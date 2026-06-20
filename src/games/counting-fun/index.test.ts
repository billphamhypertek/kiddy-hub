import { describe, it, expect } from 'vitest';

import { countingFun } from './index';

describe('counting-fun module', () => {
  it('declares the expected metadata', () => {
    expect(countingFun.id).toBe('counting-fun');
    expect(countingFun.categoryId).toBe('numbers');
    expect(countingFun.levels).toBe(3);
    expect(typeof countingFun.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await countingFun.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
