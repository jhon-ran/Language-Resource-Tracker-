// Builds the IPA font for the variant pages.
//
// Takes the full Charis SIL regular from node_modules, keeps only the
// characters phonetic transcription needs, and writes one small WOFF2 to
// src/assets/fonts/ (generated, git-ignored). Only the variant pages
// reference it, so no other page downloads it.
//
// Runs after build:data: it reads every transcription in
// src/data/variants/ and stops the build if one uses a character the
// subset font cannot draw, so a missing glyph can never ship unnoticed.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import * as fontkit from 'fontkit';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(SITE, 'node_modules/@openfonts/charis-sil_all/files/charis-sil-all-400.woff2');
const OUT = join(SITE, 'src/assets/fonts/charis-sil-ipa.woff2');
const VARIANTS = join(SITE, 'src/data/variants');

// What is kept. Basic Latin and Latin-1 are here because a transcription
// is mostly ordinary letters: without them every plain letter would fall
// back to another font and the transcription would be set in two faces.
const RANGES = [
  [0x0020, 0x007e], // Basic Latin
  [0x00a0, 0x00ff], // Latin-1 Supplement (ã æ ð õ ...)
  [0x0100, 0x024f], // Latin Extended-A and -B
  [0x0250, 0x02af], // IPA Extensions
  [0x02b0, 0x02ff], // Spacing Modifier Letters (tone letters, ʰ ʷ ˈ ː)
  [0x0300, 0x036f], // Combining Diacritical Marks
  [0x1d00, 0x1dbf], // Phonetic Extensions and Supplement
  [0x1dc0, 0x1dff], // Combining Diacritical Marks Supplement
  [0x1e00, 0x1eff], // Latin Extended Additional (ẽ ḛ ḭ ...)
  [0xa700, 0xa71f], // Modifier Tone Letters
];
// Single characters from other scripts that phonetic transcription uses.
const EXTRA = [0x03b2, 0x03b8, 0x03bb, 0x03c7, 0x04e1, 0x2016, 0x203f, 0x2191, 0x2193, 0x2197, 0x2198];

function fail(message) {
  console.error(`build-fonts: ${message}`);
  process.exit(1);
}

const codepoints = [...EXTRA];
for (const [from, to] of RANGES) for (let c = from; c <= to; c++) codepoints.push(c);
const text = String.fromCodePoint(...codepoints);

const subset = await subsetFont(readFileSync(SOURCE), text, { targetFormat: 'woff2' });
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, subset);

// Every character of every published transcription must be in the font.
const font = fontkit.create(subset);
const missing = new Map();
let transcriptions = 0;
for (const file of readdirSync(VARIANTS)) {
  const variant = JSON.parse(readFileSync(join(VARIANTS, file), 'utf8'));
  for (const a of variant.autonyms) {
    if (a.ipa === null) continue;
    transcriptions++;
    for (const ch of a.ipa) {
      if (!font.hasGlyphForCodePoint(ch.codePointAt(0))) {
        const key = `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
        missing.set(key, [...(missing.get(key) ?? []), variant.variant]);
      }
    }
  }
}
if (transcriptions === 0) fail('no transcriptions found; run build:data first');
if (missing.size > 0) {
  fail(
    'the IPA font lacks characters used in the data: ' +
      [...missing].map(([cp, where]) => `${cp} (${where.slice(0, 3).join(', ')})`).join('; '),
  );
}

console.log(
  `build-fonts: charis-sil-ipa.woff2, ${(subset.length / 1024).toFixed(0)} KB, ${font.characterSet.length} characters; ` +
    `${transcriptions} transcriptions covered`,
);
