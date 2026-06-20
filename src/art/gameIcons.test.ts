import { describe, it, expect } from 'vitest';
import { gameIcon, gameIconIds } from './gameIcons';
import { palette, outline } from './tokens';

describe('gameIcons — storybook surface (GĐ6.5)', () => {
  it('keeps all 16 game-icon ids stable', () => {
    expect(gameIconIds).toHaveLength(16);
  });

  it.each(gameIconIds)('icon %s wears painted badge + soft shadow + storybook ink', (id) => {
    const svg = gameIcon(id, 'Trò');
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(svg).toContain('<linearGradient'); // painted badge
    expect(svg).toContain('<filter'); // soft shadow
    expect(svg).toContain(`stroke="${outline.ink}"`);
    expect(svg).toContain('<title>Trò</title>');
  });

  it('counting-fun keeps the numbers (pink) category tint', () => {
    expect(gameIcon('counting-fun', '')).toContain(palette.island.numbers);
  });

  it('unknown id falls back to a painted accent badge (not blank)', () => {
    const svg = gameIcon('not-a-game', 'X');
    expect(svg).toContain('<linearGradient');
    expect(svg).toContain(palette.accent);
  });

  it('every url(#id) reference resolves within the same document', () => {
    for (const id of gameIconIds) {
      const svg = gameIcon(id, '');
      for (const m of svg.matchAll(/url\(#([a-z0-9-]+)\)/gi)) {
        expect(svg).toContain(`id="${m[1]}"`);
      }
    }
  });
});
