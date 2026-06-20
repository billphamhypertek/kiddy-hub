import { describe, it, expect } from 'vitest';
import { creature, emojiToCreatureId, CREATURE_IDS, COUNTING_CREATURE_IDS } from './creatures';
import { COUNTING_ANIMALS } from '../games/counting-fun/countingLogic';
import { WORD_BANK } from '../games/first-words/wordLogic';
import { WORD_BANK as FL_BANK } from '../games/first-letter/firstLetterLogic';
import { GROUPS as SORT_GROUPS } from '../games/sorting/sortingLogic';
import { EMOJI as MQ_EMOJI } from '../games/match-quantity/matchQuantityLogic';
import { GROUPS as ODD_GROUPS } from '../games/odd-one-out/oddOneOutLogic';
import { EMOJI as ML_EMOJI } from '../games/more-less/moreLessLogic';
import { TOKENS as PAT_TOKENS } from '../games/pattern-finder/patternLogic';

/**
 * GĐ6.2 — full parametric creature/object kit (spec §5). The DRAWING is browser-
 * verified; here we only lock the pure contracts:
 *   - every catalog id renders a valid storybook <svg> (painted gradient + soft
 *     shadow + ink stroke), never blank / never throws;
 *   - an unknown id falls back to a safe shape;
 *   - the emoji→id map covers EVERY game's content emoji with a known id, so no
 *     scene can ever fall through to a wrong / blank sprite.
 */
describe('creature kit — catalog', () => {
  it('renders a valid storybook <svg> for every catalog id', () => {
    expect(CREATURE_IDS.length).toBeGreaterThan(40);
    for (const id of CREATURE_IDS) {
      const svg = creature(id);
      expect(svg.startsWith('<svg'), `${id} should start <svg`).toBe(true);
      expect(svg, `${id} closes`).toContain('</svg>');
      // composes the storybook surface: painted gradient + soft shadow.
      expect(svg, `${id} painted`).toContain('linearGradient');
      expect(svg, `${id} shadow`).toContain('feDropShadow');
    }
  });

  it('falls back to a safe shape for an unknown id (never throws / never blank)', () => {
    const svg = creature('definitely-not-a-thing');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('feDropShadow');
  });

  it('still exposes the counting subset (6.1 API) inside the full catalog', () => {
    for (const id of COUNTING_CREATURE_IDS) {
      expect(CREATURE_IDS).toContain(id);
    }
  });
});

describe('creature kit — emoji coverage', () => {
  // Memory-match FACES are module-private; assert its literal set here.
  const MEMORY_FACES = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐸', '🐯', '🐵'];

  function expectMapped(emoji: string): void {
    const id = emojiToCreatureId(emoji);
    expect(CREATURE_IDS, `emoji ${emoji} → ${id} must be a known id`).toContain(id);
  }

  it('maps every counting-fun animal', () => {
    for (const e of COUNTING_ANIMALS) expectMapped(e);
  });
  it('maps every first-words item', () => {
    for (const lvl of [1, 2, 3] as const) for (const w of WORD_BANK[lvl]) expectMapped(w.emoji);
  });
  it('maps every first-letter item', () => {
    for (const e of FL_BANK) expectMapped(e.emoji);
  });
  it('maps every sorting item + basket label', () => {
    for (const g of SORT_GROUPS) {
      expectMapped(g.label);
      for (const e of g.items) expectMapped(e);
    }
  });
  it('maps every match-quantity emoji', () => {
    for (const e of MQ_EMOJI) expectMapped(e);
  });
  it('maps every odd-one-out emoji', () => {
    for (const g of ODD_GROUPS) for (const e of g) expectMapped(e);
  });
  it('maps every more-less emoji', () => {
    for (const e of ML_EMOJI) expectMapped(e);
  });
  it('maps every memory-match face', () => {
    for (const e of MEMORY_FACES) expectMapped(e);
  });
  it('maps every pattern-finder colour token', () => {
    for (const e of PAT_TOKENS) expectMapped(e);
  });

  it('gives an unknown emoji a stable known-id fallback (never blank)', () => {
    const id = emojiToCreatureId('🐙');
    expect(CREATURE_IDS).toContain(id);
  });
});
