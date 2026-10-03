#!/usr/bin/env python3
"""Parse INALI's 2012 risk-grade book into risk_grade.csv, one row per variant.

Source: "México. Lenguas Indígenas Nacionales en Riesgo de Desaparición:
Variantes Lingüísticas por Grado de Riesgo" (INALI, 2012). The grades are
computed by INALI from the 2000 census; every output row says so in
`risk_grade_census_year`.

Cuadro 6 (PDF pp. 61-75) is the primary table. The same 364 rows are
printed again in Cuadros 7, 8 and 9; the script requires all four to agree.
Nothing is written unless there are 364 rows, ranks 1-364, and 64 / 43 / 72 /
185 variants in grades 1-4.

Each row is joined to variants.csv:
  exact               the printed name equals spanish_name (case and accents ignored)
  corrected-spelling  it equals the corrected form behind the variant identifier
                      (the 2008 catalog's own misprints, see parse_inali_catalog.py)
  alias:<kind>        listed in risk_grade_aliases.csv. Kinds: `spelling`;
                      `by-localities` (one name, two variants, settled by locality
                      counts); `direction-conflict` (the book and the 2008 catalog
                      disagree on noreste/noroeste; joined on locality counts, and
                      NOT a spelling variant: a probable error in one source)
  unresolved          no join; `variant` is blank and the row is in review_list.csv
A printed name that fits more than one variant is never joined automatically.

Needs `pdftotext` (poppler-utils).
"""
import csv, hashlib, json, re, subprocess, sys, unicodedata, urllib.request, datetime
from collections import Counter
import parse_inali_catalog as part1

URL = "https://site.inali.gob.mx/pdf/libro_lenguas_indigenas_nacionales_en_riesgo_de_desaparicion.pdf"
SHA256 = "ce44fb95800e26d145710422ae10bd300350fe4564db6c636bc8fc4d88e9b639"
PDF = part1.ROOT / ".cache" / "inali" / "risk_2012.pdf"
CENSUS_YEAR = 2000
TABLES = {"Cuadro 6": (61, 75), "Cuadro 7": (79, 93), "Cuadro 8": (97, 111), "Cuadro 9": (115, 129)}
EXPECTED = {"1": 64, "2": 43, "3": 72, "4": 185}
LABELS = {"1": "muy alto", "2": "alto", "3": "mediano", "4": "no inmediato"}
REVIEW_PREFIX = "risk grade: "
NUM = r"-?\d+(?:\.\d+)?"
TAIL = r"\s+(%s)\s+(%s)\s+(%s)\s+(%s)\s+(%s)\s+(%s)\s+([1-4])\s*$" % ((NUM,) * 6)
FULL = re.compile(r"^\s*(\d{1,3})\s{2,}(\S.*?)\s{2,}(\S.*?)\s{2,}(\S.*?)" + TAIL)
# A long variant name is printed on the lines above and below its row,
# leaving the variant cell of the row itself empty.
WRAPPED = re.compile(r"^\s*(\d{1,3})\s{2,}(\S.*?)\s{2,}(\S.*?)" + TAIL)


def pdf():
    if not PDF.exists():
        PDF.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(URL, headers={"User-Agent": "language-resource-tracker"})
        PDF.write_bytes(urllib.request.urlopen(req, timeout=600).read())
    if hashlib.sha256(PDF.read_bytes()).hexdigest() != SHA256:
        sys.exit("INALI risk book PDF does not match the pinned checksum")
    return PDF


def read_table(first, last):
    text = subprocess.run(["pdftotext", "-layout", "-f", str(first), "-l", str(last), str(pdf()), "-"],
                          check=True, capture_output=True).stdout.decode("utf-8")
    rows = []
    for page in text.split("\f"):
        lines = page.split("\n")
        for k, line in enumerate(lines):
            m = FULL.match(line)
            if m:
                rows.append(list(m.groups()))
                continue
            m = WRAPPED.match(line)
            if m:
                g = list(m.groups())
                pieces = [lines[j].strip() for j in (k - 1, k + 1) if 0 <= j < len(lines)]
                if any(FULL.match(lines[j]) or WRAPPED.match(lines[j]) for j in (k - 1, k + 1) if 0 <= j < len(lines)):
                    sys.exit("cannot rejoin the wrapped name at rank %s" % g[0])
                rows.append(g[:3] + [" ".join(p for p in pieces if p)] + g[3:])
    return rows


def plain(s):
    return re.sub(r"\s+", " ", s.replace("’", "'")).strip()


