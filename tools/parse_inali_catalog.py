#!/usr/bin/env python3
"""Parse INALI's Catálogo de las Lenguas Indígenas Nacionales (2008).

Part 1: Appendix 4 -> variants.csv, one row per (variant, autonym) pair:
  variant, autonym, spanish_name, group, family

`spanish_name`, `autonym_appendix4` and `family` are exactly as printed in
Appendix 4, misprints included. `autonym` is the body's spelling where the
two differ (autonym_overrides.csv), otherwise the same. `variant` is an identifier (lower case, no accents, hyphens) made
from the Spanish name after correcting known misprints (CORRECTIONS).
`variant_glottocode` is the Glottocode of the variant's group, filled only
where crosswalk.csv resolves that group directly (exact or macrolanguage)
and blank otherwise. It is not a variant-specific code.
`group` uses the spelling in inali_groups.csv so it joins to crosswalk.csv;
Appendix 4 prints four group names slightly differently (see CHANGELOG.md).

Totals checked before anything is written: 476 autonyms, 364 variants,
68 groups, 11 families. The catalog itself says 475 autonyms; Appendix 4
has 476 rows (see CHANGELOG.md). It has 363 distinct Spanish names for 364
variants because two zapoteco variants share one name; SPLITS separates
them by autonym.

Needs `pdftotext` (poppler-utils). Run once; the PDF is pinned by checksum.
"""
import csv, hashlib, pathlib, re, subprocess, sys, unicodedata, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = "https://www.inali.gob.mx/pdf/CLIN_completo.pdf"
SHA256 = "21cef44abf0d896555f26954bf319340ad4814fa8a3f0719b0d068311ff1be7c"
PDF = ROOT / ".cache" / "inali" / "CLIN_completo.pdf"
APPENDIX_4 = (244, 256)   # PDF page numbers
EXPECTED = {"variants": 364, "autonyms": 476, "groups": 68, "families": 11}

# Misprints in Appendix 4's Spanish names: printed form -> corrected form.
# Used only to build the `variant` identifier; spanish_name keeps the print.
CORRECTIONS = {
    "chianateco del oeste central bajo": "chinanteco del oeste central bajo",
    "K\u2019iche\u2019 (occidental": "K\u2019iche\u2019 (occidental)",
    "Q\u2019eqchi": "Q\u2019eqchi\u2019",
    # The body (PDF p. 123) and the municipality's name are "San Antonino el Alto".
    "zapoteco de San Antonio el Alto": "zapoteco de San Antonino el Alto",
}

# One Spanish name, two variants. The body has two separate entries called
# "zapoteco de la Sierra sur, noroeste": PDF p. 117 (risna, rixhna) and
# PDF p. 122 (ditsë, dizde). Both checked against the page text and image.
# Appendix 4 lists all four autonyms under the one name. Each autonym is
# mapped to the suffix that identifies its variant.
SPLITS = {
    "zapoteco de la Sierra sur, noroeste": {
        "risna": "risna", "rixhna": "risna",
        "dits\u00eb": "dizde", "dizde (de la Sierra sur, noroeste)": "dizde",
    },
}
FAMILIES = {"Álgica", "Yuto-nahua", "Cochimí-yumana", "Seri", "Oto-mangue", "Maya",
            "Totonaco-tepehua", "Tarasca", "Mixe-zoque", "Chontal de Oaxaca", "Huave"}
# The pages are landscape, so the Diario Oficial running heads come out as
# stray text at the right-hand end of lines.
MARGIN = re.compile(r"\s{6,}(DIARIO OFICIAL|\(\w+ Sección\)|Lunes 14 de enero de 2008|\d{1,3})\s*$")


def pdf():
    if not PDF.exists():
        PDF.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(URL, headers={"User-Agent": "language-resource-tracker"})
        PDF.write_bytes(urllib.request.urlopen(req, timeout=180).read())
    if hashlib.sha256(PDF.read_bytes()).hexdigest() != SHA256:
        sys.exit("INALI catalog PDF does not match the pinned checksum")
    return PDF


def page_lines(first, last):
    text = subprocess.run(["pdftotext", "-layout", "-f", str(first), "-l", str(last), str(pdf()), "-"],
                          check=True, capture_output=True).stdout.decode("utf-8")
    for page in text.split("\f"):
        yield [MARGIN.sub("", line).rstrip() for line in page.split("\n")]


def cells(line, starts):
    """Split a line into the four table cells using the page's column starts."""
    out = ["", "", "", ""]
    for m in re.finditer(r"\S+(?: \S+)*", line):
        col = max(i for i, s in enumerate(starts) if m.start() >= s - 3)
        out[col] = (out[col] + " " + m.group(0)).strip()
    return out


