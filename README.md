# Language Resource Tracker — Mexico MVP

Weekly, append-only snapshots of digital-resource indicators for Mexico's
68 INALI indigenous-language groups (364 variants), set beside Glottolog
endangerment status and INEGI speaker counts.

The goal is to make visible, over time, which languages have datasets,
models, corpora and tools, and which have none.

Storage is flat CSV/JSON committed to this repo. No database, no paid
services, no API keys.

## The four-state model

Every indicator value for every language is recorded in exactly one of four
states. "No resources found" and "we could not look" are different facts and
are never collapsed into a blank or a zero.

| State | Meaning | Example |
|---|---|---|
| `measured` | The source was queried for this language and returned a nonzero value. | Hugging Face lists 4 datasets tagged `nah`. |
| `measured-zero` | The source was queried, covers this language's identifier, and returned nothing. A real zero. | Hugging Face queried for `sei`, 0 datasets. |
| `not-covered` | The source cannot answer for this language at all, so no value exists. | Common Voice has no locale for the language. |
| `unresolved` | The language could not be mapped to an identifier the source uses, so it was never queried. | An INALI group with no single ISO 639-3 / Glottocode match. |

Every row also carries its measurement date. Unresolved languages are kept
and listed in `unresolved.csv`; they are never silently dropped.

## Indicators

| Indicator | Source | Fetcher | Status |
|---|---|---|---|
| `endangerment_status` | Glottolog AES | `sources/glottolog.py` | active |
| `datasets_raw`, `datasets_focused` | Hugging Face | `sources/huggingface.py` | active |
| `models_raw`, `models_focused` | Hugging Face | `sources/huggingface.py` | active |
| `speech_corpus` | Common Voice | `sources/common_voice.py` | active |
| `treebanks` | Universal Dependencies | `sources/universal_dependencies.py` | active |
| `tool_support_asr` | Omnilingual ASR supported-language list | `sources/omnilingual_asr.py` | active |
| `speakers_3plus` (reference, static) | INEGI Census 2020 | `sources/inegi.py` | loaded once |

What "nothing found" means differs by source, and each source records it
with a different state on purpose:

