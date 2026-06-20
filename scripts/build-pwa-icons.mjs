/**
 * Generates the PWA app icons under public/icons/ from the Cáo (fox) mascot.
 *
 * Reuses the REAL vector art (src/art/fox.ts → foxIdle) and brand tokens
 * (src/art/tokens.ts) so the launcher icon can never drift from the in-app
 * mascot. Each icon is composed as a tiny HTML page (fox SVG centred on a
 * brand-colour rounded background) and rasterised to PNG with headless Chrome
 * — the same "render with Chrome" approach used by the other build-*-sample
 * scripts, just emitting PNG instead of SVG.
 *
 * Run with tsx (handles the .ts imports):
 *   npx tsx scripts/build-pwa-icons.mjs
 *
 * Produces, under public/icons/:
 *   - icon-192.png          192×192  (any)      fox on rounded brand bg
 *   - icon-512.png          512×512  (any)      fox on rounded brand bg
 *   - maskable-512.png      512×512  (maskable) fox in ~80% safe zone, full-bleed bg
 *   - apple-touch-icon.png  180×180  (iOS)      fox on rounded brand bg
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { palette } from '../src/art/tokens.ts';
import { foxIdle } from '../src/art/fox.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '../public/icons');

// Locate a Chrome/Chromium binary (mirrors how the project renders art locally).
const CHROME =
  process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Brand colours (single source of truth — same hues the app & manifest use). */
const BRAND = palette.primary; // Cáo orange #ff8c42
const CREAM = palette.background; // warm cream #fef6ec

/** The fox mascot as inline SVG markup (the real in-app art). */
const FOX_SVG = foxIdle('KiddyHub');

/**
 * Build a self-contained HTML page that paints the icon at `size`×`size`.
 *
 * @param size      output edge in px
 * @param scale     fox edge as a fraction of the icon (safe zone)
 * @param fullBleed true → background fills the whole square (maskable);
 *                  false → background is a rounded square with transparent corners.
 */
function iconHtml(size, scale, fullBleed) {
  const radius = Math.round(size * 0.22); // friendly rounded-square corners
  const foxSize = Math.round(size * scale);
  const bg = fullBleed
    ? `background:${BRAND};`
    : `background:${BRAND};border-radius:${radius}px;`;
  // A soft cream ring behind the fox lifts it off the orange and matches the
  // app's warm look; sized so it never touches the maskable safe-zone edge.
  const ringSize = Math.round(foxSize * 1.06);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{background:transparent}
    .frame{width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center}
    .bg{position:absolute;inset:0;${bg}}
    .ring{position:relative;width:${ringSize}px;height:${ringSize}px;border-radius:50%;
      background:${CREAM};display:flex;align-items:center;justify-content:center;
      box-shadow:0 ${Math.round(size * 0.012)}px ${Math.round(size * 0.03)}px rgba(91,70,54,0.18)}
    .ring svg{width:${foxSize}px;height:${foxSize}px;display:block}
  </style></head><body>
    <div class="frame"><div class="bg"></div><div class="ring">${FOX_SVG}</div></div>
  </body></html>`;
}

/** Render one HTML string to a PNG of exactly `size`×`size` via headless Chrome. */
function renderPng(html, size, outPath) {
  const htmlPath = resolve(tmpdir(), `kiddyhub-icon-${size}-${Date.now()}.html`);
  writeFileSync(htmlPath, html, 'utf-8');
  try {
    execFileSync(
      CHROME,
      [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        `--window-size=${size},${size}`,
        '--default-background-color=00000000', // transparent canvas (RGBA out)
        `--screenshot=${outPath}`,
        `file://${htmlPath}`,
      ],
      { stdio: ['ignore', 'ignore', 'ignore'] },
    );
  } finally {
    rmSync(htmlPath, { force: true });
  }
  console.log('wrote', outPath);
}

mkdirSync(iconsDir, { recursive: true });

// "any" icons: fox on a rounded brand square, generous size.
renderPng(iconHtml(192, 0.74, false), 192, resolve(iconsDir, 'icon-192.png'));
renderPng(iconHtml(512, 0.74, false), 512, resolve(iconsDir, 'icon-512.png'));

// maskable: full-bleed brand bg, fox kept inside the ~80% safe zone.
renderPng(iconHtml(512, 0.62, true), 512, resolve(iconsDir, 'maskable-512.png'));

// Apple touch icon: iOS masks corners itself, so full-bleed (no transparency).
renderPng(iconHtml(180, 0.72, true), 180, resolve(iconsDir, 'apple-touch-icon.png'));

console.log('PWA icons generated in', iconsDir);
