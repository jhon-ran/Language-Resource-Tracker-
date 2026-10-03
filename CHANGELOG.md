# Changelog

## 2026-10-03 — Item 9: risk grade per variant (INALI 2012)

- `tools/parse_inali_risk.py` parses Cuadro 6 (PDF pp. 61-75) into
  `risk_grade.csv`: 364 rows, one per variant, grades 64 / 43 / 72 / 185.
  It writes nothing unless those totals hold and Cuadros 7, 8 and 9 agree
  with Cuadro 6 row by row. They do; 9 rows (3 per table) differ only in
  apostrophe style. About 20 long variant names that wrap onto the lines
  above and below their row are rejoined.
- **Every row carries `risk_grade_census_year` = 2000**, next to the
  grade. The grades rest on the 2000 census; the speaker counts in the
  INEGI reference layer are from 2020.
- All eleven printed columns are kept (rank, family, group, variant,
  speakers total and in localities with 30% or more speakers, localities
  total and with 30% or more, speaker proportion, child proportion, grade).
- Join to `variants.csv`: 364 of 364 (361 before the three
  direction-conflict joins below). 354 exact; 3 through the corrected
  spelling behind the variant identifier (Q'eqchi', K'iche' (occidental),
  zapoteco de San Antonino el Alto: the 2008 catalog's own misprints);
  3 spelling aliases in `risk_grade_aliases.csv` (ku'al, Akateco,
  mocho'); 1 locality-based alias (the zapoteco case below); 3
  direction-conflict aliases (further below).
- **Zapoteco de la Sierra sur, noroeste.** Two 2008-catalog variants share
  this name (`-risna`, `-dizde`). The book's row of that name (rank 84) has
  21 localities; the catalog lists 22 for `-risna` and 16 for `-dizde`.
  Calibration: among joined variants with 10-40 localities, catalog and
  book counts are within 1 for 95 of 112 and differ by 5 or more for 7.
  Rank 84 is assigned to `-risna` on that evidence.
- **Probable noreste/noroeste error in the 2008 catalog: three names.**
  These three joins are NOT spelling variants and are recorded separately
  from the other four aliases, as kind `direction-conflict` (the `join`
  column of `risk_grade.csv` reads `alias:direction-conflict`). The two
  sources print a different direction word for what the locality counts
  show to be the same variant:

  | 2012 book prints | localities | 2008 catalog prints | localities | variant |
  |---|---|---|---|---|
  | zapoteco de la Sierra sur, noreste (rank 255) | 16 | zapoteco de la Sierra sur, noroeste | 16 | `zapoteco-de-la-sierra-sur-noroeste-dizde` |
  | zapoteco de la Sierra sur, noroeste alto (rank 247) | 13 | zapoteco de la Sierra sur, noreste alto | 13 | `zapoteco-de-la-sierra-sur-noreste-alto` |
  | náhuatl del noroeste central (rank 349) | 398 | náhuatl del noreste central | 400 | `nahuatl-del-noreste-central` |

  Method and threshold are the same as for `-risna`: near-identical
  locality counts, against the calibration that catalog and book counts
  are within 1 for 95 of 112 joined variants with 10-40 localities. The
  error is more likely in the 2008 catalog than in the 2012 book, because
  the first row also explains the catalog's duplicated name: the entry on
  PDF p. 122 of the catalog (`-dizde`) would be "noreste", not a second
  "noroeste". That is a probable reading, not a confirmed one.
  **`variants.csv` is not edited**: its `spanish_name` stays exactly as
  extracted from the catalog, and so do the variant identifiers built from
  it. The correction lives only in `risk_grade_aliases.csv` and in this
  note. Cross-reference: the catalog-quirks entry below (2026-10-02, "INALI
  catalog (CLIN 2008): known quirks") carries the same finding.
- **Inferred, not part of the documented methodology.** A child-speaker
  threshold around 15% reproduces all 364 published grades under the
  stated rules for grade 2 vs 3; INALI's text does not state this value
  explicitly — it's a reverse-engineered inference from the data,
  confirmed against every known case but not confirmed as the source's
  actual rule. The parser does not use it: `grade` is always the published
  grade.
- With those joins all 364 rows have a variant, and `review_list.csv` is
  back to 24 rows (none from this item). Both parsers keep each other's
  rows when they rewrite it.

## 2026-10-03 — Item 9 spike: INALI's 2012 risk-grade publication (nothing parsed yet)

Source: *México. Lenguas Indígenas Nacionales en Riesgo de Desaparición:
Variantes Lingüísticas por Grado de Riesgo* (INALI, 2012),
`https://site.inali.gob.mx/pdf/libro_lenguas_indigenas_nacionales_en_riesgo_de_desaparicion.pdf`,
132 pages, 33.7 MB, sha256
`ce44fb95800e26d145710422ae10bd300350fe4564db6c636bc8fc4d88e9b639`.

- Real text layer; the size comes from a few full-page divider images,
  not maps or charts. The grade is in tables with one row per variant
  (rank, family, group, variant, speakers, speakers in localities with 30%
  or more speakers, localities, such localities, proportion of speakers,
  proportion of child speakers aged 5-14, grade). The same 364 rows are
  printed in Cuadros 2-5 (by grade) and again in Cuadros 6, 7, 8 and 9.
- Stated totals match what is countable: 64 / 43 / 72 / 185 = 364, in
  every table.
- 355 of 364 variant names match `variants.csv` exactly; 9 differ. The
  book names the two zapoteco variants that share one name in the 2008
  catalog differently: "zapoteco de la Sierra sur, noroeste" and
  "zapoteco de la Sierra sur, noroeste alto".
- **Documented methodology** (conditions table, PDF p. 20; data from the
  2000 census, over localities where speakers are 30% or more):
  grade 1 if there is no such locality or fewer than 100 speakers in
  them; grade 2 if the child proportion is under 25% and there is only one
  such locality or fewer than 1,000 speakers; grade 3 if under 25% with
  more than one locality and more than 1,000 speakers, or 25% and over
  with only one locality or fewer than 1,000; grade 4 if over 25% with
  more than one locality and more than 1,000 speakers. Applied as stated,
  these rules reproduce 351 of the 364 published grades. The prose
  description of grade 2 on p. 19 repeats the grade 3 text by mistake; the
  p. 20 table is the reliable statement.
- **Decided for the build (not built yet):** the risk output file will
  carry a `risk_grade_census_year` column, value `2000`, on every row, so
  the vintage of the grade sits beside the grade itself and does not depend
  on anyone reading this file.
- **Inferred, not part of the documented methodology.** A child-speaker
  threshold around 15% reproduces all 364 published grades under the
  stated rules for grade 2 vs 3; INALI's text does not state this value
  explicitly — it's a reverse-engineered inference from the data,
  confirmed against every known case but not confirmed as the source's
  actual rule. Detail: the 13 rows the stated rules get wrong are all
  printed as grade 2, with child proportions from 6.27% to 14.32%; every
  grade 3 row in the same situation is at 15.49% or above. Any cut above
  14.32% and up to 15.49% fits all 364, so the data constrain the value to
  that interval and "15%" is only the round number inside it.

## 2026-10-02 — Item 8b: variant-to-identity link (decision)

- **Built: the group-level link only.** `variants.csv` has a new column,
  `variant_glottocode`: the Glottocode of the variant's group, filled only
  where `crosswalk.csv` resolves that group directly (`exact` or
  `macrolanguage`). It is filled for 136 of 364 variants (184 of 476 rows),
  in 44 groups: the 43 exact groups (74 variants) and zapoteco, the one
  macrolanguage group (62 variants, all carrying the subgroup node
  `zapo1437`). It is blank for the 21 many-to-one groups (210 variants) and
  the 3 unresolved groups (18 variants). Nothing is interpolated.
  **It is the group's code, not a variant-specific one**: in 30 groups the
  group has a single variant, so the two coincide; in the other 14 the
  variants of a group all share one code.
- **Shelved, not abandoned: a variant-level match.** The spike matched each
  variant against Glottolog 5.3's language and dialect nodes inside its own
  group, by Spanish name, by the place name in it, and by autonym. Result:
  51 of 364 matched a single node by name; 30 more resolve trivially (one
  variant, one language); 93 matched several nodes; 190 matched none.
  Reasons for not building on it:
  - **The two systems classify at non-corresponding granularities.** INALI
    names most variants by direction ("mixteco del noroeste medio");
    Glottolog names languages and dialects by town. 156 variant names have
    nothing to match on. Counts do not line up either (mixteco: 81 variants,
    52 Glottolog languages, 34 dialects), so the relation is many-to-many.
  - **22% resolution (81 of 364), none of it verified, is not a usable
    base.** Twelve of the 51 name matches are several variants landing on
    one language. 89 INALI names do appear verbatim among Glottolog's
    alternative names, but that source repeats a cluster's whole list of
    INALI names on every language in the cluster (up to 14 nodes for one
    name), so a hit is not evidence.
  - Glottolog does have finer-than-ISO nodes for Mexico (204 dialect nodes
    under 72 of the 281 member languages), but only 8 variants matched one.
- **Also shelved: a geography-based link** (variant localities against
  Glottolog coordinates). Not started and not tested.
- The 51 single-node name matches are kept in
  `spikes/candidate_name_matches.csv`, every row marked UNVERIFIED. They are
  not identity data and nothing reads them.

## 2026-10-02 — Municipio alias pass (item 8)

- **Method.** `municipio_aliases.csv` maps a municipio name as the catalog
  prints it to INEGI's 2020 code, keyed on the exact printed name within
  the state. `variant_localities.csv` keeps the printed name in
  `municipio`; only `municipio_code` is filled. Every alias was checked
  against INEGI's 2020 locality file (ITER): the `evidence` column says how
  many of the localities the catalog lists under that name are in the
  target municipality. 43 aliases, four kinds:
  - `spelling` (19): the name differs by a few letters ("La Indepedencia",
    "Guevea de Humbolt", "Tuxpam").
  - `name-form` (17): a short or different form of the official name
    ("Batopilas" for "Batopilas de Manuel Gómez Morín", "Temapache" for
    "Álamo Temapache", "Allende" for "San Miguel de Allende").
  - `district` (3): "San Juan Mixtepec Distrito 26" = 209, "San Pedro
    Mixtepec Distrito 22" = 318, "San Pedro Mixtepec Distrito 26" = 319.
    The mapping is taken from INEGI's own data, not inferred: in ITER 2020
    the seat locality of each municipality is named with its district
    (208 "San Juan Mixtepec Distrito 08", 209 "… Distrito 26", 318 "San
    Pedro Mixtepec Distrito 22", 319 "… Distrito 26").
  - `by-localities` (4): a printed name that fits several municipalities,
    settled by which one contains the listed localities: "Coatlán" = San
    Jerónimo Coatlán (3 of 3; 0 in the four others), "Mazatlán" = San Juan
    Mazatlán (24 of 29; 1 in Mazatlán Villa de Flores), "San Vicente
    Coyotepec" = Coyotepec, Puebla (3 of 3), and plain "San Juan Mixtepec"
    = 208 (see below).
  - Two aliases rest on the name alone because their single listed
    locality is not in ITER 2020: "Villa de Victoria" (Villa Victoria,
    México) and "Acapulco" (Acapulco de Juárez). Each has only one
    possible target in its state.
- **San Juan Mixtepec, corrected again.** The 62 rows printed as plain
  "San Juan Mixtepec" (mixteco de oeste central) are now coded 208
  (Distrito 08): 49 of the 62 localities are in 208 and 1 is in 209. The
  silent guess in commit `0a79a80` had given them 209, so it was not only
  unflagged but wrong; commit `525aaff` blanked it; this pass assigns 208
  on evidence.
- **Left in review on purpose: names printed under the wrong state.** The
  locality evidence is recorded here, but the state is not reassigned.
  This project flags disagreement with the source; it does not silently
  correct it, however strong the evidence.

  | Printed | Localities found in | Evidence |
  |---|---|---|
  | PUEBLA: Tehuipango | Tehuipango, Veracruz (30-159) | 36 of 38 |
  | PUEBLA: Astacinga | Astacinga, Veracruz (30-019) | 26 of 28 |
  | PUEBLA: Santa Ana Ateixtlahuaca | Santa Ana Ateixtlahuaca, Oaxaca (20-354) | 4 of 5 |
  | PUEBLA: San Lorenzo Cuaunecuiltitla | name exists only in Oaxaca (20-228) | 0 of 1; the one locality is spelt "Cuanecuiltitla" |
  | VERACRUZ: Tenampulco | Tenampulco, Puebla (21-158) | 31 of 31 |

- **Capulhuac is a wrong municipio name, not a wrong state.** "GUANAJUATO:
  Capulhuac" (otomí del noroeste) was first taken for México's Capulhuac
  printed under the wrong state. 15 of its 17 localities are in Tierra
  Blanca, Guanajuato (11-040). Left in review as an editorial call.
- **Also left in review:** "Camotlán" (Oaxaca; 2 of 4 localities in San
  Lucas Camotlán, not strong enough), "Ocotlán" (Oaxaca; none in any
  Ocotlán municipality, 3 of 4 in Santiago Apoala), and "Akil Baca"
  (Yucatán; two municipalities fused in print, needs a manual split).
- Result: 1,889 → 142 locality rows without a `municipio_code`;
  `review_list.csv` has 25 rows, 9 of them municipio names.

## 2026-10-02 — Correction: a silent guess in the item 8 part 2 commit

- **What was wrong.** In commit `0a79a80`, 62 locality rows of
  `mixteco-de-oeste-central` whose municipio is printed as plain "San Juan
  Mixtepec" were given `municipio_code` 209. INEGI has two Oaxaca
  municipalities with that name (codes 208 and 209; the catalog elsewhere
  tells them apart as "Distrito 08" and "Distrito 26"). The lookup kept
  whichever came last in the reference list, so the code was a guess that
  nothing in the data supported, and it was not flagged.
- **Fix.** A name shared by more than one municipality in the same state
  is now never given a code. The 62 rows have a blank `municipio_code`,
  and the entry is in `review_list.csv` (now 74 rows) with the reason
  "municipio name shared by more than one INEGI municipality". No other
  row changed. The only other shared name in the reference list is "San
  Pedro Mixtepec" (codes 318 and 319), which matched no row.

## 2026-10-02 — Item 8 part 2: IPA and geography from the catalog body

- `tools/parse_inali_body.py` reads the 364 body entries (PDF pp. 31-212)
  and joins every one to `variants.csv`. Outputs:
  - `variant_ipa.csv`: 476 rows, one per variant and autonym, with
    `ipa_status` = `extracted` (460), `corrected-by-hand` (2) or
    `in-review` (14, IPA left blank).
  - `variant_localities.csv`: 43,989 rows, one per variant, state,
    municipio and locality, with INEGI state code, canonical state, the
    state as printed, and INEGI municipio code.
  - `review_list.csv`: 73 rows for a later manual pass.
  - `autonym_overrides.csv`, `inali_build.json` (source checksum, poppler
    version, counts), `reference/inegi_municipios_2020.csv`.
- **The body is the authority for autonym spelling.** 24 autonyms differ
  from Appendix 4: 16 in accents, ñ, capitals or the bracketed qualifier,
  8 only in spacing (including seven tlapaneco "me'pha a" forms, an
  extraction artefact of Appendix 4). `variants.csv` now has `autonym`
  (body form) and a new column `autonym_appendix4` (as printed there).
- **Hand corrections** live in `ipa_corrections.csv`. Two entries so far,
  chocholteco del sur `[ŋ̪g̪i˦wa˨]` and chocholteco del este `[ŋ̪g̪i˦ba˨]`.
  The under-bridge marks sit under ŋ and g on the page (PDF p. 116), which
  neither extraction reproduces; their placement was read from the page by
  Jo. The tone letter after i is U+02E6 (˦), as both extractions give it.
  (A first hand reading had ˧; it was withdrawn because tone-letter height
  cannot be told apart reliably in a page crop.)
- **Municipio check against INEGI's 2020 municipality list** (from the
  census locality file, ITER 2020, checksum pinned). 57 printed municipio
  names do not match within their state and are in the review list; their
  1,827 locality rows have a blank `municipio_code`. They are a mix of
  misprints ("Guevea de Humbolt", "La Indepedencia"), names changed since
  2008 ("Temapache", "Allende"), short forms ("Acapulco", "Ocotlán"),
  municipalities printed under the wrong state ("Tehuipango" under
  PUEBLA, "Capulhuac" under GUANAJUATO) and one fused pair ("Akil Baca").
- Still in review: 11 entries with the unconfirmed tone letters
  (F09A/F091), chocholteco del oeste and zapoteco de la montaña del
  Istmo, bajo (diacritic placement), one ambiguous word gap, and two
  geography misprints (Chuj, Mam de la frontera).
- `.gitignore` now excludes `Claude outputs/`.

## 2026-10-02 — INALI catalog body (item 8 part 2, in progress): IPA extraction notes

Nothing from part 2 is written to the repo yet except the parser
(`tools/parse_inali_body.py`). These notes are for the methods write-up.

- **Poppler version matters.** Part of the catalog's IPA is set in an
  older font whose glyphs have no Unicode value; they come out as
  private-use codes, and different poppler versions expose them
  differently. The parser runs with **poppler 22.02.0** (`pdftohtml` and
  `pdftotext` on the build machine). The page crops used to confirm the
  glyphs were rendered with **poppler 24.02.0**. The parser prints the
  version it ran with, and the outputs will record it.
- **Private-use glyphs, confirmed by eye against page crops** (one crop
  per code; confirmed by Jo, 2026-10-02):

  | Code | Mapped to | Note |
  |---|---|---|
  | F03F | ʔ U+0294 | |
  | F083 | U+0361 tie bar | combining, after the first letter (t͡s) |
  | F0F6 | ɨ U+0268 | |
  | F0F9 | ː U+02D0 | |
  | F067 | ɡ U+0261 | |
  | F04E | ŋ U+014B | |
  | F052 | ɾ U+027E | |
  | F053 | ʃ U+0283 | |
  | F0C8 | ˈ U+02C8 | |
  | F0E2 | U+0303 tilde | combining, over the preceding letter (seri) |
  | F0C3 | ʌ U+028C | geography only (bracketed locality corrections, pp. 169-170); accepted for now, low stakes; the raised form is lost |
  | F09A, F091 | **not mapped** | tone letters, not confirmed; the 11 entries that use them (8 tlapaneco, 3 amuzgo) stay in the review list |

- **Word spacing in IPA.** The same older font loses word spaces in the
  extracted text. Spaces are rebuilt from word positions: a gap of at
  least 1.2 pt between two pieces is a space. Measured gaps are bimodal
  (124 at 0.5 pt or less, 227 at 2 pt or more). 41 IPA strings in 35
  entries changed, spaces only. A gap between 0.5 and 2.0 pt is not
  decided by the rule: the entry goes to the review list (2 entries).
- **Raised letters are not recoverable from the text.** The page prints
  pʰ with a raised h; the extraction gives a plain h. These need a manual
  pass (tlapaneco).
- **Stacked diacritics.** In three chocholteco entries and one zapoteco
  entry the two extractions order the under-bridge marks differently and
  neither matches the page; Unicode normalisation (NFC or NFD) does not
  reconcile them. They stay in the review list.

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

**Added 2026-10-03: probable direction errors in three variant names**
(found in item 9, when joining INALI's 2012 risk book). The 2012 book and
this catalog print a different direction word for three variants whose
locality counts match: the catalog's second "zapoteco de la Sierra sur,
noroeste" (PDF p. 122, `-dizde`) is the book's "… noreste"; the catalog's
"zapoteco de la Sierra sur, noreste alto" is the book's "… noroeste alto";
the catalog's "náhuatl del noreste central" is the book's "náhuatl del
noroeste central". This is a newly discovered probable catalog error
(less likely an error in the 2012 book), and it would also explain why two
catalog entries share one name. The catalog's printed names are kept
unchanged in `variants.csv`; see the item 9 entry (2026-10-03) for the
evidence and `risk_grade_aliases.csv` (kind `direction-conflict`) for the
joins.

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
