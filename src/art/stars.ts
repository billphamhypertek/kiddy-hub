/**
 * KiddyHub — Star reward + garden art (Giai đoạn 4 · Phần B2).
 *
 * A friendly gold five-point star (the app's reward token) and a small set of
 * garden props (flower / bush / tree / rabbit / pond / butterflies) so the
 * "Vườn sao" grows in the brand style instead of emoji. All on the canonical
 * 0..100 viewBox, soft brown ink, rounded caps, pastel; returned as complete
 * `<svg>` strings via `svgDoc()` for `<SvgArt>` rendering.
 *
 * Garden item keys match `data` milestones used by StarGarden:
 * flower, bush, tree, rabbit, pond, butterflies.
 */
import { svgDoc } from './svg';
import { palette, stroke } from './tokens';

const SW = stroke.width;
const SW_THIN = stroke.thin;
const INK = palette.ink;

/** Five-point star path centred at (cx, cy) with outer radius r. */
function starPath(cx: number, cy: number, r: number): string {
  const inner = r * 0.42;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)} ${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/**
 * A gold reward star with a soft outline and a little catch-light.
 * `title` becomes the accessible `<title>` (e.g. "Ngôi sao").
 */
export function starArt(title = 'Ngôi sao'): string {
  return svgDoc(
    `<path d="${starPath(50, 52, 40)}" fill="${palette.star}" stroke="${INK}" stroke-width="${stroke.bold}"/>` +
    // inner glossy star
    `<path d="${starPath(50, 50, 24)}" fill="${palette.white}" opacity="0.25"/>` +
    // catch-light
    `<circle cx="40" cy="38" r="4" fill="${palette.white}" opacity="0.7"/>`,
    title,
  );
}

/** A blank "to earn" star — pale outline, for empty slots if ever needed. */
export function starOutlineArt(title = ''): string {
  return svgDoc(
    `<path d="${starPath(50, 52, 40)}" fill="${palette.white}" stroke="${INK}" stroke-width="${SW}" opacity="0.85"/>`,
    title,
  );
}

// ─── Garden props ────────────────────────────────────────────────────────────

function gFlower(): string {
  const petal = palette.error;
  let s = `<line x1="50" y1="56" x2="50" y2="84" stroke="${palette.success}" stroke-width="${stroke.bold}"/>`;
  s += `<g fill="${petal}" stroke="${INK}" stroke-width="${SW_THIN}">`;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    s += `<ellipse cx="${(50 + Math.cos(a) * 14).toFixed(1)}" cy="${(46 + Math.sin(a) * 14).toFixed(1)}" rx="8" ry="11" transform="rotate(${(i * 72).toFixed(0)} ${(50 + Math.cos(a) * 14).toFixed(1)} ${(46 + Math.sin(a) * 14).toFixed(1)})"/>`;
  }
  s += '</g>';
  s += `<circle cx="50" cy="46" r="8" fill="${palette.star}" stroke="${INK}" stroke-width="${SW_THIN}"/>`;
  return s;
}

function gBush(): string {
  const g = palette.success;
  return (
    `<g fill="${g}" stroke="${INK}" stroke-width="${SW}">` +
    `<circle cx="38" cy="64" r="14"/><circle cx="62" cy="64" r="14"/><circle cx="50" cy="54" r="16"/></g>`
  );
}

function gTree(): string {
  return (
    `<rect x="46" y="58" width="8" height="26" rx="3" fill="#a06a3c" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="50" cy="42" r="20" fill="${palette.success}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="34" cy="50" r="12" fill="${palette.success}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="66" cy="50" r="12" fill="${palette.success}" stroke="${INK}" stroke-width="${SW_THIN}"/>`
  );
}

function gRabbit(): string {
  const c = '#f4e3ef';
  return (
    `<path d="M40 36 C36 16 44 14 46 32 Z" fill="${c}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<path d="M56 36 C60 16 52 14 50 32 Z" fill="${c}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="48" cy="54" r="22" fill="${c}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="41" cy="50" r="3" fill="${INK}"/><circle cx="55" cy="50" r="3" fill="${INK}"/>` +
    `<circle cx="36" cy="58" r="3.5" fill="#ffb3a7" opacity="0.8"/>` +
    `<circle cx="60" cy="58" r="3.5" fill="#ffb3a7" opacity="0.8"/>` +
    `<path d="M48 56 c2 0 3 1.4 2 2.6 c-1 1 -3 1 -4 0 c-1 -1.2 0 -2.6 2 -2.6 Z" fill="#e8757f"/>`
  );
}

