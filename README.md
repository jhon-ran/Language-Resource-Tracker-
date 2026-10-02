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

`inali_name, raw_iso639_3, source, reason, first_seen, last_seen`

One row per language-and-source pair that could not be resolved.

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

Scaffolding and seed crosswalk are done. Fetchers and the workflow are not built yet.

## License

TBD — see `LICENSE`. Code likely MIT; data likely CC BY or CC0.
