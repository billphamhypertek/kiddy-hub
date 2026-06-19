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

/** Cumulative garden items unlocked at a given total star count. */
export function itemsForStars(totalStars: number): string[] {
  return GARDEN_MILESTONES.filter((m) => totalStars >= m.stars).map((m) => m.item);
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
    const next: Garden = {
      id: 'family',
      totalStars: current.totalStars + amount,
      grownItems: itemsForStars(current.totalStars + amount),
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
