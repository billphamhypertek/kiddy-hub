import { describe, it, expect } from 'vitest';
import { numbersEnglish } from './index';

describe('numbers-english module', () => {
  it('declares the expected metadata', () => {
    expect(numbersEnglish.id).toBe('numbers-english');
    expect(numbersEnglish.categoryId).toBe('english');
    expect(numbersEnglish.levels).toBe(3);
    expect(typeof numbersEnglish.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await numbersEnglish.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
