#!/usr/bin/env python3
"""Hugging Face fetcher: dataset and model counts for each INALI group.

Four indicators per group, each its own row:
  datasets_raw      distinct datasets tagged with any of the group's codes
  datasets_focused  the subset tagged for at most FOCUSED_MAX_GROUPS of the 68 groups
  models_raw        distinct models whose model card lists any of the group's codes
  models_focused    the subset listed for at most FOCUSED_MAX_GROUPS of the 68 groups

Query rules (both verified against the live API on 2026-10-02):
  datasets  GET /api/datasets?filter=language:<code>
  models    GET /api/models?filter=<code>   (bare code; `language:<code>` returns nothing)
A bare model tag also matches non-language tags (pos, mix, mit, ...), so a
model only counts when <code> is in its model card's `language` list.

States:
  measured       count > 0
  measured-zero  the group's codes were queried and nothing matched
  unresolved     the group has no code to query with
"""
import json, os, re, sys, time, urllib.error, urllib.request
import common

API = "https://huggingface.co/api/"
FOCUSED_MAX_GROUPS = 3   # a judgment call, not a measured threshold; see CHANGELOG.md
PAUSE = 0.65             # anonymous limit is 500 requests per 5 minutes


def get_all(url):
    """Follow Link: rel=next pagination and return every item."""
    items = []
    headers = {"User-Agent": "language-resource-tracker"}
    if os.environ.get("HF_TOKEN"):
        headers["Authorization"] = "Bearer " + os.environ["HF_TOKEN"]
    while url:
        for attempt in range(6):
            try:
                resp = urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120)
                break
            except urllib.error.HTTPError as e:
                if e.code not in (429, 500, 502, 503, 504) or attempt == 5:
                    raise
                time.sleep(60)
            except urllib.error.URLError:
                if attempt == 5:
                    raise
                time.sleep(30)
        items += json.load(resp)
        nxt = re.search(r'<([^>]+)>;\s*rel="next"', resp.headers.get("Link") or "")
        url = nxt.group(1) if nxt else None
        time.sleep(PAUSE)
    return items


def card_languages(model):
    langs = (model.get("cardData") or {}).get("language") or []
    return [langs] if isinstance(langs, str) else langs


def main():
    args = common.parse_args(__doc__.splitlines()[0])
    date, out = common.snapshot_dir(args.date)
    measured_at = common.now()
    groups = common.load_groups()

    # Per-code results are kept in .cache/ so an interrupted run resumes
    # instead of starting over. The cache is per snapshot date.
    cache = common.ROOT / ".cache" / ("huggingface-" + date)
    cache.mkdir(parents=True, exist_ok=True)
    per_code = {}  # code -> {"datasets": [ids], "models": [ids], "rejected": n}
    for code in sorted({c for g in groups for c in g["codes"]}):
        saved = cache / (code + ".json")
        if saved.exists():
            per_code[code] = json.loads(saved.read_text(encoding="utf-8"))
            continue
        datasets = [d["id"] for d in get_all(API + "datasets?filter=language:%s&limit=1000" % code)]
        hits = get_all(API + "models?filter=%s&limit=1000&cardData=true" % code)
        models = [m["id"] for m in hits if code in card_languages(m)]
        per_code[code] = {"datasets": datasets, "models": models, "rejected": len(hits) - len(models)}
        saved.write_text(json.dumps(per_code[code]), encoding="utf-8")
        print(code, len(datasets), len(models), file=sys.stderr, flush=True)

    # How many of the 68 groups is each repo tagged for?
    per_group, breadth = {}, {"datasets": {}, "models": {}}
    for g in groups:
        per_group[g["inali_name"]] = {}
        for kind in ("datasets", "models"):
            repos = {r for c in g["codes"] for r in per_code[c][kind]}
            per_group[g["inali_name"]][kind] = repos
            for r in repos:
                breadth[kind][r] = breadth[kind].get(r, 0) + 1

    rows = []
    for g in groups:
        for kind in ("datasets", "models"):
            repos = per_group[g["inali_name"]][kind]
            focused = {r for r in repos if breadth[kind][r] <= FOCUSED_MAX_GROUPS}
            for indicator, n, detail in (
                    (kind + "_raw", len(repos), "%d codes queried" % len(g["codes"])),
                    (kind + "_focused", len(focused),
                     "repos tagged for <=%d of the 68 groups" % FOCUSED_MAX_GROUPS)):
                if not g["codes"]:
                    rows.append(common.row(date, measured_at, g, "huggingface", indicator, "",
                                           "unresolved", "no code to query with"))
                else:
                    rows.append(common.row(date, measured_at, g, "huggingface", indicator, n,
                                           "measured" if n else "measured-zero", detail))

    code_rows = [[date, g["inali_name"], c, len(per_code[c]["datasets"]), len(per_code[c]["models"]),
                  per_code[c]["rejected"]] for g in groups for c in g["codes"]]
    common.write_csv(out / "huggingface.csv", common.COLUMNS, rows)
    common.write_csv(out / "huggingface_codes.csv",
                     ["snapshot_date", "inali_name", "code", "datasets", "models",
                      "models_rejected_tag_only"], code_rows)
    repos = {kind: {} for kind in ("datasets", "models")}
    for code, found in per_code.items():
        for kind in repos:
            for r in found[kind]:
                repos[kind].setdefault(r, []).append(code)
    with open(out / "huggingface_repos.json", "w", encoding="utf-8") as f:
        json.dump({"snapshot_date": date, "measured_at": measured_at,
                   "focused_max_groups": FOCUSED_MAX_GROUPS, "repos": repos},
                  f, ensure_ascii=False, indent=1, sort_keys=True)
    print("wrote %s: %d rows, %d codes" % (out, len(rows), len(per_code)))


if __name__ == "__main__":
    main()
