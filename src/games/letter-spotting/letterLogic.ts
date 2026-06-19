export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

// Uppercase letters used for pre-readers, including Vietnamese diacritics.
export const LETTERS: string[] = [
  'A',
  'Ă',
  'Â',
  'B',
  'C',
  'D',
  'Đ',
  'E',
  'Ê',
  'G',
  'H',
  'I',
  'K',
  'L',
  'M',
  'N',
  'O',
  'Ô',
  'Ơ',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'Ư',
  'V',
  'X',
  'Y',
];

// Look-alike groups: at higher levels we prefer distractors from the same
// group as the target to make discrimination harder.
const CONFUSABLES: string[][] = [
  ['O', 'Ô', 'Ơ', 'Q'],
  ['E', 'Ê'],
  ['U', 'Ư', 'V'],
  ['A', 'Ă', 'Â'],
  ['P', 'R'],
  ['M', 'N'],
  ['C', 'G'],
  ['I', 'Y'],
];

export interface LetterRound {
  target: string;
  options: string[];
}

export function optionCountForLevel(level: number): number {
  if (level <= 1) return 3;
  if (level === 2) return 4;
  return 5;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): LetterRound {
  const target = pick(LETTERS, rng);
  const options = new Set<string>([target]);
  const size = optionCountForLevel(level);

  // From level 2 up, seed a few look-alike distractors when the target has any.
  if (level >= 2) {
    const group = CONFUSABLES.find((g) => g.includes(target)) ?? [];
    const lookAlikes = group.filter((c) => c !== target);
    let guard = 0;
    while (options.size < size && lookAlikes.length > 0 && guard++ < 50) {
      options.add(pick(lookAlikes, rng));
    }
  }

  // Fill the rest with random distinct letters.
  let guard = 0;
  while (options.size < size && guard++ < 200) {
    options.add(pick(LETTERS, rng));
  }
  // Degenerate-rng safety net: walk LETTERS to guarantee enough options.
  for (let i = 0; options.size < size; i++) options.add(LETTERS[i % LETTERS.length]);

  return { target, options: [...options] };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
