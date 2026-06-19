import { describe, it, expect } from 'vitest';
import { firstLetter } from './index';

describe('first-letter module', () => {
  it('declares the expected metadata', () => {
    expect(firstLetter.id).toBe('first-letter');
    expect(firstLetter.categoryId).toBe('letters');
    expect(firstLetter.levels).toBe(3);
    expect(typeof firstLetter.createScene).toBe('function');
  });
});
