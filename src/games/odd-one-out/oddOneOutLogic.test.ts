import { describe, it, expect } from 'vitest';
import {
  GROUPS,
  itemCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './oddOneOutLogic';

const groupOf = (emoji: string): number => GROUPS.findIndex((g) => g.includes(emoji));

describe('itemCountForLevel', () => {
  it('grows with level', () => {
    expect(itemCountForLevel(1)).toBe(3);
    expect(itemCountForLevel(2)).toBe(4);
    expect(itemCountForLevel(3)).toBe(5);
  });
});

describe('generateRound', () => {
  it('has distinct items, exactly one from a foreign group', () => {
    for (const lvl of [1, 2, 3]) {
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.items).toHaveLength(itemCountForLevel(lvl));
        expect(new Set(r.items).size).toBe(r.items.length);
        expect(r.oddIndex).toBeGreaterThanOrEqual(0);
        expect(r.oddIndex).toBeLessThan(r.items.length);
        const oddGroup = groupOf(r.items[r.oddIndex]);
        const others = r.items.filter((_, idx) => idx !== r.oddIndex).map(groupOf);
        // All non-odd items share one group, distinct from the odd item's group.
        expect(new Set(others).size).toBe(1);
        expect(others[0]).not.toBe(oddGroup);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(2, () => 0.4)).toEqual(generateRound(2, () => 0.4));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(0, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
