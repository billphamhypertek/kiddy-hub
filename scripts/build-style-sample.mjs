/**
 * Generates docs/art/style-sample.svg — the visual style board for the user
 * gate. Imports the REAL art modules so the board can never drift from code.
 * Run with tsx (handles the .ts imports): npx tsx scripts/build-style-sample.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { palette, radius } from '../src/art/tokens.ts';
import { foxGuide, foxCheer, foxIdle, foxThink, foxPoint, foxNod } from '../src/art/fox.ts';
import { creature, COUNTING_CREATURE_IDS, CREATURE_IDS } from '../src/art/creatures.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const artDir = resolve(__dirname, '../docs/art');

// Strip the outer <svg> wrapper so we can nest each pose inside an <svg> cell.
function poseInner(make) {
  return make()
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
}

function cell(x, y, w, h, make, label) {
  return (
    `<rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="${radius.lg}" fill="#fff" stroke="${palette.ink}" stroke-width="2" opacity="0.65"/>` +
    `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 100">${poseInner(make)}</svg>` +
    `<text x="${x + w / 2}" y="${y + h + 26}" text-anchor="middle" font-size="20" fill="${palette.ink}" font-weight="700">${label}</text>`
  );
}

function swatch(x, y, color, name) {
  return (
    `<rect x="${x}" y="${y}" width="86" height="64" rx="${radius.md}" fill="${color}" stroke="${palette.ink}" stroke-width="2"/>` +
    `<text x="${x + 43}" y="${y + 86}" text-anchor="middle" font-size="13" fill="${palette.ink}">${name}</text>` +
    `<text x="${x + 43}" y="${y + 102}" text-anchor="middle" font-size="11" fill="${palette.inkSoft}" font-family="monospace">${color}</text>`
  );
}

// Sample round 🔊 button.
function roundButton(cx, cy, r) {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${palette.accent}" stroke="${palette.ink}" stroke-width="4"/>` +
    `<ellipse cx="${cx}" cy="${cy - r + 14}" rx="${r - 12}" ry="${r - 22}" fill="#ffffff" opacity="0.22"/>` +
    `<g transform="translate(${cx - 18},${cy - 16})" fill="#ffffff" stroke="${palette.ink}" stroke-width="3" stroke-linejoin="round">` +
    `<path d="M2 12 L10 12 L20 3 L20 29 L10 20 L2 20 Z"/>` +
    `<path d="M26 8 Q33 16 26 24" fill="none" stroke-linecap="round"/>` +
    `<path d="M30 3 Q41 16 30 29" fill="none" stroke-linecap="round"/>` +
    `</g>`
  );
}

// Sample answer tile / card.
function answerTile(x, y, w, h) {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius.lg}" fill="${palette.surface}" stroke="${palette.ink}" stroke-width="4"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="16" rx="${radius.lg}" fill="${palette.star}" opacity="0.55"/>` +
    `<text x="${x + w / 2}" y="${y + h / 2 + 18}" text-anchor="middle" font-size="52">🦆</text>` +
    `<circle cx="${x + w - 22}" cy="${y + h - 22}" r="14" fill="${palette.success}" stroke="${palette.ink}" stroke-width="3"/>` +
    `<path d="M${x + w - 29} ${y + h - 22} l5 6 l9 -11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}

// Sample island shape (mint, with a little sign + bushes).
function island(cx, cy) {
  const c = palette.island.shapes;
  return (
    `<ellipse cx="${cx}" cy="${cy + 38}" rx="84" ry="20" fill="${palette.ink}" opacity="0.12"/>` +
    `<path d="M${cx - 76} ${cy + 16} Q${cx - 84} ${cy - 32} ${cx} ${cy - 40} Q${cx + 84} ${cy - 32} ${cx + 76} ${cy + 16} Q${cx} ${cy + 42} ${cx - 76} ${cy + 16} Z" fill="${c}" stroke="${palette.ink}" stroke-width="4"/>` +
    `<path d="M${cx - 76} ${cy + 16} Q${cx} ${cy + 42} ${cx + 76} ${cy + 16} Q${cx} ${cy + 58} ${cx - 76} ${cy + 16} Z" fill="#ffe08a" stroke="${palette.ink}" stroke-width="3"/>` +
    `<circle cx="${cx - 34}" cy="${cy - 8}" r="15" fill="#3fbf86" stroke="${palette.ink}" stroke-width="3"/>` +
    `<circle cx="${cx + 28}" cy="${cy - 14}" r="19" fill="#3fbf86" stroke="${palette.ink}" stroke-width="3"/>` +
    `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="34">🎨</text>`
  );
}

const W = 1200;
const H = 1180 + 60 + Math.ceil(CREATURE_IDS.length / 10) * 116;
const board =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Baloo 2','Comic Sans MS',system-ui,sans-serif">` +
  `<rect width="${W}" height="${H}" fill="${palette.background}"/>` +
  `<rect width="${W}" height="120" fill="${palette.backgroundSky}"/>` +
  `<text x="40" y="58" font-size="40" font-weight="800" fill="${palette.ink}">KiddyHub — Bảng phong cách (Style Board)</text>` +
  `<text x="40" y="92" font-size="20" fill="${palette.inkSoft}">Linh vật Cáo · bảng màu pastel · nút · thẻ · đảo — duyệt LOOK trước khi triển khai B2/B3</text>` +
  `<text x="40" y="162" font-size="24" font-weight="700" fill="${palette.ink}">Linh vật Cáo — 3 tư thế</text>` +
  cell(70, 186, 200, 200, foxGuide, 'guide (dẫn đường)') +
  cell(330, 186, 200, 200, foxCheer, 'cheer (cổ vũ)') +
  cell(590, 186, 200, 200, foxIdle, 'idle (đứng yên)') +
  `<text x="900" y="162" font-size="24" font-weight="700" fill="${palette.ink}">Thành phần UI</text>` +
  roundButton(960, 250, 50) +
  `<text x="960" y="330" text-anchor="middle" font-size="16" fill="${palette.ink}">Nút 🔊 nghe lại</text>` +
  answerTile(1050, 200, 110, 110) +
  `<text x="1105" y="330" text-anchor="middle" font-size="16" fill="${palette.ink}">Thẻ đáp án</text>` +
  `<text x="40" y="470" font-size="24" font-weight="700" fill="${palette.ink}">Bảng màu pastel</text>` +
  swatch(60, 490, palette.primary, 'primary (Cáo)') +
  swatch(170, 490, palette.accent, 'accent') +
  swatch(280, 490, palette.star, 'star') +
  swatch(390, 490, palette.success, 'success') +
  swatch(500, 490, palette.error, 'try again') +
  swatch(610, 490, palette.island.numbers, 'numbers') +
  swatch(720, 490, palette.island.letters, 'letters') +
  swatch(830, 490, palette.island.logic, 'logic') +
  swatch(940, 490, palette.island.memory, 'memory') +
  swatch(1050, 490, palette.island.english, 'english') +
  swatch(60, 650, palette.background, 'background') +
  swatch(170, 650, palette.ink, 'ink') +
  `<text x="340" y="640" font-size="24" font-weight="700" fill="${palette.ink}">Đảo mẫu</text>` +
  island(520, 720) +
  // ── GĐ6.1 Storybook row — drawn creatures (replace emoji) + new Cáo expressions ──
  `<text x="40" y="840" font-size="24" font-weight="700" fill="${palette.ink}">Storybook 6.1 — sinh vật vẽ tay (thay emoji)</text>` +
  COUNTING_CREATURE_IDS.map((id, i) => cell(60 + i * 130, 864, 100, 100, () => creature(id), id)).join('') +
  `<text x="40" y="1030" font-size="24" font-weight="700" fill="${palette.ink}">Cáo biểu cảm (storybook + think/point/nod)</text>` +
  cell(60, 1054, 110, 110, foxThink, 'think') +
  cell(220, 1054, 110, 110, () => foxPoint(1), 'point') +
  cell(380, 1054, 110, 110, foxNod, 'nod') +
  cell(540, 1054, 110, 110, foxIdle, 'idle (repaint)') +
  cell(700, 1054, 110, 110, foxCheer, 'cheer (repaint)') +
  // ── GĐ6.2 — full creature/object catalog (every id the kit can draw) ──
  `<text x="40" y="1210" font-size="24" font-weight="700" fill="${palette.ink}">Storybook 6.2 — bộ kit đầy đủ (${CREATURE_IDS.length} vật thể thay emoji)</text>` +
  CREATURE_IDS.map((id, i) => {
    const col = i % 10;
    const row = Math.floor(i / 10);
    return cell(60 + col * 116, 1234 + row * 116, 96, 96, () => creature(id), id);
  }).join('') +
  `</svg>`;

mkdirSync(artDir, { recursive: true });
writeFileSync(resolve(artDir, 'style-sample.svg'), board, 'utf-8');
writeFileSync(resolve(artDir, 'fox-guide.svg'), foxGuide(), 'utf-8');
writeFileSync(resolve(artDir, 'fox-cheer.svg'), foxCheer(), 'utf-8');
writeFileSync(resolve(artDir, 'fox-idle.svg'), foxIdle(), 'utf-8');
console.log('wrote', resolve(artDir, 'style-sample.svg'));
