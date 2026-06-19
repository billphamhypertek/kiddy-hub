import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { recordPlay, getProgress } from './progress';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('progress repository', () => {
  it('creates a progress row on first play', async () => {
    await recordPlay(1, 'counting-fun', 1, 4);
    const p = await getProgress(1, 'counting-fun');
    expect(p?.timesPlayed).toBe(1);
    expect(p?.bestScore).toBe(4);
    expect(p?.level).toBe(1);
  });

  it('keeps best level/score and increments play count', async () => {
    await recordPlay(1, 'counting-fun', 1, 4);
    await recordPlay(1, 'counting-fun', 2, 2);
    const p = await getProgress(1, 'counting-fun');
    expect(p?.timesPlayed).toBe(2);
    expect(p?.bestScore).toBe(4); // 4 > 2
    expect(p?.level).toBe(2); // 2 > 1
  });
});
