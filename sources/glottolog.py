#!/usr/bin/env python3
"""Glottolog fetcher: endangerment status (AES) for each INALI group.

Reads the pinned Glottolog CLDF release (see tools/build_crosswalk.py).
AES is assigned per language, so a group's value is the status of its most
endangered in-scope member, with the full breakdown in `detail` and one row
per member in glottolog_members.csv.

States:
  measured     at least one member has an AES value
  not-covered  the group has members but Glottolog gives none of them an AES value
  unresolved   the group has no member resolved to a Glottocode
"""
import csv, sys
import common

sys.path.insert(0, str(common.ROOT / "tools"))
import build_crosswalk as glottolog_pin

AES_ORDER = ["not endangered", "threatened", "shifting", "moribund", "nearly extinct", "extinct"]


def main():
    args = common.parse_args(__doc__.splitlines()[0])
    date, out = common.snapshot_dir(args.date)
    measured_at = common.now()
    source = "glottolog %s (doi:%s)" % (glottolog_pin.PIN["version"], glottolog_pin.PIN["doi"])

    aes = {}
    for r in csv.DictReader(open(glottolog_pin.fetch("values.csv"), encoding="utf-8")):
        if r["Parameter_ID"] == "aes" and r["Code_ID"]:
            aes[r["Language_ID"]] = r["Code_ID"].replace("aes-", "").replace("_", " ")

    rows, member_rows = [], []
    for g in common.load_groups():
        found = []
        for m in g["members"]:
            status = aes.get(m["glottocode"], "")
            member_rows.append([date, g["inali_name"], m["iso639_3"], m["glottocode"],
                                m["glottolog_name"], status, "measured" if status else "not-covered"])
            if status:
                found.append(status)
        if not g["members"]:
            rows.append(common.row(date, measured_at, g, source, "endangerment_status", "",
                                   "unresolved", "no member resolved to a Glottocode"))
        elif not found:
            rows.append(common.row(date, measured_at, g, source, "endangerment_status", "",
                                   "not-covered", "no AES value for any of %d members" % len(g["members"])))
        else:
            worst = max(found, key=AES_ORDER.index)
            breakdown = ";".join("%s=%d" % (s, found.count(s)) for s in AES_ORDER if s in found)
            rows.append(common.row(date, measured_at, g, source, "endangerment_status", worst,
                                   "measured", "most endangered of %d members with AES (%d in group): %s"
                                   % (len(found), len(g["members"]), breakdown)))

    common.write_csv(out / "glottolog.csv", common.COLUMNS, rows)
    common.write_csv(out / "glottolog_members.csv",
                     ["snapshot_date", "inali_name", "iso639_3", "glottocode", "glottolog_name",
                      "endangerment_status", "state"], member_rows)
    print("wrote %s: %d group rows, %d member rows" % (out, len(rows), len(member_rows)))


if __name__ == "__main__":
    main()
