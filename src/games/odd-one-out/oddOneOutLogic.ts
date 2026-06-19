export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

// Each inner array is one category; an item is "odd" if it belongs to a
// different category than the rest of the displayed set. Every emoji is unique
// across all groups so group membership is unambiguous.
export const GROUPS: string[][] = [
  ['🐱', '🐶', '🐰', '🐯', '🐸', '🐮'], // animals
  ['🍎', '🍌', '🍇', '🍓', '🍑', '🍉'], // fruits
  ['🚗', '🚌', '🚲', '✈️', '🚂', '🚀'], // vehicles
  ['🔨', '✂️', '🔧', '📏', '🖌️', '🔑'], // tools
];

export interface OddRound {
  items: string[];
  oddIndex: number;
}

export function itemCountForLevel(level: number): number {
  if (level <= 1) return 3;
  if (level === 2) return 4;
  return 5;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

function pickDistinctIndex(exclude: number, len: number, rng: Rng): number {
  let idx = Math.min(len - 1, Math.floor(rng() * len));
  let guard = 0;
  while (idx === exclude && guard++ < 50) idx = Math.min(len - 1, Math.floor(rng() * len));
  if (idx === exclude) idx = (exclude + 1) % len; // degenerate-rng safety net
  return idx;
}

export function generateRound(level: number, rng: Rng): OddRound {
  const count = itemCountForLevel(level);
  const mainGroupIdx = Math.min(GROUPS.length - 1, Math.floor(rng() * GROUPS.length));
  const oddGroupIdx = pickDistinctIndex(mainGroupIdx, GROUPS.length, rng);
  const mainGroup = GROUPS[mainGroupIdx];
  const oddGroup = GROUPS[oddGroupIdx];

  // Choose count-1 distinct emoji from the main group.
  const mains = new Set<string>();
  let guard = 0;
  while (mains.size < count - 1 && guard++ < 200) mains.add(pick(mainGroup, rng));
  for (let i = 0; mains.size < count - 1; i++) mains.add(mainGroup[i % mainGroup.length]);

  const odd = pick(oddGroup, rng);
  const items = [...mains, odd]; // odd is last for now
  // Shuffle deterministically (Fisher–Yates with rng) so oddIndex varies.
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const oddIndex = items.indexOf(odd);

  return { items, oddIndex };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
