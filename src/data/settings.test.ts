import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { getSettings, updateSettings } from './settings';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('settings repository', () => {
  it('returns sensible defaults when nothing is stored', async () => {
    const s = await getSettings();
    expect(s).toEqual({ id: 'app', soundOn: true, voiceOn: true, language: 'vi' });
  });

  it('persists partial updates', async () => {
    await updateSettings({ soundOn: false });
    const s = await getSettings();
    expect(s.soundOn).toBe(false);
    expect(s.voiceOn).toBe(true);
  });
});
