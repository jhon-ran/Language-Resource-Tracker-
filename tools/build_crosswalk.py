#!/usr/bin/env python3
"""Build crosswalk.csv: INALI's 68 language groups -> Glottocode.

Reads the hand-entered seed (inali_groups.csv) and resolves every group
against a pinned Glottolog CLDF release, using Glottolog's own ISO 639-3
cross-references. Stdlib only. Re-running against the same pin gives the
same output.

selector_type in the seed:
  iso    one or more ISO 639-3 codes, ';'-separated (empty = no ISO code exists)
  macro  an ISO 639-3 macrolanguage code that Glottolog attaches to a subgroup
  name   regex on Glottolog's language name, limited to language-level,
         non-bookkeeping languoids located in Mexico that carry an ISO code

member_overrides.csv takes single ISO codes out of a group:
  unresolved    dropped from the group and listed in unresolved.csv
  out-of-scope  dropped from the group's codes in crosswalk.csv, kept in
                crosswalk_members.csv with scope = out-of-scope

match_type written:
  exact         one ISO code <-> one Glottolog language
  macrolanguage ISO macrolanguage code <-> the Glottolog node carrying it
  many-to-one   several ISO codes -> their lowest common ancestor in Glottolog
  unresolved    no ISO code, a code Glottolog doesn't have, or an ancestor
                node that also contains another INALI group's languages
"""
import csv, hashlib, io, pathlib, re, sys, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PIN = {
    "version": "5.3",
    "doi": "10.5281/zenodo.18840967",
    "git_tag": "v5.3",
    "git_commit": "072ca0d0410039fb8b779be8fc165bac575d2cda",
    "zenodo_zip": "https://zenodo.org/api/records/18840967/files/glottolog/glottolog-cldf-v5.3.zip/content",
    "zenodo_zip_md5": "a90ec97b56abb432dc02ca7b5a838272",
    # sha256 of each file with LF line endings (the Zenodo zip ships CRLF)
    "sha256": {
        "languages.csv": "1a50a393bc81568b656f9522be18aa4f80f38e94309ba6c863d583234adfbb89",
        "values.csv": "a8601cb04ccc6a310538217f772d2461853aa0ea49e3bfe24c7396570fc4ea25",
    },
}
CACHE = ROOT / ".cache" / ("glottolog-cldf-" + PIN["git_tag"])
SOURCE = "glottolog-cldf %s (doi:%s)" % (PIN["git_tag"], PIN["doi"])
BOOKKEEPING = "book1242"


def fetch(name):
    path = CACHE / name
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        blob = urllib.request.urlopen(PIN["zenodo_zip"]).read()
        if hashlib.md5(blob).hexdigest() != PIN["zenodo_zip_md5"]:
            sys.exit("checksum mismatch for the Zenodo archive")
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            for member in z.namelist():
                base = member.rsplit("/", 1)[-1]
                if member.endswith("/cldf/" + base) and base in PIN["sha256"]:
                    (CACHE / base).write_bytes(z.read(member).replace(b"\r\n", b"\n"))
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != PIN["sha256"][name]:
        sys.exit("checksum mismatch for %s: %s" % (name, digest))
    return path


