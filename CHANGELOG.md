# Changelog

## 2026-10-02 — Source spike decisions; Glottolog and Hugging Face fetchers

- **OLAC dropped from the MVP.** The OAI-PMH harvest endpoint
  (`www.language-archives.org/cgi-bin/olaca3.pl`) returns 404. The site was
  relaunched with a search service at `search.language-archives.org`, which
  has no documented public API or bulk dump. The archive-records indicator
  is dropped pending a documented alternative. It is not silently missing:
  no snapshot contains OLAC rows at all, and the README lists it as dropped.
- **Hugging Face stores two counts per kind:** `datasets_raw` /
  `datasets_focused` and `models_raw` / `models_focused`. "Focused" means
  the repo is tagged for at most 3 of the 68 groups.
  **The cutoff of 3 is a judgment call, not a measured threshold.** It was
  picked after seeing that most raw counts come from a few massively
  multilingual repos; no analysis was done to derive it. It is the constant
  `FOCUSED_MAX_GROUPS` in `sources/huggingface.py` and is written into every
  `huggingface_repos.json`. Changing it changes the series.
- **INEGI residual rows** (Census 2020, sheet 03 of
  `cpv2020_b_eum_05_etnicidad.xlsx`):
  - In `unresolved.csv`, because each belongs to one of the 68 groups but
    the variant was not specified: "Chontal insuficientemente especificado"
    (1,704), "Popoluca insuficientemente especificado" (8,427), "Tepehuano
    insuficientemente especificado" (317).
  - Explicitly excluded, and not in `unresolved.csv`, because they are
    residual census categories outside INALI's 68 groups and not crosswalk
    candidates: "Otras lenguas indígenas de América" (2,453) and
    "No especificado" (22,777).
- `unresolved.csv` gained a `raw_name` column for sources that report a
  name instead of an ISO code. `tools/build_crosswalk.py` now keeps rows
  written by other sources when it rebuilds.
- Added `sources/common.py`, `sources/glottolog.py`,
  `sources/huggingface.py` and the first snapshot, `snapshots/2026-10-02/`.
- Spike notes kept for the record: Common Voice's current releases are
  scripted speech 27.0 and spontaneous speech 5.0 (both 2026-09-11); the
  per-language INEGI table is the workbook above, not ITER 2020, which only
  has totals per locality.

## 2026-10-02 — Zenodo verification and crosswalk corrections

- **Glottolog 5.3 re-fetched from Zenodo and verified.**
  - Archive: `glottolog/glottolog-cldf-v5.3.zip` from record 18840967
    (doi:10.5281/zenodo.18840967), 49,646,070 bytes,
    md5 `a90ec97b56abb432dc02ca7b5a838272` — matches the md5 Zenodo publishes.
  - `cldf/languages.csv` and `cldf/values.csv` in the archive are identical
    in content to the GitHub-sourced copies. The raw sha256 values differ
    only because the Zenodo zip ships CRLF line endings and GitHub serves LF;
    with line endings normalised to LF both files match the pinned sha256.
  - The archive's top folder is `glottolog-glottolog-cldf-db1d557`. `db1d557`
    is the annotated tag object for `v5.3`; it points at commit `072ca0d`.
  - `tools/build_crosswalk.py` now downloads from Zenodo, checks the archive
    md5, normalises to LF and checks the sha256 of both files.
- Classical Nahuatl (`nci`) removed from the Náhuatl group and listed in
  `unresolved.csv` ("historical variety, not a living INALI variant").
  Náhuatl now has 28 individual codes.
- `crosswalk.csv` gained a `collective_code` column. Náhuatl carries `nah`
  (ISO 639-2 collective code); empty for every other group.
- Southern Pame (`pmz`) removed from the Pame group's codes in
  `crosswalk.csv`; kept in `crosswalk_members.csv` with
  `scope = out-of-scope`. `crosswalk_members.csv` gained `scope` and
  `scope_note` columns (replacing `outside_node`, which was always empty).
- Added `member_overrides.csv`, which holds these two per-code decisions.
- Group names checked against INALI's published list of 68 agrupaciones
  and normalised to its exact orthography: 56 names lower-cased,
  `Q'eqchi'` corrected to `Q'eqchí'`, and rows put in INALI's order.
  Renaming only; no code, Glottocode or match_type changed.
- Group-level result unchanged: 65 of 68 resolved (95.6%).

## 2026-10-02 — Seed crosswalk

- Pinned Glottolog to release **5.3** (glottolog-cldf).
  - Zenodo DOI: [10.5281/zenodo.18840967](https://doi.org/10.5281/zenodo.18840967)
  - Git tag `v5.3`, commit `072ca0d0410039fb8b779be8fc165bac575d2cda`,
    published 2026-03-02
  - `cldf/languages.csv` (LF line endings) sha256 `1a50a393bc81568b656f9522be18aa4f80f38e94309ba6c863d583234adfbb89`
  - `cldf/values.csv` (LF line endings) sha256 `a8601cb04ccc6a310538217f772d2461853aa0ea49e3bfe24c7396570fc4ea25`
  - First fetched from the GitHub tag, because zenodo.org was unreachable
    at the time. See the Zenodo verification entry above.
- Added `inali_groups.csv`, the hand-entered seed of INALI's 68 groups.
- Added `tools/build_crosswalk.py`, which writes `crosswalk.csv`,
  `crosswalk_members.csv` and `unresolved.csv`.
- Result: 65 of 68 groups resolved (95.6%): 43 exact, 21 many-to-one,
  1 macrolanguage, 3 unresolved (Ku'ahl, Otomí, Zoque).

## 2026-10-02 — Scaffolding

- Repo structure, README, placeholder LICENSE.
