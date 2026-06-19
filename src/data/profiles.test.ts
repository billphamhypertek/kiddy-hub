import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import {
  createProfile,
  listProfiles,
  getProfile,
  updateProfile,
  deleteProfile,
} from './profiles';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('profiles repository', () => {
  it('creates and lists profiles in creation order', async () => {
    await createProfile({ name: 'Na', avatarKey: 'cat' });
    await createProfile({ name: 'Bo', avatarKey: 'dog' });
    const all = await listProfiles();
    expect(all.map((p) => p.name)).toEqual(['Na', 'Bo']);
    expect(all[0].id).toBeTypeOf('number');
    expect(all[0].createdAt).toBeTypeOf('number');
  });

  it('gets and updates a profile', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await updateProfile(id, { avatarKey: 'fox' });
    const p = await getProfile(id);
    expect(p?.avatarKey).toBe('fox');
  });

  it('deletes a profile and its related rows', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await db.progress.add({
      profileId: id, gameId: 'counting-fun', level: 1, bestScore: 0, timesPlayed: 1, lastPlayedAt: 0,
    });
    await db.starEvents.add({ profileId: id, amount: 3, earnedAt: 0, weekKey: '2026-W25' });

    await deleteProfile(id);

    expect(await getProfile(id)).toBeUndefined();
    expect(await db.progress.where('profileId').equals(id).count()).toBe(0);
    expect(await db.starEvents.where('profileId').equals(id).count()).toBe(0);
  });
});
