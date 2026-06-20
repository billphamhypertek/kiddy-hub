import { describe, it, expect } from 'vitest';
import { creature, emojiToCreatureId, COUNTING_CREATURE_IDS } from './creaturesCounting';
import { COUNTING_ANIMALS } from '../games/counting-fun/countingLogic';

/**
 * GĐ6.1 — minimal creature kit for the counting-fun pilot (spec §10). The DRAWING
 * is browser-verified; here we only lock the pure contracts: every id renders a
 * valid <svg>, an unknown id falls back safely (never blank / never throws), and
 * the emoji→id map covers exactly the counting animals.
 */
describe('creature kit (counting subset)', () => {
  it('renders a valid <svg> for every counting id', () => {
    for (const id of COUNTING_CREATURE_IDS) {
      const svg = creature(id);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('</svg>');
      // composes the storybook surface: a painted gradient + soft shadow.
      expect(svg).toContain('linearGradient');
      expect(svg).toContain('feDropShadow');
    }
  });

  it('falls back to a safe shape for an unknown id (never throws / never blank)', () => {
    const svg = creature('not-an-animal');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('feDropShadow');
  });

  it('maps every counting-fun emoji to a known creature id', () => {
    for (const emoji of COUNTING_ANIMALS) {
      const id = emojiToCreatureId(emoji);
      expect(COUNTING_CREATURE_IDS).toContain(id);
    }
  });

  it('gives an unknown emoji a stable fallback id', () => {
    const id = emojiToCreatureId('🐙');
    expect(COUNTING_CREATURE_IDS).toContain(id);
  });
});
