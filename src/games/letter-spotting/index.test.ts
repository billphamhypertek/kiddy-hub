import { describe, it, expect } from 'vitest';
import { letterSpotting } from './index';

describe('letter-spotting module', () => {
  it('declares the expected metadata', () => {
    expect(letterSpotting.id).toBe('letter-spotting');
    expect(letterSpotting.categoryId).toBe('letters');
    expect(letterSpotting.levels).toBe(3);
    expect(typeof letterSpotting.createScene).toBe('function');
  });
});
