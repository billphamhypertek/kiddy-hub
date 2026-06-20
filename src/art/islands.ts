/**
 * KiddyHub — Island illustrations + map backdrop (Giai đoạn 4 · Phần B2).
 *
 * Six richer island scenes (one per category) and a soft pastel sky/sea backdrop
 * so the islands sit in a cohesive adventure map. Each island is a rounded grassy
 * landmass in its category colour, ringed by a little beach, with category-hinting
 * props (trees, waves, clouds, a sign-emblem). Drawn on the canonical 0..100
 * viewBox in the brand style (soft brown ink, rounded caps, pastel) and returned
 * as complete `<svg>` strings via `svgDoc()` for `<SvgArt>` rendering.
 *
 * Island keys match `src/content/categories.ts` ids and use the same
 * `palette.island.*` accent so they stay on-brand.
 */
import { svgDoc } from './svg';
import { paintedFill, softShadow, withDefs } from './paint';
import { palette, stroke, outline, type IslandKey } from './tokens';

const SW = stroke.width;
const SW_THIN = stroke.thin;
const INK = outline.ink; // GĐ6.5 — storybook brown "ink" (was palette.ink)
const SAND = '#ffe6b3';

// Namespaced ids per island document (one doc per texture → ids never collide).
const SHADOW_ID = 'isl-shadow';
const GRASS_ID = 'isl-grass';

/** Slightly darken a hex colour (for grass shadow / tree foliage). */
function shade(hex: string, amount = 0.18): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** The shared island base: soft shadow, sand ring, PAINTED grassy top. */
function base(color: string): string {
  const grassDark = shade(color);
  return (
    // sea shadow under the island
    `<ellipse cx="50" cy="84" rx="40" ry="9" fill="${INK}" opacity="0.10"/>` +
    // sandy beach
    `<ellipse cx="50" cy="74" rx="42" ry="18" fill="${SAND}" stroke="${INK}" stroke-width="${SW}"/>` +
    // painted grass dome (lighten→hue→darken via the shared gradient #isl-grass)
    `<path d="M14 70 C14 48 30 36 50 36 C70 36 86 48 86 70 C72 78 60 80 50 80 C40 80 28 78 14 70 Z" ` +
    `fill="url(#${GRASS_ID})" stroke="${INK}" stroke-width="${SW}"/>` +
    // grass under-shade
    `<path d="M16 68 C30 76 70 76 84 68 C72 74 60 76 50 76 C40 76 28 74 16 68 Z" fill="${grassDark}" opacity="0.5"/>`
  );
}

/** A rounded broadleaf tree at (x, footY). */
function tree(x: number, footY: number, foliage: string): string {
  const trunk = '#a06a3c';
  return (
    `<rect x="${x - 2.5}" y="${footY - 14}" width="5" height="14" rx="2" fill="${trunk}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="${x}" cy="${footY - 20}" r="10" fill="${foliage}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="${x - 6}" cy="${footY - 16}" r="6.5" fill="${foliage}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="${x + 6}" cy="${footY - 16}" r="6.5" fill="${foliage}" stroke="${INK}" stroke-width="${SW_THIN}"/>`
  );
}

/** A slim palm tree (for the English/coral island). */
function palm(x: number, footY: number): string {
  const frond = palette.success;
  return (
    `<path d="M${x} ${footY} C${x - 3} ${footY - 18} ${x - 2} ${footY - 26} ${x + 2} ${footY - 30}" ` +
    `fill="none" stroke="#a06a3c" stroke-width="5"/>` +
    `<g fill="${frond}" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<path d="M${x + 2} ${footY - 30} C${x - 12} ${footY - 36} ${x - 18} ${footY - 28} ${x - 16} ${footY - 24} C${x - 8} ${footY - 30} ${x - 2} ${footY - 30} ${x + 2} ${footY - 30} Z"/>` +
    `<path d="M${x + 2} ${footY - 30} C${x + 16} ${footY - 36} ${x + 22} ${footY - 28} ${x + 20} ${footY - 24} C${x + 12} ${footY - 30} ${x + 6} ${footY - 30} ${x + 2} ${footY - 30} Z"/>` +
    `<path d="M${x + 2} ${footY - 30} C${x - 4} ${footY - 44} ${x + 6} ${footY - 46} ${x + 8} ${footY - 42} C${x + 6} ${footY - 36} ${x + 4} ${footY - 32} ${x + 2} ${footY - 30} Z"/>` +
    `</g>`
  );
}

