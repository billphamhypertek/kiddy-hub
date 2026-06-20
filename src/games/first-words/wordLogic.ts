export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export interface WordItem {
  word: string;
  emoji: string;
}

// L1 animals, L2 objects, L3 food. UI stays Vietnamese; only words are English.
export const WORD_BANK: Record<1 | 2 | 3, WordItem[]> = {
  1: [
    { word: 'cat', emoji: '🐱' },
    { word: 'dog', emoji: '🐶' },
    { word: 'fish', emoji: '🐟' },
    { word: 'bird', emoji: '🐦' },
    { word: 'bear', emoji: '🐻' },
    { word: 'frog', emoji: '🐸' },
  ],
  2: [
    { word: 'ball', emoji: '⚽' },
    { word: 'car', emoji: '🚗' },
    { word: 'book', emoji: '📖' },
    { word: 'cup', emoji: '☕' },
    { word: 'hat', emoji: '🎩' },
    { word: 'key', emoji: '🔑' },
  ],
  3: [
    { word: 'apple', emoji: '🍎' },
    { word: 'banana', emoji: '🍌' },
    { word: 'cake', emoji: '🍰' },
    { word: 'milk', emoji: '🥛' },
    { word: 'egg', emoji: '🥚' },
    { word: 'bread', emoji: '🍞' },
  ],
};

export interface WordRound {
  target: WordItem;
  options: WordItem[];
}

export function optionCountForLevel(level: number): number {
  return level >= 3 ? 4 : 3;
}

function bankFor(level: number): WordItem[] {
  if (level <= 1) return WORD_BANK[1];
  if (level === 2) return WORD_BANK[2];
  return WORD_BANK[3];
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng, seedTarget?: string): WordRound {
  const bank = bankFor(level);
  // SR seed (§5.5): use the requested word when it is in this level's bank;
  // otherwise pick as before (undefined seed ⇒ byte-identical behaviour).
  const seeded = seedTarget !== undefined ? bank.find((w) => w.word === seedTarget) : undefined;
  const target = seeded ?? pick(bank, rng);
  const size = optionCountForLevel(level);

  const chosen: WordItem[] = [target];
  let guard = 0;
  while (chosen.length < size && guard++ < 200) {
    const cand = pick(bank, rng);
    if (!chosen.some((c) => c.word === cand.word)) chosen.push(cand);
  }
  // Degenerate-rng safety net.
  for (let i = 0; chosen.length < size; i++) {
    const cand = bank[i % bank.length];
    if (!chosen.some((c) => c.word === cand.word)) chosen.push(cand);
  }

  return { target, options: chosen };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
