import { describe, it, expect } from 'vitest';
import {
  maxCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './countingLogic';

describe('maxCountForLevel', () => {
  it('grows the counting range by level', () => {
    expect(maxCountForLevel(1)).toBe(3);
    expect(maxCountForLevel(2)).toBe(5);
    expect(maxCountForLevel(3)).toBe(10);
  });
});

describe('generateRound', () => {
  it('produces a count within the level range and 3 unique options including the answer', () => {
    // rng returns 0 -> picks first index/value deterministically
    const round = generateRound(2, () => 0);
    expect(round.count).toBeGreaterThanOrEqual(1);
    expect(round.count).toBeLessThanOrEqual(maxCountForLevel(2));
    expect(round.options).toHaveLength(3);
    expect(new Set(round.options).size).toBe(3);
    expect(round.options).toContain(round.count);
    expect(round.animal.length).toBeGreaterThan(0);
  });

  it('keeps all options within 1..max', () => {
    for (let i = 0; i < 50; i++) {
      const r = generateRound(3, () => i / 50);
      for (const opt of r.options) {
        expect(opt).toBeGreaterThanOrEqual(1);
        expect(opt).toBeLessThanOrEqual(maxCountForLevel(3));
      }
    }
  });
});

describe('starsFor', () => {
  it('awards 3 for a perfect game, 2 for >=60%, else 1', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(1, 5)).toBe(1);
    expect(starsFor(0, 5)).toBe(1);
  });
  it('exposes a 5-question session length', () => {
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});

describe('generateRound seeded (SR)', () => {
  it('builds the round around the seeded count', () => {
    const round = generateRound(3, () => 0, 7);
    expect(round.count).toBe(7);
    expect(round.options).toContain(7);
    expect(round.options).toHaveLength(3);
    expect(new Set(round.options).size).toBe(3);
  });

  it('ignores an out-of-range seed and falls back to a valid count', () => {
    const round = generateRound(1, () => 0, 9); // max at L1 is 3
    expect(round.count).toBeGreaterThanOrEqual(1);
    expect(round.count).toBeLessThanOrEqual(maxCountForLevel(1));
  });
});
