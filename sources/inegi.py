#!/usr/bin/env python3
"""INEGI loader: speakers per INALI group, Census 2020. STATIC - run once.

This is a reference layer, not a weekly indicator. The census table does not
change, so this script is not part of the weekly snapshot run. It writes to
reference/, not to snapshots/, and only needs re-running if INEGI replaces
the file (the pinned checksum below will then fail) or after a new census.

Source: Censo de Población y Vivienda 2020, Tabulados del Cuestionario
Básico, workbook "Etnicidad", sheet 03: population aged 3 and over that
speaks an indigenous language, by sex and language (Catálogo INALI),
national level. Groups are matched by name, ignoring case and accents.

States:
  measured       the group has a row with speakers > 0
  measured-zero  the group has a row with 0 speakers
  not-covered    the census table has no row for the group

Rows that are not one of the 68 groups:
  "... insuficientemente especificado"  -> unresolved.csv (a group, variant unknown)
  everything else                       -> excluded, listed in the other-rows file
"""
import csv, hashlib, io, re, unicodedata, urllib.request, zipfile
import xml.etree.ElementTree as ET
import common

URL = "https://www.inegi.org.mx/contenidos/programas/ccpv/2020/tabulados/cpv2020_b_eum_05_etnicidad.xlsx"
SHA256 = "60d618c4d439bd931c66408c3f2f7be4448b859277ee4b7d983faba205bd5b57"
SHEET = "03"
SOURCE = "INEGI Censo de Población y Vivienda 2020, cpv2020_b_eum_05_etnicidad.xlsx sheet 03"
REFERENCE_PERIOD = "2020"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "p": "http://schemas.openxmlformats.org/package/2006/relationships"}
CANDIDATES = {"chontal": "chontal de Oaxaca or chontal de Tabasco",
              "popoluca": "popoluca de la Sierra, oluteco, sayulteco or texistepequeño",
              "tepehuano": "tepehuano del norte or tepehuano del sur"}


def fold(s):
    s = unicodedata.normalize("NFD", s.lower().replace("’", "'"))
    return "".join(c for c in s if not unicodedata.combining(c)).strip()


def read_sheet(blob, name):
    """Rows of one worksheet as {column letter: text}. Standard library only."""
    z = zipfile.ZipFile(io.BytesIO(blob))
    strings = ["".join(t.text or "" for t in si.iter("{%s}t" % NS["m"]))
               for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)]
    book = ET.fromstring(z.read("xl/workbook.xml"))
    rid = next(s.get("{%s}id" % NS["r"]) for s in book.find("m:sheets", NS) if s.get("name") == name)
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    target = next(r.get("Target") for r in rels.findall("p:Relationship", NS) if r.get("Id") == rid)
    rows = []
    for row in ET.fromstring(z.read("xl/" + target.lstrip("/").replace("xl/", ""))).iter("{%s}row" % NS["m"]):
        cells = {}
        for c in row.findall("m:c", NS):
            v = c.find("m:v", NS)
            if c.get("t") == "s" and v is not None:
                text = strings[int(v.text)]
            elif c.get("t") == "inlineStr":
                text = "".join(t.text or "" for t in c.iter("{%s}t" % NS["m"]))
            else:
                text = v.text if v is not None else ""
            cells[re.match(r"[A-Z]+", c.get("r")).group(0)] = text
        rows.append(cells)
    return rows


def main():
    retrieved_at = common.now()
    blob = urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "language-resource-tracker"}),
                                  timeout=180).read()
    digest = hashlib.sha256(blob).hexdigest()
    if digest != SHA256:
        raise SystemExit("INEGI workbook changed: sha256 %s" % digest)

    # Columns: A = area, B = sex, C = language, D = speakers aged 3 and over.
    national_total, table = None, {}
    for r in read_sheet(blob, SHEET):
        if r.get("B") == "Total" and r.get("C") and r.get("D", "").strip().isdigit():
            if r["C"] == "Total":
                national_total = int(r["D"])
            else:
                table[r["C"].strip()] = int(r["D"])

    by_fold = {fold(name): name for name in table}
    rows, used = [], set()
    for g in common.load_groups():
        raw = by_fold.get(fold(g["inali_name"]))
        if raw is None:
            line = [g, "", "not-covered", "no row for this group in the census table"]
        else:
            used.add(raw)
            n = table[raw]
            line = [g, n, "measured" if n else "measured-zero", "census row: %s" % raw]
        g, value, state, detail = line
        rows.append([REFERENCE_PERIOD, retrieved_at, g["inali_name"], g["glottocode"], g["match_type"],
                     SOURCE, "speakers_3plus", value, state, detail])

    others, unresolved = [], []
    for raw, n in table.items():
        if raw in used:
            continue
        if "insuficientemente especificado" in fold(raw):
            cand = CANDIDATES.get(fold(raw).split()[0], "one of the 68 groups")
            others.append([raw, n, "unresolved", "variant not specified; belongs to " + cand])
            unresolved.append({"inali_name": "", "raw_iso639_3": "", "raw_name": raw, "source": SOURCE,
                               "reason": "variant not specified in the census (%d speakers); belongs to %s" % (n, cand),
                               "first_seen": "2026-10-02", "last_seen": "2026-10-02"})
        else:
            others.append([raw, n, "excluded", "residual census category outside INALI's 68 groups"])

    out = common.ROOT / "reference"
    out.mkdir(exist_ok=True)
    header = ["reference_period", "retrieved_at"] + common.COLUMNS[2:]
    common.write_csv(out / "inegi_census_2020.csv", header, rows)
    common.write_csv(out / "inegi_census_2020_other_rows.csv",
                     ["census_row", "speakers_3plus", "disposition", "note"], others)

    # unresolved.csv: replace this source's rows, keep everyone else's.
    path = common.ROOT / "unresolved.csv"
    existing = list(csv.DictReader(open(path, encoding="utf-8")))
    fields = list(existing[0].keys())
    kept = [r for r in existing if r["source"] != SOURCE]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fields, lineterminator="\n")
        w.writeheader()
        w.writerows(kept + unresolved)

    matched = sum(r[7] for r in rows if r[7] != "")
    print("sha256", digest)
    print("groups: %d matched, %d not covered" % (len(used), len(rows) - len(used)))
    print("reconciliation: groups %d + other rows %d = %d; census national total %s"
          % (matched, sum(o[1] for o in others), matched + sum(o[1] for o in others), national_total))


if __name__ == "__main__":
    main()
