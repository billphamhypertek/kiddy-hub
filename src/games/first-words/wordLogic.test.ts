import { describe, it, expect } from 'vitest';
import {
  WORD_BANK,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './wordLogic';

describe('WORD_BANK', () => {
  it('has at least 5 distinct items per level', () => {
    for (const lvl of [1, 2, 3] as const) {
      const bank = WORD_BANK[lvl];
      expect(bank.length).toBeGreaterThanOrEqual(5);
      expect(new Set(bank.map((w) => w.word)).size).toBe(bank.length);
      expect(new Set(bank.map((w) => w.emoji)).size).toBe(bank.length);
    }
  });
});

describe('optionCountForLevel', () => {
  it('uses 3 for L1/L2 and 4 for L3', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(3);
    expect(optionCountForLevel(3)).toBe(4);
  });
});

describe('generateRound', () => {
  it('keeps target in options, unique by word, from the level bank', () => {
    for (const lvl of [1, 2, 3] as const) {
      for (let i = 0; i < 40; i++) {
        const r = generateRound(lvl, () => i / 40);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options.map((o) => o.word)).size).toBe(r.options.length);
        expect(r.options.map((o) => o.word)).toContain(r.target.word);
        const bankWords = WORD_BANK[lvl].map((w) => w.word);
        for (const o of r.options) expect(bankWords).toContain(o.word);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(2, () => 0.6)).toEqual(generateRound(2, () => 0.6));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(0, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
