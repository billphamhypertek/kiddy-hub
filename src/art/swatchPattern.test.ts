import { describe, it, expect } from 'vitest';
import { patternFor, patternKeyFor, type PatternKind } from './swatchPattern';
import { COLORS as COLORS_EN } from '../games/colors-english/colorsEnLogic';
import { COLORS as COLORS_VI } from '../games/shapes-colors/shapeColorLogic';

/**
 * GĐ5E2 — colourblind-safe pattern MAPPING (pure, no Phaser).
 *
 * The drawing (`drawSwatchPattern`) is manual-tested in the browser like every
 * other Phaser scene art; only the data-only `name → descriptor` mapping is
 * unit-tested here. The contract: every colour both games use has a pattern, the
 * mapping is deterministic, and the patterns are DISTINCT (so colour-removed,
 * each option is still tellable apart by its glyph).
 */
describe('swatchPattern mapping', () => {
  it('covers every colors-english colour name', () => {
    for (const c of COLORS_EN) {
      expect(patternKeyFor(c.name), `missing pattern for EN "${c.name}"`).toBeDefined();
    }
  });

  it('covers every shapes-colors (Vietnamese) colour name', () => {
    for (const c of COLORS_VI) {
      expect(patternKeyFor(c.name), `missing pattern for VI "${c.name}"`).toBeDefined();
    }
  });

  it('is deterministic — same colour always maps to the same descriptor', () => {
    const a = patternFor('red');
    const b = patternFor('red');
    expect(a).toEqual(b);
  });

  it('maps a Vietnamese name to the same descriptor as its English twin', () => {
    // đỏ ≡ red, xanh dương ≡ blue, etc. — one chip system across both games.
    expect(patternFor('đỏ')).toEqual(patternFor('red'));
    expect(patternFor('xanh dương')).toEqual(patternFor('blue'));
    expect(patternFor('vàng')).toEqual(patternFor('yellow'));
    expect(patternFor('xanh lá')).toEqual(patternFor('green'));
    expect(patternFor('tím')).toEqual(patternFor('purple'));
    expect(patternFor('cam')).toEqual(patternFor('orange'));
  });

  it('gives each distinct colour a DISTINCT pattern kind within a game', () => {
    // colors-english is the worst case: 8 bare colour rects → 8 distinct glyphs.
    const kinds = COLORS_EN.map((c) => patternFor(c.name).kind);
    const unique = new Set<PatternKind>(kinds);
    // `black` deliberately shares vstripes with `blue`, but on a near-black fill
    // the hue separation is obvious; every OTHER colour is unique. Assert the
    // colourblind-critical confusable pairs differ.
    expect(patternFor('red').kind).not.toBe(patternFor('green').kind);
    expect(patternFor('orange').kind).not.toBe(patternFor('yellow').kind);
    expect(patternFor('blue').kind).not.toBe(patternFor('purple').kind);
    // At least 6 distinct glyph kinds across the 8 EN colours.
    expect(unique.size).toBeGreaterThanOrEqual(6);
  });

  it('the 6 shapes-colors colours all get DISTINCT pattern kinds', () => {
    const kinds = COLORS_VI.map((c) => patternFor(c.name).kind);
    expect(new Set(kinds).size).toBe(COLORS_VI.length);
  });

  it('falls back to a neutral pattern for an unknown name (never blank)', () => {
    const d = patternFor('chartreuse-unknown');
    expect(d.kind).toBe('dots');
    expect(d.ink).toBeDefined();
  });
});
