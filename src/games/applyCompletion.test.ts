import { describe, it, expect, vi } from 'vitest';
import { applyCompletion } from './applyCompletion';
import type { GameResult } from './GameModule';

function makeDeps(overrides: Partial<Parameters<typeof applyCompletion>[0]> = {}) {
  const recordPlay = vi.fn().mockResolvedValue(undefined);
  return {
    deps: { profileId: 7, maxLevels: 3, recordPlay, ...overrides },
    recordPlay,
  };
}

const result = (level: number, stars: number): GameResult => ({
  gameId: 'counting-fun',
  level,
  score: stars >= 3 ? 5 : 3,
  stars,
});

describe('applyCompletion', () => {
  it('advances one level on a perfect (3-star) session below max', async () => {
    const { deps, recordPlay } = makeDeps();
    const stored = await applyCompletion(deps, result(1, 3));
    expect(stored).toBe(2);
    expect(recordPlay).toHaveBeenCalledWith(7, 'counting-fun', 2, 5);
  });

  it('does not advance past the max level', async () => {
    const { deps, recordPlay } = makeDeps();
    const stored = await applyCompletion(deps, result(3, 3));
    expect(stored).toBe(3);
    expect(recordPlay).toHaveBeenCalledWith(7, 'counting-fun', 3, 5);
  });

  it('keeps the level unchanged when not perfect', async () => {
    const { deps, recordPlay } = makeDeps();
    const stored = await applyCompletion(deps, result(2, 2));
    expect(stored).toBe(2);
    expect(recordPlay).toHaveBeenCalledWith(7, 'counting-fun', 2, 3);
  });

  it('does not persist stars itself (no double-count)', async () => {
    const { deps } = makeDeps();
    // applyCompletion has no addStars dependency at all; calling it must not throw.
    await expect(applyCompletion(deps, result(1, 3))).resolves.toBe(2);
  });
});
