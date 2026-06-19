import { describe, it, expect } from 'vitest';
import {
  GROUPS,
  basketCountForLevel,
  itemsPerBasketForLevel,
  generateRound,
  starsFor,
} from './sortingLogic';

describe('per-level config', () => {
  it('sets basket and item counts per level', () => {
    expect(basketCountForLevel(1)).toBe(2);
    expect(basketCountForLevel(2)).toBe(2);
    expect(basketCountForLevel(3)).toBe(3);
    expect(itemsPerBasketForLevel(1)).toBe(2);
    expect(itemsPerBasketForLevel(2)).toBe(3);
    expect(itemsPerBasketForLevel(3)).toBe(2);
  });
});

describe('GROUPS', () => {
  it('has >= 3 groups with distinct labels', () => {
    expect(GROUPS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(GROUPS.map((g) => g.label)).size).toBe(GROUPS.length);
  });
});

describe('generateRound', () => {
  it('builds baskets + a valid pile with distinct emoji and a permutation', () => {
    for (const lvl of [1, 2, 3]) {
      const b = basketCountForLevel(lvl);
      const per = itemsPerBasketForLevel(lvl);
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.baskets).toHaveLength(b);
        expect(r.pile).toHaveLength(b * per);
        expect(new Set(r.pile.map((p) => p.emoji)).size).toBe(r.pile.length); // distinct
        for (const p of r.pile) {
          expect(p.basketIndex).toBeGreaterThanOrEqual(0);
          expect(p.basketIndex).toBeLessThan(b);
        }
        // Each basket gets exactly `per` items.
        for (let bi = 0; bi < b; bi++) {
          expect(r.pile.filter((p) => p.basketIndex === bi)).toHaveLength(per);
        }
        // pileOrder is a permutation.
        expect([...r.pileOrder].sort((a, c) => a - c)).toEqual(
          Array.from({ length: r.pile.length }, (_, k) => k),
        );
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.25)).toEqual(generateRound(3, () => 0.25));
  });
});

describe('starsFor', () => {
  it('scores by correctly sorted items', () => {
    expect(starsFor(4, 4)).toBe(3);
    expect(starsFor(3, 4)).toBe(2);
    expect(starsFor(1, 4)).toBe(1);
  });
});
