import { describe, it, expect } from 'vitest';
import {
  applyResult,
  freshRow,
  BOX_INTERVALS_MS,
  MAX_BOX,
  MASTERED_BOX,
  type MasteryRow,
} from './leitner';

const NOW = 1_000_000;

describe('leitner constants', () => {
  it('has one interval per box (0..MAX_BOX)', () => {
    expect(BOX_INTERVALS_MS).toHaveLength(MAX_BOX + 1);
    expect(BOX_INTERVALS_MS[0]).toBe(0);
    // intervals strictly increasing
    for (let i = 1; i < BOX_INTERVALS_MS.length; i++) {
      expect(BOX_INTERVALS_MS[i]).toBeGreaterThan(BOX_INTERVALS_MS[i - 1]);
    }
  });

  it('MASTERED_BOX is within range and is the single tweakable threshold', () => {
    expect(MASTERED_BOX).toBe(4);
    expect(MASTERED_BOX).toBeLessThanOrEqual(MAX_BOX);
  });
});

describe('freshRow', () => {
  it('creates a never-seen row due immediately at box 0', () => {
    const row = freshRow('A', NOW);
    expect(row).toEqual({
      itemKey: 'A',
      box: 0,
      dueAt: NOW,
      seenCount: 0,
      correctCount: 0,
      lastResult: 'wrong',
      lastSeenAt: 0,
    });
    expect(row.masteredAt).toBeUndefined();
  });
});

describe('applyResult — correct', () => {
  it('promotes the box by 1 and sets dueAt per the interval table', () => {
    const row = freshRow('A', 0);
    const next = applyResult(row, true, NOW);
    expect(next.box).toBe(1);
    expect(next.dueAt).toBe(NOW + BOX_INTERVALS_MS[1]);
    expect(next.seenCount).toBe(1);
    expect(next.correctCount).toBe(1);
    expect(next.lastResult).toBe('correct');
    expect(next.lastSeenAt).toBe(NOW);
  });

  it('caps the box at MAX_BOX', () => {
    let row: MasteryRow = { ...freshRow('A', 0), box: MAX_BOX };
    row = applyResult(row, true, NOW);
    expect(row.box).toBe(MAX_BOX);
    expect(row.dueAt).toBe(NOW + BOX_INTERVALS_MS[MAX_BOX]);
  });
});

describe('applyResult — wrong', () => {
  it('drops the box to 0, due immediately, increments seen but not correct', () => {
    const row: MasteryRow = { ...freshRow('A', 0), box: 3, correctCount: 3, seenCount: 3 };
    const next = applyResult(row, false, NOW);
    expect(next.box).toBe(0);
    expect(next.dueAt).toBe(NOW + BOX_INTERVALS_MS[0]); // == NOW
    expect(next.dueAt).toBe(NOW);
    expect(next.seenCount).toBe(4);
    expect(next.correctCount).toBe(3); // unchanged
    expect(next.lastResult).toBe('wrong');
    expect(next.lastSeenAt).toBe(NOW);
  });
});

describe('applyResult — masteredAt', () => {
  it('sets masteredAt the first time box reaches MASTERED_BOX', () => {
    let row: MasteryRow = { ...freshRow('A', 0), box: MASTERED_BOX - 1 };
    row = applyResult(row, true, NOW); // box -> MASTERED_BOX
    expect(row.box).toBe(MASTERED_BOX);
    expect(row.masteredAt).toBe(NOW);
  });

  it('does not set masteredAt before crossing the threshold', () => {
    const row = applyResult(freshRow('A', 0), true, NOW); // box 1
    expect(row.masteredAt).toBeUndefined();
  });

  it('keeps the original masteredAt (does not overwrite) on later promotions', () => {
    let row: MasteryRow = { ...freshRow('A', 0), box: MASTERED_BOX - 1 };
    row = applyResult(row, true, NOW); // crosses, masteredAt = NOW
    const later = applyResult(row, true, NOW + 999); // box 5
    expect(later.masteredAt).toBe(NOW); // unchanged
  });

  it('does not clear masteredAt when the box later drops on a wrong answer', () => {
    let row: MasteryRow = { ...freshRow('A', 0), box: MASTERED_BOX - 1 };
    row = applyResult(row, true, NOW); // masteredAt = NOW, box MASTERED_BOX
    const dropped = applyResult(row, false, NOW + 5000); // wrong -> box 0
    expect(dropped.box).toBe(0);
    expect(dropped.masteredAt).toBe(NOW); // remembered "đã từng thạo"
  });
});
