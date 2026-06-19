export type Rng = () => number;

export interface Card {
  id: number;
  faceKey: string;
  pairId: number;
}

export interface GridSpec {
  rows: number;
  cols: number;
  pairs: number;
}

const FACES = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐸', '🐯', '🐵'];

export function gridForLevel(level: number): GridSpec {
  if (level <= 1) return { rows: 2, cols: 2, pairs: 2 };
  if (level === 2) return { rows: 3, cols: 2, pairs: 3 };
  return { rows: 4, cols: 3, pairs: 6 };
}

/** Fisher–Yates shuffle using an injected rng (deterministic in tests). */
function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildBoard(level: number, rng: Rng): Card[] {
  const { pairs } = gridForLevel(level);
  const cards: Card[] = [];
  let id = 0;
  for (let p = 0; p < pairs; p++) {
    const faceKey = FACES[p % FACES.length];
    cards.push({ id: id++, faceKey, pairId: p });
    cards.push({ id: id++, faceKey, pairId: p });
  }
  return shuffle(cards, rng);
}

/**
 * Stars by how many flip-pairs were used. Minimum possible = `pairs`
 * (every flip a match). Allowance: up to ~1.5x the minimum -> 3 stars,
 * up to ~2.5x -> 2 stars, else 1. Monotone non-increasing; never 0.
 */
export function starsForFlips(flips: number, pairs: number): number {
  if (flips <= pairs * 1.5) return 3;
  if (flips <= pairs * 2.5) return 2;
  return 1;
}
