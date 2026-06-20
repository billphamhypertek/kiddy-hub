/**
 * KiddyHub — Colourblind-safe swatch PATTERNS (Giai đoạn 5 · Phần E2).
 *
 * The two colour games (`colors-english`, `shapes-colors`) used to encode
 * meaning by HUE ALONE: a bare colour rect / a same-shape-different-colour
 * option. For a colourblind child (deuteranopia/protanopia/achromatopsia) the
 * options could be indistinguishable. WCAG: never rely on colour alone.
 *
 * The fix is a SECOND, hue-independent signal on every colour option — a small,
 * DISTINCT glyph cluster drawn OVER the swatch/shape. (A NAME label is added by
 * the scenes too; together colour + pattern + label make each option
 * distinguishable with colour removed.)
 *
 * This module is split in two on purpose:
 *
 *   1. `patternFor(colorName)` — a PURE, data-only mapping from a colour name
 *      (English `red`/`blue`/… OR Vietnamese `đỏ`/`xanh dương`/…) to a fixed
 *      pattern DESCRIPTOR (`{ kind, ink }`). Deterministic: the same colour maps
 *      to the same pattern everywhere. Unit-testable WITHOUT Phaser.
 *
 *   2. `drawSwatchPattern(scene, x, y, size, colorName)` — a thin renderer that
 *      turns a descriptor into a `Graphics` glyph cluster centred on (x, y),
 *      drawn with monochrome (white-on-dark / dark-on-light) Graphics primitives.
 *      The scenes call this AFTER the swatch/shape, as a NON-interactive child.
 *
 * Keeping the mapping data-only means the colourblind-distinctness contract is
 * verified by a pure unit test; the Graphics rendering is exercised manually in
 * the browser (CB emulation) like every other Phaser scene art.
 */
import type Phaser from 'phaser';

/** The distinct pattern shapes. Each colour gets exactly one (CB-friendly). */
export type PatternKind = 'dots' | 'vstripes' | 'dstripes' | 'grid' | 'waves' | 'rings' | 'hearts';

/** Pen colour for the monochrome glyph, chosen for contrast against the swatch. */
export type PatternInk = 'dark' | 'light';

/** Data-only pattern descriptor — testable without Phaser. */
export interface PatternDescriptor {
  kind: PatternKind;
  ink: PatternInk;
}

/**
 * Canonical pattern table keyed by the ENGLISH colour name. Each colour has a
 * DISTINCT `kind` so the glyphs never collide; `ink` picks dark-on-light vs
 * light-on-dark for contrast against that colour's fill.
 *
 * Pairs that colourblind eyes confuse are pulled apart by kind:
 *   red(dots) vs green(grid), orange(rings) vs yellow(dstripes).
 */
const PATTERNS: Record<string, PatternDescriptor> = {
  red: { kind: 'dots', ink: 'light' },
  blue: { kind: 'vstripes', ink: 'light' },
  yellow: { kind: 'dstripes', ink: 'dark' },
  green: { kind: 'grid', ink: 'light' },
  purple: { kind: 'waves', ink: 'light' },
  orange: { kind: 'rings', ink: 'dark' },
  pink: { kind: 'hearts', ink: 'dark' },
  black: { kind: 'vstripes', ink: 'light' },
};

/**
 * Map a Vietnamese colour name (as used by `shapes-colors`) to its English key.
 * `colors-english` already uses English names so its names hit `PATTERNS`
 * directly; this only bridges the VN game.
 */
const VI_TO_EN: Record<string, string> = {
  đỏ: 'red',
  'xanh dương': 'blue',
  vàng: 'yellow',
  'xanh lá': 'green',
  tím: 'purple',
  cam: 'orange',
};

/**
 * Resolve a colour `name` (English or Vietnamese) to its English pattern key.
 * Exported for the pure mapping test. Returns `undefined` for unknown names so
 * callers can decide a safe fallback.
 */
export function patternKeyFor(colorName: string): string | undefined {
  if (colorName in PATTERNS) return colorName;
  const en = VI_TO_EN[colorName];
  if (en !== undefined && en in PATTERNS) return en;
  return undefined;
}

