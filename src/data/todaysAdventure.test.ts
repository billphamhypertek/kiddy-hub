import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { createProfile } from './profiles';
import { recordPlay } from './progress';
import { pickTodaysAdventure, getRecentGameIds, type AdventureInput } from './todaysAdventure';
import type { GameModule } from '../games/GameModule';
import type { ItemMastery, SkillId } from './types';
import type { SkillMastery } from './mastery';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

// A tiny deterministic LCG so picks are reproducible in tests.
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function game(id: string, skill: string): GameModule {
  return {
    id,
    categoryId: 'numbers',
    title: id,
    iconKey: id,
    skill,
    levels: 3,
    loadScene: () => Promise.resolve(() => ({}) as never),
  };
}

const ALL_GAMES: GameModule[] = [
  game('counting-fun', 'number-vi'),
  game('letter-spotting', 'letter-vi'),
  game('abc-english', 'letter-en'),
  game('numbers-english', 'number-en'),
  game('first-words', 'word-en'),
  game('colors-english', 'color-en'),
  game('shapes-colors', 'shape'),
  game('memory-match', 'memory'),
  game('more-less', 'compare'),
];

function dueItem(skillId: SkillId, itemKey: string, dueAt: number): ItemMastery {
  return {
    profileId: 1,
    skillId,
    itemKey,
    seenCount: 1,
    correctCount: 0,
    box: 0,
    dueAt,
    lastResult: 'wrong',
    lastSeenAt: dueAt,
  };
}

function input(over: Partial<AdventureInput> = {}): AdventureInput {
  return {
    dueItems: [],
    summary: [],
    recentGameIds: [],
    allGames: ALL_GAMES,
    rng: seededRng(1),
    ...over,
  };
}

describe('pickTodaysAdventure (pure)', () => {
  it('never throws and always returns 2..3 picks even with no data (new child)', () => {
    const picks = pickTodaysAdventure(input());
    expect(picks.length).toBeGreaterThanOrEqual(2);
    expect(picks.length).toBeLessThanOrEqual(3);
    // brand-new child → everything is variety/fresh, no due
    for (const p of picks) expect(['fresh', 'variety']).toContain(p.reason);
  });

  it('clamps count into 2..3', () => {
    expect(pickTodaysAdventure(input({ count: 99 })).length).toBe(3);
    expect(pickTodaysAdventure(input({ count: 1 })).length).toBe(2);
    expect(pickTodaysAdventure(input({ count: 0 })).length).toBe(2);
  });

  it('prioritises due items (tier A) mapped to their practice game', () => {
    const picks = pickTodaysAdventure(
      input({
        dueItems: [
          dueItem('number-vi', '3', 100),
          dueItem('number-vi', '5', 110),
          dueItem('letter-vi', 'A', 200),
        ],
      }),
    );
    // counting-fun has 2 due items, letter-spotting has 1 → counting-fun ranks first & is 'due'
    expect(picks[0]).toEqual({
      gameId: 'counting-fun',
      title: 'counting-fun',
      reason: 'due',
    });
    expect(picks.some((p) => p.gameId === 'letter-spotting' && p.reason === 'due')).toBe(true);
  });

  it('orders due games by due-count desc then earliest dueAt', () => {
    const picks = pickTodaysAdventure(
      input({
        count: 3,
        dueItems: [
          dueItem('letter-vi', 'A', 50), // letter-spotting: 1 due, very early
          dueItem('number-vi', '3', 100),
          dueItem('number-vi', '5', 110), // counting-fun: 2 due
        ],
      }),
    );
    // more due items wins over earliest dueAt
    expect(picks[0].gameId).toBe('counting-fun');
  });

  it('de-duplicates gameIds (two skills → same game counts once)', () => {
    const picks = pickTodaysAdventure(
      input({
        dueItems: [dueItem('shape', 'circle', 100), dueItem('color-vi', 'red', 110)],
      }),
    );
    const ids = picks.map((p) => p.gameId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('fills remaining slots with fresh (skill not yet picked), preferring non-recent', () => {
    const picks = pickTodaysAdventure(
      input({
        count: 3,
        dueItems: [dueItem('number-vi', '3', 100)],
        recentGameIds: ['letter-spotting', 'abc-english'],
      }),
    );
    expect(picks).toHaveLength(3);
    expect(picks[0].gameId).toBe('counting-fun'); // due first
    // remaining are fresh/variety, and should avoid the recent ones first
    const filler = picks.slice(1).map((p) => p.gameId);
    expect(filler).not.toContain('counting-fun'); // no dupes
  });

  it('is deterministic for a fixed rng+input', () => {
    const a = pickTodaysAdventure(input({ rng: seededRng(42) }));
    const b = pickTodaysAdventure(input({ rng: seededRng(42) }));
    expect(a).toEqual(b);
  });

  it('FRESH each call: different rng seeds can yield different variety picks', () => {
    // With no due items, picks come from variety → rng varies them across "opens".
    const seen = new Set<string>();
    for (let seed = 0; seed < 12; seed++) {
      for (const p of pickTodaysAdventure(input({ rng: seededRng(seed) }))) seen.add(p.gameId);
    }
    // over several opens more than `count` distinct games appear → not always the same 3
    expect(seen.size).toBeGreaterThan(3);
  });
});

describe('getRecentGameIds (read-only)', () => {
  it('returns recently-played gameIds, most recent first', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await recordPlay(id, 'counting-fun', 1, 3);
    await new Promise((r) => setTimeout(r, 2));
    await recordPlay(id, 'abc-english', 1, 3);
    await new Promise((r) => setTimeout(r, 2));
    await recordPlay(id, 'memory-match', 1, 3);
    const recent = await getRecentGameIds(id, 2);
    expect(recent).toEqual(['memory-match', 'abc-english']);
  });

  it('returns empty for a child who has never played', async () => {
    const id = await createProfile({ name: 'Bo', avatarKey: 'dog' });
    expect(await getRecentGameIds(id, 5)).toEqual([]);
  });

  it('only includes the given child', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const b = await createProfile({ name: 'Bo', avatarKey: 'dog' });
    await recordPlay(a, 'counting-fun', 1, 3);
    await recordPlay(b, 'abc-english', 1, 3);
    expect(await getRecentGameIds(a, 5)).toEqual(['counting-fun']);
  });
});

// referenced only to keep the type import meaningful in the test file
const _summaryShape: SkillMastery[] = [];
void _summaryShape;
