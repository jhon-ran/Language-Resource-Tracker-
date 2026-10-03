#!/usr/bin/env python3
"""Parse the body of INALI's catalog (PDF pp. 31-212): IPA and geography.

Part 2 of the catalog parse. Reads the variant tables with `pdftohtml -xml`,
which gives every text run its position and whether it is bold, so:
  - the two table columns are separated by x coordinate, not by character
    column (left cell: autonyms, IPA, <Spanish name>; right cell: geography);
  - municipalities are recognised because they are printed in bold.

Each body entry is joined to variants.csv on spanish_name. Nothing is
guessed: an entry that does not join, whose IPA count differs from its
autonym count, whose autonyms differ from Appendix 4, or whose geography
does not parse cleanly goes to the review list with the raw text attached.

Needs `pdftohtml` (poppler-utils).
"""
import csv, html, re, subprocess, sys, unicodedata
from collections import Counter
import parse_inali_catalog as part1

BODY = (31, 212)
STATE_RE = re.compile(r"^([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ]+(?: (?:[A-ZÁÉÍÓÚÜÑ]+|de))*):")
HEADER_RE = re.compile(r"GEOESTAD[IÍ]STICA")
HEADER_LEFT_RE = re.compile(r"AUTODENOMINACI|VARIANTE LING|NOMBRE EN ESPAÑOL|^EN ESPAÑOL|^LINGÜÍSTICA Y|^ESPAÑOL$")
# INEGI state codes and names; keys are the forms printed in the catalog.
STATES = {
    "BAJA CALIFORNIA": ("02", "Baja California"), "CAMPECHE": ("04", "Campeche"),
    "COAHUILA DE ZARAGOZA": ("05", "Coahuila de Zaragoza"), "COLIMA": ("06", "Colima"),
    "CHIAPAS": ("07", "Chiapas"), "CHIHUAHUA": ("08", "Chihuahua"),
    "DISTRITO FEDERAL": ("09", "Ciudad de México"), "DURANGO": ("10", "Durango"),
    "GUANAJUATO": ("11", "Guanajuato"), "GUERRERO": ("12", "Guerrero"), "HIDALGO": ("13", "Hidalgo"),
    "JALISCO": ("14", "Jalisco"), "ESTADO DE MÉXICO": ("15", "México"), "MÉXICO": ("15", "México"),
    "MICHOACÁN DE OCAMPO": ("16", "Michoacán de Ocampo"), "MORELOS": ("17", "Morelos"),
    "NAYARIT": ("18", "Nayarit"), "OAXACA": ("20", "Oaxaca"), "OAXACA de JUÁREZ": ("20", "Oaxaca"),
    "PUEBLA": ("21", "Puebla"), "QUERÉTARO ARTEAGA": ("22", "Querétaro"), "QUERÉTARO": ("22", "Querétaro"),
    "QUINTANA ROO": ("23", "Quintana Roo"), "SAN LUIS POTOSÍ": ("24", "San Luis Potosí"),
    "SINALOA": ("25", "Sinaloa"), "SONORA": ("26", "Sonora"), "TABASCO": ("27", "Tabasco"),
    "TAMAULIPAS": ("28", "Tamaulipas"), "TLAXCALA": ("29", "Tlaxcala"),
    "VERACRUZ DE IGNACIO DE LA LLAVE": ("30", "Veracruz de Ignacio de la Llave"),
    "VERACRUZ": ("30", "Veracruz de Ignacio de la Llave"),
    "YUCATÁN": ("31", "Yucatán"), "ZACATECAS": ("32", "Zacatecas"),
}


