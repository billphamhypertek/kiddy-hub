import { describe, it, expect, vi } from 'vitest';
import {
  createMasterySession,
  SCAFFOLD_KEEP,
  NO_REDUCTION,
  type MasterySessionDeps,
} from './masterySession';
import { freshRow, applyResult, type MasteryRow } from '../data/leitner';
import type { SkillId } from '../data/types';

const NOW = 7_000_000;

function key(skillId: SkillId, itemKey: string): string {
  return `${skillId}|${itemKey}`;
}

function makeDeps(over: Partial<MasterySessionDeps> = {}): {
  deps: MasterySessionDeps;
  persist: ReturnType<typeof vi.fn>;
} {
  const persist = vi.fn();
  const deps: MasterySessionDeps = {
    rows: new Map<string, MasteryRow>(),
    now: () => NOW,
    rng: () => 0,
    persist,
    ...over,
  };
  return { deps, persist };
}

describe('createMasterySession.pick', () => {
  it('returns an item from the pool and remembers it as lastPicked', () => {
    const { deps } = makeDeps();
    const session = createMasterySession(deps);
    const first = session.pick('number-vi', ['1', '2', '3']);
    expect(['1', '2', '3']).toContain(first);
  });

  it('suppresses immediate repeats across rounds (uses lastPicked)', () => {
    // make '1' the strict top pick (lowest box, due) so without suppression
    // it would repeat. After first pick it must be excluded next round.
    const rows = new Map<string, MasteryRow>([
      [key('number-vi', '1'), { ...freshRow('1', NOW), seenCount: 1, box: 0, dueAt: NOW - 1 }],
      [key('number-vi', '2'), { ...freshRow('2', NOW), seenCount: 1, box: 0, dueAt: NOW - 1 }],
      [key('number-vi', '3'), { ...freshRow('3', NOW), seenCount: 1, box: 0, dueAt: NOW - 1 }],
    ]);
    const { deps } = makeDeps({ rows, rng: () => 0 });
    const session = createMasterySession(deps);
    const a = session.pick('number-vi', ['1', '2', '3']);
    const b = session.pick('number-vi', ['1', '2', '3']);
    expect(b).not.toBe(a);
  });
});

describe('createMasterySession.record', () => {
  it('applies applyResult to the cache and flushes via persist', () => {
    const { deps, persist } = makeDeps();
    const session = createMasterySession(deps);
    session.record('number-vi', '5', true);

    const cached = deps.rows.get(key('number-vi', '5'));
    const expected = applyResult(freshRow('5', NOW), true, NOW);
    expect(cached).toEqual(expected);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith('number-vi', expected);
  });

  it('accumulates across multiple records on the same item', () => {
    const { deps } = makeDeps();
    const session = createMasterySession(deps);
    session.record('number-vi', '5', true); // box 1
    session.record('number-vi', '5', true); // box 2
    const cached = deps.rows.get(key('number-vi', '5'))!;
    expect(cached.box).toBe(2);
    expect(cached.seenCount).toBe(2);
    expect(cached.correctCount).toBe(2);
  });

  it('a wrong answer drops the cached box to 0', () => {
    const rows = new Map<string, MasteryRow>([
      [key('letter-vi', 'A'), { ...freshRow('A', NOW), box: 3, seenCount: 3, correctCount: 3 }],
    ]);
    const { deps } = makeDeps({ rows });
    const session = createMasterySession(deps);
    session.record('letter-vi', 'A', false);
    expect(deps.rows.get(key('letter-vi', 'A'))!.box).toBe(0);
  });
});

describe('createMasterySession.hintFor (scaffolding)', () => {
  it('reduces to SCAFFOLD_KEEP for a never-seen item', () => {
    const { deps } = makeDeps();
    const session = createMasterySession(deps);
    expect(session.hintFor('letter-vi', 'Z')).toBe(SCAFFOLD_KEEP);
  });

  it('reduces to SCAFFOLD_KEEP for a weak item (box ≤ 1)', () => {
    const rows = new Map<string, MasteryRow>([
      [key('letter-vi', 'A'), { ...freshRow('A', NOW), box: 1, seenCount: 2 }],
    ]);
    const { deps } = makeDeps({ rows });
    const session = createMasterySession(deps);
    expect(session.hintFor('letter-vi', 'A')).toBe(SCAFFOLD_KEEP);
  });

  it('does not reduce (NO_REDUCTION) once box ≥ 2 — scaffold faded', () => {
    const rows = new Map<string, MasteryRow>([
      [key('letter-vi', 'A'), { ...freshRow('A', NOW), box: 2, seenCount: 5 }],
    ]);
    const { deps } = makeDeps({ rows });
    const session = createMasterySession(deps);
    expect(session.hintFor('letter-vi', 'A')).toBe(NO_REDUCTION);
  });
});
