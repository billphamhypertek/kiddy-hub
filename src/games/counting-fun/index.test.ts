import { describe, it, expect, vi } from 'vitest';

// Phaser runs canvas-detection at module load time which fails under jsdom (no real WebGL/canvas).
// We stub the default export with a minimal Scene base-class so CountingFunScene can extend it
// without touching the DOM.  The test still imports the real countingFun module and asserts its
// metadata — the stub only prevents the Phaser bootstrap from crashing.
vi.mock('phaser', () => {
  class Scene {
    constructor(_config: unknown) {}
  }
  return { default: { Scene } };
});

import { countingFun } from './index';

describe('counting-fun module', () => {
  it('declares the expected metadata', () => {
    expect(countingFun.id).toBe('counting-fun');
    expect(countingFun.categoryId).toBe('numbers');
    expect(countingFun.levels).toBe(3);
    expect(typeof countingFun.createScene).toBe('function');
  });
});
