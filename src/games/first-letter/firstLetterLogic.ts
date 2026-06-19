export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export interface WordEntry {
  emoji: string;
  word: string;
  letter: string;
}

// Words whose first letter is a basic (undiacritised) uppercase letter so the
// initial sound is easy for pre-readers to match.
export const WORD_BANK: WordEntry[] = [
  { emoji: '🐱', word: 'MÈO', letter: 'M' },
  { emoji: '🐶', word: 'CHÓ', letter: 'C' },
  { emoji: '🐟', word: 'CÁ', letter: 'C' },
  { emoji: '🐝', word: 'ONG', letter: 'O' },
  { emoji: '🐘', word: 'VOI', letter: 'V' },
  { emoji: '🐔', word: 'GÀ', letter: 'G' },
  { emoji: '🍌', word: 'CHUỐI', letter: 'C' },
  { emoji: '🌳', word: 'CÂY', letter: 'C' },
  { emoji: '🏠', word: 'NHÀ', letter: 'N' },
  { emoji: '☀️', word: 'TRỜI', letter: 'T' },
  { emoji: '🐦', word: 'CHIM', letter: 'C' },
  { emoji: '🐢', word: 'RÙA', letter: 'R' },
  { emoji: '🍎', word: 'TÁO', letter: 'T' },
  { emoji: '🦆', word: 'VỊT', letter: 'V' },
];

// Distractor pool: every letter that appears as a target, plus a few near letters.
export const LETTER_POOL: string[] = [
  'M', 'C', 'O', 'V', 'G', 'N', 'T', 'R', 'B', 'D', 'H', 'L', 'S', 'X',
];

export interface FirstLetterRound {
  entry: WordEntry;
  options: string[];
}

export function optionCountForLevel(level: number): number {
  return level <= 1 ? 3 : 4;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): FirstLetterRound {
  const entry = pick(WORD_BANK, rng);
  const size = optionCountForLevel(level);
  const options = new Set<string>([entry.letter]);

  let guard = 0;
  while (options.size < size && guard++ < 200) {
    options.add(pick(LETTER_POOL, rng));
  }
  // Degenerate-rng safety net: walk the pool to guarantee enough options.
  for (let i = 0; options.size < size; i++) options.add(LETTER_POOL[i % LETTER_POOL.length]);

  return { entry, options: [...options] };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