def slug(name):
    s = unicodedata.normalize("NFD", name.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def parse_appendix_4():
    rows, pending, started = [], None, False
    for lines in page_lines(*APPENDIX_4):
        # Column starts on this page: taken from lines that have all four cells.
        full = []
        for line in lines:
            segs = [(m.start(), m.group(0)) for m in re.finditer(r"\S+(?: \S+)*", line)]
            if len(segs) == 4 and segs[3][1] in FAMILIES:
                full.append([s for s, _ in segs])
        if not full:
            continue
        starts = [0] + [min(f[i] for f in full) for i in (1, 2, 3)]
        for line in lines:
            if not line.strip():
                continue
            if not started:                       # skip the appendix title, intro and table header
                started = line.strip() == "lingüística" or re.fullmatch(r"\s*lingüística\s+lingüística", line) is not None
                continue
            if line.lstrip().startswith("México, D.F., a "):   # closing signature
                break
            c = cells(line, starts)
            anchor = c[3] in FAMILIES
            if anchor:
                if pending:                        # first line of the row came before group/family
                    c = [(a + " " + b).strip() for a, b in zip(pending, c)]
                    pending = None
                rows.append(c)
            elif c[0] and c[1] and not c[0].startswith("(") and not (c[0].endswith(")") and "(" not in c[0]):
                pending = c                        # a new row whose group/family sit on its next line
            elif rows and not pending:             # wrapped text of the previous row
                rows[-1] = [(a + " " + b).strip() for a, b in zip(rows[-1], c)]
            else:
                sys.exit("cannot place line: %r" % line)
    if pending:
        sys.exit("unfinished row at end of appendix: %r" % pending)
    return rows


def fold(name):
    """Compare group names ignoring case, accents and apostrophe style."""
    s = unicodedata.normalize("NFD", name.lower().replace("\u2019", "'"))
    return "".join(c for c in s if not unicodedata.combining(c))


def main():
    printed = parse_appendix_4()
    problems = []
    seed = {fold(r["inali_name"]): r["inali_name"]
            for r in csv.DictReader(open(ROOT / "inali_groups.csv", encoding="utf-8"))}
    unknown = sorted({r[2] for r in printed if fold(r[2]) not in seed})
    if unknown:
        problems.append("groups not in inali_groups.csv: %s" % unknown)
    respelled = sorted({(r[2], seed[fold(r[2])]) for r in printed if fold(r[2]) in seed and r[2] != seed[fold(r[2])]})

    rows = []  # variant, autonym, spanish_name, group, family
    for autonym, name, group, family in printed:
        variant = slug(CORRECTIONS.get(name, name))
        if name in SPLITS:
            if autonym not in SPLITS[name]:
                problems.append("no split rule for autonym %r of %r" % (autonym, name))
                continue
            variant += "-" + SPLITS[name][autonym]
        rows.append([variant, autonym, name, seed.get(fold(group), group), family, autonym])

    # The body of the catalog is the authority for how an autonym is spelt.
    # autonym_overrides.csv (written by parse_inali_body.py) lists every
    # autonym the body prints differently from Appendix 4. `autonym` takes the
    # body's form; `autonym_appendix4` keeps what Appendix 4 prints.
    path = ROOT / "autonym_overrides.csv"
    if path.exists():
        body = {(o["variant"], o["autonym_appendix4"]): o["autonym_body"]
                for o in csv.DictReader(open(path, encoding="utf-8"))}
        hit = set()
        for r in rows:
            if (r[0], r[5]) in body:
                r[1] = body[(r[0], r[5])]
                hit.add((r[0], r[5]))
        if set(body) - hit:
            problems.append("autonym overrides that match nothing: %s" % sorted(set(body) - hit))

    # Group-level identity link. A variant gets its group's Glottocode only
    # where crosswalk.csv resolves the group to a single code directly
    # (match_type exact or macrolanguage). For many-to-one and unresolved
    # groups the column is left blank: the group's code there is an inferred
    # common ancestor, or missing, and nothing is interpolated.
    # This is the code of the variant's GROUP, not of the variant itself.
    link = {c["inali_name"]: c["canonical_glottocode"]
            for c in csv.DictReader(open(ROOT / "crosswalk.csv", encoding="utf-8"))
            if c["match_type"] in ("exact", "macrolanguage")}
    for r in rows:
        r.append(link.get(r[3], ""))

    found = {"variants": len({r[0] for r in rows}), "autonyms": len(rows),
             "groups": len({r[3] for r in rows}), "families": len({r[4] for r in rows})}
    problems += ["%s: expected %d, found %d" % (k, EXPECTED[k], found[k]) for k in EXPECTED if found[k] != EXPECTED[k]]
    for label, items in (("misprint corrections", CORRECTIONS), ("split rules", SPLITS)):
        unused = [k for k in items if k not in {r[1] for r in printed}]
        if unused:
            problems.append("%s that match nothing in Appendix 4: %s" % (label, unused))
    split = {}
    for r in rows:
        split.setdefault(r[0], set()).add((r[3], r[4]))
    multi = {k: v for k, v in split.items() if len(v) > 1}
    if multi:
        problems.append("variants assigned to more than one group: %s" % multi)
    # Every column must be filled except variant_glottocode (the last), which
    # is blank on purpose where the group has no direct code.
    if any(not all(r[:6]) for r in rows):
        problems.append("rows with an empty cell: %s" % [r for r in rows if not all(r[:6])][:5])
    print("found:", found)
    if problems:
        sys.exit("CHECKS FAILED, nothing written:\n  " + "\n  ".join(problems))
    order = list(seed.values())
    with open(ROOT / "variants.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["variant", "autonym", "spanish_name", "group", "family", "autonym_appendix4",
                    "variant_glottocode"])
        w.writerows(sorted(rows, key=lambda r: (order.index(r[3]), r[0], r[1])))
    print("all checks passed; wrote variants.csv: %d rows" % len(rows))
    print("group names respelled to match inali_groups.csv:", respelled)


if __name__ == "__main__":
    main()
