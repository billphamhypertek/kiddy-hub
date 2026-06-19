export type Rng = () => number;

export interface Piece {
  id: number;
  row: number;
  col: number;
}

export interface GridSpec {
  rows: number;
  cols: number;
}

export function gridForLevel(level: number): GridSpec {
  if (level <= 1) return { rows: 2, cols: 2 };
  if (level === 2) return { rows: 2, cols: 3 };
  return { rows: 3, cols: 3 };
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** One piece per cell, returned in shuffled tray order. */
export function sliceGrid(level: number, rng: Rng): Piece[] {
  const { rows, cols } = gridForLevel(level);
  const pieces: Piece[] = [];
  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) pieces.push({ id: id++, row: r, col: c });
  }
  return shuffle(pieces, rng);
}

export function isCorrectDrop(piece: Piece, targetRow: number, targetCol: number): boolean {
  return piece.row === targetRow && piece.col === targetCol;
}

/** 0 wrong drops -> 3 stars, <=2 -> 2, else 1. Monotone non-increasing; never 0. */
export function starsForMisplacements(misses: number): number {
  if (misses <= 0) return 3;
  if (misses <= 2) return 2;
  return 1;
}