function gPond(): string {
  return (
    `<ellipse cx="50" cy="62" rx="34" ry="18" fill="${palette.accent}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<ellipse cx="50" cy="58" rx="26" ry="11" fill="#bfeaff"/>` +
    `<g fill="none" stroke="${palette.white}" stroke-width="${SW_THIN}">` +
    `<path d="M38 60 q4 -3 8 0 t8 0"/></g>` +
    `<circle cx="40" cy="68" r="5" fill="${palette.success}" stroke="${INK}" stroke-width="${SW_THIN}"/>`
  );
}

function gButterflies(): string {
  const wing = (cx: number, cy: number, color: string): string =>
    `<g fill="${color}" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<circle cx="${cx - 6}" cy="${cy - 4}" r="6"/><circle cx="${cx + 6}" cy="${cy - 4}" r="6"/>` +
    `<circle cx="${cx - 6}" cy="${cy + 5}" r="5"/><circle cx="${cx + 6}" cy="${cy + 5}" r="5"/></g>` +
    `<line x1="${cx}" y1="${cy - 8}" x2="${cx}" y2="${cy + 8}" stroke="${INK}" stroke-width="${SW}"/>`;
  return wing(36, 40, palette.error) + wing(64, 58, palette.accent);
}

// ─── Mastery-driven garden props (GĐ5 D2, additive) ──────────────────────────

function gSprout(): string {
  const g = palette.success;
  return (
    `<line x1="50" y1="58" x2="50" y2="84" stroke="${g}" stroke-width="${stroke.bold}"/>` +
    `<path d="M50 64 C40 58 32 60 30 70 C40 72 48 70 50 64 Z" fill="${g}" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<path d="M50 58 C60 52 68 54 70 64 C60 66 52 64 50 58 Z" fill="${g}" stroke="${INK}" stroke-width="${SW_THIN}"/>`
  );
}

function gMushroom(): string {
  return (
    `<rect x="45" y="56" width="10" height="26" rx="4" fill="#fff3e0" stroke="${INK}" stroke-width="${SW_THIN}"/>` +
    `<path d="M26 56 C26 38 74 38 74 56 Z" fill="${palette.error}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="40" cy="48" r="4" fill="${palette.white}"/>` +
    `<circle cx="58" cy="46" r="5" fill="${palette.white}"/>` +
    `<circle cx="50" cy="52" r="3" fill="${palette.white}"/>`
  );
}

function gBirdhouse(): string {
  return (
    `<line x1="50" y1="56" x2="50" y2="86" stroke="#a06a3c" stroke-width="${stroke.bold}"/>` +
    `<rect x="36" y="40" width="28" height="24" rx="3" fill="#f4c97a" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M34 42 L50 26 L66 42 Z" fill="${palette.error}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<circle cx="50" cy="52" r="6" fill="${INK}"/>` +
    `<circle cx="50" cy="62" r="2.5" fill="#a06a3c"/>`
  );
}

const gardenProps: Record<string, () => string> = {
  flower: gFlower,
  bush: gBush,
  tree: gTree,
  rabbit: gRabbit,
  pond: gPond,
  butterflies: gButterflies,
  // mastery-driven (D2)
  sprout: gSprout,
  mushroom: gMushroom,
  birdhouse: gBirdhouse,
};

/**
 * Return a complete `<svg>` string for a grown garden item. Unknown keys fall
 * back to a sparkle. `title` becomes the accessible `<title>`.
 */
export function gardenItemArt(item: string, title = ''): string {
  const make = gardenProps[item];
  if (make) return svgDoc(make(), title);
  // fallback sparkle
  return svgDoc(
    `<path d="${starPath(50, 50, 24)}" fill="${palette.star}" stroke="${INK}" stroke-width="${SW_THIN}"/>`,
    title,
  );
}

/** Garden item keys that have a drawn prop — handy for the style board. */
export const gardenItemKeys = Object.keys(gardenProps);
