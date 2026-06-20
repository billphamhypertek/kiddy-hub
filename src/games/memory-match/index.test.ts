import { describe, it, expect } from 'vitest';
import { memoryMatch } from './index';

describe('memory-match module', () => {
  it('declares the expected metadata', () => {
    expect(memoryMatch.id).toBe('memory-match');
    expect(memoryMatch.categoryId).toBe('memory');
    expect(memoryMatch.levels).toBe(3);
    expect(typeof memoryMatch.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await memoryMatch.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
