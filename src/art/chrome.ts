/**
 * KiddyHub — In-scene UI chrome art (Giai đoạn 4 · Phần B3).
 *
 * SVG vector art for the bits of UI that live INSIDE a Phaser game scene:
 * the round home / speaker buttons, the rounded answer-tile that backs an
 * option, and the soft clouds that drift on the scene background. These swap
 * the old emoji chrome (🏠 / 🔊) and bare white rectangles for the cohesive
 * illustrated look — same brand style as the Cáo mascot and the islands.
 *
 * Like every `src/art/*` module: authored on the canonical 0..100 viewBox,
 * every colour/stroke/radius imported from `tokens.ts`, returned as a complete
 * `<svg>` string via `svgDoc()`. The Phaser adapters in `sceneArt.ts` turn
 * these into textures with `loadSvgTexture` / `addArt` from B1.
 */
import { svgDoc } from './svg';
import { palette, stroke, radius } from './tokens';

const SW = stroke.width;
const SW_THIN = stroke.thin;
const INK = palette.ink;

/** A soft round button base: a tinted disc with a glossy top highlight + ink ring. */
function buttonBase(fill: string): string {
  return (
    `<circle cx="50" cy="52" r="40" fill="${INK}" opacity="0.12"/>` + // soft drop shadow
    `<circle cx="50" cy="50" r="40" fill="${fill}" stroke="${INK}" stroke-width="${stroke.bold}"/>` +
    // glossy highlight across the top
    `<path d="M22 38 C30 24 70 24 78 38 C70 32 30 32 22 38 Z" fill="${palette.white}" opacity="0.35"/>`
  );
}

/**
 * Round HOME button (replaces the 🏠 emoji). A friendly little house glyph in
 * white on the brand sky-blue disc.
 */
export function homeButtonArt(title = 'Về nhà'): string {
  const W = palette.white;
  return svgDoc(
    buttonBase(palette.accent) +
      // house body
      `<rect x="36" y="50" width="28" height="24" rx="3" fill="${W}" stroke="${INK}" stroke-width="${SW}"/>` +
      // roof
      `<path d="M32 52 L50 34 L68 52 Z" fill="${W}" stroke="${INK}" stroke-width="${SW}"/>` +
      // door
      `<rect x="46" y="60" width="8" height="14" rx="2" fill="${palette.accent}" stroke="${INK}" stroke-width="${SW_THIN}"/>`,
    title,
  );
}

/**
 * Round SPEAKER button (replaces the 🔊 emoji). A speaker cone + two sound
 * waves in white on the brand orange disc — "nghe lại" (listen again).
 */
export function speakerButtonArt(title = 'Nghe lại'): string {
  const W = palette.white;
  return svgDoc(
    buttonBase(palette.primary) +
      // speaker body + cone
      `<path d="M34 44 H42 L54 34 V70 L42 60 H34 Z" fill="${W}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>` +
      // sound waves
      `<g fill="none" stroke="${W}" stroke-width="${SW}">` +
      `<path d="M62 42 Q70 52 62 62"/>` +
      `<path d="M68 36 Q82 52 68 68"/></g>`,
    title,
  );
}

/**
 * The approved rounded ANSWER TILE that sits BEHIND an option (number, letter,
 * emoji…). White rounded card with a soft tinted shadow and a glossy top — the
 * cute backing the content symbol rests on. Purely decorative; the scene keeps
 * its own invisible hit area on top so interaction is unchanged.
 *
 * @param accent ring/shadow tint (defaults to the warm star gold).
 */
export function optionTileArt(accent: string = palette.star, title = ''): string {
  return svgDoc(
    // soft shadow
    `<rect x="12" y="16" width="76" height="76" rx="${radius.lg}" fill="${INK}" opacity="0.10"/>` +
    // card
    `<rect x="10" y="10" width="80" height="80" rx="${radius.lg}" fill="${palette.surface}" stroke="${accent}" stroke-width="${stroke.bold}"/>` +
    // glossy top highlight
    `<rect x="18" y="16" width="64" height="18" rx="${radius.md}" fill="${palette.white}" opacity="0.5"/>`,
    title,
  );
}

/**
 * A single confetti piece — a small rounded rectangle in `color` with a soft ink
 * edge. Used by the GĐ6.1 celebrate burst (drawn via `addArt` so the texture
 * cache stays tidy: one texture per colour). Decorative.
 */
export function confettiArt(color: string, title = ''): string {
  return svgDoc(
    `<rect x="38" y="22" width="24" height="56" rx="8" fill="${color}" stroke="${INK}" stroke-width="${SW_THIN}"/>`,
    title,
  );
}

/** A single soft fluffy cloud used to dress the scene sky. Decorative. */
export function cloudArt(title = ''): string {
  return svgDoc(
    `<g fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}" opacity="0.92">` +
    `<circle cx="30" cy="56" r="16"/>` +
    `<circle cx="50" cy="48" r="20"/>` +
    `<circle cx="70" cy="56" r="16"/>` +
    `<rect x="18" y="56" width="64" height="18" rx="9"/></g>`,
    title,
  );
}