/** A small fluffy cloud. */
function cloud(x: number, y: number, s = 1): string {
  return (
    `<g fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}" opacity="0.95" ` +
    `transform="translate(${x} ${y}) scale(${s})">` +
    `<circle cx="0" cy="0" r="6"/><circle cx="8" cy="-2" r="7.5"/><circle cx="16" cy="1" r="6"/>` +
    `<rect x="-6" y="0" width="28" height="6" rx="3"/></g>`
  );
}

/** A couple of little waves lapping the beach. */
function waves(): string {
  return (
    `<g fill="none" stroke="${palette.white}" stroke-width="${SW_THIN}" opacity="0.9">` +
    `<path d="M16 80 q4 -3 8 0 t8 0"/>` +
    `<path d="M68 80 q4 -3 8 0 t8 0"/></g>`
  );
}

// ─── Per-category scenes ─────────────────────────────────────────────────────

/** numbers (pink) — counting pebbles on the grass + trees. */
function islandNumbers(color: string): string {
  return (
    base(color) +
    tree(30, 64, palette.success) +
    cloud(66, 22, 0.8) +
    `<g fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<circle cx="56" cy="58" r="4"/><circle cx="66" cy="62" r="4"/><circle cx="60" cy="68" r="4"/></g>` +
    `<text x="50" y="54" text-anchor="middle" font-size="16" font-weight="800" fill="${palette.white}" stroke="${INK}" stroke-width="1" paint-order="stroke">123</text>` +
    waves()
  );
}

/** letters (sky blue) — a big "A" signpost. */
function islandLetters(color: string): string {
  return (
    base(color) +
    tree(70, 66, palette.success) +
    cloud(26, 20, 0.8) +
    `<rect x="40" y="46" width="20" height="22" rx="4" fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<text x="50" y="63" text-anchor="middle" font-size="18" font-weight="800" fill="${INK}">A</text>` +
    `<rect x="48" y="64" width="4" height="8" fill="#a06a3c"/>` +
    waves()
  );
}

/** logic (amber) — interlocking puzzle pieces. */
function islandLogic(color: string): string {
  return (
    base(color) +
    tree(28, 64, palette.success) +
    cloud(70, 20, 0.8) +
    `<path d="M44 48 h8 a4 4 0 0 1 8 0 h2 v8 a4 4 0 0 1 0 8 v6 h-18 v-6 a4 4 0 0 0 0 -8 z" ` +
    `fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    waves()
  );
}

/** memory (lavender) — a pair of cards, one with a star. */
function islandMemory(color: string): string {
  return (
    base(color) +
    tree(70, 66, palette.success) +
    cloud(24, 22, 0.8) +
    `<rect x="36" y="48" width="14" height="20" rx="3" fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<rect x="52" y="48" width="14" height="20" rx="3" fill="${palette.star}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M59 52 l1.6 3.4 l3.6 .4 l-2.7 2.5 l.7 3.6 l-3.2 -1.9 l-3.2 1.9 l.7 -3.6 l-2.7 -2.5 l3.6 -.4 z" fill="${palette.white}" stroke="${INK}" stroke-width="0.8"/>` +
    `<text x="43" y="62" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}">?</text>` +
    waves()
  );
}