| Source | A group with nothing is | Why |
|---|---|---|
| Hugging Face | `measured-zero` | Open-ended: any language can be tagged, so finding nothing is a real zero. |
| Universal Dependencies | `measured-zero` | Open-ended: UD accepts a treebank for any language, so none is a real zero. |
| Common Voice | `not-covered` | Fixed, enumerable locale list per release; a variety not on it is outside the source's scope. |
| Omnilingual ASR | `not-covered` | Fixed, enumerable supported-language list; same reasoning as Common Voice. |
| Glottolog | `not-covered` | Only if Glottolog assigns no AES value to any of the group's languages (no group today). |
| INEGI | `not-covered` | The census table has no row for the group (ku'ahl). A row with 0 speakers would be `measured-zero`. |

In every weekly source, a group with no code to look up (ku'ahl) is
`unresolved`, never zero.

**Dropped: archive records (OLAC).** OLAC's OAI-PMH harvest endpoint no
longer exists and its replacement search service has no documented public
API (details in `CHANGELOG.md`, 2026-10-02). It can be re-added if OLAC
publishes a real API.

### Endangerment status

Glottolog assigns AES per language, so a group's value is the status of its
most endangered in-scope member. `detail` gives the full breakdown and
`glottolog_members.csv` has one row per member.

### Speech corpus

Common Voice locales are single varieties, so matching is per variety and
rolled up: `speech_corpus` is the number of a group's varieties present in
the newest scripted-speech or spontaneous-speech release. A group with none
is `not-covered`. `common_voice_locales.csv` has one row per matched locale
with clips, speakers and validated hours.

### Treebanks

`treebanks` counts a group's Universal Dependencies treebanks that are in
the latest UD release. A treebank that exists only as a GitHub repository is
not counted; it is named in `detail`. A group with none is `measured-zero`,
because UD can hold any language. `universal_dependencies_treebanks.csv` has
one row per treebank with sentence and token counts.

### Speakers (static reference layer)

`reference/inegi_census_2020.csv` holds speakers aged 3 and over per group
from the 2020 census. It is **loaded once and is not part of the weekly
snapshot run**: the census table does not change, and the workbook's
checksum is pinned in `sources/inegi.py`. Re-run it only if that checksum
fails or a new census is published. Groups are matched by name. A group
with no census row (ku'ahl) is `not-covered`.

`reference/inegi_census_2020_other_rows.csv` lists the census rows that are
not one of the 68 groups, so the table reconciles with the national total:
three "insuficientemente especificado" rows (also in `unresolved.csv`) and
two residual categories that are excluded.

### Tool support (ASR)

`tool_support_asr` is the number of a group's varieties in Omnilingual
ASR's supported-language list. The list is published as codes
(`<ISO 639-3>_<script>`, e.g. `yua_Latn`), so matching is by ISO code, not
by name. A group with no supported variety is `not-covered`.
`omnilingual_asr_languages.csv` has one row per supported variety with the
training hours and character error rate Meta reports for it.

### Hugging Face counts

- `*_raw`: distinct repos tagged with any of the group's codes (its ISO
  639-3 codes, plus `zap` for zapoteco and `nah` for náhuatl).
- `*_focused`: the subset of those repos that are tagged for **at most 3 of
  the 68 groups**, counted separately for datasets and for models. This
  removes massively multilingual repos that list hundreds of languages. The
  cutoff of 3 was picked, not derived.

Two rules any Hugging Face query must follow:

1. **Datasets and models use different filters.** Datasets:
   `GET /api/datasets?filter=language:<code>` (not `languages:`, which
   returns nothing). Models: `GET /api/models?filter=<code>`, the bare code
   (`language:<code>` returns nothing for models).
2. **Check every model hit against its model card.** The bare filter
   matches any tag, and several codes are also ordinary tags (`pos`, `mix`,
   `mit` and others). A model counts only when the code is in the
   `language` list of its model card (`cardData=true` in the query).

## Snapshots

Each run writes `snapshots/YYYY-MM-DD/` (UTC date). The main files are
`glottolog.csv`, `huggingface.csv`, `common_voice.csv`,
`universal_dependencies.csv` and `omnilingual_asr.csv`, one row per group
and indicator:

`snapshot_date, measured_at, inali_name, canonical_glottocode, match_type, source, indicator, value, state, detail`

Indicators are measured through a group's individual codes, so a group whose
`match_type` is `unresolved` only at group level (otomí, zoque) is still
measured. A group with no code at all (ku'ahl) gets `state = unresolved`.

Supporting files: `glottolog_members.csv` (per language),
`huggingface_codes.csv` (per code) and `huggingface_repos.json` (every repo
id and the codes it matched).

```
python3 sources/glottolog.py
python3 sources/huggingface.py      # about 10 minutes; resumes if interrupted
python3 sources/common_voice.py
python3 sources/universal_dependencies.py
python3 sources/omnilingual_asr.py
```

Both take `--date YYYY-MM-DD` to choose the folder.

## Weekly run

`.github/workflows/snapshot.yml` runs the five weekly fetchers every Monday
at 06:17 UTC and commits `snapshots/YYYY-MM-DD/`. It can also be started by
hand from the Actions tab, with an optional date. INEGI is not part of it.

- It refuses to replace an existing dated folder unless `overwrite` is
  ticked, so snapshots stay append-only.
- If a fetcher fails, the others are still committed, the commit message
  names the failed source, and the run is marked failed.
- The commit-back uses GitHub Actions' own token; no credential is stored.
  It needs `main` to accept pushes from GitHub Actions (no branch protection
  requiring pull requests) and workflow permissions not locked to
  read-only. An optional `HF_TOKEN` secret raises the Hugging Face limit.

## INALI catalog data (variants, IPA, geography)

A separate, static dataset parsed from INALI's *Catálogo de las Lenguas
Indígenas Nacionales* (Diario Oficial, 14 January 2008). It is not part of
the weekly run.

| File | Rows | What it holds |
|---|---|---|
| `variants.csv` | 476 | One row per variant and autonym: `variant` (identifier), `autonym` (as the body prints it), `spanish_name`, `group`, `family`, `autonym_appendix4` (as Appendix 4 prints it), `variant_glottocode` (see below). 364 variants, 68 groups, 11 families. |
| `variant_ipa.csv` | 476 | IPA for each variant and autonym. `ipa_status` is `extracted`, `corrected-by-hand`, or `in-review` (IPA left blank). |
| `variant_localities.csv` | 43,989 | One row per variant, state, municipio and locality: `state_code` and `state` (INEGI), `state_raw` (as printed), `municipio_code` (INEGI 2020, blank if unresolved), `municipio` and `locality` (as printed). |
| `review_list.csv` | varies | Everything held for a manual pass, with page, reason and detail. Nothing in it is guessed elsewhere. |
| `inali_build.json` | n/a | Source URL and checksum, poppler version, build time, counts. |
| `risk_grade.csv` | 364 | INALI's risk grade per variant, from its 2012 book: `variant`, `grade` (1-4), `grade_label`, `risk_grade_census_year` (2000), `rank`, the printed speaker and locality figures, the names as printed, and `join` (how the row was matched to a variant). |
| `risk_grade_build.json` | n/a | Same build metadata for the risk file. |

Hand-maintained inputs, each row with its reason or evidence:

| File | What it holds |
|---|---|
| `ipa_corrections.csv` | IPA strings read from the page where the text extraction is wrong. |
| `risk_grade_aliases.csv` | Variant names the 2012 risk book prints differently from the 2008 catalog. |
| `municipio_aliases.csv` | Municipio names the catalog prints differently from INEGI, mapped to INEGI 2020 codes. |
| `autonym_overrides.csv` | Autonyms the body spells differently from Appendix 4 (written by the body parser; the body is the authority). |
| `reference/inegi_municipios_2020.csv` | INEGI's 2,469 municipalities, taken from the 2020 census locality file. |

`group` in `variants.csv` uses the same spelling as `crosswalk.csv`, so the
two join at group level.

`variant_glottocode` is the Glottocode of the variant's **group**, not of
the variant. It is filled only where `crosswalk.csv` resolves the group
directly (`exact` or `macrolanguage`): 136 of 364 variants, in 44 groups. It
is blank for the 21 many-to-one groups and the 3 unresolved groups; nothing
is interpolated. No variant-specific identifier exists yet.

### Rebuilding

```
python3 tools/parse_inali_catalog.py    # Appendix 4 -> variants.csv
python3 tools/parse_inali_body.py       # body -> variant_ipa.csv, variant_localities.csv, review_list.csv
python3 tools/parse_inali_catalog.py    # again, to apply autonym_overrides.csv to variants.csv
python3 tools/parse_inali_risk.py       # 2012 risk book -> risk_grade.csv
```

- **Needs poppler** (`pdftotext` and `pdftohtml`), plus Python 3 standard
  library. The committed data was built with **poppler 22.02.0**. Part of
  the catalog's IPA uses an old font whose glyphs have no Unicode value, and
  other poppler versions expose those glyphs differently, so compare a
  rebuild against the committed files before trusting it.
- **Pinned inputs.** The catalog PDF
  (`https://www.inali.gob.mx/pdf/CLIN_completo.pdf`, sha256 `21cef44a…f1be7c`)
  and INEGI's 2020 locality file (sha256 `9342fdbd…2ab60`, only downloaded
  if `reference/inegi_municipios_2020.csv` is missing) are checked against
  checksums in the scripts. A changed file stops the run.
- **Built-in checks.** `parse_inali_catalog.py` writes nothing unless it
  finds 476 autonyms, 364 variants, 68 groups and 11 families.
  `parse_inali_body.py` writes nothing unless all 364 body entries join to
  364 variants and there are 476 autonym rows.
- **Risk grades are from the 2000 census.** `risk_grade.csv` comes from
  *México. Lenguas Indígenas Nacionales en Riesgo de Desaparición* (INALI,
  2012; sha256 `ce44fb95…e9b639`). `parse_inali_risk.py` writes nothing
  unless it finds 364 rows graded 64 / 43 / 72 / 185 and the book's four
  copies of the table agree. `grade` is always the published grade.
- The catalog's known quirks, the glyph mapping and every correction are in
  `CHANGELOG.md`.

## Known gaps

- No variant-level link to Glottolog or ISO 639-3. A name-based match and a
  geography-based match are both shelved (reasons in `CHANGELOG.md`, item
  8b). `spikes/candidate_name_matches.csv` holds 51 unverified name matches
  from the spike; it is not identity data.
- Three variant names carry a probable noreste/noroeste error in the 2008
  catalog (or, less likely, in the 2012 risk book): the two sources print
  different direction words for variants whose locality counts match.
  `variants.csv` keeps the catalog's printed names; the three are joined to
  their risk rows in `risk_grade_aliases.csv` as kind `direction-conflict`,
  and `risk_grade.csv` marks them `alias:direction-conflict`. Details in
  `CHANGELOG.md`.
- The risk grades use 2000 census counts; the INEGI speaker layer is 2020.
- "Proportion of speakers" (`speaker_proportion` in `risk_grade.csv`): the
  denominator is unconfirmed against INALI's own methodology. The variant
  pages label it as published, without saying what it is a percentage of.
  To be resolved on the site's Método page once that is built; not urgent.
- `tool_support_mt` indicator: Google Translate (and possibly Microsoft
  Translator) published supported-language lists, same four-state pattern
  as `tool_support_asr`. Candidates already confirmed relevant to this
  project: Náhuatl, Zapoteco, Q'eqchi', Maya Yucateco. Not started.

## Layout

```
sources/             one fetch script per source
tools/               one-off build scripts (crosswalk)
inali_groups.csv     hand-entered seed: INALI's 68 groups (INALI's exact spelling) and how to find each in Glottolog
member_overrides.csv hand-entered: single ISO codes taken out of a group, with reasons
crosswalk.csv        INALI group -> ISO 639-3 -> Glottocode
variants.csv, variant_ipa.csv, variant_localities.csv, review_list.csv
                     INALI catalog data (see "INALI catalog data" above)
crosswalk_members.csv  every ISO code in each group -> its own Glottocode
unresolved.csv       groups/identifiers that could not be resolved
snapshots/           one dated folder per run (YYYY-MM-DD/), append-only
reference/           static reference data, loaded once (INEGI Census 2020)
.github/workflows/   weekly snapshot cron
```

### crosswalk.csv

`inali_name, raw_iso639_3, canonical_glottocode, match_type, source, collective_code`

One row per INALI group (68 rows). `raw_iso639_3` holds every in-scope ISO
639-3 code of the group, `;`-separated, or the macrolanguage code.
`collective_code` is an extra non-ISO-639-3 code some sources tag the whole
group with (náhuatl: `nah`, ISO 639-2). `match_type`:

| Value | Meaning |
|---|---|
| `exact` | One ISO code, one Glottolog language. |
| `macrolanguage` | An ISO macrolanguage code, matched to the Glottolog subgroup that carries it. |
| `many-to-one` | Several ISO codes; the Glottocode is their lowest common ancestor in Glottolog. |
| `unresolved` | No ISO code, or no Glottolog node covers this group without also covering another INALI group. |

`crosswalk_members.csv` lists every ISO code of every group with its own
language-level Glottocode. Fetchers that query by ISO code read this file
and skip rows whose `scope` is `out-of-scope` (e.g. Southern Pame, extinct).

`member_overrides.csv` records single codes taken out of a group by hand,
with the reason: `unresolved` moves the code to `unresolved.csv`,
`out-of-scope` keeps it in `crosswalk_members.csv` but out of the group.

### unresolved.csv

`inali_name, raw_iso639_3, raw_name, source, reason, first_seen, last_seen`

One row per language-and-source pair that could not be resolved. `raw_name`
is for sources that report a name instead of an ISO code (INEGI).

## Pinned upstream releases

| Source | Version | DOI | Git ref |
|---|---|---|---|
| Glottolog (glottolog-cldf) | 5.3 | [10.5281/zenodo.18840967](https://doi.org/10.5281/zenodo.18840967) | tag `v5.3`, commit `072ca0d` |

File checksums and how the files were obtained are in `CHANGELOG.md`.

## Rebuilding the crosswalk

```
python3 tools/build_crosswalk.py
```

Python 3 standard library only. It reads `inali_groups.csv` and
`member_overrides.csv` (the two hand-entered files), downloads the pinned
Glottolog archive from Zenodo into `.cache/`, verifies its checksums, and
rewrites the three CSVs.

## Status

As of 2026-10-03:

- **Crosswalk:** 68 INALI groups mapped to Glottolog 5.3 (pinned); 65
  resolved, 3 unresolved (ku'ahl, otomí, zoque).
- **Weekly indicators:** five fetchers plus the static INEGI 2020 reference
  layer. The weekly workflow runs; snapshots exist for 2026-10-02 and
  2026-10-09.
- **INALI 2008 catalog:** 364 variants and 476 autonym rows with IPA, and
  43,989 locality rows. 13 autonym rows have IPA still in review and 142
  locality rows have no municipio code. `review_list.csv` holds 24 rows
  for a manual pass.
- **Variant identity:** 136 of 364 variants carry a Glottocode, at group
  level only. Variant-level matching is shelved.
- **INALI 2012 risk grade:** all 364 variants graded and joined
  (`risk_grade.csv`). Grades rest on the 2000 census.

Open points are listed under "Known gaps" and in `CHANGELOG.md`.

## License

- **Code:** MIT. See `LICENSE`.
- **Data produced by this project** (crosswalk, weekly snapshots, derived
  files): CC BY 4.0. See `LICENSE-DATA`.
- **Third-party source data** (INALI, INEGI, Glottolog and the platforms
  counted) keeps its own terms; this project cannot relicense it.
- **Charis SIL**, used on the site for IPA: SIL Open Font License. See
  `site/public/licenses/charis-sil-OFL.txt`.

Copyright (c) 2026 Jhonnatan Rangel.
