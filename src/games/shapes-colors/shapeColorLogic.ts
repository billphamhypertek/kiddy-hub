export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export type ShapeName = 'circle' | 'square' | 'triangle' | 'star';
export const SHAPES: ShapeName[] = ['circle', 'square', 'triangle', 'star'];

export interface ColorDef {
  name: string; // Vietnamese colour name shown/voiced
  hex: number; // Phaser fill colour
}

export const COLORS: ColorDef[] = [
  { name: 'đỏ', hex: 0xe53935 },
  { name: 'xanh dương', hex: 0x1e88e5 },
  { name: 'vàng', hex: 0xfdd835 },
  { name: 'xanh lá', hex: 0x43a047 },
  { name: 'tím', hex: 0x8e24aa },
  { name: 'cam', hex: 0xfb8c00 },
];

export interface ShapeOption {
  shape: ShapeName;
  color: ColorDef;
}

export type RoundMode = 'shape' | 'color' | 'both';

export interface ShapeColorRound {
  mode: RoundMode;
  targetShape?: ShapeName;
  targetColor?: ColorDef;
  options: ShapeOption[];
  correctIndex: number;
}

export function optionCountForLevel(level: number): number {
  return level <= 1 ? 3 : 4;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

function modeForLevel(level: number, rng: Rng): RoundMode {
  if (level >= 3) return 'both';
  return rng() < 0.5 ? 'shape' : 'color';
}

export function generateRound(level: number, rng: Rng): ShapeColorRound {
  const size = optionCountForLevel(level);
  const mode = modeForLevel(level, rng);
  const targetShape = pick(SHAPES, rng);
  const targetColor = pick(COLORS, rng);

  // Build the correct option first.
  const correct: ShapeOption = { shape: targetShape, color: targetColor };
  const options: ShapeOption[] = [correct];

  // A candidate "matches" the target under the active mode; distractors must NOT.
  const matches = (o: ShapeOption): boolean => {
    if (mode === 'shape') return o.shape === targetShape;
    if (mode === 'color') return o.color.name === targetColor.name;
    return o.shape === targetShape && o.color.name === targetColor.name;
  };

  // Fill distractors deterministically: iterate shape×color combinations until
  // we have `size` options, skipping any that match the target or duplicate
  // an existing option. This is degenerate-rng safe (full deterministic walk).
  const startS = Math.floor(rng() * SHAPES.length);
  const startC = Math.floor(rng() * COLORS.length);
  for (let s = 0; s < SHAPES.length && options.length < size; s++) {
    for (let c = 0; c < COLORS.length && options.length < size; c++) {
      const shape = SHAPES[(startS + s) % SHAPES.length];
      const color = COLORS[(startC + c) % COLORS.length];
      const cand: ShapeOption = { shape, color };
      if (matches(cand)) continue;
      if (options.some((o) => o.shape === cand.shape && o.color.name === cand.color.name)) continue;
      options.push(cand);
    }
  }

  // Shuffle deterministically so the correct option is not always first.
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const correctIndex = options.indexOf(correct);

  return { mode, targetShape, targetColor, options, correctIndex };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
