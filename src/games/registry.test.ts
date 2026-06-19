import { describe, it, expect, beforeEach } from 'vitest';
import { registerGame, getGame, getGamesByCategory, allGames, _clearRegistry } from './registry';
import type { GameModule } from './GameModule';

function fakeGame(id: string, categoryId: GameModule['categoryId']): GameModule {
  return {
    id,
    categoryId,
    title: id,
    iconKey: '🎲',
    skill: 'test',
    levels: 3,
    createScene: () => ({}) as never,
  };
}

beforeEach(() => _clearRegistry());

describe('game registry', () => {
  it('registers and looks up by id', () => {
    registerGame(fakeGame('a', 'numbers'));
    expect(getGame('a')?.id).toBe('a');
    expect(getGame('missing')).toBeUndefined();
  });

  it('filters by category', () => {
    registerGame(fakeGame('a', 'numbers'));
    registerGame(fakeGame('b', 'numbers'));
    registerGame(fakeGame('c', 'logic'));
    expect(getGamesByCategory('numbers').map((g) => g.id)).toEqual(['a', 'b']);
    expect(allGames()).toHaveLength(3);
  });
});
