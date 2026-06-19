import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { createProfile } from './profiles';
import {
  itemsForStars,
  addStars,
  getGarden,
  getWeeklyStars,
  getWeeklyTally,
} from './stars';
import { getWeekKey } from './week';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('itemsForStars (pure)', () => {
  it('unlocks nothing below the first milestone', () => {
    expect(itemsForStars(4)).toEqual([]);
  });
  it('unlocks cumulative items as stars grow', () => {
    expect(itemsForStars(5)).toEqual(['flower']);
    expect(itemsForStars(30)).toEqual(['flower', 'bush', 'tree']);
  });
});

describe('stars + garden repository', () => {
  it('accumulates total stars into the shared garden', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const b = await createProfile({ name: 'Bo', avatarKey: 'dog' });
    await addStars(a, 3);
    await addStars(b, 2);
    const garden = await getGarden();
    expect(garden.totalStars).toBe(5);
    expect(garden.grownItems).toEqual(['flower']);
  });

  it('tracks weekly stars per child', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await addStars(a, 3);
    await addStars(a, 1);
    expect(await getWeeklyStars(a)).toBe(4);
  });

  it('ignores stars from other weeks in the weekly total', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await db.starEvents.add({ profileId: a, amount: 9, earnedAt: 0, weekKey: '1999-W01' });
    await addStars(a, 2);
    expect(await getWeeklyStars(a, getWeekKey(new Date()))).toBe(2);
  });

  it('builds a weekly tally sorted by stars desc with names', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const b = await createProfile({ name: 'Bo', avatarKey: 'dog' });
    await addStars(a, 2);
    await addStars(b, 5);
    const tally = await getWeeklyTally();
    expect(tally).toEqual([
      { profileId: b, name: 'Bo', stars: 5 },
      { profileId: a, name: 'Na', stars: 2 },
    ]);
  });
});
