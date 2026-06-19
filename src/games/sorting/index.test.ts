import { describe, it, expect } from 'vitest';
import { sorting } from './index';

describe('sorting module', () => {
  it('declares the expected metadata', () => {
    expect(sorting.id).toBe('sorting');
    expect(sorting.categoryId).toBe('logic');
    expect(sorting.levels).toBe(3);
    expect(typeof sorting.createScene).toBe('function');
  });
});
