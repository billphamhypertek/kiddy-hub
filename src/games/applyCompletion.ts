import { nextLevel } from './progression';
import type { GameResult } from './GameModule';

export interface CompletionDeps {
  profileId: number;
  maxLevels: number;
  recordPlay: (profileId: number, gameId: string, level: number, score: number) => Promise<void>;
}

/**
 * Persists a finished session: computes the auto-advanced level (a perfect
 * 3-star game bumps one level, capped at maxLevels) and records the play.
 * Stars are NOT persisted here — they were already added via host.awardStars
 * -> onAward, so this keeps the no-double-count guarantee. Returns the level
 * that was stored.
 */
export async function applyCompletion(deps: CompletionDeps, result: GameResult): Promise<number> {
  const newLevel = nextLevel(result.stars, result.level, deps.maxLevels);
  await deps.recordPlay(deps.profileId, result.gameId, newLevel, result.score);
  return newLevel;
}
