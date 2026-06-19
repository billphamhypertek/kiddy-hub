/**
 * The level to persist after a session. A perfect (3-star) game advances one
 * level, capped at the game's max; otherwise the level is unchanged.
 */
export function nextLevel(stars: number, currentLevel: number, maxLevels: number): number {
  return stars >= 3 && currentLevel < maxLevels ? currentLevel + 1 : currentLevel;
}
