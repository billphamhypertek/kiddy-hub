import { describe, it, expect } from 'vitest';
import { CATEGORIES } from './categories';
import { AVATARS } from './avatars';

describe('content metadata', () => {
  it('defines exactly the 6 categories with unique ids', () => {
    expect(CATEGORIES).toHaveLength(6);
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(6);
    expect(ids).toContain('numbers');
    expect(ids).toContain('english');
  });

  it('gives every category a title, icon, colour and island position', () => {
    for (const c of CATEGORIES) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.icon.length).toBeGreaterThan(0);
      expect(c.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(c.islandPos.x).toBeGreaterThanOrEqual(0);
      expect(c.islandPos.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('provides several unique avatar options', () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(AVATARS.map((a) => a.key)).size).toBe(AVATARS.length);
  });
});
