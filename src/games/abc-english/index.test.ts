import { describe, it, expect } from 'vitest';
import { abcEnglish } from './index';

describe('abc-english module', () => {
  it('declares the expected metadata', () => {
    expect(abcEnglish.id).toBe('abc-english');
    expect(abcEnglish.categoryId).toBe('english');
    expect(abcEnglish.levels).toBe(3);
    expect(typeof abcEnglish.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await abcEnglish.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
