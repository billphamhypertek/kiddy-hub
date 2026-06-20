import { describe, it, expect } from 'vitest';
import { oddOneOut } from './index';

describe('odd-one-out module', () => {
  it('declares the expected metadata', () => {
    expect(oddOneOut.id).toBe('odd-one-out');
    expect(oddOneOut.categoryId).toBe('logic');
    expect(oddOneOut.levels).toBe(3);
    expect(typeof oddOneOut.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await oddOneOut.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