/**
 * PURE mapping: colour name → fixed pattern descriptor. Same colour ⇒ same
 * descriptor everywhere, in both games. Unknown names fall back to a neutral
 * `dots/dark` so a swatch is never left with no second signal.
 */
export function patternFor(colorName: string): PatternDescriptor {
  const key = patternKeyFor(colorName);
  return key !== undefined ? PATTERNS[key] : { kind: 'dots', ink: 'dark' };
}

/**
 * Render a colour's pattern as a small monochrome glyph CLUSTER centred on
 * (x, y), fitting inside a `size`×`size` box. Returns the `Graphics` so the
 * caller can depth-sort it (below the hit area) and feed it to `dimDistractor`.
 *
 * VISUAL-ONLY: the returned object is NOT interactive — it adds no hit area and
 * attaches no pointer handler, so it can never intercept a tap. The scenes draw
 * it as a child BELOW the swatch's/hit's interaction layer.
 *
 * Drawn with Graphics primitives only (no textures), matching the other scene
 * art; jsdom-safe because the phaser-stub provides a forgiving `add.graphics()`.
 */
export function drawSwatchPattern(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  colorName: string,
): Phaser.GameObjects.Graphics {
  const { kind, ink } = patternFor(colorName);
  const g = scene.add.graphics();
  g.setPosition(x, y);
  const pen = ink === 'light' ? 0xffffff : 0x3a2a1c;
  const half = size / 2;

  switch (kind) {
    case 'dots': {
      g.fillStyle(pen, 0.85);
      const r = size * 0.07;
      const step = size / 3;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          g.fillCircle(i * step, j * step, r);
        }
      }
      break;
    }
    case 'vstripes': {
      g.fillStyle(pen, 0.8);
      const w = size * 0.09;
      for (let i = -2; i <= 2; i++) {
        g.fillRect(i * (size / 4) - w / 2, -half * 0.9, w, size * 0.9);
      }
      break;
    }
    case 'dstripes': {
      g.lineStyle(size * 0.08, pen, 0.85);
      for (let i = -3; i <= 3; i++) {
        const off = i * (size / 4);
        g.lineBetween(-half, off - half, off + half, half);
      }
      break;
    }
    case 'grid': {
      g.lineStyle(size * 0.06, pen, 0.85);
      const step = size / 4;
      for (let i = -1; i <= 1; i++) {
        g.lineBetween(i * step, -half * 0.8, i * step, half * 0.8);
        g.lineBetween(-half * 0.8, i * step, half * 0.8, i * step);
      }
      break;
    }
    case 'waves': {
      g.lineStyle(size * 0.06, pen, 0.85);
      const amp = size * 0.1;
      for (let row = -1; row <= 1; row++) {
        const baseY = row * (size / 3);
        g.beginPath();
        g.moveTo(-half, baseY);
        const segs = 8;
        for (let s = 1; s <= segs; s++) {
          const px = -half + (size * s) / segs;
          const py = baseY + (s % 2 === 0 ? -amp : amp);
          g.lineTo(px, py);
        }
        g.strokePath();
      }
      break;
    }
    case 'rings': {
      g.lineStyle(size * 0.07, pen, 0.85);
      g.strokeCircle(0, 0, size * 0.18);
      g.strokeCircle(0, 0, size * 0.34);
      g.strokeCircle(0, 0, size * 0.48);
      break;
    }
    case 'hearts': {
      g.fillStyle(pen, 0.85);
      const positions = [
        { hx: 0, hy: 0 },
        { hx: -size * 0.28, hy: -size * 0.22 },
        { hx: size * 0.28, hy: -size * 0.22 },
        { hx: -size * 0.28, hy: size * 0.26 },
        { hx: size * 0.28, hy: size * 0.26 },
      ];
      const hs = size * 0.12;
      for (const { hx, hy } of positions) {
        g.fillCircle(hx - hs * 0.5, hy - hs * 0.3, hs * 0.55);
        g.fillCircle(hx + hs * 0.5, hy - hs * 0.3, hs * 0.55);
        g.fillTriangle(hx - hs, hy, hx + hs, hy, hx, hy + hs * 1.1);
      }
      break;
    }
  }

  return g;
}
