import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import {
  getMasteryRow,
  getMasteryRows,
  recordItemResult,
  upsertMastery,
  getDueItems,
  getMasterySummary,
  bucketOf,
} from './mastery';
import { freshRow, applyResult, MASTERED_BOX } from './leitner';
import { recordPlay, getProgress } from './progress';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const NOW = 5_000_000;

describe('bucketOf (pure)', () => {
  it('classifies box ≥ MASTERED_BOX as mastered', () => {
    expect(bucketOf({ box: MASTERED_BOX })).toBe('mastered');
    expect(bucketOf({ box: MASTERED_BOX + 1 })).toBe('mastered');
  });
  it('classifies box 0 as practice-next, and 1..MASTERED_BOX-1 as emerging', () => {
    expect(bucketOf({ box: 0 })).toBe('practice-next');
    expect(bucketOf({ box: 1 })).toBe('emerging');
    expect(bucketOf({ box: MASTERED_BOX - 1 })).toBe('emerging');
  });
});

describe('recordItemResult', () => {
  it('creates a mastery row on the first result', async () => {
    await recordItemResult(1, 'number-vi', '3', true, NOW);
    const r = await getMasteryRow(1, 'number-vi', '3');
    expect(r).toBeDefined();
    expect(r?.seenCount).toBe(1);
    expect(r?.correctCount).toBe(1);
    expect(r?.box).toBe(1); // correct: 0 -> 1
    expect(r?.lastResult).toBe('correct');
    expect(r?.lastSeenAt).toBe(NOW);
  });

  it('updates the same row (no duplicate) on subsequent results', async () => {
    await recordItemResult(1, 'number-vi', '3', true, NOW);
    await recordItemResult(1, 'number-vi', '3', false, NOW + 1000);
    const rows = await getMasteryRows(1, 'number-vi');
    expect(rows).toHaveLength(1); // single row, updated
    expect(rows[0].seenCount).toBe(2);
    expect(rows[0].correctCount).toBe(1); // wrong did not bump correct
    expect(rows[0].box).toBe(0); // wrong -> dropped to 0
    expect(rows[0].lastResult).toBe('wrong');
  });

  it('sets masteredAt when crossing the mastered box and keeps it afterward', async () => {
    let last;
    for (let i = 0; i < MASTERED_BOX; i++) {
      last = await recordItemResult(1, 'letter-vi', 'A', true, NOW + i);
    }
    expect(last?.box).toBe(MASTERED_BOX);
    const r = await getMasteryRow(1, 'letter-vi', 'A');
    expect(r?.masteredAt).toBe(NOW + (MASTERED_BOX - 1));
    // a later wrong answer must not clear masteredAt
    await recordItemResult(1, 'letter-vi', 'A', false, NOW + 99_999);
    const after = await getMasteryRow(1, 'letter-vi', 'A');
    expect(after?.box).toBe(0);
    expect(after?.masteredAt).toBe(NOW + (MASTERED_BOX - 1));
  });

  it('keeps different skills with the same itemKey separate', async () => {
    await recordItemResult(1, 'number-vi', '3', true, NOW);
    await recordItemResult(1, 'number-en', '3', false, NOW);
    const vi = await getMasteryRow(1, 'number-vi', '3');
    const en = await getMasteryRow(1, 'number-en', '3');
    expect(vi?.lastResult).toBe('correct');
    expect(en?.lastResult).toBe('wrong');
  });
});

describe('upsertMastery (direct row flush)', () => {
  it('persists a computed MasteryRow and reads back', async () => {
    const row = applyResult(freshRow('cat', NOW), true, NOW);
    await upsertMastery(2, 'word-en', row);
    const r = await getMasteryRow(2, 'word-en', 'cat');
    expect(r?.box).toBe(1);
    expect(r?.seenCount).toBe(1);
  });

  it('updates an existing row rather than inserting a duplicate', async () => {
    await upsertMastery(2, 'word-en', applyResult(freshRow('cat', NOW), true, NOW));
    await upsertMastery(2, 'word-en', applyResult(freshRow('cat', NOW), false, NOW + 5));
    const rows = await getMasteryRows(2, 'word-en');
    expect(rows).toHaveLength(1);
  });
});

describe('getDueItems', () => {
  it('returns only items due at or before now, sorted by dueAt', async () => {
    // box 0 -> due now (NOW)
    await recordItemResult(1, 'letter-vi', 'A', false, NOW);
    // box 1 -> due NOW + 20min (in the future relative to NOW)
    await recordItemResult(1, 'letter-vi', 'B', true, NOW);
    const due = await getDueItems(1, NOW);
    const keys = due.map((d) => d.itemKey);
    expect(keys).toContain('A');
    expect(keys).not.toContain('B');
  });

  it('respects the limit', async () => {
    await recordItemResult(1, 'letter-vi', 'A', false, NOW);
    await recordItemResult(1, 'letter-vi', 'B', false, NOW + 1);
    await recordItemResult(1, 'letter-vi', 'C', false, NOW + 2);
    const due = await getDueItems(1, NOW + 10, 2);
    expect(due).toHaveLength(2);
  });

  it('scopes due items to the given profile', async () => {
    await recordItemResult(1, 'letter-vi', 'A', false, NOW);
    await recordItemResult(2, 'letter-vi', 'A', false, NOW);
    const due = await getDueItems(1, NOW);
    expect(due.every((d) => d.profileId === 1)).toBe(true);
  });
});

describe('getMasterySummary', () => {
  it('buckets items per skill and computes accuracy', async () => {
    // letter-vi 'A' -> mastered (reach MASTERED_BOX)
    for (let i = 0; i < MASTERED_BOX; i++) {
      await recordItemResult(1, 'letter-vi', 'A', true, NOW + i);
    }
    // letter-vi 'B' -> emerging (box 1)
    await recordItemResult(1, 'letter-vi', 'B', true, NOW);
    // letter-vi 'C' -> practice-next (box 0, wrong)
    await recordItemResult(1, 'letter-vi', 'C', false, NOW);
    // a different skill row
    await recordItemResult(1, 'number-vi', '1', true, NOW);

    const summary = await getMasterySummary(1);
    const letters = summary.find((s) => s.skillId === 'letter-vi')!;
    expect(letters.total).toBe(3);
    expect(letters.mastered).toContain('A');
    expect(letters.emerging).toContain('B');
    expect(letters.practiceNext).toContain('C');
    // accuracy = correct(4+1+0)/seen(4+1+1) = 5/6
    expect(letters.accuracy).toBeCloseTo(5 / 6, 5);

    const numbers = summary.find((s) => s.skillId === 'number-vi')!;
    expect(numbers.total).toBe(1);
    expect(numbers.accuracy).toBe(1);
  });
});

describe('additive v2 bump — old tables survive', () => {
  it('reads and writes the legacy progress table alongside itemMastery', async () => {
    // exercise old table
    await recordPlay(1, 'counting-fun', 2, 5);
    // exercise new table
    await recordItemResult(1, 'number-vi', '5', true, NOW);

    const p = await getProgress(1, 'counting-fun');
    expect(p?.bestScore).toBe(5);
    expect(p?.level).toBe(2);

    const m = await getMasteryRow(1, 'number-vi', '5');
    expect(m?.box).toBe(1);
  });
});
