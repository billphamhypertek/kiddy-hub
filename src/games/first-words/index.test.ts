import { describe, it, expect } from 'vitest';
import { firstWords } from './index';

describe('first-words module', () => {
  it('declares the expected metadata', () => {
    expect(firstWords.id).toBe('first-words');
    expect(firstWords.categoryId).toBe('english');
    expect(firstWords.levels).toBe(3);
    expect(typeof firstWords.createScene).toBe('function');
  });
});
