"""Count the languages in the pinned Glottolog release, for the site.

Writes reference/glottolog_reference.csv with one row per Glottolog
languoid category and its count. The site quotes the "Spoken_L1_Language"
row as the size of Glottolog's reference set of languages.

Reads the same pinned CLDF tables as tools/build_crosswalk.py, from
.cache/glottolog-cldf-v5.3/ (not committed), so the committed CSV is what
the site build uses.

    python tools/count_glottolog_languages.py
"""
import collections
import csv
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CLDF = ROOT / ".cache" / "glottolog-cldf-v5.3"
SOURCE = "glottolog-cldf v5.3 (doi:10.5281/zenodo.18840967)"
OUT = ROOT / "reference" / "glottolog_reference.csv"


def main():
    with open(CLDF / "values.csv", encoding="utf-8", newline="") as f:
        counts = collections.Counter(
            r["Value"] for r in csv.DictReader(f) if r["Parameter_ID"] == "category"
        )
    if not counts.get("Spoken_L1_Language"):
        raise SystemExit("no Spoken_L1_Language rows: the CLDF tables have changed shape")
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["category", "languoids", "source"])
        for category, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
            w.writerow([category, n, SOURCE])
    print(f"{OUT.relative_to(ROOT)}: Spoken_L1_Language = {counts['Spoken_L1_Language']}")


if __name__ == "__main__":
    main()
