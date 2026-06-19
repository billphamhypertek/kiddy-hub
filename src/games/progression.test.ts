import { describe, it, expect } from 'vitest';
import { nextLevel } from './progression';

describe('nextLevel', () => {
  it('advances one level after a perfect game', () => {
    expect(nextLevel(3, 1, 3)).toBe(2);
    expect(nextLevel(3, 2, 3)).toBe(3);
  });
  it('caps at the max level', () => {
    expect(nextLevel(3, 3, 3)).toBe(3);
  });
  it('does not advance on an imperfect game', () => {
    expect(nextLevel(2, 1, 3)).toBe(1);
    expect(nextLevel(0, 1, 3)).toBe(1);
  });
});