def pages():
    """Yield (page number, lines); a line is a list of runs sorted left to right.
    A run is (left, right, text, bold)."""
    xml = subprocess.run(["pdftohtml", "-xml", "-i", "-stdout", "-f", str(BODY[0]), "-l", str(BODY[1]),
                          str(part1.pdf())], check=True, capture_output=True).stdout.decode("utf-8")
    for chunk in xml.split("<page ")[1:]:
        number = int(re.match(r'number="(\d+)"', chunk).group(1))
        runs = []
        for top, left, width, body in re.findall(
                r'<text top="(-?\d+)" left="(-?\d+)" width="(-?\d+)" height="-?\d+" font="\d+">(.*?)</text>', chunk, re.S):
            text = html.unescape(re.sub(r"<[^>]+>", "", body))
            # Rotated running heads sit at the right-hand edge with width 0.
            # Other width-0 runs are combining marks inside IPA and must be kept.
            if text.strip() and not (int(width) == 0 and int(left) > 1080):
                runs.append((int(top), int(left), int(left) + int(width), text, "<b>" in body))
        runs.sort()
        lines = []
        for r in runs:
            if lines and abs(r[0] - lines[-1][0]) <= 7:   # line pitch is 18; IPA runs sit a few px off
                lines[-1][1].append(r[1:])
            else:
                lines.append([r[0], [r[1:]]])
        yield number, [(l[0], sorted(l[1])) for l in lines]


