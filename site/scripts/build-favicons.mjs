// Generates the favicons in public/ from the header mark (the three bars
// in BaseLayout.astro). Run by hand when the mark or its colors change:
//
//   node scripts/build-favicons.mjs
//
// The output is committed, so the site build does not run this.
//
// COLORS ARE COPIES. An icon file cannot read the CSS tokens, so the three
// values below repeat light-theme tokens from global.css. If any of those
// tokens changes, change it here and re-run.
//
// Every format is the light-theme mark on a light tile. There is no dark
// variant on purpose: an SVG favicon can only follow the browser's
// prefers-color-scheme, which says nothing about the color of the tab it
// is drawn on (a dark browser theme on a light OS, incognito), so a
// transparent mark is unreadable in some of those cases. A tile reads on
// every tab.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const LIGHT = { bars: '#2b3f6b', third: '#a8545e', tile: '#f4f2ec' }; // --accent, --risk-2, --surface

const bars = `<rect class="a" x="2" y="3" width="10" height="4"/><rect class="a" x="2" y="11" width="18" height="4"/><rect class="b" x="2" y="19" width="14" height="4"/>`;

// Fixed colors on a light tile, legible on light and dark tab bars.
// The mark is 18 wide in a 26 box starting at x=2; shift it to center.
const tiled = (radius, pad) =>
  (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${26 + 2 * pad} ${26 + 2 * pad}"><rect x="${-pad}" y="${-pad}" width="${26 + 2 * pad}" height="${26 + 2 * pad}" rx="${radius}" fill="${LIGHT.tile}"/><g transform="translate(2 0)"><style>.a{fill:${LIGHT.bars}}.b{fill:${LIGHT.third}}</style>${bars}</g></svg>`
  );
const png = (size, radius, pad) => sharp(Buffer.from(tiled(radius, pad)), { density: 1200 }).resize(size, size).png().toBuffer();

writeFileSync(join(PUBLIC, 'favicon.svg'), tiled(4, 2) + '\n');

const png16 = await png(16, 4, 2);
const png32 = await png(32, 4, 2);
const png180 = await png(180, 0, 7); // iOS rounds the corners itself
writeFileSync(join(PUBLIC, 'favicon-32.png'), png32);
writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), png180);

// favicon.ico holding the 16 and 32 px PNGs (PNG-in-ICO).
const images = [[16, png16], [32, png32]];
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach(([size, data], i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(size, e); header.writeUInt8(size, e + 1);
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(data.length, e + 8); header.writeUInt32LE(offset, e + 12);
  offset += data.length;
});
writeFileSync(join(PUBLIC, 'favicon.ico'), Buffer.concat([header, ...images.map(([, d]) => d)]));
console.log('build-favicons: favicon.svg, favicon.ico (16, 32), favicon-32.png, apple-touch-icon.png');
