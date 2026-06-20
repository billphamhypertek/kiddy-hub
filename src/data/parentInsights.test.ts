import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { createProfile } from './profiles';
import { recordItemResult } from './mastery';
import { addStars } from './stars';
import { getWeekKey } from './week';
import { MASTERED_BOX } from './leitner';
import { registerAllGames } from '../games';
import { _clearRegistry } from '../games/registry';
import {
  SKILL_LABEL,
  skillLabel,
  getChildMastery,
  getWeeklyMasteryRecap,
} from './parentInsights';
import type { ItemMastery, SkillId } from './types';

beforeEach(async () => {
  await db.delete();
  await db.open();
  _clearRegistry();
  registerAllGames();
});

const ALL_SKILLS: SkillId[] = [
  'letter-vi',
  'letter-en',
  'number-vi',
  'number-en',
  'word-en',
  'color-en',
  'shape',
  'color-vi',
  'pattern',
  'compare',
  'classify',
  'memory',
  'assemble',
  'observe',
  'quantity',
];

/** Seed a raw mastery row with a chosen box / masteredAt (test-only direct write). */
function seedRow(
  profileId: number,
  skillId: SkillId,
  itemKey: string,
  box: number,
  masteredAt?: number,
): Promise<unknown> {
  const row: ItemMastery = {
    profileId,
    skillId,
    itemKey,
    seenCount: Math.max(1, box),
    correctCount: box,
    box,
    dueAt: 0,
    lastResult: box > 0 ? 'correct' : 'wrong',
    lastSeenAt: masteredAt ?? 0,
    masteredAt,
  };
  return db.itemMastery.add(row);
}

describe('SKILL_LABEL / skillLabel (pure, exhaustive)', () => {
  it('gives every SkillId a non-empty Vietnamese label', () => {
    for (const skill of ALL_SKILLS) {
      const label = SKILL_LABEL[skill];
      expect(label, skill).toBeDefined();
      expect(label.trim().length, skill).toBeGreaterThan(0);
    }
    expect(Object.keys(SKILL_LABEL).sort()).toEqual([...ALL_SKILLS].sort());
  });

  it('keeps the canonical names from the spec', () => {
    expect(SKILL_LABEL['letter-vi']).toBe('Nhận mặt chữ');
    expect(SKILL_LABEL['number-vi']).toBe('Đếm số');
    expect(SKILL_LABEL['word-en']).toBe('Từ vựng tiếng Anh');
  });

  it('does not leak skill codes (-vi/-en) into the human label', () => {
    for (const skill of ALL_SKILLS) {
      expect(SKILL_LABEL[skill], skill).not.toMatch(/-vi|-en/);
    }
  });

  it('skillLabel() returns the mapped label, falling back to the id for unknowns', () => {
    expect(skillLabel('shape')).toBe(SKILL_LABEL['shape']);
    // @ts-expect-error — runtime fallback for an off-union value
    expect(skillLabel('mystery')).toBe('mystery');
  });
});

describe('getChildMastery', () => {
  it('returns [] for a child who has never played', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    expect(await getChildMastery(a)).toEqual([]);
  });

  it('attaches human label, counts, tip and the practice game per skill', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    // number-vi: '1' practice-next (box 0), '2' emerging (box 2)
    await seedRow(a, 'number-vi', '1', 0);
    await seedRow(a, 'number-vi', '2', 2);

    const views = await getChildMastery(a);
    const num = views.find((v) => v.skillId === 'number-vi')!;
    expect(num.label).toBe('Đếm số');
    expect(num.practiceCount).toBe(1);
    expect(num.emergingCount).toBe(1);
    expect(num.masteredCount).toBe(0);
    expect(num.total).toBe(2);
    expect(num.status).toBe('practice-next'); // any practice-next wins
    expect(num.practiceGameId).toBe('counting-fun'); // only when practice-next
    expect(num.tip.length).toBeGreaterThan(0); // tip attached on practice-next
  });

  it('computes the overall status with priority practice-next > emerging > mastered', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    // skill that is fully mastered
    await seedRow(a, 'letter-vi', 'A', MASTERED_BOX, 1000);
    await seedRow(a, 'letter-vi', 'B', MASTERED_BOX + 1, 1000);
    // skill that is only emerging (no mastered, no practice-next)
    await seedRow(a, 'shape', 'circle', 2);

    const views = await getChildMastery(a);
    expect(views.find((v) => v.skillId === 'letter-vi')!.status).toBe('mastered');
    expect(views.find((v) => v.skillId === 'shape')!.status).toBe('emerging');
  });

  it('sorts practice-next first, then emerging, then mastered', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await seedRow(a, 'letter-vi', 'A', MASTERED_BOX, 1000); // mastered
    await seedRow(a, 'shape', 'circle', 2); // emerging
    await seedRow(a, 'number-vi', '1', 0); // practice-next

    const statuses = (await getChildMastery(a)).map((v) => v.status);
    expect(statuses).toEqual(['practice-next', 'emerging', 'mastered']);
  });

  it('only attaches practiceGameId on practice-next skills, but tip on practice-next + mastered', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await seedRow(a, 'letter-vi', 'A', MASTERED_BOX, 1000); // mastered
    await seedRow(a, 'shape', 'circle', 2); // emerging

    const views = await getChildMastery(a);
    const mastered = views.find((v) => v.skillId === 'letter-vi')!;
    const emerging = views.find((v) => v.skillId === 'shape')!;

    expect(mastered.practiceGameId).toBeUndefined(); // not practice-next
    expect(mastered.tip.length).toBeGreaterThan(0); // mastered gets a tip
    expect(emerging.tip).toBe(''); // emerging is kept tidy (no tip)
  });

  it('exposes a stable game title for the practice game when available', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await seedRow(a, 'number-vi', '1', 0);
    const num = (await getChildMastery(a)).find((v) => v.skillId === 'number-vi')!;
    expect(num.practiceGameTitle).toBe('Đếm Vui');
  });

  it('skips skills with no data (total === 0)', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await seedRow(a, 'number-vi', '1', 0);
    const views = await getChildMastery(a);
    expect(views.every((v) => v.total > 0)).toBe(true);
    expect(views.map((v) => v.skillId)).toEqual(['number-vi']);
  });
});

