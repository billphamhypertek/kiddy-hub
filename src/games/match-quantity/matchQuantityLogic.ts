export type Rng = () => number;

export const EMOJI: string[] = ['🍎', '⭐', '🐰', '🌸', '🚗', '🐟', '🎈', '🍌'];

export interface QuantityPair {
  value: number;
  emoji: string;
}

export interface MatchQuantityRound {
  pairs: QuantityPair[];
  tileOrder: number[]; // permutation of [0..pairs.length-1]
}

export function pairCountForLevel(level: number): number {
  if (level <= 1) return 2;
  if (level === 2) return 3;
  return 4;
}

export function maxValueForLevel(level: number): number {
  if (level <= 1) return 3;
  if (level === 2) return 5;
  return 10;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): MatchQuantityRound {
  const n = pairCountForLevel(level);
  const max = maxValueForLevel(level);

  // Distinct values in 1..max.
  const values = new Set<number>();
  let guard = 0;
  while (values.size < n && guard++ < 200) values.add(1 + Math.floor(rng() * max));
  for (let v = 1; values.size < n; v++) values.add(((v - 1) % max) + 1);
  const valueList = [...values];

  const pairs: QuantityPair[] = valueList.map((value) => ({ value, emoji: pick(EMOJI, rng) }));

  // tileOrder: shuffle [0..n-1] deterministically (Fisher–Yates with rng).
  const tileOrder = Array.from({ length: n }, (_, k) => k);
  for (let i = tileOrder.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [tileOrder[i], tileOrder[j]] = [tileOrder[j], tileOrder[i]];
  }

  return { pairs, tileOrder };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
