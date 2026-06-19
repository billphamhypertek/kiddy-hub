import { describe, it, expect } from 'vitest';
import { colorsEnglish } from './index';

describe('colors-english module', () => {
  it('declares the expected metadata', () => {
    expect(colorsEnglish.id).toBe('colors-english');
    expect(colorsEnglish.categoryId).toBe('english');
    expect(colorsEnglish.levels).toBe(3);
    expect(typeof colorsEnglish.createScene).toBe('function');
  });
});
