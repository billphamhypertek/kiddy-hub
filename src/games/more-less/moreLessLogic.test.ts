import { describe, it, expect } from 'vitest';
import { EMOJI, generateRound, starsFor, QUESTIONS_PER_GAME } from './moreLessLogic';

describe('generateRound', () => {
  it('always has two unequal counts in range for the level', () => {
    const ranges: Record<number, number> = { 1: 5, 2: 8, 3: 10 };
    for (const lvl of [1, 2, 3]) {
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.leftCount).not.toBe(r.rightCount);
        expect(r.leftCount).toBeGreaterThanOrEqual(1);
        expect(r.rightCount).toBeGreaterThanOrEqual(1);
        expect(r.leftCount).toBeLessThanOrEqual(ranges[lvl]);
        expect(r.rightCount).toBeLessThanOrEqual(ranges[lvl]);
        expect(['more', 'less']).toContain(r.want);
        expect(EMOJI).toContain(r.emoji);
      }
    }
  });

  it('keeps a gap of at least 2 at level 1', () => {
    for (let i = 0; i < 60; i++) {
      const r = generateRound(1, () => i / 60);
      expect(Math.abs(r.leftCount - r.rightCount)).toBeGreaterThanOrEqual(2);
    }
  });

  it('never produces equal counts even with a degenerate rng', () => {
    const r = generateRound(3, () => 0);
    expect(r.leftCount).not.toBe(r.rightCount);
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(2, () => 0.37)).toEqual(generateRound(2, () => 0.37));
  });
});

describe('starsFor', () => {
  it('awards 3 for perfect, 2 for >=60%, else 1', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(2, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
