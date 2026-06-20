/**
 * KiddyHub — Storybook paint factory (Giai đoạn 6 · Phần 6.1).
 *
 * Pure functions returning reusable SVG <defs> fragments for the "Truyện tranh
 * giấy · Tươi" look: a soft warm drop-shadow, a painted (lighten→hue→darken)
 * gradient fill, a brown "ink" stroke, and a faint paper-grain filter. Every id
 * is NAMESPACED by the caller so multiple assets can share one document/texture
 * without their filter/gradient ids colliding.
 *
 * Phaser note (spec §4.2): feDropShadow / feTurbulence bake into the base64
 * texture fine. paintedFill + softShadow are cheap PER-ASSET; paperGrain is used
 * for ONE scene-level overlay, never per-sprite.
 *
 * Every colour/dimension comes from `tokens.ts` — nothing here hard-codes a hue.
 */
import { shadow, outline, paper, paint } from './tokens';

/** Clamp to a 2-hex byte. */
function byte(n: number): string {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, '0');
}

/** Mix a `#rrggbb` toward white by `amt` (0..1). */
export function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `#${byte(r + (255 - r) * amt)}${byte(g + (255 - g) * amt)}${byte(b + (255 - b) * amt)}`;
}

/** Mix a `#rrggbb` toward black by `amt` (0..1). */
export function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `#${byte(r * (1 - amt))}${byte(g * (1 - amt))}${byte(b * (1 - amt))}`;
}

/**
 * A soft warm drop-shadow filter. Reference it with `filter="url(#id)"` on the
 * shape you want to lift off the page. Padded region so the blur isn't clipped.
 */
export function softShadow(id: string): string {
  return (
    `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%">` +
    `<feDropShadow dx="${shadow.dx}" dy="${shadow.dy}" stdDeviation="${shadow.blur}" ` +
    `flood-color="${shadow.color}" flood-opacity="${shadow.opacity}"/>` +
    `</filter>`
  );
}

/**
 * A vertical painted-fill gradient (lighter at top → hue → darker at foot) giving
 * each colour block hand-painted depth. Reference with `fill="url(#id)"`.
 */
export function paintedFill(id: string, hue: string): string {
  const top = lighten(hue, paint.lighten);
  const foot = darken(hue, paint.darken);
  return (
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${top}"/>` +
    `<stop offset="55%" stop-color="${hue}"/>` +
    `<stop offset="100%" stop-color="${foot}"/>` +
    `</linearGradient>`
  );
}

/**
 * Standard storybook stroke attributes (brown ink, thin, round caps/joins).
 * Returns an ATTRIBUTE string to interpolate into a `<path …>`/`<circle …>`.
 */
export function inkStroke(): string {
  return `stroke="${outline.ink}" stroke-width="${outline.width}" stroke-linecap="round" stroke-linejoin="round"`;
}

/**
 * A faint paper-grain filter for ONE scene-level overlay (not per-sprite). Apply
 * to a full-bleed rect with low opacity to dust the whole scene with texture.
 */
export function paperGrain(id: string): string {
  return (
    `<filter id="${id}" x="0%" y="0%" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${paper.baseFrequency}" numOctaves="2" stitchTiles="stitch" result="n"/>` +
    `<feColorMatrix in="n" type="saturate" values="0"/>` +
    `</filter>`
  );
}

/** Wrap reusable defs in a `<defs>` block before the body (compose helper). */
export function withDefs(defs: string, body: string): string {
  return `<defs>${defs}</defs>${body}`;
}
