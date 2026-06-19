export type Rng = () => number;

export interface SortGroup {
  label: string; // emoji representing the basket
  items: string[]; // distinct emoji belonging to this group
}

export const GROUPS: SortGroup[] = [
  { label: '🐾', items: ['🐱', '🐶', '🐰', '🐯', '🐸', '🐮'] }, // animals
  { label: '🍽️', items: ['🍎', '🍌', '🍇', '🍓', '🍑', '🍉'] }, // fruits
  { label: '🚦', items: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚀'] }, // vehicles
];

export interface SortingBasket {
  label: string;
}

export interface PileItem {
  emoji: string;
  basketIndex: number;
}

export interface SortingRound {
  baskets: SortingBasket[];
  pile: PileItem[];
  pileOrder: number[]; // permutation of [0..pile.length-1]
}

export function basketCountForLevel(level: number): number {
  return level >= 3 ? 3 : 2;
}

export function itemsPerBasketForLevel(level: number): number {
  return level === 2 ? 3 : 2;
}

function pickDistinctIndices(count: number, len: number, rng: Rng): number[] {
  const chosen = new Set<number>();
  let guard = 0;
  while (chosen.size < count && guard++ < 200) chosen.add(Math.min(len - 1, Math.floor(rng() * len)));
  for (let i = 0; chosen.size < count; i++) chosen.add(i % len);
  return [...chosen];
}

export function generateRound(level: number, rng: Rng): SortingRound {
  const basketCount = basketCountForLevel(level);
  const per = itemsPerBasketForLevel(level);

  const groupIdxs = pickDistinctIndices(basketCount, GROUPS.length, rng);
  const baskets: SortingBasket[] = groupIdxs.map((gi) => ({ label: GROUPS[gi].label }));

  const pile: PileItem[] = [];
  groupIdxs.forEach((gi, basketIndex) => {
    const itemIdxs = pickDistinctIndices(per, GROUPS[gi].items.length, rng);
    for (const ii of itemIdxs) pile.push({ emoji: GROUPS[gi].items[ii], basketIndex });
  });

  // pileOrder: shuffle [0..pile.length-1] deterministically.
  const pileOrder = Array.from({ length: pile.length }, (_, k) => k);
  for (let i = pileOrder.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [pileOrder[i], pileOrder[j]] = [pileOrder[j], pileOrder[i]];
  }

  return { baskets, pile, pileOrder };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
