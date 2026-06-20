import { describe, it, expect } from 'vitest';
import { firstWords } from './index';

describe('first-words module', () => {
  it('declares the expected metadata', () => {
    expect(firstWords.id).toBe('first-words');
    expect(firstWords.categoryId).toBe('english');
    expect(firstWords.levels).toBe(3);
    expect(typeof firstWords.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await firstWords.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
