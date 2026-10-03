# Changelog

## 2026-10-02 — INALI catalog (CLIN 2008): known quirks, for the methods write-up

Source: `https://www.inali.gob.mx/pdf/CLIN_completo.pdf` (Diario Oficial,
14 January 2008; 256 pages; sha256
`21cef44abf0d896555f26954bf319340ad4814fa8a3f0719b0d068311ff1be7c`). The
`http://` address is not reachable from the build environment; `https://` is.

Layout quirks found in the spike:

- **Rotated-page artifacts.** The table pages are landscape. The Diario
  Oficial running heads ("DIARIO OFICIAL", "(Primera Sección)", "Lunes 14
  de enero de 2008", page numbers) come out as stray text in the middle of
  the extracted lines and must be stripped.
- **Cross-page continuation notes.** Entries run across pages, with notes
  such as "(Viene de la página 78 de la Primera Sección)" and "(Viene de
  la Segunda Sección)" inside the tables.
- **Three misprinted table headers.** "REFERECIA GEOESTADÍSTICA" twice
  (amuzgo, triqui) and "REGIÓN GEOESTADÍSTICA" once (chatino), instead of
  "REFERENCIA GEOESTADÍSTICA".
- **ixcateco state name.** Its geography reads "OAXACA de JUÁREZ"; every
  other Oaxaca entry reads "OAXACA".
- Municipality names are bold in the PDF and lose that in plain text;
  square brackets appear in the geography as locality corrections, not
  only as IPA.

Appendix 4 does not match the totals the catalog states for itself.
`variants.csv` is built from Appendix 4 by `tools/parse_inali_catalog.py`,
which checks 476 autonyms, 364 variants, 68 groups and 11 families before
writing anything.

- **476 autonym rows, not the stated 475: the catalog's own figure is off
  by one.** Evidence, two independent counts of Appendix 4 (PDF pages
  244-256):
  1. `pdftotext -layout`: 476 lines carry a family name in the last
     column; per page 33, 32, 30, 34, 41, 41, 40, 39, 40, 41, 36, 36, 33.
  2. `pdftotext -raw` (a different extraction mode, no column layout):
     476 lines end in a family name.
  No row is duplicated and all 476 autonym strings are distinct. The
  script asserts 476.
- **363 distinct Spanish names for 364 variants.** Two separate zapoteco
  entries in the body share the name "zapoteco de la Sierra sur,
  noroeste": PDF p. 117 (autonyms risna, rixhna) and PDF p. 122 (autonyms
  ditsë, dizde (de la Sierra sur, noroeste)). All four autonyms were
  confirmed against the page text and the rendered page, not inferred.
  Appendix 4 lists the four under the one name. `variants.csv` splits them
  into `zapoteco-de-la-sierra-sur-noroeste-risna` and
  `zapoteco-de-la-sierra-sur-noroeste-dizde`; `spanish_name` is the same
  for both, as printed.
- **Group names.** The `group` column uses the spelling in
  `inali_groups.csv` so it joins to `crosswalk.csv`. Appendix 4 prints
  four of them differently: "K’iche’" and "Q’anjob’al" (curly
  apostrophes), "Q’eqchi’" (curly apostrophes, no accent; INALI's current
  list has Q'eqchí'), and "popoluca de la sierra" (lower-case s).
- **Misprints in variant names.** `spanish_name` keeps them exactly as
  printed. The `variant` identifier is built from a corrected form:
  "chianateco del oeste central bajo" (chinanteco), "K’iche’ (occidental"
  (missing bracket), "Q’eqchi" (missing apostrophe), "zapoteco de San
  Antonio el Alto" (the body and the municipality are "San Antonino el
  Alto").

## 2026-10-02 — Weekly workflow

- Added `.github/workflows/snapshot.yml`: Mondays 06:17 UTC plus manual
  trigger; runs Glottolog, Hugging Face, Common Voice, Universal
  Dependencies and Omnilingual ASR; INEGI excluded (static loader).
- README now states, per source, whether "nothing found" is `not-covered`
  or `measured-zero` and why. Omnilingual ASR stays `not-covered` (fixed,
  enumerable list, like Common Voice; unlike UD's open-ended scope).

## 2026-10-02 — Omnilingual ASR tool-support fetcher

- Added `sources/omnilingual_asr.py`.
- **This changes the PRD's assumption.** The PRD expected a name-only list
  needing manual review. The published list (`supported_langs` in
  `lang_ids.py`, 1,672 entries) is coded as `<ISO 639-3>_<script>`, so
  groups are matched on ISO 639-3 codes like every other source. No name
  matching is done and nothing needed manual review.
- The list does not carry Glottocodes in general: only four entries have a
  third subtag (two Glottocodes, `cypr1249` and `surs1244`, and two other
  variant tags), none of them for a Mexican language.
- First result: 48 groups measured, 19 not-covered, 1 unresolved (ku'ahl);
  173 supported varieties matched, all in Latin script.
- The fetcher stops if it reads fewer than 1,000 entries, so a moved or
  reshaped file cannot be recorded as "no language supported".

## 2026-10-02 — INEGI Census 2020 reference layer

- Added `sources/inegi.py`, a **one-time loader, not a weekly fetcher**. It
  writes to `reference/`, not `snapshots/`, and must not be added to the
  weekly workflow. Workbook `cpv2020_b_eum_05_etnicidad.xlsx`, sheet 03,
  sha256 `60d618c4d439bd931c66408c3f2f7be4448b859277ee4b7d983faba205bd5b57`
  (pinned in the script; a changed file stops the run).
- Result: 67 groups measured, 0 measured-zero, 1 not-covered (ku'ahl has no
  census row).
- Reconciliation: the 67 group rows sum to 7,328,967 and the five other
  rows to 35,678, which together equal the census national total of
  7,364,645.
- Rows that are not one of the 68 groups:
  - **Unresolved** (in `unresolved.csv`): "Chontal insuficientemente
    especificado" 1,704; "Popoluca insuficientemente especificado" 8,427;
    "Tepehuano insuficientemente especificado" 317.
  - **Excluded, not unresolved**: "Otras lenguas indígenas de América"
    2,453 and "No especificado" 22,777. These are residual census
    categories outside INALI's 68 groups and are not crosswalk candidates.
    They appear only in `reference/inegi_census_2020_other_rows.csv`.

## 2026-10-02 — Universal Dependencies fetcher

- Added `sources/universal_dependencies.py`. Only treebanks in the latest
  UD release count (2.18, dated 2026-05-15, at the first run); repositories
  not yet released are named in `detail` at a count of zero. Absence is
  `measured-zero`, not `not-covered`.
- First result: 2 groups measured (K'iche' 1, náhuatl 2), 65 measured-zero,
  1 unresolved (ku'ahl). cuicateco, huave and seri each have a repository
  that is not in release 2.18.
- **Classical Nahuatl cross-reference.** UD has a Classical Nahuatl
  treebank (ISO `nci`). Because `nci` was moved out of the náhuatl group
  (see the crosswalk corrections entry below), that treebank is not counted
  toward náhuatl or any other group and does not appear in any snapshot.

## 2026-10-02 — Common Voice fetcher

- Added `sources/common_voice.py`. It reads release metadata from the
  `common-voice/cv-dataset` GitHub repo and uses the newest full release of
  each kind: scripted speech 27.0 and spontaneous speech 5.0 (both
  2026-09-11) at the time of the first run.
- Matching is per variety, rolled up to the group. First result: 13 groups
  covered (9 through scripted, 4 through spontaneous), 54 not covered,
  1 unresolved (ku'ahl).

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
