import { describe, it, expect } from 'vitest';
import { moreLess } from './index';

describe('more-less module', () => {
  it('declares the expected metadata', () => {
    expect(moreLess.id).toBe('more-less');
    expect(moreLess.categoryId).toBe('numbers');
    expect(moreLess.levels).toBe(3);
    expect(typeof moreLess.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await moreLess.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
