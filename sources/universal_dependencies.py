#!/usr/bin/env python3
"""Universal Dependencies fetcher: treebanks for each INALI group.

Three inputs, all on GitHub and needing no account:
  - the UniversalDependencies organisation's repository list (UD_<Language>-<Name>)
  - docs-automation/codes_and_flags.yaml, UD's language name -> ISO 639-3 table
  - docs-automation/valdan/releases.json, the treebanks in each release

Indicator `treebanks`: number of the group's treebanks that are in the
latest UD release. A treebank that exists only as a repository is not
counted; it is named in `detail` and listed in
universal_dependencies_treebanks.csv with released = no.

States:
  measured       at least one treebank in the latest release
  measured-zero  none in the latest release (UD can hold any language, so
                 absence is a real zero, not a coverage gap)
  unresolved     the group has no code to match with
"""
import json, os, re, urllib.request
import xml.etree.ElementTree as ET
import common

ORG = "https://api.github.com/orgs/UniversalDependencies/repos?per_page=100&page=%d"
RAW = "https://raw.githubusercontent.com/UniversalDependencies/"


def get(url):
    headers = {"User-Agent": "language-resource-tracker"}
    if os.environ.get("GITHUB_TOKEN") and "api.github.com" in url:
        headers["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120).read()


def treebank_repos():
    names, page = [], 1
    while True:
        batch = json.loads(get(ORG % page))
        names += [r["name"] for r in batch if r["name"].startswith("UD_")]
        if len(batch) < 100:
            return sorted(names)
        page += 1


def language_codes():
    """{UD language name: iso3}, from the simple two-level YAML file."""
    codes, current = {}, None
    for line in get(RAW + "docs-automation/master/codes_and_flags.yaml").decode("utf-8").splitlines():
        if line and not line.startswith((" ", "#")) and line.rstrip().endswith(":"):
            current = line.rstrip()[:-1].strip("\"'")
        else:
            m = re.match(r"\s+iso3:\s*(\S+)", line)
            if m and current:
                codes[current] = m.group(1).strip("\"'")
    return codes


def size(repo):
    """(sentences, tokens) from the treebank's stats.xml, or blanks."""
    try:
        total = ET.fromstring(get(RAW + repo + "/master/stats.xml")).find("size/total")
        return total.findtext("sentences"), total.findtext("tokens")
    except Exception:
        return "", ""


def main():
    args = common.parse_args(__doc__.splitlines()[0])
    date, out = common.snapshot_dir(args.date)
    measured_at = common.now()
    releases = json.loads(get(RAW + "docs-automation/master/valdan/releases.json"))["releases"]
    version = max(releases, key=lambda v: [int(x) for x in v.split(".")])
    released = set(releases[version]["treebanks"])
    source = "universal-dependencies %s (%s)" % (version, releases[version]["date"])
    codes = language_codes()
    repos = treebank_repos()

    rows, treebank_rows = [], []
    for g in common.load_groups():
        mine = []  # (code, repo, is_released)
        for repo in repos:
            language = repo[3:].rsplit("-", 1)[0].replace("_", " ")
            if codes.get(language) in g["codes"]:
                mine.append((codes[language], repo, repo in released))
        for code, repo, ok in mine:
            sentences, tokens = size(repo)
            treebank_rows.append([date, g["inali_name"], code, repo, "yes" if ok else "no",
                                  version, sentences, tokens])
        if not g["codes"]:
            rows.append(common.row(date, measured_at, g, source, "treebanks", "",
                                   "unresolved", "no code to match with"))
            continue
        yes = [m for m in mine if m[2]]
        no = [m for m in mine if not m[2]]
        parts = []
        if yes:
            parts.append("in release %s: %s" % (version, ", ".join("%s (%s)" % (r, c) for c, r, _ in yes)))
        if no:
            parts.append("repository only, not in release %s: %s"
                         % (version, ", ".join("%s (%s)" % (r, c) for c, r, _ in no)))
        if not mine:
            parts.append("no treebank for any of %d codes" % len(g["codes"]))
        rows.append(common.row(date, measured_at, g, source, "treebanks", len(yes),
                               "measured" if yes else "measured-zero", "; ".join(parts)))

    common.write_csv(out / "universal_dependencies.csv", common.COLUMNS, rows)
    common.write_csv(out / "universal_dependencies_treebanks.csv",
                     ["snapshot_date", "inali_name", "iso639_3", "treebank", "released",
                      "release_version", "sentences", "tokens"], treebank_rows)
    print("wrote %s: %d group rows, %d treebanks; %s; %d UD repositories checked"
          % (out, len(rows), len(treebank_rows), source, len(repos)))


if __name__ == "__main__":
    main()
