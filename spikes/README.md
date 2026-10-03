# spikes/

Exploratory output. **Nothing here is verified data, and nothing in the
pipeline reads it.**

## candidate_name_matches.csv

51 INALI variants that matched exactly one Glottolog language or dialect
node by name in the item 8b spike (2026-10-02, Glottolog 5.3). Kept so the
spike's work is not lost; every row has `status = UNVERIFIED`.

- `matched_on`: `spanish-name` (the variant's Spanish name equals a
  Glottolog main or alternative name), `place-name` (the place name inside
  the variant name appears in one node's names), or `autonym` (an autonym
  equals a Glottolog name).
- `node_shared_with_other_variants = yes` means several variants landed on
  the same node, so the match is at best a parent-language link.
- No row was checked for correctness. Do not join this file to
  `variants.csv` as identity data. See `CHANGELOG.md` (item 8b) for why
  name matching was shelved.
