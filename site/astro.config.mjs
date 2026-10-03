// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves a project site under /<repo-name>/, so every
// internal link and asset has to be prefixed with `base`. Use
// import.meta.env.BASE_URL in pages rather than a leading "/".
export default defineConfig({
  site: 'https://jhon-ran.github.io',
  base: '/Language-Resource-Tracker-',
  output: 'static',
});