def main():
    tables = {name: read_table(*pages) for name, pages in TABLES.items()}
    primary = tables["Cuadro 6"]
    problems = []
    for name, rows in tables.items():
        grades = Counter(r[10] for r in rows)
        if len(rows) != 364 or {int(r[0]) for r in rows} != set(range(1, 365)) or dict(grades) != EXPECTED:
            problems.append("%s: %d rows, grades %s" % (name, len(rows), dict(sorted(grades.items()))))
    by_rank = {r[0]: r for r in primary}
    apostrophes = 0
    for name, rows in tables.items():
        for r in rows:
            p = by_rank.get(r[0])
            if p is None or p == r:
                continue
            if [plain(x) for x in p] == [plain(x) for x in r]:
                apostrophes += 1          # same row, different apostrophe style
            else:
                problems.append("%s disagrees with Cuadro 6 at rank %s: %s / %s" % (name, r[0], r, p))
    if problems:
        sys.exit("CHECKS FAILED, nothing written:\n  " + "\n  ".join(problems[:20]))

    variants = list(csv.DictReader(open(part1.ROOT / "variants.csv", encoding="utf-8")))
    by_name, ids = {}, {v["variant"] for v in variants}
    for v in variants:
        by_name.setdefault(part1.fold(v["spanish_name"]), set()).add(v["variant"])
    aliases = {plain(a["risk_name"]): a for a in csv.DictReader(open(part1.ROOT / "risk_grade_aliases.csv", encoding="utf-8"))}
    for a in aliases.values():
        if a["variant"] not in ids:
            sys.exit("risk_grade_aliases.csv: unknown variant %s" % a["variant"])

    listed = Counter(r["variant"] for r in csv.DictReader(open(part1.ROOT / "variant_localities.csv", encoding="utf-8")))
    out, review, used_alias = [], [], set()
    for rank, family, group, name, sp_total, sp30, loc_total, loc30, prop, child, grade in primary:
        name = plain(name)
        hits = by_name.get(part1.fold(name), set())
        if name in aliases:
            variant, how = aliases[name]["variant"], "alias:" + aliases[name]["kind"]
            used_alias.add(name)
        elif len(hits) == 1:
            variant, how = next(iter(hits)), "exact"
        elif len(hits) > 1:
            variant, how = "", "unresolved"
            review.append([rank, name, "name fits more than one variant in variants.csv: " + ", ".join(sorted(hits)),
                           "book gives %s localities" % loc_total])
        elif part1.slug(name) in ids:
            variant, how = part1.slug(name), "corrected-spelling"
        else:
            variant, how = "", "unresolved"
            review.append([rank, name, "no variant in variants.csv has this name", "book gives %s localities" % loc_total])
        out.append([variant, grade, LABELS[grade], CENSUS_YEAR, rank, sp30, loc30, child,
                    sp_total, loc_total, prop, plain(family), plain(group), name, how])
    if set(aliases) - used_alias:
        sys.exit("risk_grade_aliases.csv has names that are not in the book: %s" % sorted(set(aliases) - used_alias))
    joined = Counter(r[0] for r in out if r[0])
    if any(n > 1 for n in joined.values()):
        sys.exit("a variant was joined to more than one risk row: %s" % [k for k, n in joined.items() if n > 1])
    names = {v["variant"]: v["spanish_name"] for v in variants}
    for vid in sorted(ids - set(joined)):
        review.append(["", names[vid], "variant in variants.csv has no risk-grade row (id %s)" % vid,
                       "2008 catalog lists %d localities" % listed[vid]])

    root = part1.ROOT
    with open(root / "risk_grade.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["variant", "grade", "grade_label", "risk_grade_census_year", "rank",
                    "speakers_30pct_localities", "localities_30pct", "child_proportion",
                    "speakers_total", "localities_total", "speaker_proportion",
                    "family_printed", "group_printed", "variant_printed", "join"])
        w.writerows(out)

    # review_list.csv is shared with parse_inali_body.py: replace only this script's rows.
    path = root / "review_list.csv"
    rows = [r for r in csv.DictReader(open(path, encoding="utf-8")) if not r["reason"].startswith(REVIEW_PREFIX)]
    for rank, name, why, evidence in review:
        rows.append({"page": "", "variant": "", "spanish_name": name, "reason": REVIEW_PREFIX + why,
                     "detail": (("rank %s in the 2012 risk book; " % rank) if rank else "") + evidence})
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, ["page", "variant", "spanish_name", "reason", "detail"], lineterminator="\n")
        w.writeheader()
        w.writerows(rows)

    version = re.search(r"version ([\d.]+)", subprocess.run(["pdftotext", "-v"], capture_output=True).stderr.decode()).group(1)
    meta = {"source": URL, "source_sha256": SHA256, "poppler_version": version,
            "built": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "primary_table": "Cuadro 6, PDF pp. 61-75", "cross_checked": ["Cuadro 7", "Cuadro 8", "Cuadro 9"],
            "rows": len(out), "grades": dict(sorted(Counter(r[1] for r in out).items())),
            "join": dict(Counter(r[14] for r in out)), "risk_grade_census_year": CENSUS_YEAR,
            "rows_differing_only_in_apostrophe_style": apostrophes}
    with open(root / "risk_grade_build.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(json.dumps(meta, ensure_ascii=False))
    for r in review:
        print("REVIEW", r)


if __name__ == "__main__":
    main()
