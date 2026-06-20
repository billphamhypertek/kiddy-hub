import { describe, it, expect } from 'vitest';
import {
  NUMBER_WORDS,
  maxNumberForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
  OPTION_COUNT,
} from './numbersEnLogic';

describe('NUMBER_WORDS', () => {
  it('maps 1..10 to English words', () => {
    expect(NUMBER_WORDS[1]).toBe('one');
    expect(NUMBER_WORDS[7]).toBe('seven');
    expect(NUMBER_WORDS[10]).toBe('ten');
    expect(Object.keys(NUMBER_WORDS)).toHaveLength(10);
  });
});

describe('maxNumberForLevel', () => {
  it('grows with level', () => {
    expect(maxNumberForLevel(1)).toBe(5);
    expect(maxNumberForLevel(2)).toBe(8);
    expect(maxNumberForLevel(3)).toBe(10);
  });
});

describe('generateRound', () => {
  it('keeps target among 3 unique options within 1..max with the right word', () => {
    for (const lvl of [1, 2, 3]) {
      const max = maxNumberForLevel(lvl);
      for (let i = 0; i < 50; i++) {
        const r = generateRound(lvl, () => i / 50);
        expect(r.options).toHaveLength(OPTION_COUNT);
        expect(new Set(r.options).size).toBe(OPTION_COUNT);
        expect(r.options).toContain(r.target);
        expect(r.word).toBe(NUMBER_WORDS[r.target]);
        for (const o of r.options) {
          expect(o).toBeGreaterThanOrEqual(1);
          expect(o).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(2, () => 0.3)).toEqual(generateRound(2, () => 0.3));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(1, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});

describe('generateRound seeded (SR)', () => {
  it('builds the round around the seeded number and its word', () => {
    const round = generateRound(3, () => 0, 7);
    expect(round.target).toBe(7);
    expect(round.word).toBe(NUMBER_WORDS[7]);
    expect(round.options).toContain(7);
    expect(round.options).toHaveLength(OPTION_COUNT);
  });

  it('ignores an out-of-range seed for the level', () => {
    const round = generateRound(1, () => 0, 9); // L1 max is 5
    expect(round.target).toBeLessThanOrEqual(maxNumberForLevel(1));
  });
});
