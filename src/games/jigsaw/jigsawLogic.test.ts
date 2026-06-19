import { describe, it, expect } from 'vitest';
import { gridForLevel, sliceGrid, isCorrectDrop, starsForMisplacements } from './jigsawLogic';

describe('gridForLevel', () => {
  it('grows the grid per level', () => {
    expect(gridForLevel(1)).toEqual({ rows: 2, cols: 2 });
    expect(gridForLevel(2)).toEqual({ rows: 2, cols: 3 });
    expect(gridForLevel(3)).toEqual({ rows: 3, cols: 3 });
  });
});

describe('sliceGrid', () => {
  it('returns rows*cols pieces, one per (row,col) cell', () => {
    for (const lvl of [1, 2, 3]) {
      const { rows, cols } = gridForLevel(lvl);
      const pieces = sliceGrid(lvl, () => 0.4);
      expect(pieces).toHaveLength(rows * cols);
      const seen = new Set(pieces.map((p) => `${p.row},${p.col}`));
      expect(seen.size).toBe(rows * cols);
      for (const p of pieces) {
        expect(p.row).toBeGreaterThanOrEqual(0);
        expect(p.row).toBeLessThan(rows);
        expect(p.col).toBeGreaterThanOrEqual(0);
        expect(p.col).toBeLessThan(cols);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(sliceGrid(3, () => 0.7)).toEqual(sliceGrid(3, () => 0.7));
  });
});

describe('isCorrectDrop', () => {
  it('is true only when the piece lands on its own cell', () => {
    const piece = { id: 0, row: 1, col: 2 };
    expect(isCorrectDrop(piece, 1, 2)).toBe(true);
    expect(isCorrectDrop(piece, 0, 2)).toBe(false);
    expect(isCorrectDrop(piece, 1, 1)).toBe(false);
  });
});

describe('starsForMisplacements', () => {
  it('gives 3 for a clean solve and is monotone non-increasing, never 0', () => {
    expect(starsForMisplacements(0)).toBe(3);
    let prev = 3;
    for (let m = 0; m <= 12; m++) {
      const s = starsForMisplacements(m);
      expect(s).toBeLessThanOrEqual(prev);
      expect(s).toBeGreaterThanOrEqual(1);
      prev = s;
    }
  });
});
