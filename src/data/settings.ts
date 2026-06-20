import { db } from './db';
import type { Settings } from './types';

const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  soundOn: true,
  voiceOn: true,
  language: 'vi',
  // GĐ5E1 — "Chế độ êm" defaults off (still respects OS prefers-reduced-motion).
  calmMode: false,
};

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get('app');
  // Spread defaults UNDER the stored row so a row written before a new flag was
  // added (e.g. `calmMode`) reads its default instead of `undefined` — additive,
  // migration-free forward-compat.
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
}

export async function updateSettings(changes: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...changes, id: 'app' };
  await db.settings.put(next);
  return next;
}
