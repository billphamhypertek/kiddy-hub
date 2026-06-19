import { describe, it, expect } from 'vitest';
import {
  LETTERS,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './letterLogic';

describe('LETTERS', () => {
  it('contains the Vietnamese diacritic uppercase letters', () => {
    for (const ch of ['Ă', 'Â', 'Ê', 'Ô', 'Ơ', 'Ư', 'Đ']) {
      expect(LETTERS).toContain(ch);
    }
    expect(new Set(LETTERS).size).toBe(LETTERS.length); // no dups
  });
});

describe('optionCountForLevel', () => {
  it('grows the choices by level', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(4);
    expect(optionCountForLevel(3)).toBe(5);
  });
});

describe('generateRound', () => {
  it('always includes the target among unique options of the right size', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let i = 0; i < 40; i++) {
        const r = generateRound(lvl, () => i / 40);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options).size).toBe(r.options.length); // unique
        expect(r.options).toContain(r.target);
        expect(LETTERS).toContain(r.target);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    const a = generateRound(3, () => 0.42);
    const b = generateRound(3, () => 0.42);
    expect(a).toEqual(b);
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
