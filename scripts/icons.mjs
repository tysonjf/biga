// Renders the app icons from inline SVG. Run with `pnpm icons` after changing the artwork.
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const BG = '#B4471F';

// A dough ball: domed, floured, a few fermentation bubbles.
const ball = `
  <ellipse cx="256" cy="372" rx="148" ry="16" fill="#3a1407" opacity=".28"/>
  <path d="M118 338C118 228 180 154 256 154S394 228 394 338C394 357 331 368 256 368S118 357 118 338Z" fill="#F8EEDD"/>
  <path d="M118 338C118 357 181 368 256 368S394 357 394 338C394 330 393 322 392 315C380 337 324 347 256 347S132 337 120 315C119 322 118 330 118 338Z" fill="#E8D3B2"/>
  <ellipse cx="205" cy="214" rx="38" ry="17" transform="rotate(-32 205 214)" fill="#fff" opacity=".7"/>
  <circle cx="292" cy="226" r="10" fill="#E3CCA8"/>
  <circle cx="321" cy="282" r="14" fill="#E3CCA8"/>
  <circle cx="214" cy="292" r="9" fill="#E3CCA8"/>
  <circle cx="262" cy="270" r="6" fill="#E3CCA8"/>
  <circle cx="176" cy="262" r="5" fill="#E3CCA8"/>`;

const rounded = (size = 512) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" rx="114" fill="${BG}"/>${ball}</svg>`;
const fullBleed = (size = 512) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" fill="${BG}"/>${ball}</svg>`;
// Maskable icons get cropped to a circle as small as 80%: shrink the art into the safe zone.
const maskable = (size = 512) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" fill="${BG}"/><g transform="translate(256 262) scale(.82) translate(-256 -262)">${ball}</g></svg>`;

const out = 'public';
await mkdir(out, { recursive: true });
const png = (svg, size, file) => sharp(Buffer.from(svg(size))).png({ compressionLevel: 9 }).toFile(`${out}/${file}`);

await writeFile(`${out}/favicon.svg`, rounded().replace(/ width="\d+" height="\d+"/, ''));
await Promise.all([
  png(rounded, 64, 'pwa-64x64.png'),
  png(rounded, 192, 'pwa-192x192.png'),
  png(rounded, 512, 'pwa-512x512.png'),
  png(maskable, 512, 'maskable-icon-512x512.png'),
  png(fullBleed, 180, 'apple-touch-icon-180x180.png'),
  png(rounded, 48, 'favicon-48x48.png'),
]);
// iOS launch screens: still only possible via apple-touch-startup-image, one per device size.
// Portrait iPhones, light + dark. Excluded from the SW precache (see vite.config.ts).
const DEVICES = [
  [440, 956, 3], // 16/17 Pro Max
  [420, 912, 3], // Air
  [402, 874, 3], // 16/17 Pro, 17
  [430, 932, 3], // 14/15 Pro Max, 15/16 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 13, 14, 16e
  [375, 812, 3], // X, XS, 11 Pro, mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [414, 896, 2], // XR, 11
  [375, 667, 2], // SE, 8
];
const SPLASH_BG = { light: '#f6f2ec', dark: '#14110f' };
await mkdir(`${out}/splash`, { recursive: true });
const links = [];
for (const [w, h, r] of DEVICES) {
  for (const scheme of ['light', 'dark']) {
    const W = w * r, H = h * r, size = Math.round(W * 0.34);
    const art = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="100 140 312 250" width="${size}" height="${Math.round(size * 250 / 312)}">${ball}</svg>`;
    const file = `splash/${scheme}-${W}x${H}.png`;
    await sharp({ create: { width: W, height: H, channels: 3, background: SPLASH_BG[scheme] } })
      .composite([{ input: Buffer.from(art), gravity: 'center' }])
      .png({ compressionLevel: 9, palette: true })
      .toFile(`${out}/${file}`);
    links.push(
      `    <link rel="apple-touch-startup-image" media="screen and (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait) and (prefers-color-scheme: ${scheme})" href="/${file}" />`,
    );
  }
}
const html = await readFile('index.html', 'utf8');
await writeFile('index.html', html.replace(/<!--splash-->[\s\S]*?<!--\/splash-->|<!--splash-->/, `<!--splash-->\n${links.join('\n')}\n    <!--/splash-->`));
console.log('icons and splash screens written to public/');
