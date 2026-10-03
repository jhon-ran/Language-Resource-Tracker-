# Site

Static site for the Language Resource Tracker, built with Astro and
deployed to GitHub Pages by `.github/workflows/deploy-site.yml`.

```
cd site
npm ci
npm run dev      # local preview
npm run build    # writes site/dist
```

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
