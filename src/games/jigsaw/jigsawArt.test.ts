import { describe, it, expect } from 'vitest';
import {
  jigsawPicture,
  JIGSAW_PICTURE_COUNT,
  PIC_SIZE,
} from './jigsawArt';
import { palette } from '../../art/tokens';

/**
 * GĐ6 follow-up — the jigsaw picture is now a real storybook scene drawn 100%
 * locally from the shared art primitives (paint.ts surface + `creature()` + the
 * fox), replacing the old flat yellow/green + 🦊 emoji placeholder. Like every
 * `src/art/*` string factory the DRAWING is browser-verified; here we only lock
 * the PURE contracts:
 *   - each scene → a complete, well-formed `<svg>` string;
 *   - NATIVE width/height = 480 (so the texture's pixel size matches PIC and the
 *     scene's `setCrop` slot math lines up exactly);
 *   - the storybook surface is composed (painted gradient + soft shadow + ink);
 *   - colours come from `tokens.ts`;
 *   - `pick` selects deterministically and ANY value wraps safely into range.
 */
describe('jigsawPicture — catalog', () => {
  it('exposes a 480px native size matching the scene PIC', () => {
    expect(PIC_SIZE).toBe(480);
  });

  it('offers at least 3 distinct scenes for variety', () => {
    expect(JIGSAW_PICTURE_COUNT).toBeGreaterThanOrEqual(3);
  });

  it('renders a complete native-480 storybook <svg> for every scene', () => {
    for (let i = 0; i < JIGSAW_PICTURE_COUNT; i++) {
      const svg = jigsawPicture(i);
      expect(svg.startsWith('<svg'), `scene ${i} starts <svg`).toBe(true);
      expect(svg, `scene ${i} closes`).toContain('</svg>');
      // NATIVE 480×480 — load-bearing for the slicer's crop math.
      expect(svg, `scene ${i} width=480`).toContain('width="480"');
      expect(svg, `scene ${i} height=480`).toContain('height="480"');
      expect(svg, `scene ${i} viewBox`).toContain('viewBox="0 0 480 480"');
      // Composes the storybook surface (paint.ts): painted fill + soft shadow + ink.
      expect(svg, `scene ${i} painted`).toContain('linearGradient');
      expect(svg, `scene ${i} shadow`).toContain('feDropShadow');
      expect(svg, `scene ${i} ink`).toContain('stroke-linecap="round"');
    }
  });

  it('reuses the shared characters (Cáo + a creature) in every scene', () => {
    for (let i = 0; i < JIGSAW_PICTURE_COUNT; i++) {
      const svg = jigsawPicture(i);
      // The fox + creatures are embedded as NESTED <svg> sub-documents, so a
      // composed scene always has more than the one outer <svg> tag.
      expect((svg.match(/<svg/g) ?? []).length, `scene ${i} embeds characters`).toBeGreaterThan(1);
      expect(svg, `scene ${i} has a Vietnamese title`).toContain('<title>');
    }
  });

  it('draws colours from the brand palette (tokens), never a stray hue', () => {
    const svg = jigsawPicture(0);
    // The sun uses the reward-gold token; flowers/sky pull island/sky tokens.
    expect(svg).toContain(palette.star);
    expect(svg).toContain(palette.backgroundSky);
  });
});

describe('jigsawPicture — deterministic + safe pick', () => {
  it('selects deterministically: same pick → identical svg', () => {
    expect(jigsawPicture(0)).toBe(jigsawPicture(0));
    expect(jigsawPicture(1)).toBe(jigsawPicture(1));
  });

  it('distinct picks select distinct scenes', () => {
    const seen = new Set<string>();
    for (let i = 0; i < JIGSAW_PICTURE_COUNT; i++) seen.add(jigsawPicture(i));
    expect(seen.size).toBe(JIGSAW_PICTURE_COUNT);
  });

  it('wraps an out-of-range pick safely back into the catalog', () => {
    expect(jigsawPicture(JIGSAW_PICTURE_COUNT)).toBe(jigsawPicture(0));
    expect(jigsawPicture(JIGSAW_PICTURE_COUNT + 1)).toBe(jigsawPicture(1));
  });

  it('handles negative and fractional picks without throwing / blanking', () => {
    for (const p of [-1, -7, 2.9, -0.5, 999, -999]) {
      const svg = jigsawPicture(p);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('</svg>');
    }
    // -1 wraps to the LAST scene; 2.9 floors to index 2.
    expect(jigsawPicture(-1)).toBe(jigsawPicture(JIGSAW_PICTURE_COUNT - 1));
    expect(jigsawPicture(2.9)).toBe(jigsawPicture(2));
  });
});
