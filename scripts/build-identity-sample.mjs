/**
 * Generates docs/art/identity-sample.svg — the B2 identity board: 8 avatars,
 * 6 islands, all 15 game icons, the map backdrop and the reward star + garden.
 * Imports the REAL art modules so the board can never drift from code.
 * Run with tsx: npx tsx scripts/build-identity-sample.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { palette, radius } from '../src/art/tokens.ts';
import { avatarArt, avatarKeys } from '../src/art/avatars.ts';
import { gameIcon, gameIconIds } from '../src/art/gameIcons.ts';
import { islandArt, islandIds, mapBackdrop } from '../src/art/islands.ts';
import { starArt, gardenItemArt, gardenItemKeys } from '../src/art/stars.ts';
import { AVATARS } from '../src/content/avatars.ts';
import { CATEGORIES } from '../src/content/categories.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const artDir = resolve(__dirname, '../docs/art');

const labelFor = (key) => AVATARS.find((a) => a.key === key)?.label ?? key;
const catTitle = (id) => CATEGORIES.find((c) => c.id === id)?.title ?? id;

/** Strip the outer <svg> wrapper so we can nest the art inside a cell <svg>. */
function inner(svg) {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}

function cell(x, y, w, h, svg, label) {
  return (
    `<rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" rx="${radius.lg}" fill="#fff" stroke="${palette.ink}" stroke-width="2" opacity="0.7"/>` +
    `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 100">${inner(svg)}</svg>` +
    `<text x="${x + w / 2}" y="${y + h + 20}" text-anchor="middle" font-size="15" fill="${palette.ink}" font-weight="700">${label}</text>`
  );
}

function heading(x, y, t) {
  return `<text x="${x}" y="${y}" font-size="24" font-weight="800" fill="${palette.ink}">${t}</text>`;
}

const W = 1240;
const H = 1120;
const parts = [];
parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Baloo 2','Comic Sans MS',system-ui,sans-serif">`,
);
parts.push(`<rect width="${W}" height="${H}" fill="${palette.background}"/>`);
parts.push(`<rect width="${W}" height="110" fill="${palette.backgroundSky}"/>`);
parts.push(
  `<text x="40" y="54" font-size="38" font-weight="800" fill="${palette.ink}">KiddyHub — Bộ nhận diện đồ hoạ (B2)</text>`,
);
parts.push(
  `<text x="40" y="88" font-size="18" fill="${palette.inkSoft}">8 avatar · 6 đảo · 15 biểu tượng trò · nền bản đồ · sao &amp; vườn — tất cả vector dựng trong mã</text>`,
);

// Avatars row.
parts.push(heading(40, 150, 'Avatar (8 con vật)'));
avatarKeys.forEach((key, i) => {
  const col = i % 8;
  parts.push(cell(46 + col * 150, 170, 120, 120, avatarArt(key, labelFor(key)), labelFor(key)));
});

// Islands row.
parts.push(heading(40, 350, 'Đảo (6 nhóm)'));
islandIds.forEach((id, i) => {
  parts.push(cell(46 + i * 198, 370, 170, 150, islandArt(id, catTitle(id)), catTitle(id)));
});

// Game icons grid (15).
parts.push(heading(40, 600, 'Biểu tượng trò (15)'));
gameIconIds.forEach((id, i) => {
  const col = i % 8;
  const row = Math.floor(i / 8);
  parts.push(cell(46 + col * 150, 620 + row * 168, 110, 110, gameIcon(id, id), id));
});

// Map backdrop sample.
parts.push(heading(40, 980, 'Nền bản đồ'));
parts.push(
  `<rect x="40" y="998" width="380" height="92" rx="${radius.lg}" fill="#fff" stroke="${palette.ink}" stroke-width="2"/>` +
    `<svg x="44" y="1002" width="372" height="84" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${inner(mapBackdrop())}</svg>`,
);

// Star + garden props.
parts.push(heading(460, 980, 'Sao thưởng &amp; vườn sao'));
parts.push(cell(466, 998, 84, 84, starArt(), 'sao'));
gardenItemKeys.forEach((key, i) => {
  parts.push(cell(566 + i * 110, 998, 84, 84, gardenItemArt(key, key), key));
});

parts.push('</svg>');

const svg = parts.join('');
mkdirSync(artDir, { recursive: true });
writeFileSync(resolve(artDir, 'identity-sample.svg'), svg, 'utf-8');
console.log('wrote', resolve(artDir, 'identity-sample.svg'));
