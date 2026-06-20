import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { createProfile } from './profiles';
import {
  STICKER_MILESTONES,
  unlockedStickers,
  getCollection,
  syncCollection,
} from './collection';
import type { SkillMastery, MasteryBucket } from './mastery';
import type { SkillId } from './types';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

// minimal SkillMastery builder — only the fields the rules read.
function sm(skillId: SkillId, mastered: number, total = mastered): SkillMastery {
  return {
    skillId,
    total,
    mastered: Array.from({ length: mastered }, (_, i) => `${skillId}-${i}`),
    emerging: [],
    practiceNext: [],
    accuracy: 1,
  };
}

describe('STICKER_MILESTONES (finite, completable)', () => {
  it('is a fixed, finite set of about a dozen stickers', () => {
    expect(STICKER_MILESTONES.length).toBeGreaterThanOrEqual(10);
    expect(STICKER_MILESTONES.length).toBeLessThanOrEqual(14);
  });

  it('has unique ids and every sticker carries an art key + label', () => {
    const ids = STICKER_MILESTONES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of STICKER_MILESTONES) {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.art).toBeTruthy();
    }
  });
});

describe('unlockedStickers (pure, mastery-driven)', () => {
  it('unlocks nothing with no mastery (new child)', () => {
    expect(unlockedStickers([])).toEqual([]);
  });

  it('unlocks the first-mastery sticker as soon as one item is mastered', () => {
    const got = unlockedStickers([sm('number-vi', 1)]);
    expect(got).toContain('first-mastery');
  });

  it('respects totalMastered thresholds (5/10/15) cumulatively', () => {
    const at5 = unlockedStickers([sm('number-vi', 3), sm('letter-vi', 2)]);
    expect(at5).toContain('mastered-5');
    expect(at5).not.toContain('mastered-10');

    const at12 = unlockedStickers([sm('number-vi', 6), sm('letter-vi', 6)]);
    expect(at12).toContain('mastered-5');
    expect(at12).toContain('mastered-10');
    expect(at12).not.toContain('mastered-15');
  });

  it('unlocks a skill-specific sticker only when that skill hits its bar', () => {
    const got = unlockedStickers([sm('letter-vi', 5)]);
    expect(got).toContain('letters-5');
    const notYet = unlockedStickers([sm('letter-vi', 4)]);
    expect(notYet).not.toContain('letters-5');
  });

  it('unlocks skillsTouched after enough distinct skills are emerging/mastered', () => {
    const got = unlockedStickers([
      sm('number-vi', 1),
      sm('letter-vi', 1),
      sm('color-vi', 1),
    ]);
    expect(got).toContain('explorer-3');
  });

  it('is order-independent and returns ids only from the fixed set', () => {
    const got = unlockedStickers([sm('letter-vi', 10), sm('number-vi', 10)]);
    const known = new Set(STICKER_MILESTONES.map((s) => s.id));
    for (const id of got) expect(known.has(id)).toBe(true);
  });

  it('never exceeds the sticker ceiling (completable, no infinite grind)', () => {
    const everything: SkillMastery[] = [
      sm('number-vi', 10),
      sm('number-en', 10),
      sm('letter-vi', 29),
      sm('letter-en', 26),
      sm('word-en', 20),
      sm('color-en', 11),
      sm('color-vi', 6),
      sm('shape', 6),
    ];
    const got = unlockedStickers(everything);
    expect(got.length).toBeLessThanOrEqual(STICKER_MILESTONES.length);
  });
});

describe('collection repository (Dexie)', () => {
  it('starts empty for a new child', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    expect(await getCollection(id)).toEqual([]);
  });

  it('syncs newly-earned stickers and returns the freshly-earned ids', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const newly = await syncCollection(id, [sm('number-vi', 1)]);
    expect(newly).toContain('first-mastery');
    const stored = await getCollection(id);
    expect(stored.map((s) => s.stickerId)).toContain('first-mastery');
    expect(stored[0].unlockedAt).toBeGreaterThan(0);
  });

  it('does not re-earn or duplicate an already-owned sticker', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await syncCollection(id, [sm('number-vi', 1)]);
    const secondTime = await syncCollection(id, [sm('number-vi', 2)]);
    // first-mastery was already owned → not reported as newly earned
    expect(secondTime).not.toContain('first-mastery');
    const stored = await getCollection(id);
    const firsts = stored.filter((s) => s.stickerId === 'first-mastery');
    expect(firsts).toHaveLength(1);
  });

  it('keeps collections separate per child', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const b = await createProfile({ name: 'Bo', avatarKey: 'dog' });
    await syncCollection(a, [sm('number-vi', 1)]);
    expect((await getCollection(b)).length).toBe(0);
  });
});

describe('v3 additive bump — old tables survive', () => {
  it('keeps every legacy table after the v3 collection bump', async () => {
    await db.open();
    expect(db.verno).toBe(3);
    const names = db.tables.map((t) => t.name).sort();
    expect(names).toEqual(
      ['collection', 'garden', 'itemMastery', 'profiles', 'progress', 'settings', 'starEvents'].sort(),
    );
  });

  it('reads back legacy data written after the v3 bump (no loss)', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await db.itemMastery.add({
      profileId: id,
      skillId: 'number-vi',
      itemKey: '7',
      seenCount: 1,
      correctCount: 1,
      box: 4,
      dueAt: 1,
      lastResult: 'correct',
      lastSeenAt: 1,
    });
    await db.garden.put({ id: 'family', totalStars: 9, grownItems: ['flower'] });
    db.close();
    await db.open();
    expect((await db.profiles.get(id))?.name).toBe('Na');
    expect((await db.garden.get('family'))?.totalStars).toBe(9);
    expect(
      (await db.itemMastery.where({ profileId: id, skillId: 'number-vi', itemKey: '7' }).first())
        ?.box,
    ).toBe(4);
  });
});

const _bucket: MasteryBucket = 'mastered';
void _bucket;