/** shapes (mint) — triangle + circle + square props. */
function islandShapes(color: string): string {
  return (
    base(color) +
    tree(28, 64, shade(palette.success)) +
    cloud(70, 20, 0.8) +
    `<path d="M40 48 l8 14 h-16 z" fill="${palette.error}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="62" cy="54" r="8" fill="${palette.accent}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<rect x="46" y="60" width="14" height="10" rx="2" fill="${palette.star}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    waves()
  );
}

/** english (coral) — a palm tree + a small globe (around the world). */
function islandEnglish(color: string): string {
  return (
    base(color) +
    palm(72, 66) +
    cloud(24, 20, 0.8) +
    `<circle cx="44" cy="58" r="11" fill="${palette.accent}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<g fill="none" stroke="${palette.white}" stroke-width="${SW_THIN}">` +
    `<path d="M44 47 V69"/><path d="M33 58 H55"/><path d="M36 51 Q44 56 52 51"/><path d="M36 65 Q44 60 52 65"/></g>` +
    waves()
  );
}

/** Resolver registry keyed by category id. */
const scenes: Record<IslandKey, (color: string) => string> = {
  numbers: islandNumbers,
  letters: islandLetters,
  logic: islandLogic,
  memory: islandMemory,
  shapes: islandShapes,
  english: islandEnglish,
};

/**
 * Return a complete `<svg>` string for a category's island scene. The colour
 * comes from `palette.island[id]` so it matches `categories.ts`. `title`
 * becomes the accessible `<title>` (pass the category's Vietnamese title).
 */
export function islandArt(id: IslandKey, title = ''): string {
  const color = palette.island[id];
  // GĐ6.5 — paint the grass dome with this island's hue + lift the whole scene
  // with one soft warm shadow (storybook surface, matching the Phaser scenes).
  const defs = paintedFill(GRASS_ID, color) + softShadow(SHADOW_ID);
  const body = `<g filter="url(#${SHADOW_ID})">${scenes[id](color)}</g>`;
  return svgDoc(withDefs(defs, body), title);
}

/**
 * A soft pastel sky-over-sea backdrop for the AdventureMap. Wide 0..100 grid;
 * the CSS stretches it to fill the island field behind the 6 islands. Drawn as
 * a decorative background (no title → `aria-hidden` via `<SvgArt>` with no alt).
 */
export function mapBackdrop(): string {
  // GĐ6.5 — lift the sun + drifting clouds with one soft warm shadow so the
  // backdrop reads as a layered storybook scene, not flat shapes.
  const defs = softShadow(SHADOW_ID);
  return svgDoc(
    withDefs(
      defs,
      // sky
      `<rect x="0" y="0" width="100" height="58" fill="${palette.backgroundSky}"/>` +
        // soft sun glow (lifted)
        `<g filter="url(#${SHADOW_ID})">` +
        `<circle cx="82" cy="16" r="12" fill="${palette.star}" opacity="0.55"/>` +
        `<circle cx="82" cy="16" r="7" fill="${palette.star}"/></g>` +
        // sea
        `<rect x="0" y="50" width="100" height="50" fill="#bfeaff"/>` +
        `<rect x="0" y="64" width="100" height="36" fill="#a6dcf7"/>` +
        `<rect x="0" y="80" width="100" height="20" fill="#8fcff0"/>` +
        // drifting clouds (lifted)
        `<g filter="url(#${SHADOW_ID})">` +
        cloud(20, 14, 1.1) +
        cloud(54, 10, 0.9) +
        cloud(38, 30, 0.7) +
        `</g>` +
        // sparkles on the water
        `<g fill="${palette.white}" opacity="0.55">` +
        `<path d="M16 72 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z"/>` +
        `<path d="M70 84 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z"/>` +
        `<path d="M44 90 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z"/></g>`,
    ),
  );
}

/** Category ids that have a drawn island — handy for the style board. */
export const islandIds = Object.keys(scenes) as IslandKey[];
