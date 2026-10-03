// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves a project site under /<repo-name>/, so every
// internal link and asset has to be prefixed with `base`, and with the
// locale for non-default locales. Build links with localePath() from
// src/i18n/ui.ts rather than writing a leading "/".
export default defineConfig({
  site: 'https://jhon-ran.github.io',
  base: '/Language-Resource-Tracker-',
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
