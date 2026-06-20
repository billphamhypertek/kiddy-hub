import { NO_REDUCTION } from './masterySession';

/**
 * Pure scaffolding decision (GĐ5B §9): on a wrong FIRST try, which option indices
 * should be dimmed+disabled so that exactly `keepN` options remain — the correct
 * answer plus (keepN-1) distractors — while NEVER removing any game object.
 *
 * `keepN` comes from `host.hint?.(skill,item)` = `session.hintFor(...)`:
 *   - a finite number (e.g. SCAFFOLD_KEEP=2) → reduce the visible choices, OR
 *   - NO_REDUCTION (Infinity) → scaffold has faded (box ≥ 2): dim nothing.
 *
 * Returns the indices to dim. The correct option is always kept. We keep the
 * LOWEST-indexed distractors (deterministic, layout-stable) and dim the rest.
 *
 * Returns [] when there is nothing to do (keepN ≥ total, or scaffold faded, or
 * an invalid correctIndex) — callers should treat [] as "leave the round as is".
 */
export function distractorsToDim(
  total: number,
  correctIndex: number,
  keepN: number,
): number[] {
  if (!Number.isFinite(keepN)) return []; // NO_REDUCTION → no scaffold
  if (correctIndex < 0 || correctIndex >= total) return [];
  const keep = Math.max(2, Math.floor(keepN)); // never collapse below 2 visible
  if (keep >= total) return [];

  const dim: number[] = [];
  const kept = new Set<number>([correctIndex]);
  // Keep the lowest-indexed distractors until we have `keep` visible, dim the rest.
  for (let i = 0; i < total && kept.size < keep; i++) {
    if (i !== correctIndex) kept.add(i);
  }
  for (let i = 0; i < total; i++) {
    if (!kept.has(i)) dim.push(i);
  }
  return dim;
}

/** Convenience: does this keepN value call for any reduction at all? */
export function scaffoldReduces(keepN: number, total: number): boolean {
  return keepN !== NO_REDUCTION && distractorsToDim(total, 0, keepN).length > 0;
}
