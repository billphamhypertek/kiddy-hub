import { describe, it, expect } from 'vitest';
import {
  EMOJI,
  pairCountForLevel,
  maxValueForLevel,
  generateRound,
  starsFor,
} from './matchQuantityLogic';

describe('per-level config', () => {
  it('grows pairs and value range with level', () => {
    expect(pairCountForLevel(1)).toBe(2);
    expect(pairCountForLevel(2)).toBe(3);
    expect(pairCountForLevel(3)).toBe(4);
    expect(maxValueForLevel(1)).toBe(3);
    expect(maxValueForLevel(2)).toBe(5);
    expect(maxValueForLevel(3)).toBe(10);
  });
});

describe('generateRound', () => {
  it('builds distinct-value pairs and a valid tile permutation', () => {
    for (const lvl of [1, 2, 3]) {
      const n = pairCountForLevel(lvl);
      const max = maxValueForLevel(lvl);
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.pairs).toHaveLength(n);
        expect(new Set(r.pairs.map((p) => p.value)).size).toBe(n); // distinct values
        for (const p of r.pairs) {
          expect(p.value).toBeGreaterThanOrEqual(1);
          expect(p.value).toBeLessThanOrEqual(max);
          expect(EMOJI).toContain(p.emoji);
        }
        // tileOrder is a permutation of [0..n-1].
        expect([...r.tileOrder].sort((a, b) => a - b)).toEqual(
          Array.from({ length: n }, (_, k) => k),
        );
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.3)).toEqual(generateRound(3, () => 0.3));
  });
});

describe('starsFor', () => {
  it('scores by first-try correct placements', () => {
    expect(starsFor(4, 4)).toBe(3);
    expect(starsFor(3, 4)).toBe(2); // 75% -> >=60%
    expect(starsFor(1, 4)).toBe(1);
  });
});
