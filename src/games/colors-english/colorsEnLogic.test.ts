import { describe, it, expect } from 'vitest';
import {
  COLORS,
  colorPoolForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
  OPTION_COUNT,
} from './colorsEnLogic';

describe('COLORS', () => {
  it('has >= 8 entries unique by name with English names', () => {
    expect(COLORS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(COLORS.map((c) => c.name)).size).toBe(COLORS.length);
    expect(COLORS.map((c) => c.name)).toContain('red');
  });
});

describe('colorPoolForLevel', () => {
  it('widens by level', () => {
    expect(colorPoolForLevel(1)).toHaveLength(3);
    expect(colorPoolForLevel(2)).toHaveLength(6);
    expect(colorPoolForLevel(3).length).toBeGreaterThanOrEqual(8);
  });
});

describe('generateRound', () => {
  it('keeps target among 3 unique options from the level pool', () => {
    for (const lvl of [1, 2, 3]) {
      const poolNames = colorPoolForLevel(lvl).map((c) => c.name);
      for (let i = 0; i < 50; i++) {
        const r = generateRound(lvl, () => i / 50);
        expect(r.options).toHaveLength(OPTION_COUNT);
        expect(new Set(r.options.map((o) => o.name)).size).toBe(OPTION_COUNT);
        expect(r.options.map((o) => o.name)).toContain(r.target.name);
        for (const o of r.options) expect(poolNames).toContain(o.name);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.4)).toEqual(generateRound(3, () => 0.4));
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
  it('uses the seeded colour as the target when in the level pool', () => {
    const round = generateRound(2, () => 0, 'green'); // green is in the L2 pool
    expect(round.target.name).toBe('green');
    expect(round.options.map((o) => o.name)).toContain('green');
    expect(round.options).toHaveLength(OPTION_COUNT);
  });

  it('ignores a colour outside the level pool', () => {
    const round = generateRound(1, () => 0, 'purple'); // L1 pool is red/blue/yellow
    expect(colorPoolForLevel(1).map((c) => c.name)).toContain(round.target.name);
  });
});
