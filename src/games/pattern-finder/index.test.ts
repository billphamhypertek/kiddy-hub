import { describe, it, expect } from 'vitest';
import { patternFinder } from './index';

describe('pattern-finder module', () => {
  it('declares the expected metadata', () => {
    expect(patternFinder.id).toBe('pattern-finder');
    expect(patternFinder.categoryId).toBe('logic');
    expect(patternFinder.levels).toBe(3);
    expect(typeof patternFinder.createScene).toBe('function');
  });
});
