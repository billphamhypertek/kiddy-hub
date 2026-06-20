import { describe, it, expect } from 'vitest';
import { avatarArt, avatarKeys } from './avatars';
import { outline } from './tokens';

describe('avatars — storybook surface (GĐ6.5)', () => {
  it('keeps the eight avatar keys stable', () => {
    expect([...avatarKeys].sort()).toEqual(
      ['bear', 'cat', 'dog', 'fox', 'frog', 'lion', 'panda', 'rabbit'].sort(),
    );
  });

  it.each(avatarKeys.filter((k) => k !== 'fox'))(
    'avatar %s wears painted + soft-shadow + storybook ink',
    (key) => {
      const svg = avatarArt(key, 'Bạn');
      expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
      expect(svg).toContain('<linearGradient'); // painted body
      expect(svg).toContain('<filter'); // soft shadow
      expect(svg).toContain(`stroke="${outline.ink}"`); // storybook ink
      expect(svg).toContain('<title>Bạn</title>');
    },
  );

  it('fox avatar still reuses the storybook mascot idle pose', () => {
    const svg = avatarArt('fox', 'Cáo');
    expect(svg).toContain('<linearGradient'); // foxIdle is already painted
    expect(svg).toContain('<title>Cáo</title>');
  });

  it('unknown key falls back to a drawn avatar (cat), not a blank', () => {
    const svg = avatarArt('unknown-xyz', 'X');
    expect(svg).toContain('<linearGradient');
    expect(svg).toContain('<title>X</title>');
  });

  it('every url(#id) reference resolves within the same document', () => {
    for (const key of avatarKeys) {
      const svg = avatarArt(key, '');
      for (const m of svg.matchAll(/url\(#([a-z0-9-]+)\)/gi)) {
        expect(svg).toContain(`id="${m[1]}"`);
      }
    }
  });
});
