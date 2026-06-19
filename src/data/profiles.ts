import { db } from './db';
import type { Profile } from './types';

export function createProfile(data: Omit<Profile, 'id' | 'createdAt'>): Promise<number> {
  return db.profiles.add({ ...data, createdAt: Date.now() });
}

export function listProfiles(): Promise<Profile[]> {
  return db.profiles.orderBy('createdAt').toArray();
}

export function getProfile(id: number): Promise<Profile | undefined> {
  return db.profiles.get(id);
}

export async function updateProfile(id: number, changes: Partial<Profile>): Promise<void> {
  await db.profiles.update(id, changes);
}

export async function deleteProfile(id: number): Promise<void> {
  await db.transaction('rw', db.profiles, db.progress, db.starEvents, async () => {
    await db.profiles.delete(id);
    await db.progress.where('profileId').equals(id).delete();
    await db.starEvents.where('profileId').equals(id).delete();
  });
}
