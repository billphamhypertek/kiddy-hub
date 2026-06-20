import { describe, it, expect } from 'vitest';
import { islandArt, mapBackdrop, islandIds } from './islands';
import { palette, outline } from './tokens';
import type { IslandKey } from './tokens';

describe('islands — storybook surface (GĐ6.5)', () => {
  it('keeps the six island ids stable', () => {
    expect([...islandIds].sort()).toEqual(
      ['english', 'letters', 'logic', 'memory', 'numbers', 'shapes'].sort(),
    );
  });

  it.each(islandIds)('island %s wears the painted + soft-shadow + ink surface', (id) => {
    const svg = islandArt(id as IslandKey, 'Đảo');
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(svg).toContain('<linearGradient'); // painted grass dome
    expect(svg).toContain('<filter'); // soft shadow
    expect(svg).toContain(`stroke="${outline.ink}"`); // storybook ink, not old palette.ink
    expect(svg).toContain('<title>Đảo</title>');
  });

  it.each(islandIds)('island %s keeps its category hue', (id) => {
    const svg = islandArt(id as IslandKey, '');
    expect(svg).toContain(palette.island[id as IslandKey]);
  });

  it('the map backdrop is decorative and wears the storybook soft shadow', () => {
    const svg = mapBackdrop();
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(svg).not.toContain('<title>'); // decorative — no accessible name
    expect(svg).toContain('<filter'); // soft shadow somewhere (sun/clouds)
  });

  it('namespaces every gradient/filter id per island document (refs resolve in-doc)', () => {
    const a = islandArt('numbers', '');
    const refs = [...a.matchAll(/url\(#([a-z0-9-]+)\)/gi)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const id of refs) expect(a).toContain(`id="${id}"`);
  });
});
