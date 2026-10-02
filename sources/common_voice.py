#!/usr/bin/env python3
"""Common Voice fetcher: which INALI groups have a speech corpus.

Reads the release metadata Mozilla publishes in the common-voice/cv-dataset
repo on GitHub and takes the newest full release of each kind (scripted
speech and spontaneous speech). No account is needed for this metadata.

Common Voice locales are single varieties (one ISO 639-3 code each), so the
match is done per variety and rolled up: a group is covered if any of its
varieties is in either release. One row per matched locale and release goes
to common_voice_locales.csv.

Indicator `speech_corpus`: number of the group's varieties present in
either release.
  measured       at least one variety is present with validated audio
  measured-zero  present, but with zero validated hours
  not-covered    none of the group's varieties is a Common Voice locale
  unresolved     the group has no code to match with
"""
import json, os, re, urllib.request
import common

LIST = "https://api.github.com/repos/common-voice/cv-dataset/contents/datasets/%s"
RAW = "https://raw.githubusercontent.com/common-voice/cv-dataset/main/datasets/%s/%s"
KINDS = {"scripted": ("scripted-speech", r"cv-corpus-(\d+(?:\.\d+)?)-(\d{4}-\d{2}-\d{2})\.json$"),
         "spontaneous": ("spontaneous-speech", r"sps-corpus-(\d+(?:\.\d+)?)-(\d{4}-\d{2}-\d{2})\.json$")}


def get_json(url):
    headers = {"User-Agent": "language-resource-tracker"}
    if os.environ.get("GITHUB_TOKEN") and "api.github.com" in url:
        headers["Authorization"] = "Bearer " + os.environ["GITHUB_TOKEN"]
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120))


def latest_release(kind):
    """(version, date, {locale: stats}) for the newest full release."""
    folder, pattern = KINDS[kind]
    found = []
    for entry in get_json(LIST % folder):
        m = re.match(pattern, entry["name"])
        if m:
            found.append((m.group(2), m.group(1), entry["name"]))
    date, version, name = max(found)
    return version, date, get_json(RAW % (folder, name))["locales"]


def stats(kind, s):
    """(clips, users, validated hours) from either metadata layout."""
    if kind == "scripted":
        return s.get("clips", 0), s.get("users", 0), s.get("validHrs", 0)
    return s.get("clips", 0), s.get("users", 0), (s.get("duration") or {}).get("validated_hrs", 0)


def main():
    args = common.parse_args(__doc__.splitlines()[0])
    date, out = common.snapshot_dir(args.date)
    measured_at = common.now()
    releases = {kind: latest_release(kind) for kind in KINDS}
    source = "common-voice " + ", ".join("%s %s (%s)" % (k, releases[k][0], releases[k][1]) for k in KINDS)

    rows, locale_rows = [], []
    for g in common.load_groups():
        hits = []  # (code, kind, locale, clips, users, hours)
        for kind, (version, _, locales) in releases.items():
            for locale, s in sorted(locales.items()):
                code = locale.split("-")[0].lower()
                if code in g["codes"]:
                    hits.append((code, kind, locale) + stats(kind, s))
        for code, kind, locale, clips, users, hours in hits:
            locale_rows.append([date, g["inali_name"], code, locale, kind, releases[kind][0],
                                clips, users, hours, "measured" if hours else "measured-zero"])
        if not g["codes"]:
            rows.append(common.row(date, measured_at, g, source, "speech_corpus", "",
                                   "unresolved", "no code to match with"))
        elif not hits:
            rows.append(common.row(date, measured_at, g, source, "speech_corpus", "", "not-covered",
                                   "none of %d codes is a Common Voice locale" % len(g["codes"])))
        else:
            varieties = sorted({h[0] for h in hits})
            detail = "; ".join("%s %s %s: %sh validated" % (h[0], h[1], releases[h[1]][0], h[5]) for h in hits)
            state = "measured" if any(h[5] for h in hits) else "measured-zero"
            rows.append(common.row(date, measured_at, g, source, "speech_corpus", len(varieties), state,
                                   "%d of %d codes covered: %s" % (len(varieties), len(g["codes"]), detail)))

    common.write_csv(out / "common_voice.csv", common.COLUMNS, rows)
    common.write_csv(out / "common_voice_locales.csv",
                     ["snapshot_date", "inali_name", "iso639_3", "locale", "release_kind",
                      "release_version", "clips", "users", "validated_hours", "state"], locale_rows)
    print("wrote %s: %d group rows, %d locale rows; %s" % (out, len(rows), len(locale_rows), source))


if __name__ == "__main__":
    main()
