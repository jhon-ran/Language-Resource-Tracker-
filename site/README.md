# Site

Static site for the Language Resource Tracker, built with Astro and
deployed to GitHub Pages by `.github/workflows/deploy-site.yml`.

```
cd site
npm ci
npm run dev      # local preview
npm run check    # type check only
npm run build    # type check, then writes site/dist
```

## Data

`npm run build:data` (`scripts/build-data.mjs`) reads the CSVs committed
in the repo root, `reference/` and the newest `snapshots/<date>/`, and
writes JSON into `src/data/`: `home.json`, `groups.json`, one file per
group in `groups/` and one per variant in `variants/`. It runs before
`npm run build` and `npm run dev`. The folder is generated and
git-ignored; pages import from it and never read a CSV.

Every indicator is written as `{ value, state }`, with `state` one of
measured, measured-zero, not-covered or unresolved.

## Languages and links

Spanish is the default locale and is served at the site root; English is
under `/en/`. Pages for Spanish sit directly in `src/pages/`, and
`src/pages/en/` mirrors them.

UI strings live in `src/i18n/`: `es.ts` is the reference dictionary,
`en.ts` must have the same keys, and `ui.ts` exports `useTranslations()`
and `localePath()`.

The site is served under `/Language-Resource-Tracker-/` (see `base` in
`astro.config.mjs`). Build every internal link with
`localePath(locale, path)`, which adds both the base path and the locale
prefix; never write a leading `/`.
