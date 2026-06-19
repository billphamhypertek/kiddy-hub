import { describe, it, expect } from 'vitest';
import { gridForLevel, buildBoard, starsForFlips } from './memoryLogic';

describe('gridForLevel', () => {
  it('grows the board per level with even cell counts', () => {
    for (const lvl of [1, 2, 3]) {
      const g = gridForLevel(lvl);
      expect((g.rows * g.cols) % 2).toBe(0);
      expect(g.pairs).toBe((g.rows * g.cols) / 2);
    }
    expect(gridForLevel(1)).toEqual({ rows: 2, cols: 2, pairs: 2 });
    expect(gridForLevel(2)).toEqual({ rows: 3, cols: 2, pairs: 3 });
    expect(gridForLevel(3)).toEqual({ rows: 4, cols: 3, pairs: 6 });
  });
});

describe('buildBoard', () => {
  it('produces rows*cols cards with each pairId appearing exactly twice', () => {
    for (const lvl of [1, 2, 3]) {
      const g = gridForLevel(lvl);
      const cards = buildBoard(lvl, () => 0.5);
      expect(cards).toHaveLength(g.rows * g.cols);
      const counts = new Map<number, number>();
      for (const c of cards) counts.set(c.pairId, (counts.get(c.pairId) ?? 0) + 1);
      expect([...counts.values()].every((n) => n === 2)).toBe(true);
      expect(counts.size).toBe(g.pairs);
      // Same pairId shares one faceKey.
      const byPair = new Map<number, string>();
      for (const c of cards) {
        if (byPair.has(c.pairId)) expect(byPair.get(c.pairId)).toBe(c.faceKey);
        else byPair.set(c.pairId, c.faceKey);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(buildBoard(3, () => 0.2)).toEqual(buildBoard(3, () => 0.2));
  });
});

describe('starsForFlips', () => {
  it('gives 3 stars for a perfect run and never below 1', () => {
    expect(starsForFlips(2, 2)).toBe(3); // perfect: pairs flips
    expect(starsForFlips(999, 6)).toBeGreaterThanOrEqual(1);
  });
  it('is monotone non-increasing as flips grow', () => {
    let prev = 3;
    for (let f = 6; f <= 30; f++) {
      const s = starsForFlips(f, 6);
      expect(s).toBeLessThanOrEqual(prev);
      expect(s).toBeGreaterThanOrEqual(1);
      prev = s;
    }
  });
});
