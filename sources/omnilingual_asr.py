#!/usr/bin/env python3
"""Omnilingual ASR fetcher: tool support for each INALI group.

Meta's Omnilingual ASR publishes its supported languages as codes, not
names: `supported_langs` in lang_ids.py, each entry `<ISO 639-3>_<script>`
(a handful carry a third variant subtag). So groups are matched on ISO
639-3 codes like every other source; no name matching is involved.
Training hours and character error rate (CER) per entry come from the
per-language results table in the same repository.

Indicator `tool_support_asr`: number of the group's varieties in the
supported list.
  measured     at least one variety is supported
  not-covered  none of the group's varieties is in the supported list
  unresolved   the group has no code to match with
"""
import csv, io, json, os, re, urllib.request
import common

REPO = "facebookresearch/omnilingual-asr"
LIST = "src/omnilingual_asr/models/wav2vec2_llama/lang_ids.py"
RESULTS = "per_language_results_table_7B_llm_asr.csv"
RAW = "https://raw.githubusercontent.com/%s/%s/%s"
API = "https://api.github.com/repos/%s/commits?path=%s&per_page=1"


def get(url):
    headers = {"User-Agent": "language-resource-tracker"}
    if os.environ.get("GITHUB_TOKEN") and "api.github.com" in url:
        headers["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120).read().decode("utf-8")


def main():
    args = common.parse_args(__doc__.splitlines()[0])
    date, out = common.snapshot_dir(args.date)
    measured_at = common.now()
    commit = json.loads(get(API % (REPO, LIST)))[0]
    sha = commit["sha"]  # last commit that changed the list; recorded for provenance
    source = "omnilingual-asr lang_ids.py @ %s (%s)" % (sha[:10], commit["commit"]["committer"]["date"][:10])

    block = get(RAW % (REPO, "main", LIST)).split("supported_langs", 1)[1].split("= [", 1)[1]
    supported = re.findall(r'"([a-z]{3}_[A-Za-z0-9_]+)"', block[:block.index("]")])
    if len(supported) < 1000:
        # The list has had 1,600+ entries since release; a short list means
        # the file moved or changed shape, not that support was withdrawn.
        raise SystemExit("could not read the supported-language list (%d entries)" % len(supported))
    results = {r["Language"]: r for r in csv.DictReader(io.StringIO(get(RAW % (REPO, "main", RESULTS))))}

    rows, language_rows = [], []
    for g in common.load_groups():
        hits = [e for e in supported if e.split("_")[0] in g["codes"]]
        for e in hits:
            parts = e.split("_")
            r = results.get(e, {})
            language_rows.append([date, g["inali_name"], parts[0], e, parts[1],
                                  "_".join(parts[2:]), r.get("Training Hours", ""), r.get("CER", "")])
        if not g["codes"]:
            rows.append(common.row(date, measured_at, g, source, "tool_support_asr", "",
                                   "unresolved", "no code to match with"))
        elif not hits:
            rows.append(common.row(date, measured_at, g, source, "tool_support_asr", "", "not-covered",
                                   "none of %d codes is in the supported list" % len(g["codes"])))
        else:
            varieties = sorted({e.split("_")[0] for e in hits})
            rows.append(common.row(date, measured_at, g, source, "tool_support_asr", len(varieties),
                                   "measured", "%d of %d codes supported: %s"
                                   % (len(varieties), len(g["codes"]), ", ".join(hits))))

    common.write_csv(out / "omnilingual_asr.csv", common.COLUMNS, rows)
    common.write_csv(out / "omnilingual_asr_languages.csv",
                     ["snapshot_date", "inali_name", "iso639_3", "entry", "script", "variant_subtag",
                      "training_hours", "cer"], language_rows)
    print("wrote %s: %d group rows, %d supported entries matched of %d in the list; %s"
          % (out, len(rows), len(language_rows), len(supported), source))


if __name__ == "__main__":
    main()
