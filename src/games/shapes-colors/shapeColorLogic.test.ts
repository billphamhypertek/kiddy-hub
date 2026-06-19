import { describe, it, expect } from 'vitest';
import {
  SHAPES,
  COLORS,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './shapeColorLogic';

describe('optionCountForLevel', () => {
  it('uses 3 for L1 and 4 for L2/L3', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(4);
    expect(optionCountForLevel(3)).toBe(4);
  });
});

describe('generateRound', () => {
  it('has exactly one correct option matching the target', () => {
    for (const lvl of [1, 2, 3]) {
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(r.correctIndex).toBeGreaterThanOrEqual(0);
        expect(r.correctIndex).toBeLessThan(r.options.length);

        const matches = (o: { shape: string; color: { name: string } }): boolean => {
          if (r.mode === 'shape') return o.shape === r.targetShape;
          if (r.mode === 'color') return o.color.name === r.targetColor!.name;
          return o.shape === r.targetShape && o.color.name === r.targetColor!.name;
        };
        const matching = r.options.filter(matches);
        expect(matching).toHaveLength(1);
        expect(r.options[r.correctIndex]).toBe(matching[0]);

        for (const o of r.options) {
          expect(SHAPES).toContain(o.shape);
          expect(COLORS.map((c) => c.name)).toContain(o.color.name);
        }
      }
    }
  });

  it('uses single-attribute modes at L1/L2 and both at L3', () => {
    for (let i = 0; i < 20; i++) {
      expect(['shape', 'color']).toContain(generateRound(1, () => i / 20).mode);
      expect(['shape', 'color']).toContain(generateRound(2, () => i / 20).mode);
      expect(generateRound(3, () => i / 20).mode).toBe('both');
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.5)).toEqual(generateRound(3, () => 0.5));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(2, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
