import { describe, it, expect } from 'vitest';
import { pickNextItem, type Rng } from './srScheduler';
import { freshRow, type MasteryRow } from './leitner';

const NOW = 10_000_000;

function row(itemKey: string, over: Partial<MasteryRow>): MasteryRow {
  return { ...freshRow(itemKey, NOW), seenCount: 1, ...over, itemKey };
}

function rowsOf(...rs: MasteryRow[]): Map<string, MasteryRow> {
  return new Map(rs.map((r) => [r.itemKey, r]));
}

/** Deterministic rng returning a fixed sequence (clamped). */
function seqRng(values: number[]): Rng {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('pickNextItem — tier priority', () => {
  it('T2 (due & weak) beats T3 (due, box>1)', () => {
    const weak = row('weak', { box: 0, dueAt: NOW - 1 }); // T2
    const dueStrong = row('strong', { box: 3, dueAt: NOW - 1 }); // T3
    const got = pickNextItem({
      pool: ['weak', 'strong'],
      rows: rowsOf(weak, dueStrong),
      now: NOW,
      rng: () => 0,
    });
    expect(got).toBe('weak');
  });

  it('T2 (due & weak) beats T1 (new) — review weak items before new ones', () => {
    const weak = row('weak', { box: 1, dueAt: NOW - 1 }); // T2
    const fresh = freshRow('new', NOW); // T1 (seenCount 0)
    const got = pickNextItem({
      pool: ['weak', 'new'],
      rows: rowsOf(weak, fresh),
      now: NOW,
      rng: () => 0,
    });
    expect(got).toBe('weak');
  });

  it('T1 (new) is introduced when nothing is due', () => {
    const future = row('seen', { box: 2, dueAt: NOW + 100_000 }); // T4
    const fresh = freshRow('new', NOW); // T1
    const got = pickNextItem({
      pool: ['seen', 'new'],
      rows: rowsOf(future, fresh),
      now: NOW,
      rng: () => 0,
    });
    expect(got).toBe('new');
  });

  it('T3 (due) beats T4 (not due)', () => {
    const due = row('due', { box: 3, dueAt: NOW - 1 }); // T3
    const future = row('future', { box: 2, dueAt: NOW + 100_000 }); // T4
    const got = pickNextItem({
      pool: ['due', 'future'],
      rows: rowsOf(due, future),
      now: NOW,
      rng: () => 0,
    });
    expect(got).toBe('due');
  });

  it('T4 fill: when nothing due/new, picks the lowest-box (least sure) item', () => {
    const low = row('low', { box: 2, dueAt: NOW + 100_000 });
    const high = row('high', { box: 4, dueAt: NOW + 100_000 });
    const got = pickNextItem({
      pool: ['low', 'high'],
      rows: rowsOf(low, high),
      now: NOW,
      rng: () => 0,
    });
    expect(got).toBe('low');
  });
});

describe('pickNextItem — immediate-repeat suppression', () => {
  it('excludes lastPicked when ≥2 other candidates remain', () => {
    const a = row('a', { box: 0, dueAt: NOW - 1 });
    const b = row('b', { box: 0, dueAt: NOW - 1 });
    const c = row('c', { box: 0, dueAt: NOW - 1 });
    // 'a' is highest priority but was just picked -> must not repeat
    const got = pickNextItem({
      pool: ['a', 'b', 'c'],
      rows: rowsOf(a, b, c),
      now: NOW,
      rng: () => 0,
      lastPicked: 'a',
    });
    expect(got).not.toBe('a');
  });

  it('keeps lastPicked when fewer than 2 other candidates exist (pool of 2)', () => {
    const a = row('a', { box: 0, dueAt: NOW - 1 });
    const b = row('b', { box: 0, dueAt: NOW - 1 });
    // only 1 "other" -> lastPicked is NOT removed; tie -> rng picks
    const got = pickNextItem({
      pool: ['a', 'b'],
      rows: rowsOf(a, b),
      now: NOW,
      rng: () => 0, // index 0 of sorted tie group
      lastPicked: 'b',
    });
    expect(['a', 'b']).toContain(got);
  });

  it('keeps the only item in a single-element pool', () => {
    const a = row('a', { box: 0, dueAt: NOW - 1 });
    const got = pickNextItem({
      pool: ['a'],
      rows: rowsOf(a),
      now: NOW,
      rng: () => 0,
      lastPicked: 'a',
    });
    expect(got).toBe('a');
  });
});

describe('pickNextItem — rng-within-tier variety', () => {
  it('two different rng values yield two different tied items', () => {
    // three tied candidates (same box/dueAt/lastSeenAt)
    const a = row('a', { box: 0, dueAt: NOW - 1, lastSeenAt: 5 });
    const b = row('b', { box: 0, dueAt: NOW - 1, lastSeenAt: 5 });
    const c = row('c', { box: 0, dueAt: NOW - 1, lastSeenAt: 5 });
    const base = { pool: ['a', 'b', 'c'], rows: rowsOf(a, b, c), now: NOW };
    const first = pickNextItem({ ...base, rng: seqRng([0]) });
    const last = pickNextItem({ ...base, rng: seqRng([0.99]) });
    expect(first).toBe('a');
    expect(last).toBe('c');
    expect(first).not.toBe(last);
  });

  it('does not pick from a lower-ranked item even if tie group is small', () => {
    // 'a' strictly best (lower box); 'b' worse -> rng must still give 'a'
    const a = row('a', { box: 0, dueAt: NOW - 1 });
    const b = row('b', { box: 1, dueAt: NOW - 1 });
    const got = pickNextItem({
      pool: ['a', 'b'],
      rows: rowsOf(a, b),
      now: NOW,
      rng: () => 0.99, // would pick 'b' if it were in the group
    });
    expect(got).toBe('a');
  });
});

describe('pickNextItem — robustness', () => {
  it('handles an empty rows map by treating all pool items as new (T1)', () => {
    const got = pickNextItem({
      pool: ['x', 'y'],
      rows: new Map(),
      now: NOW,
      rng: () => 0,
    });
    expect(['x', 'y']).toContain(got);
  });

  it('never throws and returns empty string for an empty pool', () => {
    expect(() =>
      pickNextItem({ pool: [], rows: new Map(), now: NOW, rng: () => 0 }),
    ).not.toThrow();
    expect(pickNextItem({ pool: [], rows: new Map(), now: NOW, rng: () => 0 })).toBe('');
  });
});
