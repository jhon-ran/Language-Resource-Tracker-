# Site

Static site for the Language Resource Tracker, built with Astro and
deployed to GitHub Pages by `.github/workflows/deploy-site.yml`.

```
cd site
npm ci
npm run dev      # local preview
npm run build    # writes site/dist
```

The site is served under `/Language-Resource-Tracker-/` (see `base` in
`astro.config.mjs`), so internal links must be built from
`import.meta.env.BASE_URL`.
