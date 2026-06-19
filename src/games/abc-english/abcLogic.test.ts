import { describe, it, expect } from 'vitest';
import {
  ALPHABET,
  letterPoolForLevel,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './abcLogic';

describe('ALPHABET', () => {
  it('is A..Z with 26 unique uppercase letters', () => {
    expect(ALPHABET).toHaveLength(26);
    expect(ALPHABET[0]).toBe('A');
    expect(ALPHABET[25]).toBe('Z');
    expect(new Set(ALPHABET).size).toBe(26);
  });
});

describe('letterPoolForLevel', () => {
  it('widens the range by level', () => {
    expect(letterPoolForLevel(1)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(letterPoolForLevel(2)).toEqual(ALPHABET.slice(0, 14)); // A..N
    expect(letterPoolForLevel(3)).toEqual(ALPHABET);
  });
});

describe('optionCountForLevel', () => {
  it('uses 3 for L1 and 4 for L2/L3', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(4);
    expect(optionCountForLevel(3)).toBe(4);
  });
});

describe('generateRound', () => {
  it('keeps target among unique options drawn from the level pool', () => {
    for (const lvl of [1, 2, 3]) {
      const pool = letterPoolForLevel(lvl);
      for (let i = 0; i < 50; i++) {
        const r = generateRound(lvl, () => i / 50);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options).size).toBe(r.options.length);
        expect(r.options).toContain(r.target);
        for (const o of r.options) expect(pool).toContain(o);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.5)).toEqual(generateRound(3, () => 0.5));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(2, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
