import { db } from './db';
import { getWeekKey } from './week';
import type { Garden } from './types';

export const GARDEN_MILESTONES: { stars: number; item: string }[] = [
  { stars: 5, item: 'flower' },
  { stars: 15, item: 'bush' },
  { stars: 30, item: 'tree' },
  { stars: 50, item: 'rabbit' },
  { stars: 80, item: 'pond' },
  { stars: 120, item: 'butterflies' },
];

/**
 * GĐ5 D2 — mastery-driven garden growth (decision #2, ADDITIVE). The family
 * Vườn sao grows from REAL mastery milestones (box ≥ MASTERED_BOX totals) in
 * ADDITION to the star-count growth above — never replacing it. These item keys
 * are DISJOINT from GARDEN_MILESTONES so the two growth tracks never collide,
 * and both unions accumulate (a planted item is never removed).
 */
export const GARDEN_MASTERY_MILESTONES: { mastered: number; item: string }[] = [
  { mastered: 3, item: 'sprout' },
  { mastered: 8, item: 'mushroom' },
  { mastered: 15, item: 'birdhouse' },
];

/** Cumulative garden items unlocked at a given total star count. */
export function itemsForStars(totalStars: number): string[] {
  return GARDEN_MILESTONES.filter((m) => totalStars >= m.stars).map((m) => m.item);
}

/** Cumulative garden items unlocked at a given total mastered-item count. */
export function gardenItemsForMastery(totalMastered: number): string[] {
  return GARDEN_MASTERY_MILESTONES.filter((m) => totalMastered >= m.mastered).map((m) => m.item);
}

/** Union helper: keep existing grown items, add new ones, stable de-dup order. */
function unionItems(existing: string[], extra: string[]): string[] {
  const out = [...existing];
  for (const item of extra) if (!out.includes(item)) out.push(item);
  return out;
}

const EMPTY_GARDEN: Garden = { id: 'family', totalStars: 0, grownItems: [] };

export function getGarden(): Promise<Garden> {
  return db.garden.get('family').then((g) => g ?? EMPTY_GARDEN);
}

export async function addStars(profileId: number, amount: number): Promise<Garden> {
  const weekKey = getWeekKey(new Date());
  return db.transaction('rw', db.starEvents, db.garden, async () => {
    await db.starEvents.add({ profileId, amount, earnedAt: Date.now(), weekKey });
    const current = (await db.garden.get('family')) ?? EMPTY_GARDEN;
    const total = current.totalStars + amount;
    const next: Garden = {
      id: 'family',
      totalStars: total,
      // UNION (not overwrite): the new star milestones merge into whatever is
      // already grown — including mastery-driven items — so nothing is wiped.
      grownItems: unionItems(current.grownItems, itemsForStars(total)),
    };
    await db.garden.put(next);
    return next;
  });
}

/**
 * GĐ5 D2 — fold mastery-driven growth into the shared garden (ADDITIVE). Reads
 * the current garden, unions in the items earned for `totalMastered`, and writes
 * back WITHOUT changing the star total. Idempotent. Call after a round / when the
 * garden opens (outside the round lifecycle). Read total mastered from B's
 * getMasterySummary upstream.
 */
export async function syncGardenMastery(totalMastered: number): Promise<Garden> {
  return db.transaction('rw', db.garden, async () => {
    const current = (await db.garden.get('family')) ?? EMPTY_GARDEN;
    const next: Garden = {
      id: 'family',
      totalStars: current.totalStars,
      grownItems: unionItems(current.grownItems, gardenItemsForMastery(totalMastered)),
    };
    await db.garden.put(next);
    return next;
  });
}

export async function getWeeklyStars(
  profileId: number,
  weekKey: string = getWeekKey(new Date()),
): Promise<number> {
  const events = await db.starEvents
    .where('profileId')
    .equals(profileId)
    .filter((e) => e.weekKey === weekKey)
    .toArray();
  return events.reduce((sum, e) => sum + e.amount, 0);
}

export async function getWeeklyTally(
  weekKey: string = getWeekKey(new Date()),
): Promise<{ profileId: number; name: string; stars: number }[]> {
  const profiles = await db.profiles.toArray();
  const rows = await Promise.all(
    profiles.map(async (p) => ({
      profileId: p.id!,
      name: p.name,
      stars: await getWeeklyStars(p.id!, weekKey),
    })),
  );
  return rows.sort((x, y) => y.stars - x.stars);
}
