import { describe, it, expect } from 'vitest';

import { countingFun } from './index';

describe('counting-fun module', () => {
  it('declares the expected metadata', () => {
    expect(countingFun.id).toBe('counting-fun');
    expect(countingFun.categoryId).toBe('numbers');
    expect(countingFun.levels).toBe(3);
    expect(typeof countingFun.createScene).toBe('function');
  });
});
