import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { createProfile } from './profiles';
import {
  GARDEN_MASTERY_MILESTONES,
  gardenItemsForMastery,
  itemsForStars,
  addStars,
  getGarden,
  syncGardenMastery,
} from './stars';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('gardenItemsForMastery (pure, additive)', () => {
  it('unlocks nothing below the first mastery milestone', () => {
    expect(gardenItemsForMastery(0)).toEqual([]);
  });

  it('unlocks cumulative mastery growth items as mastery grows', () => {
    const first = GARDEN_MASTERY_MILESTONES[0];
    expect(gardenItemsForMastery(first.mastered)).toContain(first.item);
  });

  it('its items are DISJOINT from the star-count milestones (additive, no clash)', () => {
    const starItems = new Set(itemsForStars(99999));
    for (const m of GARDEN_MASTERY_MILESTONES) {
      expect(starItems.has(m.item)).toBe(false);
    }
  });
});

describe('addStars preserves mastery-grown items (union, not overwrite)', () => {
  it('does not wipe a mastery item when stars are later added', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    // mastery growth lands a sprout even with zero stars
    await syncGardenMastery(GARDEN_MASTERY_MILESTONES[0].mastered);
    const masteryItem = GARDEN_MASTERY_MILESTONES[0].item;
    expect((await getGarden()).grownItems).toContain(masteryItem);
    // adding stars must keep the mastery item AND add the star item
    await addStars(id, 6); // crosses the 5-star "flower"
    const g = await getGarden();
    expect(g.grownItems).toContain('flower');
    expect(g.grownItems).toContain(masteryItem);
  });

  it('still unlocks star milestones exactly as before (existing behaviour intact)', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await addStars(id, 5);
    const g = await getGarden();
    expect(g.totalStars).toBe(5);
    expect(g.grownItems).toContain('flower');
  });
});

describe('syncGardenMastery (repo, additive)', () => {
  it('adds mastery items into the shared family garden without touching star total', async () => {
    const before = await getGarden();
    expect(before.totalStars).toBe(0);
    const g = await syncGardenMastery(GARDEN_MASTERY_MILESTONES[0].mastered);
    expect(g.totalStars).toBe(0);
    expect(g.grownItems).toContain(GARDEN_MASTERY_MILESTONES[0].item);
  });

  it('is idempotent — re-syncing the same mastery does not duplicate items', async () => {
    await syncGardenMastery(GARDEN_MASTERY_MILESTONES[0].mastered);
    const g = await syncGardenMastery(GARDEN_MASTERY_MILESTONES[0].mastered);
    const counts = g.grownItems.filter((i) => i === GARDEN_MASTERY_MILESTONES[0].item);
    expect(counts).toHaveLength(1);
  });
});
