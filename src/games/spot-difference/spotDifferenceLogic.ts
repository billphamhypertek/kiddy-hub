/**
 * KiddyHub — "Tìm Điểm Khác" (spot-the-difference) pure logic.
 *
 * Game #10 (group 🧠 Trí nhớ & Quan sát, skill "Quan sát chi tiết"). Two copies
 * of ONE richly-detailed SVG garden scene are shown side by side; the right copy
 * has N details changed. This module owns the framework-agnostic part: the
 * catalog of candidate difference-spots and the seeded selection of N of them.
 *
 * All randomness is injected via `Rng` so rounds are deterministic & testable.
 * Coordinates in the catalog are expressed in the changed image's own 0..100
 * design viewBox; the scene maps them onto the rendered image at display time.
 */
export type Rng = () => number;

/** How the right-hand copy differs from the left for a given spot. */
export type DifferenceKind = 'removed' | 'recolored' | 'moved' | 'resized';

/** One candidate difference: a stable id, the kind of change, and a circular
 *  tap region (centre x/y + radius) in the changed image's 0..100 viewBox. */
export interface DifferenceSpot {
  id: string;
  kind: DifferenceKind;
  x: number;
  y: number;
  radius: number;
}

/** Number of rounds in one play session. */
export const ROUNDS_PER_GAME = 3;

/**
 * The ~8 candidate difference-spots for the fox's garden scene. Each id is also
 * the toggle key `buildScene()` reads to render the "changed" variant of that
 * part. The four kinds are all represented (see DifferenceKind). Tap regions are
 * generous (kid-friendly) and sit over the changed element in the right image.
 */
export const DIFFERENCE_CATALOG: DifferenceSpot[] = [
  { id: 'sun', kind: 'resized', x: 80, y: 18, radius: 14 }, // sun is bigger on the right
  { id: 'cloud', kind: 'moved', x: 36, y: 16, radius: 14 }, // cloud drifts sideways (x straddles both positions)
  { id: 'butterfly', kind: 'removed', x: 64, y: 40, radius: 12 }, // butterfly gone
  { id: 'apple', kind: 'recolored', x: 26, y: 40, radius: 11 }, // apple red → gold
  { id: 'flowerLeft', kind: 'removed', x: 16, y: 80, radius: 12 }, // a flower removed
  { id: 'flowerRight', kind: 'recolored', x: 84, y: 80, radius: 12 }, // flower recoloured
  { id: 'bird', kind: 'moved', x: 54, y: 26, radius: 12 }, // bird moved along the sky (x straddles both positions)
  { id: 'bush', kind: 'resized', x: 70, y: 70, radius: 14 }, // bush smaller on the right
];

/** N differences for a level = 2 + level (L1=3, L2=4, L3=5), capped to catalog. */
export function differenceCountForLevel(level: number): number {
  const n = 2 + Math.max(1, Math.floor(level));
  return Math.min(DIFFERENCE_CATALOG.length, n);
}

/**
 * Pick N distinct difference-spots for one round, seeded by `rng`. Uses a
 * deterministic Fisher–Yates partial shuffle so a fixed rng always yields the
 * same selection, and the result is always exactly N distinct catalog entries.
 */
export function chooseDifferences(level: number, rng: Rng): DifferenceSpot[] {
  const count = differenceCountForLevel(level);
  const pool = [...DIFFERENCE_CATALOG];
  // Partial Fisher–Yates: shuffle the first `count` slots into place.
  for (let i = 0; i < count; i++) {
    const j = i + Math.min(pool.length - 1 - i, Math.floor(rng() * (pool.length - i)));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/** True once every chosen spot's id is present in the `found` set. */
export function allFound(found: Set<string>, chosen: DifferenceSpot[]): boolean {
  return chosen.every((spot) => found.has(spot.id));
}

/** Map rounds-cleared → reward stars (3 when all cleared; gentle floor of 1). */
export function starsForRounds(roundsCleared: number, total: number): number {
  if (roundsCleared >= total) return 3;
  if (roundsCleared >= Math.ceil(total / 2)) return 2;
  return 1;
}
