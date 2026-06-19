import type { CategoryId } from '../data/types';
import type { GameModule } from './GameModule';

const games = new Map<string, GameModule>();

export function registerGame(module: GameModule): void {
  games.set(module.id, module);
}

export function getGame(id: string): GameModule | undefined {
  return games.get(id);
}

export function getGamesByCategory(categoryId: CategoryId): GameModule[] {
  return [...games.values()].filter((g) => g.categoryId === categoryId);
}

export function allGames(): GameModule[] {
  return [...games.values()];
}

/** Test-only: reset registry state between tests. */
export function _clearRegistry(): void {
  games.clear();
}
