export const QUESTIONS_PER_GAME = 5;

export const COUNTING_ANIMALS = ['🦆', '🐰', '🐸', '🐝', '🐟', '🦋'];

export type Rng = () => number;

export interface CountingRound {
  count: number;
  animal: string;
  options: number[];
}

export function maxCountForLevel(level: number): number {
  if (level <= 1) return 3;
  if (level === 2) return 5;
  return 10;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng, seedTarget?: number): CountingRound {
  const max = maxCountForLevel(level);
  // SR seed (§5.5): when a target is supplied (and in range) the round is built
  // around it; otherwise behaviour is byte-identical to before (rng picks count).
  const count =
    seedTarget !== undefined && seedTarget >= 1 && seedTarget <= max
      ? seedTarget
      : 1 + Math.floor(rng() * max); // 1..max
  const animal = pick(COUNTING_ANIMALS, rng);

  const options = new Set<number>([count]);
  let guard = 0;
  while (options.size < 3 && guard++ < 100) {
    const candidate = 1 + Math.floor(rng() * max);
    options.add(candidate);
  }
  // Guarantee 3 distinct options even if rng is degenerate.
  for (let v = 1; options.size < 3; v++) options.add(((v - 1) % max) + 1);

  return { count, animal, options: [...options].sort((a, b) => a - b) };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
