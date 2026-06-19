export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export const ALPHABET: string[] = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i),
);

export interface AbcRound {
  target: string;
  options: string[];
}

export function letterPoolForLevel(level: number): string[] {
  if (level <= 1) return ALPHABET.slice(0, 7); // A..G
  if (level === 2) return ALPHABET.slice(0, 14); // A..N
  return ALPHABET; // A..Z
}

export function optionCountForLevel(level: number): number {
  return level <= 1 ? 3 : 4;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): AbcRound {
  const pool = letterPoolForLevel(level);
  const target = pick(pool, rng);
  const size = optionCountForLevel(level);
  const options = new Set<string>([target]);

  let guard = 0;
  while (options.size < size && guard++ < 200) options.add(pick(pool, rng));
  for (let i = 0; options.size < size; i++) options.add(pool[i % pool.length]);

  return { target, options: [...options] };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
