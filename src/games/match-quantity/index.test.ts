import { describe, it, expect } from 'vitest';
import { matchQuantity } from './index';

describe('match-quantity module', () => {
  it('declares the expected metadata', () => {
    expect(matchQuantity.id).toBe('match-quantity');
    expect(matchQuantity.categoryId).toBe('numbers');
    expect(matchQuantity.levels).toBe(3);
    expect(typeof matchQuantity.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await matchQuantity.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
