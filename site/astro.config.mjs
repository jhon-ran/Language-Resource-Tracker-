// @ts-check
import { defineConfig } from 'astro/config';

// Served from the root of the custom domain (GitHub Pages, with
// public/CNAME), so there is no base path. Internal links still go through
// localePath() from src/i18n/ui.ts, which adds the locale prefix and would
// add a base path again if one were ever set; don't hand-write a leading "/".
// `site` is what citation URLs, canonical/og:url and og:image are built from.
export default defineConfig({
  site: 'https://glototeca.com',
  base: '/',
  output: 'static',
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      // Spanish at the site root, English under /en/.
      prefixDefaultLocale: false,
    },
  },
});
