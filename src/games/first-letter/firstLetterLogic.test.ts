import { describe, it, expect } from 'vitest';
import {
  WORD_BANK,
  LETTER_POOL,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './firstLetterLogic';

describe('WORD_BANK', () => {
  it('has unique entries whose letter is the uppercase first letter', () => {
    expect(WORD_BANK.length).toBeGreaterThanOrEqual(8);
    expect(new Set(WORD_BANK.map((w) => w.word)).size).toBe(WORD_BANK.length);
    for (const w of WORD_BANK) {
      expect(w.letter).toBe(w.letter.toUpperCase());
      expect(w.letter.length).toBe(1);
      expect(LETTER_POOL).toContain(w.letter);
    }
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
  it('keeps the correct letter among unique options of the right size', () => {
    for (const lvl of [1, 2, 3]) {
      for (let i = 0; i < 50; i++) {
        const r = generateRound(lvl, () => i / 50);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options).size).toBe(r.options.length);
        expect(r.options).toContain(r.entry.letter);
        for (const o of r.options) expect(LETTER_POOL).toContain(o);
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
    expect(starsFor(1, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});

describe('generateRound seeded (SR)', () => {
  it('picks a word whose first letter matches the seeded letter', () => {
    // 'M' has exactly one word (MÈO) in the bank.
    const round = generateRound(2, () => 0, 'M');
    expect(round.entry.letter).toBe('M');
    expect(round.options).toContain('M');
    expect(round.options).toHaveLength(optionCountForLevel(2));
  });

  it('falls back to a normal pick when no word has the seeded letter', () => {
    const round = generateRound(1, () => 0, 'Z'); // no word starts with Z
    expect(WORD_BANK.map((w) => w.word)).toContain(round.entry.word);
    expect(round.options).toContain(round.entry.letter);
  });
});
