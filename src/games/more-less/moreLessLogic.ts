export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export const EMOJI: string[] = ['🍎', '🍌', '⭐', '🐰', '🌸', '🚗', '🐟', '🎈'];

export interface MoreLessRound {
  leftCount: number;
  rightCount: number;
  want: 'more' | 'less';
  emoji: string;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

/** L1: 1..5, gap >= 2. L2: 1..8, gap >= 1. L3: 1..10, gap >= 1. */
function rangeForLevel(level: number): { max: number; minGap: number } {
  if (level <= 1) return { max: 5, minGap: 2 };
  if (level === 2) return { max: 8, minGap: 1 };
  return { max: 10, minGap: 1 };
}

export function generateRound(level: number, rng: Rng): MoreLessRound {
  const { max, minGap } = rangeForLevel(level);
  const emoji = pick(EMOJI, rng);
  const want: 'more' | 'less' = rng() < 0.5 ? 'more' : 'less';

  let leftCount = 1 + Math.floor(rng() * max); // 1..max
  let rightCount = 1 + Math.floor(rng() * max);
  // Ensure two distinct counts with the required gap, even under a degenerate rng.
  let guard = 0;
  while (Math.abs(leftCount - rightCount) < minGap && guard++ < 100) {
    rightCount = 1 + Math.floor(rng() * max);
  }
  // Degenerate-rng safety net: force a gap deterministically.
  if (Math.abs(leftCount - rightCount) < minGap) {
    leftCount = 1;
    rightCount = Math.min(max, 1 + minGap);
  }

  return { leftCount, rightCount, want, emoji };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
