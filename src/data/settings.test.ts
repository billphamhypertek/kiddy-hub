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
    expect(s).toEqual({
      id: 'app',
      soundOn: true,
      voiceOn: true,
      language: 'vi',
      calmMode: false,
    });
  });

  it('persists partial updates', async () => {
    await updateSettings({ soundOn: false });
    const s = await getSettings();
    expect(s.soundOn).toBe(false);
    expect(s.voiceOn).toBe(true);
  });

  // GĐ5E1 — "Chế độ êm" flag is additive and persists like the other toggles.
  it('defaults calmMode to false and persists toggling it on', async () => {
    expect((await getSettings()).calmMode).toBe(false);
    await updateSettings({ calmMode: true });
    expect((await getSettings()).calmMode).toBe(true);
  });

  it('back-fills calmMode for a row stored before the flag existed', async () => {
    // Simulate an older persisted row that predates the calmMode field.
    await db.settings.put({
      id: 'app',
      soundOn: false,
      voiceOn: true,
      language: 'vi',
    } as never);
    const s = await getSettings();
    expect(s.calmMode).toBe(false);
    expect(s.soundOn).toBe(false);
  });
});
