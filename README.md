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
| Speech corpus | Common Voice | not built yet | planned |
| Treebanks | Universal Dependencies | not built yet | planned |
| Tool support | one tool's language list | not built yet | planned |
| Speakers (reference, static) | INEGI Census 2020 | not built yet | planned |

**Dropped: archive records (OLAC).** OLAC's OAI-PMH harvest endpoint no
longer exists and its replacement search service has no documented public
API (details in `CHANGELOG.md`, 2026-10-02). It can be re-added if OLAC
publishes a real API.

### Endangerment status

Glottolog assigns AES per language, so a group's value is the status of its
most endangered in-scope member. `detail` gives the full breakdown and
`glottolog_members.csv` has one row per member.

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
`glottolog.csv` and `huggingface.csv`, one row per group and indicator:

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
```

Both take `--date YYYY-MM-DD` to choose the folder.

## Layout

```
sources/             one fetch script per source
tools/               one-off build scripts (crosswalk)
inali_groups.csv     hand-entered seed: INALI's 68 groups (INALI's exact spelling) and how to find each in Glottolog
member_overrides.csv hand-entered: single ISO codes taken out of a group, with reasons
crosswalk.csv        INALI group -> ISO 639-3 -> Glottocode
crosswalk_members.csv  every ISO code in each group -> its own Glottocode
unresolved.csv       groups/identifiers that could not be resolved
snapshots/           one dated folder per run (YYYY-MM-DD/), append-only
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

Seed crosswalk, the Glottolog and Hugging Face fetchers and the first snapshot are done. The remaining fetchers and the workflow are not built yet.

## License

TBD — see `LICENSE`. Code likely MIT; data likely CC BY or CC0.
