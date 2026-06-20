import { describe, it, expect } from 'vitest';
import { shapesColors } from './index';

describe('shapes-colors module', () => {
  it('declares the expected metadata', () => {
    expect(shapesColors.id).toBe('shapes-colors');
    expect(shapesColors.categoryId).toBe('shapes');
    expect(shapesColors.levels).toBe(3);
    expect(typeof shapesColors.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await shapesColors.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
