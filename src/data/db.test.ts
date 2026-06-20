import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('KiddyHubDB schema (v2, additive)', () => {
  it('opens at version 2', async () => {
    await db.open();
    expect(db.verno).toBe(2);
  });

  it('declares the itemMastery table with the hot-path indexes', () => {
    const table = db.itemMastery;
    expect(table).toBeDefined();
    const indexes = table.schema.indexes.map((ix) => ix.name);
    // compound indexes are keyed by their bracketed name in Dexie
    expect(table.schema.primKey.name).toBe('id');
    expect(indexes).toContain('profileId');
    expect(indexes).toContain('[profileId+skillId]');
    expect(indexes).toContain('[profileId+skillId+itemKey]');
    expect(indexes).toContain('[profileId+dueAt]');
  });

  it('keeps all legacy tables present after the bump', () => {
    const names = db.tables.map((t) => t.name).sort();
    expect(names).toEqual(
      ['garden', 'itemMastery', 'profiles', 'progress', 'settings', 'starEvents'].sort(),
    );
  });

  it('persists an itemMastery row across a close/open cycle', async () => {
    await db.itemMastery.add({
      profileId: 1,
      skillId: 'number-vi',
      itemKey: '7',
      seenCount: 1,
      correctCount: 1,
      box: 1,
      dueAt: 123,
      lastResult: 'correct',
      lastSeenAt: 100,
    });
    db.close();
    await db.open();
    const row = await db.itemMastery.where({ profileId: 1, skillId: 'number-vi', itemKey: '7' }).first();
    expect(row?.box).toBe(1);
  });
});
