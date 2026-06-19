import { db } from './db';
import type { Progress } from './types';

export function getProgress(profileId: number, gameId: string): Promise<Progress | undefined> {
  return db.progress.where({ profileId, gameId }).first();
}

export async function recordPlay(
  profileId: number,
  gameId: string,
  level: number,
  score: number,
): Promise<void> {
  const existing = await getProgress(profileId, gameId);
  if (existing) {
    await db.progress.update(existing.id!, {
      level: Math.max(existing.level, level),
      bestScore: Math.max(existing.bestScore, score),
      timesPlayed: existing.timesPlayed + 1,
      lastPlayedAt: Date.now(),
    });
  } else {
    await db.progress.add({
      profileId,
      gameId,
      level,
      bestScore: score,
      timesPlayed: 1,
      lastPlayedAt: Date.now(),
    });
  }
}
