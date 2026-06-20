export const QUESTIONS_PER_GAME = 5;
export const OPTION_COUNT = 3;

export type Rng = () => number;

export const NUMBER_WORDS: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
};

export interface NumbersEnRound {
  target: number;
  word: string;
  options: number[];
}

export function maxNumberForLevel(level: number): number {
  if (level <= 1) return 5;
  if (level === 2) return 8;
  return 10;
}

export function generateRound(level: number, rng: Rng, seedTarget?: number): NumbersEnRound {
  const max = maxNumberForLevel(level);
  // SR seed (§5.5): build the round around the requested number when in range;
  // otherwise pick as before (undefined seed ⇒ byte-identical behaviour).
  const target =
    seedTarget !== undefined && seedTarget >= 1 && seedTarget <= max
      ? seedTarget
      : 1 + Math.floor(rng() * max); // 1..max
  const options = new Set<number>([target]);

  let guard = 0;
  while (options.size < OPTION_COUNT && guard++ < 100) options.add(1 + Math.floor(rng() * max));
  for (let v = 1; options.size < OPTION_COUNT; v++) options.add(((v - 1) % max) + 1);

  return {
    target,
    word: NUMBER_WORDS[target],
    options: [...options].sort((a, b) => a - b),
  };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
