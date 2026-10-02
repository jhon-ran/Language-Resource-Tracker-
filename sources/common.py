"""Shared helpers for the fetchers: read the crosswalk, write snapshot rows."""
import argparse, csv, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
STATES = ("measured", "measured-zero", "not-covered", "unresolved")
COLUMNS = ["snapshot_date", "measured_at", "inali_name", "canonical_glottocode", "match_type",
           "source", "indicator", "value", "state", "detail"]


def parse_args(description):
    p = argparse.ArgumentParser(description=description)
    p.add_argument("--date", help="snapshot folder name, YYYY-MM-DD (default: today, UTC)")
    return p.parse_args()


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def snapshot_dir(date=None):
    date = date or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    path = ROOT / "snapshots" / date
    path.mkdir(parents=True, exist_ok=True)
    return date, path


def load_groups():
    """All 68 groups, in crosswalk order. Each group lists its in-scope members
    and every code a source may be queried with."""
    members = {}
    for r in csv.DictReader(open(ROOT / "crosswalk_members.csv", encoding="utf-8")):
        if r["scope"] == "in-scope":
            members.setdefault(r["inali_name"], []).append(r)
    groups = []
    for r in csv.DictReader(open(ROOT / "crosswalk.csv", encoding="utf-8")):
        mine = members.get(r["inali_name"], [])
        codes = [c for c in r["raw_iso639_3"].split(";") if c]
        codes += [m["iso639_3"] for m in mine if m["iso639_3"] not in codes]
        if r["collective_code"]:
            codes.append(r["collective_code"])
        groups.append({"inali_name": r["inali_name"], "glottocode": r["canonical_glottocode"],
                       "match_type": r["match_type"], "members": mine, "codes": codes})
    return groups


def row(date, measured_at, group, source, indicator, value, state, detail=""):
    assert state in STATES, state
    return [date, measured_at, group["inali_name"], group["glottocode"], group["match_type"],
            source, indicator, value, state, detail]


def write_csv(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)
