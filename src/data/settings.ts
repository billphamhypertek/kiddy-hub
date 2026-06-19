import { db } from './db';
import type { Settings } from './types';

const DEFAULT_SETTINGS: Settings = { id: 'app', soundOn: true, voiceOn: true, language: 'vi' };

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? DEFAULT_SETTINGS;
}

export async function updateSettings(changes: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...changes, id: 'app' };
  await db.settings.put(next);
  return next;
}
