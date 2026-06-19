export const QUESTIONS_PER_GAME = 5;
export const OPTION_COUNT = 3;

export type Rng = () => number;

export interface ColorDef {
  name: string; // English colour name (voiced placeholder)
  hex: number; // Phaser fill colour
}

// Ordered so the first 3 are the "basic" colours used at L1.
export const COLORS: ColorDef[] = [
  { name: 'red', hex: 0xe53935 },
  { name: 'blue', hex: 0x1e88e5 },
  { name: 'yellow', hex: 0xfdd835 },
  { name: 'green', hex: 0x43a047 },
  { name: 'orange', hex: 0xfb8c00 },
  { name: 'purple', hex: 0x8e24aa },
  { name: 'pink', hex: 0xec407a },
  { name: 'black', hex: 0x222222 },
];

export interface ColorsEnRound {
  target: ColorDef;
  options: ColorDef[];
}

export function colorPoolForLevel(level: number): ColorDef[] {
  if (level <= 1) return COLORS.slice(0, 3);
  if (level === 2) return COLORS.slice(0, 6);
  return COLORS;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): ColorsEnRound {
  const pool = colorPoolForLevel(level);
  const target = pick(pool, rng);
  const chosen: ColorDef[] = [target];

  let guard = 0;
  while (chosen.length < OPTION_COUNT && guard++ < 200) {
    const cand = pick(pool, rng);
    if (!chosen.some((c) => c.name === cand.name)) chosen.push(cand);
  }
  for (let i = 0; chosen.length < OPTION_COUNT; i++) {
    const cand = pool[i % pool.length];
    if (!chosen.some((c) => c.name === cand.name)) chosen.push(cand);
  }

  return { target, options: chosen };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
