import { describe, it, expect } from 'vitest';
import { spotDifference } from './index';

describe('spot-difference module', () => {
  it('declares the expected metadata', () => {
    expect(spotDifference.id).toBe('spot-difference');
    expect(spotDifference.categoryId).toBe('memory');
    expect(spotDifference.title).toBe('Tìm Điểm Khác');
    expect(spotDifference.skill).toBe('Quan sát chi tiết');
    expect(spotDifference.levels).toBe(3);
    expect(typeof spotDifference.loadScene).toBe('function');
  });

  it('lazily resolves a scene factory', async () => {
    const createScene = await spotDifference.loadScene();
    expect(typeof createScene).toBe('function');
  });
});
