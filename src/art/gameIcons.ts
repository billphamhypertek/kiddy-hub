/**
 * KiddyHub — Game icons (Giai đoạn 4 · Phần B2).
 *
 * One little SVG emblem per game id (15 total). Each is a simple, clear symbol
 * for what the game trains, drawn on the canonical 0..100 viewBox in the brand
 * style (soft brown ink outline, rounded caps, pastel) and tinted with its
 * category's accent colour from `palette.island`. Returned as complete `<svg>`
 * strings via `svgDoc()` so they render through `<SvgArt>` in React.
 *
 * Keys match each game module's `id` (see the game index files). Use
 * `gameIcon(id, title)` — the resolver also picks the right category tint.
 */
import { svgDoc } from './svg';
import { palette, stroke, radius, type IslandKey } from './tokens';

const SW = stroke.width;
const SW_THIN = stroke.thin;
const INK = palette.ink;

/** Which category each game belongs to → drives the icon's accent tint. */
const GAME_CATEGORY: Record<string, IslandKey> = {
  'counting-fun': 'numbers',
  'match-quantity': 'numbers',
  'more-less': 'numbers',
  'letter-spotting': 'letters',
  'first-letter': 'letters',
  'pattern-finder': 'logic',
  'odd-one-out': 'logic',
  sorting: 'logic',
  'memory-match': 'memory',
  'spot-difference': 'memory',
  jigsaw: 'shapes',
  'shapes-colors': 'shapes',
  'abc-english': 'english',
  'colors-english': 'english',
  'numbers-english': 'english',
  'first-words': 'english',
};

/** A soft rounded badge that every icon sits on, tinted by the category hue. */
function badge(color: string): string {
  return (
    `<rect x="10" y="10" width="80" height="80" rx="${radius.lg}" fill="${color}" stroke="${INK}" stroke-width="${stroke.bold}"/>` +
    // glossy top highlight
    `<rect x="18" y="16" width="64" height="20" rx="${radius.md}" fill="${palette.white}" opacity="0.22"/>`
  );
}

/** A bold glyph "drawn" in white-on-tint, with a soft ink edge for contrast. */
function glyphText(ch: string, y = 64, fontSize = 46): string {
  return (
    `<text x="50" y="${y}" text-anchor="middle" font-size="${fontSize}" font-weight="800" ` +
    `font-family="'Baloo 2','Comic Sans MS',system-ui,sans-serif" ` +
    `fill="${palette.white}" stroke="${INK}" stroke-width="1.4" paint-order="stroke">${ch}</text>`
  );
}

// ─── Per-game emblems (inner markup, drawn on top of the badge) ──────────────

/** counting-fun 🦆 → three counting dots + "123" feel. */
function emCounting(): string {
  return (
    `<g fill="${palette.white}" stroke="${INK}" stroke-width="${SW}">` +
    `<circle cx="34" cy="44" r="8"/><circle cx="50" cy="44" r="8"/><circle cx="66" cy="44" r="8"/></g>` +
    glyphText('123', 78, 26)
  );
}

/** match-quantity 🔢 → number "3" linked to three dots. */
function emMatchQuantity(): string {
  return (
    glyphText('3', 60, 40) +
    `<g fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<circle cx="64" cy="40" r="5"/><circle cx="76" cy="52" r="5"/><circle cx="64" cy="64" r="5"/></g>` +
    `<path d="M40 52 H56" stroke="${palette.white}" stroke-width="${SW}"/>`
  );
}

/** more-less ⚖️ → a simple balance scale. */
function emMoreLess(): string {
  return (
    `<g stroke="${palette.white}" stroke-width="${SW}" fill="none">` +
    `<path d="M50 26 V70"/><path d="M30 38 H70"/></g>` +
    `<circle cx="50" cy="24" r="4" fill="${palette.white}"/>` +
    `<path d="M22 38 l-8 16 h16 z" fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<path d="M78 38 l-8 16 h16 z" fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<rect x="38" y="70" width="24" height="8" rx="3" fill="${palette.white}"/>`
  );
}

/** letter-spotting 🔤 → a big magnified "A". */
function emLetterSpotting(): string {
  return glyphText('A', 70, 56);
}

/** first-letter 🅰️ → "A" with a sound spark. */
function emFirstLetter(): string {
  return (
    glyphText('A', 66, 50) +
    `<g fill="${palette.star}" stroke="${INK}" stroke-width="1.2">` +
    `<path d="M74 26 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z"/></g>`
  );
}

/** pattern-finder 🧩 → repeating shape sequence ●▲●. */
function emPattern(): string {
  return (
    `<circle cx="28" cy="50" r="9" fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<path d="M50 41 l9 18 h-18 z" fill="${palette.star}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="72" cy="50" r="9" fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<path d="M40 72 q10 8 20 0" fill="none" stroke="${palette.white}" stroke-width="${SW_THIN}"/>`
  );
}

/** odd-one-out 🔍 → magnifier over a grid, one circled. */
function emOddOneOut(): string {
  return (
    `<g fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<circle cx="36" cy="38" r="6"/><circle cx="58" cy="38" r="6"/>` +
    `<rect x="30" y="56" width="12" height="12" rx="3"/></g>` +
    `<circle cx="62" cy="62" r="13" fill="none" stroke="${palette.star}" stroke-width="${SW}"/>` +
    `<path d="M71 71 l10 10" stroke="${palette.star}" stroke-width="${stroke.bold}"/>`
  );
}