def word_boxes():
    """{page: [(x0, y0, x1, text)]} from `pdftotext -bbox`, in PDF points.
    pdftotext separates words by their position on the page, so it keeps word
    breaks that are missing from the text runs of the older IPA font."""
    out = subprocess.run(["pdftotext", "-bbox", "-f", str(BODY[0]), "-l", str(BODY[1]), str(part1.pdf()), "-"],
                         check=True, capture_output=True).stdout.decode("utf-8")
    boxes = {}
    for i, chunk in enumerate(out.split("<page ")[1:]):
        boxes[BODY[0] + i] = [(float(a), float(b), float(c), html.unescape(t)) for a, b, c, t in re.findall(
            r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">(.*?)</word>', chunk)]
    return boxes


SCALE = 1.5   # pdftohtml pixels per PDF point

# Part of the catalog's IPA is set in an older font whose glyphs have no
# Unicode value and come out as private-use codes. Each mapping below was
# confirmed by eye against a crop of the page (see CHANGELOG.md).
GLYPHS = {
    "\uf03f": "\u0294",   # glottal stop
    "\uf083": "\u0361",   # tie bar (combining; follows the first letter)
    "\uf0f6": "\u0268",   # barred i
    "\uf0f9": "\u02d0",   # length mark
    "\uf067": "\u0261",   # script g
    "\uf04e": "\u014b",   # eng
    "\uf052": "\u027e",   # fish-hook r
    "\uf053": "\u0283",   # esh
    "\uf0c8": "\u02c8",   # primary stress
    "\uf0e2": "\u0303",   # tilde over the preceding letter (combining)
    "\uf0c3": "\u028c",   # geography only, pp. 169-170: small raised turned v; accepted, not IPA
}
# Tone letters: NOT confirmed yet. Left as private-use codes, and every
# entry that contains one stays in the review list.
HELD = {"\uf09a", "\uf091"}


def map_glyphs(text):
    return unicodedata.normalize("NFC", "".join(GLYPHS.get(c, c) for c in text))


def unmapped(text):
    return sorted({c for c in text if unicodedata.category(c) == "Co"})

MIN_GAP = 1.2 # points; a word space in the 10 pt IPA font is about 2.5
AMBIGUOUS = (0.5, 2.0)   # measured gaps are <= 0.5 or >= 2.0; anything between goes to review
GAPS = []     # every gap seen, for checking the threshold


def respace(text, page, top, x0, x1, boxes):
    """Rebuild word spacing of one left-cell line from word positions.
    Returns (text, status). The characters must be identical apart from
    spaces; otherwise the original text is returned unchanged."""
    words = sorted(w for w in boxes.get(page, []) if abs(w[1] * SCALE - top) <= 7
                   and w[0] * SCALE >= x0 - 6 and w[2] * SCALE <= x1 + 6)
    # pdftotext also breaks a word after a tie bar or a stacked diacritic, with
    # no real gap. Only a gap of at least MIN_GAP points counts as a space.
    spaced = ""
    for i, w in enumerate(words):
        gap = w[0] - words[i - 1][2] if i else 0
        GAPS.append((round(gap, 2), page, words[i - 1][3] if i else "", w[3]))
        if i and AMBIGUOUS[0] < gap < AMBIGUOUS[1]:
            return text, "ambiguous"          # neither clearly a space nor clearly none: do not decide
        spaced += (" " if i and gap >= MIN_GAP else "") + w[3]
    same = lambda a: "".join(unicodedata.normalize("NFC", a).split())
    if spaced and same(spaced) == same(text) and len(spaced.split()) >= len(text.split()):
        return spaced, "respaced" if spaced != text else "same"
    # The two extractions disagree on the characters themselves (stacked
    # diacritics come out in a different order): keep the text, flag it.
    return text, "mismatch" if spaced else "same"


def text_of(runs):
    return re.sub(r"\s+", " ", "".join(r[2] for r in runs)).strip()


def read_entries():
    """Every table entry, in document order, with its raw left and right cells."""
    entries, cur, closed, in_table, heading, g = [], None, True, False, "", None
    boxes = word_boxes()
    for number, lines in pages():
        # The geography column's left edge: every state name starts a line there.
        cands = sorted({r[0] for _, l in lines for r in l if not r[3] and STATE_RE.match(r[2].strip())})
        for top, line in lines:
            full = text_of(line)
            if HEADER_RE.search(full) and ("REFERE" in full or "REGIÓN" in full):
                in_table, closed = True, True
                continue
            hit = [c for c in cands if any(abs(r[0] - c) <= 2 for r in line)]
            if hit:
                g = min(hit)
            if g is None:
                continue
            left = [r for r in line if r[0] < g - 6]
            right = [r for r in line if r[0] >= g - 6]
            lt = text_of(left)
            if lt.startswith("[") or (cur and not closed and cur.get("open_ipa")):
                lt, status = respace(lt, number, top, min(r[0] for r in left), max(r[1] for r in left), boxes)
                if status != "same" and cur is not None:
                    cur.setdefault(status, []).append(lt)
            if HEADER_LEFT_RE.search(lt):
                continue
            aligned = bool(right) and abs(right[0][0] - g) <= 2 and (not left or max(r[1] for r in left) <= g + 2)
            if not in_table:
                if lt and not right and any(r[3] for r in left) and not lt.startswith("(") and lt != lt.upper():
                    heading = lt
                continue
            if closed:
                if lt and right and aligned:                      # first line of a new entry
                    cur = {"page": number, "heading": heading, "left": [lt], "right": [right]}
                    entries.append(cur)
                    closed = False
                elif not lt and right and cur and aligned:           # geography continuing
                    cur["right"].append(right)
                elif lt and not right and re.match(r"^[\[<]", lt) is None and any(r[3] for r in left):
                    in_table, heading = False, lt                  # bold line: next group's heading
                elif lt or right:
                    if re.search(r"^\(Viene de |^\(Continúa ", full):
                        continue
                    in_table = False                               # running text between tables
                    if lt and not right and any(r[3] for r in left) and not lt.startswith("(") and lt != lt.upper():
                        heading = lt
                continue
            if lt:
                cur["left"].append(lt)
            if right:
                cur["right"].append(right)
            if lt.endswith(">"):
                closed = True
    return entries


def split_left(lines):
    """Left cell -> (autonyms, ipas, spanish name). Wrapped items are rejoined."""
    autonyms, ipas, name, mode = [], [], None, None
    for t in lines:
        if mode == "name":
            name += ("" if name.endswith("-") else " ") + t
        elif t.startswith("<"):
            name, mode = t, "name"
        elif mode == "ipa" or t.startswith("["):
            if mode == "ipa":
                ipas[-1] += " " + t
            else:
                ipas.append(t)
            mode = None if ipas[-1].count("[") <= ipas[-1].count("]") else "ipa"
        elif autonyms and autonyms[-1].count("(") > autonyms[-1].count(")"):
            autonyms[-1] += ("" if autonyms[-1].endswith("-") else " ") + t
        else:
            autonyms.append(t)
    return autonyms, ipas, (name or "").strip("<> ").strip()


def split_localities(text):
    out, depth, cur = [], 0, ""
    for ch in text:
        depth += ch in "([" 
        depth -= ch in ")]"
        if ch == "," and depth <= 0:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    out.append(cur)
    return [re.sub(r"\s+", " ", x).strip(" .") for x in out if x.strip(" .")]


def parse_geo(lines):
    """Right cell -> ([(state_raw, municipio, locality)], problems)."""
    rows, problems, state, muni, buf = [], [], None, None, ""

    def flush():
        nonlocal buf
        body = buf.strip()
        buf = ""
        if body.startswith(":"):
            body = body[1:]
        if not body.strip(" ."):
            if muni is not None:
                problems.append("municipio with no localities: %s" % muni)
            return
        if state is None or muni is None:
            problems.append("text outside a state/municipio: %s" % body[:60])
            return
        for loc in split_localities(body):
            rows.append((state, muni, loc))

    pending_bold = False
    for line in lines:
        for i, (l, r, text, bold) in enumerate(line):
            if bold and not re.search(r"\w", text):
                bold = False                      # bold punctuation or space is not a municipality
                if not text.strip():
                    continue
            if bold:
                if pending_bold:
                    muni += " " + text.strip()
                else:
                    flush()
                    muni = text.strip()
                    pending_bold = True
                continue
            m = STATE_RE.match(text.strip()) if i == 0 else None
            if m:
                flush()
                state, muni = m.group(1), None
                text = text.strip()[m.end():]
            if text.strip():
                pending_bold = False
            buf += text
        buf += " "
    flush()
    return rows, problems


def norm(s):
    return re.sub(r"\s+", " ", s.replace("’", "'")).strip()


def tight(s):
    """For comparing autonyms: ignore spacing, which text extraction does not preserve reliably."""
    return "".join(norm(s).split())


def build():
    variants = list(csv.DictReader(open(part1.ROOT / "variants.csv", encoding="utf-8")))
    by_name = {}
    for v in variants:
        by_name.setdefault(norm(v["spanish_name"]), {}).setdefault(v["variant"], []).append(v)
    by_id = {}
    for v in variants:
        by_id.setdefault(v["variant"], []).append(v)

    results, review = [], []
    for e in read_entries():
        autonyms, ipas, name = split_left(e["left"])
        ipas = [map_glyphs(i) for i in ipas]
        cands = by_name.get(norm(name))
        how = "exact"
        if not cands:                                   # body spelling differs from Appendix 4
            vid = part1.slug(name)
            cands = {vid: by_id[vid]} if vid in by_id else None
            how = "by identifier"
        if cands and len(cands) > 1:                    # one name, two variants: tell apart by autonym
            pick = [vid for vid, rows in cands.items()
                    if {tight(r.get("autonym_appendix4") or r["autonym"]) for r in rows} & {tight(a) for a in autonyms}]
            cands = {pick[0]: cands[pick[0]]} if len(pick) == 1 else None
            how = "by autonym"
        geo, problems = parse_geo(e["right"])
        geo = [(st, map_glyphs(mu), map_glyphs(loc)) for st, mu, loc in geo]
        for st, mu, loc in geo:
            if unmapped(mu + loc):
                problems.append("characters with no Unicode value: %s / %s" % (mu, loc))
        item = {"page": e["page"], "heading": e["heading"], "name": name, "autonyms": autonyms, "ipas": ipas,
                "geo": geo, "variant": None, "join": how, "respaced": e.get("respaced", []),
                "held_ipas": [map_glyphs(x) for x in e.get("mismatch", []) + e.get("ambiguous", [])]}
        if e.get("mismatch"):
            review.append((e["page"], name, "IPA differs between two extractions", " ".join(e["mismatch"])))
        if e.get("ambiguous"):
            review.append((e["page"], name, "IPA word gap ambiguous", " ".join(e["ambiguous"])))
        if not cands:
            review.append((e["page"], name, "no join to variants.csv", " | ".join(e["left"])))
        else:
            vid, rows = next(iter(cands.items()))
            item["variant"], item["group"] = vid, rows[0]["group"]
            if part1.fold(e["heading"]) != part1.fold(rows[0]["group"]):
                review.append((e["page"], name, "table heading differs from group", "%s / %s" % (e["heading"], rows[0]["group"])))
            printed = [r.get("autonym_appendix4") or r["autonym"] for r in rows]
            if {tight(a) for a in printed} != {tight(a) for a in autonyms}:
                review.append((e["page"], name, "autonyms differ from Appendix 4",
                               "body: %s || appendix: %s" % (autonyms, printed)))
        if len(ipas) != len(autonyms):
            review.append((e["page"], name, "IPA count differs from autonym count", "autonyms: %s || ipa: %s" % (autonyms, ipas)))
        left_over = unmapped("".join(ipas))
        if left_over:
            kind = "IPA has unconfirmed tone-letter glyphs" if set(left_over) <= HELD else "IPA has characters with no Unicode value"
            review.append((e["page"], name, kind, " ".join(ipas)))
        for p in problems:
            review.append((e["page"], name, "geography", p))
        for s in sorted({g[0] for g in geo} - set(STATES)):
            review.append((e["page"], name, "state not in canonical list", s))
        if not geo:
            review.append((e["page"], name, "no geography parsed", ""))
        results.append(item)
    return variants, results, review


def poppler_version():
    out = subprocess.run(["pdftohtml", "-v"], capture_output=True)
    return re.search(r"version ([\d.]+)", (out.stderr + out.stdout).decode()).group(1)


ITER_URL = "https://www.inegi.org.mx/contenidos/programas/ccpv/2020/datosabiertos/iter/iter_00_cpv2020_csv.zip"
ITER_SHA256 = "9342fdbd45bda5897f2b827a12904843b6f8fb85d4e72da299e09e4d2422ab60"
MUNICIPIOS = part1.ROOT / "reference" / "inegi_municipios_2020.csv"


def municipios():
    """{(state code, folded name): (municipio code, INEGI name)} from INEGI's
    2020 census locality file (ITER). The small list is kept in reference/;
    it is rebuilt from the 36 MB download only if that file is missing."""
    if not MUNICIPIOS.exists():
        import hashlib, io, urllib.request, zipfile
        cache = part1.ROOT / ".cache" / "inegi" / "iter.zip"
        if not cache.exists():
            cache.parent.mkdir(parents=True, exist_ok=True)
            req = urllib.request.Request(ITER_URL, headers={"User-Agent": "language-resource-tracker"})
            cache.write_bytes(urllib.request.urlopen(req, timeout=600).read())
        if hashlib.sha256(cache.read_bytes()).hexdigest() != ITER_SHA256:
            sys.exit("INEGI ITER 2020 file does not match the pinned checksum")
        z = zipfile.ZipFile(cache)
        name = next(n for n in z.namelist() if "conjunto_de_datos" in n and n.endswith(".csv"))
        rows = []
        with z.open(name) as f:
            for r in csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig")):
                if int(r["LOC"]) == 0 and int(r["MUN"]) != 0:
                    rows.append([r["ENTIDAD"].zfill(2), r["NOM_ENT"], r["MUN"].zfill(3), r["NOM_MUN"]])
        MUNICIPIOS.parent.mkdir(exist_ok=True)
        with open(MUNICIPIOS, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f, lineterminator="\n")
            w.writerow(["state_code", "state", "municipio_code", "municipio"])
            w.writerows(rows)
    table = {}
    for r in csv.DictReader(open(MUNICIPIOS, encoding="utf-8")):
        key = (r["state_code"], part1.fold(r["municipio"]))
        # Two municipalities in one state can share a name (Oaxaca has two
        # "San Juan Mixtepec" and two "San Pedro Mixtepec"). Such a name
        # identifies neither: it is marked AMBIGUOUS, never given a code.
        table[key] = AMBIGUOUS_NAME if key in table else (r["municipio_code"], r["municipio"])
    # municipio_aliases.csv: hand-checked names the catalog prints differently
    # from INEGI (spelling, short or older forms, Oaxaca districts, and a few
    # settled by which municipality contains the listed localities). An alias
    # is keyed on the exact printed name within the state.
    valid = {(r["state_code"], r["municipio_code"]) for r in csv.DictReader(open(MUNICIPIOS, encoding="utf-8"))}
    for a in csv.DictReader(open(part1.ROOT / "municipio_aliases.csv", encoding="utf-8")):
        if (a["state_code"], a["municipio_code"]) not in valid:
            sys.exit("municipio_aliases.csv: unknown code %s-%s" % (a["state_code"], a["municipio_code"]))
        table[(a["state_code"], "alias:" + a["municipio_printed"])] = (a["municipio_code"], a["municipio_inegi"])
    return table


AMBIGUOUS_NAME = ("", "")


def find_municipio(table, state_code, printed):
    """Exact name match within the state (ignoring case and accents). A
    bracketed correction such as "Del Nayar [El Nayar]" may match on either form."""
    if (state_code, "alias:" + printed) in table:
        return table[(state_code, "alias:" + printed)]
    forms = [printed] + re.findall(r"\[([^\]]+)\]", printed) + [re.sub(r"\s*\[[^\]]*\]", "", printed)]
    for form in forms:
        hit = table.get((state_code, part1.fold(form.strip())))
        if hit:
            return hit
    return None


def pair_autonyms(body, appendix):
    """Pair each Appendix 4 autonym with the body's spelling of it.
    Returns ([(appendix, body)], unpaired). Never pairs by guesswork: only
    identical-ignoring-spaces, or the single closest remaining candidate."""
    import difflib
    pairs, left_b, left_a = [], list(body), []
    for a in appendix:
        same = [b for b in left_b if tight(b) == tight(a)]
        if same:
            pairs.append((a, same[0]))
            left_b.remove(same[0])
        else:
            left_a.append(a)
    for a in list(left_a):
        scored = sorted(((difflib.SequenceMatcher(None, part1.fold(a), part1.fold(b)).ratio(), b) for b in left_b), reverse=True)
        if scored and scored[0][0] >= 0.8 and (len(scored) == 1 or scored[0][0] - scored[1][0] > 0.05):
            pairs.append((a, scored[0][1]))
            left_b.remove(scored[0][1])
            left_a.remove(a)
    return pairs, left_a + left_b


def main():
    import datetime, json
    variants, results, review = build()
    by_id = {}
    for v in variants:
        by_id.setdefault(v["variant"], []).append(v)
    if len(results) != 364 or len({r["variant"] for r in results}) != 364:
        sys.exit("expected 364 body entries joined to 364 variants; nothing written")
    corrections = {(c["variant"], c["autonym"]): c for c in csv.DictReader(open(part1.ROOT / "ipa_corrections.csv", encoding="utf-8"))}
    used = set()
    table = municipios()
    held = {}                                   # (page, name) -> reasons that keep its IPA out of the main file
    for page, name, reason, detail in review:
        if reason.startswith("IPA"):
            held.setdefault((page, name), []).append(reason)

    ipa_rows, loc_rows, overrides, out_review = [], [], [], []
    for r in results:
        vid = r["variant"]
        pairs, unpaired = pair_autonyms(r["autonyms"], [v.get("autonym_appendix4") or v["autonym"] for v in by_id[vid]])
        if unpaired:
            out_review.append([r["page"], vid, r["name"], "autonyms could not be paired with Appendix 4", " | ".join(unpaired)])
        for a, b in pairs:
            if a != b:
                overrides.append([vid, a, b])
        for autonym, ipa in zip(r["autonyms"], r["ipas"]):
            fix = corrections.get((vid, autonym))
            if fix:
                used.add((vid, autonym))
                ipa_rows.append([vid, autonym, fix["ipa"], "corrected-by-hand"])
            elif unmapped(ipa) or ipa in r["held_ipas"]:
                ipa_rows.append([vid, autonym, "", "in-review"])
            else:
                ipa_rows.append([vid, autonym, ipa, "extracted"])
        seen = set()
        for state_raw, muni, loc in r["geo"]:
            code, state = STATES.get(state_raw, ("", ""))
            hit = find_municipio(table, code, muni)
            if hit == AMBIGUOUS_NAME:
                hit = None
                if (state_raw, muni) not in seen:
                    seen.add((state_raw, muni))
                    out_review.append([r["page"], vid, r["name"], "municipio name shared by more than one INEGI municipality",
                                       "%s: %s" % (state_raw, muni)])
            elif not hit and (state_raw, muni) not in seen:
                seen.add((state_raw, muni))
                out_review.append([r["page"], vid, r["name"], "municipio not in INEGI 2020 list", "%s: %s" % (state_raw, muni)])
            loc_rows.append([vid, code, state, state_raw, hit[0] if hit else "", muni, loc])
    for page, name, reason, detail in review:
        if reason == "autonyms differ from Appendix 4":
            continue                               # settled: the body is authoritative (see autonym overrides)
        vid = next(r["variant"] for r in results if (r["page"], r["name"]) == (page, name))
        done = reason.startswith("IPA") and all(row[3] != "in-review" for row in ipa_rows if row[0] == vid)
        if not done:
            out_review.append([page, vid, name, reason, detail])
    if set(corrections) - used:
        sys.exit("ipa_corrections.csv has rows that match no autonym: %s" % sorted(set(corrections) - used))
    if len(ipa_rows) != 476:
        sys.exit("expected 476 autonym rows, found %d; nothing written" % len(ipa_rows))

    root = part1.ROOT
    w = lambda name, header, rows: common_write(root / name, header, rows)
    w("variant_ipa.csv", ["variant", "autonym", "ipa", "ipa_status"], ipa_rows)
    w("variant_localities.csv", ["variant", "state_code", "state", "state_raw", "municipio_code", "municipio", "locality"], loc_rows)
    w("review_list.csv", ["page", "variant", "spanish_name", "reason", "detail"], sorted(out_review, key=lambda x: (x[0], x[1], x[3])))
    w("autonym_overrides.csv", ["variant", "autonym_appendix4", "autonym_body"], overrides)
    meta = {"source": part1.URL, "source_sha256": part1.SHA256, "poppler_version": poppler_version(),
            "built": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "body_pages": list(BODY), "entries": len(results), "autonym_rows": len(ipa_rows),
            "ipa_status": dict(Counter(r[3] for r in ipa_rows)), "locality_rows": len(loc_rows),
            "review_rows": len(out_review), "glyphs_mapped": sorted("%X" % ord(k) for k in GLYPHS),
            "glyphs_held": sorted("%X" % ord(k) for k in HELD), "min_gap_pt": MIN_GAP}
    with open(root / "inali_build.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(json.dumps(meta, ensure_ascii=False))
    print("review reasons:", Counter(x[3] for x in out_review))


def common_write(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)


if __name__ == "__main__":
    main()