describe('getWeeklyMasteryRecap', () => {
  it('counts only items mastered within the given week', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const thisWeek = getWeekKey(new Date());
    const now = Date.now();
    const lastWeekTs = now - 8 * 24 * 3_600_000;

    // mastered THIS week
    await seedRow(a, 'letter-vi', 'A', MASTERED_BOX, now);
    await seedRow(a, 'letter-vi', 'B', MASTERED_BOX, now);
    // mastered LAST week — must NOT count
    await seedRow(a, 'number-vi', '1', MASTERED_BOX, lastWeekTs);
    // not mastered at all — must NOT count
    await seedRow(a, 'shape', 'circle', 1);

    const recap = await getWeeklyMasteryRecap(a, thisWeek);
    expect(recap.weekKey).toBe(thisWeek);
    expect(recap.newlyMasteredCount).toBe(2);
    expect(recap.newlyMastered.map((m) => m.itemKey).sort()).toEqual(['A', 'B']);
    expect(recap.newlyMastered.every((m) => m.skillId === 'letter-vi')).toBe(true);
    expect(recap.newlyMastered[0].label).toBe('Nhận mặt chữ');
  });

  it('reports the weekly stars from getWeeklyStars', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await addStars(a, 3);
    await addStars(a, 2);
    const recap = await getWeeklyMasteryRecap(a, getWeekKey(new Date()));
    expect(recap.stars).toBe(5);
  });

  it('picks the topSkill with the most newly-mastered items this week', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const now = Date.now();
    await seedRow(a, 'letter-vi', 'A', MASTERED_BOX, now);
    await seedRow(a, 'letter-vi', 'B', MASTERED_BOX, now);
    await seedRow(a, 'number-vi', '1', MASTERED_BOX, now);
    const recap = await getWeeklyMasteryRecap(a, getWeekKey(new Date()));
    expect(recap.topSkill?.skillId).toBe('letter-vi');
    expect(recap.topSkill?.label).toBe('Nhận mặt chữ');
  });

  it('returns an empty recap (0 mastered, 0 stars) for a fresh child without throwing', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const recap = await getWeeklyMasteryRecap(a);
    expect(recap.newlyMasteredCount).toBe(0);
    expect(recap.newlyMastered).toEqual([]);
    expect(recap.stars).toBe(0);
    expect(recap.topSkill).toBeUndefined();
  });

  it('scopes the recap to the requested profile only', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const b = await createProfile({ name: 'Bo', avatarKey: 'dog' });
    const now = Date.now();
    await seedRow(a, 'letter-vi', 'A', MASTERED_BOX, now);
    await seedRow(b, 'number-vi', '1', MASTERED_BOX, now);
    const recap = await getWeeklyMasteryRecap(a, getWeekKey(new Date()));
    expect(recap.newlyMasteredCount).toBe(1);
    expect(recap.newlyMastered[0].skillId).toBe('letter-vi');
  });
});

describe('read-only guarantee (regression guard)', () => {
  it('does not mutate itemMastery when reading insights', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await recordItemResult(a, 'number-vi', '3', true, Date.now());
    const before = await db.itemMastery.where('profileId').equals(a).toArray();

    await getChildMastery(a);
    await getWeeklyMasteryRecap(a);

    const after = await db.itemMastery.where('profileId').equals(a).toArray();
    expect(after).toEqual(before);
  });
});
