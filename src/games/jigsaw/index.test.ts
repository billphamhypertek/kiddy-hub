import { describe, it, expect } from 'vitest';
import { jigsaw } from './index';

describe('jigsaw module', () => {
  it('declares the expected metadata', () => {
    expect(jigsaw.id).toBe('jigsaw');
    expect(jigsaw.categoryId).toBe('shapes');
    expect(jigsaw.levels).toBe(3);
    expect(typeof jigsaw.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await jigsaw.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