/** sorting 🧺 → two bins with items dropping in. */
function emSorting(): string {
  return (
    `<g fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<circle cx="36" cy="32" r="6"/><rect x="58" y="26" width="12" height="12" rx="2"/></g>` +
    `<path d="M24 52 h24 l-3 22 h-18 z" fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M52 52 h24 l-3 22 h-18 z" fill="${palette.star}" stroke="${INK}" stroke-width="${SW}"/>`
  );
}

/** memory-match 🧠 → two cards, one flipped showing a star. */
function emMemory(): string {
  return (
    `<rect x="22" y="32" width="26" height="36" rx="5" fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<rect x="52" y="32" width="26" height="36" rx="5" fill="${palette.star}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M65 40 l2.4 5 l5.4 .6 l-4 3.8 l1 5.4 l-4.8 -2.8 l-4.8 2.8 l1 -5.4 l-4 -3.8 l5.4 -.6 z" fill="${palette.white}" stroke="${INK}" stroke-width="1"/>` +
    `<text x="35" y="56" text-anchor="middle" font-size="20" font-weight="800" fill="${INK}">?</text>`
  );
}

/** spot-difference 🔎 → two side-by-side picture frames with a magnifier. */
function emSpotDifference(): string {
  return (
    // two little framed pictures
    `<rect x="20" y="30" width="24" height="30" rx="4" fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<rect x="56" y="30" width="24" height="30" rx="4" fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    // a sun in each (the "same" detail) + the difference dot on the right
    `<circle cx="29" cy="40" r="4" fill="${palette.star}" stroke="${INK}" stroke-width="1"/>` +
    `<circle cx="65" cy="40" r="4" fill="${palette.star}" stroke="${INK}" stroke-width="1"/>` +
    `<circle cx="72" cy="52" r="3" fill="${palette.error}" stroke="${INK}" stroke-width="1"/>` +
    // magnifier hunting the difference
    `<circle cx="60" cy="64" r="11" fill="none" stroke="${palette.star}" stroke-width="${SW}"/>` +
    `<path d="M68 72 l9 9" stroke="${palette.star}" stroke-width="${stroke.bold}"/>`
  );
}

/** jigsaw 🎨 → a single puzzle piece. */
function emJigsaw(): string {
  return (
    `<path d="M32 34 h14 a6 6 0 0 1 12 0 h14 v14 a6 6 0 0 1 0 12 v14 h-14 a6 6 0 0 0 -12 0 h-14 v-14 a6 6 0 0 0 0 -12 z" ` +
    `fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>`
  );
}

/** shapes-colors 🔺 → a triangle, circle and square stack. */
function emShapes(): string {
  return (
    `<path d="M30 30 l12 22 h-24 z" fill="${palette.error}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="68" cy="40" r="13" fill="${palette.accent}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<rect x="38" y="58" width="26" height="22" rx="4" fill="${palette.star}" stroke="${INK}" stroke-width="${SW_THIN}"/>`
  );
}

/** abc-english 🔤 → "ABC". */
function emAbc(): string {
  return glyphText('ABC', 62, 30);
}

/** colors-english 🎨 → an artist palette with paint blobs. */
function emColors(): string {
  return (
    `<path d="M50 26 C70 26 80 40 78 54 C76 64 66 62 64 70 C62 78 52 80 50 80 C32 80 20 66 20 50 C20 36 32 26 50 26 Z" ` +
    `fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="36" cy="42" r="5" fill="${palette.error}"/>` +
    `<circle cx="52" cy="38" r="5" fill="${palette.accent}"/>` +
    `<circle cx="64" cy="48" r="5" fill="${palette.success}"/>` +
    `<circle cx="36" cy="60" r="5" fill="${palette.star}"/>`
  );
}

/** numbers-english 🔟 → "123". */
function emNumbersEn(): string {
  return glyphText('123', 64, 34);
}

/** first-words 🌎 → a small globe. */
function emFirstWords(): string {
  return (
    `<circle cx="50" cy="50" r="26" fill="${palette.white}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<g fill="none" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<path d="M50 24 V76"/><path d="M24 50 H76"/>` +
    `<path d="M30 36 Q50 46 70 36"/><path d="M30 64 Q50 54 70 64"/></g>` +
    `<path d="M40 40 q6 4 0 10 q8 6 2 14" fill="${palette.success}" opacity="0.7"/>`
  );
}

/** Resolver registry keyed by game id. */
const emblems: Record<string, () => string> = {
  'counting-fun': emCounting,
  'match-quantity': emMatchQuantity,
  'more-less': emMoreLess,
  'letter-spotting': emLetterSpotting,
  'first-letter': emFirstLetter,
  'pattern-finder': emPattern,
  'odd-one-out': emOddOneOut,
  sorting: emSorting,
  'memory-match': emMemory,
  'spot-difference': emSpotDifference,
  jigsaw: emJigsaw,
  'shapes-colors': emShapes,
  'abc-english': emAbc,
  'colors-english': emColors,
  'numbers-english': emNumbersEn,
  'first-words': emFirstWords,
};

/**
 * Return a complete `<svg>` string for a game icon: the category-tinted badge
 * plus the game's emblem. Unknown ids fall back to a neutral question badge.
 * `title` becomes the accessible `<title>` (pass the game's Vietnamese title).
 */
export function gameIcon(id: string, title = ''): string {
  const cat = GAME_CATEGORY[id];
  const color = cat ? palette.island[cat] : palette.accent;
  const emblem = emblems[id];
  const inner = badge(color) + (emblem ? emblem() : glyphText('?'));
  return svgDoc(inner, title);
}

/** Game ids that have a drawn icon — handy for galleries / the style board. */
export const gameIconIds = Object.keys(emblems);
