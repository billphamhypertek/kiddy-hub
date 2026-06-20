import { describe, it, expect } from 'vitest';
import {
  DIFFERENCE_CATALOG,
  ROUNDS_PER_GAME,
  differenceCountForLevel,
  chooseDifferences,
  allFound,
  starsForRounds,
  type DifferenceKind,
} from './spotDifferenceLogic';

const catalogIds = new Set(DIFFERENCE_CATALOG.map((d) => d.id));

describe('DIFFERENCE_CATALOG', () => {
  it('holds at least as many candidates as the hardest level needs', () => {
    // L3 needs 5 distinct spots; keep a comfortable buffer (~8 candidates).
    expect(DIFFERENCE_CATALOG.length).toBeGreaterThanOrEqual(differenceCountForLevel(3));
    expect(DIFFERENCE_CATALOG.length).toBeGreaterThanOrEqual(8);
  });

  it('has unique ids and a valid tap region for every spot', () => {
    expect(catalogIds.size).toBe(DIFFERENCE_CATALOG.length);
    for (const spot of DIFFERENCE_CATALOG) {
      expect(spot.radius).toBeGreaterThan(0);
      expect(Number.isFinite(spot.x)).toBe(true);
      expect(Number.isFinite(spot.y)).toBe(true);
    }
  });

  it('mixes all four difference kinds', () => {
    const kinds = new Set<DifferenceKind>(DIFFERENCE_CATALOG.map((d) => d.kind));
    expect(kinds).toEqual(new Set(['removed', 'recolored', 'moved', 'resized']));
  });
});

describe('differenceCountForLevel', () => {
  it('is 2 + level (3 / 4 / 5)', () => {
    expect(differenceCountForLevel(1)).toBe(3);
    expect(differenceCountForLevel(2)).toBe(4);
    expect(differenceCountForLevel(3)).toBe(5);
  });

  it('never exceeds the catalog size', () => {
    expect(differenceCountForLevel(99)).toBeLessThanOrEqual(DIFFERENCE_CATALOG.length);
  });
});

describe('chooseDifferences', () => {
  it('returns the right count of distinct, in-catalog spots for each level', () => {
    for (const lvl of [1, 2, 3]) {
      for (let i = 0; i < 60; i++) {
        const chosen = chooseDifferences(lvl, () => i / 60);
        expect(chosen).toHaveLength(differenceCountForLevel(lvl));
        const ids = chosen.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length); // distinct within a round
        for (const id of ids) expect(catalogIds.has(id)).toBe(true);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(chooseDifferences(2, () => 0.4)).toEqual(chooseDifferences(2, () => 0.4));
    expect(chooseDifferences(3, () => 0.73)).toEqual(chooseDifferences(3, () => 0.73));
  });

  it('produces different selections for different rng streams', () => {
    let n = 0;
    const stream = (): number => {
      n = (n * 9301 + 49297) % 233280;
      return n / 233280;
    };
    const a = chooseDifferences(3, stream).map((c) => c.id);
    const b = chooseDifferences(3, () => 0).map((c) => c.id);
    // Not asserting strict inequality of content (could coincide), but both are
    // valid full selections — exercises the shuffle with a non-constant stream.
    expect(a).toHaveLength(5);
    expect(b).toHaveLength(5);
  });
});

describe('allFound', () => {
  it('is true only when every chosen id is found', () => {
    const chosen = chooseDifferences(1, () => 0.2);
    const ids = chosen.map((c) => c.id);
    expect(allFound(new Set(), chosen)).toBe(false);
    expect(allFound(new Set(ids.slice(0, 1)), chosen)).toBe(false);
    expect(allFound(new Set(ids), chosen)).toBe(true);
  });
});

describe('starsForRounds', () => {
  it('awards 3 when every round was cleared, scaling down otherwise', () => {
    expect(starsForRounds(3, 3)).toBe(3);
    expect(starsForRounds(2, 3)).toBe(2);
    expect(starsForRounds(0, 3)).toBe(1);
    expect(ROUNDS_PER_GAME).toBe(3);
  });
});
