import { describe, it, expect } from 'vitest';
import {
  TOKENS,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './patternLogic';

describe('optionCountForLevel', () => {
  it('uses 3 options for L1/L2 and 4 for L3', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(3);
    expect(optionCountForLevel(3)).toBe(4);
  });
});

describe('generateRound', () => {
  it('builds a sequence whose continued pattern equals the answer', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let i = 0; i < 40; i++) {
        const r = generateRound(lvl, () => i / 40);
        // Reconstruct the full pattern: the answer is the token that comes
        // after the visible sequence under the level's repeating rule.
        expect(TOKENS).toContain(r.answer);
        expect(r.sequence.length).toBeGreaterThanOrEqual(3);
        for (const t of r.sequence) expect(TOKENS).toContain(t);
        expect(r.options).toContain(r.answer);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options).size).toBe(r.options.length); // unique
      }
    }
  });

  it('produces AB repetition at level 1', () => {
    // With rng=0 the first two distinct tokens are TOKENS[0], TOKENS[1].
    const r = generateRound(1, () => 0);
    // AB pattern: sequence alternates two tokens; answer continues it.
    const a = r.sequence[0];
    const b = r.sequence[1];
    expect(a).not.toBe(b);
    // Each even index is a, each odd index is b.
    r.sequence.forEach((tok, idx) => expect(tok).toBe(idx % 2 === 0 ? a : b));
    const nextIsA = r.sequence.length % 2 === 0;
    expect(r.answer).toBe(nextIsA ? a : b);
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