def main():
    langs = {r["ID"]: r for r in csv.DictReader(open(fetch("languages.csv"), encoding="utf-8"))}
    lineage = {}  # glottocode -> ancestors, root first
    for r in csv.DictReader(open(fetch("values.csv"), encoding="utf-8")):
        if r["Parameter_ID"] == "classification":
            lineage[r["Language_ID"]] = r["Value"].split("/")
    by_iso = {r["ISO639P3code"]: r for r in langs.values()
              if r["ISO639P3code"] and r["Family_ID"] != BOOKKEEPING}

    def is_real_language(r):
        return r["Level"] == "language" and r["ISO639P3code"] and r["Family_ID"] != BOOKKEEPING

    def descendants(node):
        return [r for g, r in langs.items() if node in lineage.get(g, []) and is_real_language(r)]

    def lca(codes):
        paths = [lineage.get(c, []) + [c] for c in codes]
        common = []
        for level in zip(*paths):
            if len(set(level)) != 1:
                break
            common.append(level[0])
        return common[-1] if common else ""

    seed = list(csv.DictReader(open(ROOT / "inali_groups.csv", encoding="utf-8")))
    overrides = {}  # (inali_name, iso) -> (action, reason)
    for o in csv.DictReader(open(ROOT / "member_overrides.csv", encoding="utf-8")):
        overrides[(o["inali_name"], o["iso639_3"])] = (o["action"], o["reason"])
    set_aside = []  # (inali_name, glottolog row, action, reason)
    resolved = []  # (seed row, raw iso string, node, match_type, members, problem)
    for s in seed:
        kind, sel = s["selector_type"], s["selector"].strip()
        members, node, mtype, raw, problem = [], "", "unresolved", sel, ""
        if kind == "iso":
            isos = [c for c in sel.split(";") if c]
            missing = [c for c in isos if c not in by_iso]
            if not isos:
                problem = "no ISO 639-3 code for this group"
            elif missing:
                problem = "ISO code(s) not in Glottolog: " + ";".join(missing)
            else:
                members = [by_iso[c] for c in isos]
        elif kind == "macro":
            hit = by_iso.get(sel)
            if hit is None:
                problem = "macrolanguage code not in Glottolog"
            else:
                node, mtype = hit["ID"], "macrolanguage"
                members = descendants(node)
        elif kind == "name":
            rx = re.compile(sel)
            members = [r for r in langs.values() if is_real_language(r)
                       and "MX" in r["Countries"].split(";") and rx.search(r["Name"])]
            raw = ";".join(sorted(r["ISO639P3code"] for r in members))
            if not members:
                problem = "name pattern matched nothing"
        kept = []
        for r in members:
            action = overrides.get((s["inali_name"], r["ISO639P3code"]))
            if action:
                set_aside.append((s["inali_name"], r, action[0], action[1]))
            else:
                kept.append(r)
        if len(kept) != len(members):
            members = kept
            if kind != "macro":
                raw = ";".join(sorted(r["ISO639P3code"] for r in members))
        if members and kind != "macro":
            if len(members) == 1:
                node, mtype = members[0]["ID"], "exact"
            else:
                node = lca([r["ID"] for r in members])
                mtype = "many-to-one" if node else "unresolved"
                if not node:
                    problem = "members share no common Glottolog ancestor"
        resolved.append([s, raw, node, mtype, members, problem])

    # A subgroup node must not swallow a language that belongs to another group.
    owner = {}
    for s, _, _, _, members, _ in resolved:
        for r in members:
            owner.setdefault(r["ID"], s["inali_name"])
    for row in resolved:
        s, _, node, mtype, members, _ = row
        if mtype in ("many-to-one", "macrolanguage"):
            clash = sorted({owner[r["ID"]] for r in descendants(node)
                            if owner.get(r["ID"], s["inali_name"]) != s["inali_name"]})
            if clash:
                row[2], row[3] = "", "unresolved"
                row[5] = "common ancestor %s (%s) also contains: %s" % (
                    node, langs[node]["Name"], ", ".join(clash))

    with open(ROOT / "crosswalk.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["inali_name", "raw_iso639_3", "canonical_glottocode", "match_type", "source",
                    "collective_code"])
        for s, raw, node, mtype, _, _ in resolved:
            w.writerow([s["inali_name"], raw, node, mtype, SOURCE, s["collective_code"]])

    with open(ROOT / "crosswalk_members.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["inali_name", "iso639_3", "glottocode", "glottolog_name", "group_glottocode",
                    "scope", "scope_note"])
        for s, _, node, _, members, _ in resolved:
            rows = [(r, "in-scope", "") for r in members]
            rows += [(r, "out-of-scope", why) for name, r, action, why in set_aside
                     if name == s["inali_name"] and action == "out-of-scope"]
            for r, scope, why in sorted(rows, key=lambda t: t[0]["Name"]):
                w.writerow([s["inali_name"], r["ISO639P3code"], r["ID"], r["Name"], node, scope, why])

    # Rows written by other sources (e.g. INEGI) are kept as they are.
    path = ROOT / "unresolved.csv"
    others = [r for r in csv.DictReader(open(path, encoding="utf-8"))
              if not r["source"].startswith("glottolog-cldf")] if path.exists() else []
    header = ["inali_name", "raw_iso639_3", "raw_name", "source", "reason", "first_seen", "last_seen"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(header)
        for s, raw, _, mtype, _, problem in resolved:
            if mtype == "unresolved":
                w.writerow([s["inali_name"], raw, "", SOURCE, problem, "", ""])
        for name, r, action, why in set_aside:
            if action == "unresolved":
                w.writerow([name, r["ISO639P3code"], "", SOURCE, why, "", ""])
        for r in others:
            w.writerow([r.get(h, "") for h in header])

    counts = {}
    for _, _, _, mtype, _, _ in resolved:
        counts[mtype] = counts.get(mtype, 0) + 1
    ok = len(resolved) - counts.get("unresolved", 0)
    print("groups: %d  %s" % (len(resolved), counts))
    print("resolved: %d/%d = %.1f%%" % (ok, len(resolved), 100.0 * ok / len(resolved)))
    for s, raw, node, mtype, members, problem in resolved:
        print("|".join([s["inali_name"], mtype, node, langs[node]["Name"] if node else "",
                        str(len(members)), raw if len(raw) < 24 else raw[:20] + "...", problem]))


if __name__ == "__main__":
    main()
