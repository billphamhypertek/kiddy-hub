import { describe, it, expect } from 'vitest';
import { selectScreen } from './selectScreen';
import type { Screen } from './screens';

describe('selectScreen', () => {
  it('routes the who screen', () => {
    expect(selectScreen({ name: 'who' }, false)).toEqual({ key: 'who', kind: 'who' });
    // Even with a profile, an explicit `who` stays on who.
    expect(selectScreen({ name: 'who' }, true)).toEqual({ key: 'who', kind: 'who' });
  });

  it('routes the map screen (requires a profile)', () => {
    expect(selectScreen({ name: 'map' }, true)).toEqual({ key: 'map', kind: 'map' });
  });

  it('routes the category screen with a category-scoped key', () => {
    const screen: Screen = { name: 'category', categoryId: 'numbers' };
    expect(selectScreen(screen, true)).toEqual({ key: 'category:numbers', kind: 'category' });
  });

  it('routes the garden screen', () => {
    expect(selectScreen({ name: 'garden' }, true)).toEqual({ key: 'garden', kind: 'garden' });
  });

  it('routes the game screen with a game-scoped key', () => {
    const screen: Screen = { name: 'game', gameId: 'counting-fun', level: 2 };
    expect(selectScreen(screen, true)).toEqual({ key: 'game:counting-fun', kind: 'game' });
  });

  it('falls back to who when a profile-gated screen has no profile', () => {
    // map/category/garden/game all require a selected profile.
    expect(selectScreen({ name: 'map' }, false)).toEqual({ key: 'who', kind: 'who' });
    expect(selectScreen({ name: 'category', categoryId: 'logic' }, false)).toEqual({
      key: 'who',
      kind: 'who',
    });
    expect(selectScreen({ name: 'garden' }, false)).toEqual({ key: 'who', kind: 'who' });
    expect(selectScreen({ name: 'game', gameId: 'jigsaw', level: 1 }, false)).toEqual({
      key: 'who',
      kind: 'who',
    });
  });

  // ── D1 regression guard ─────────────────────────────────────────────────────
  // The parent screens MUST be matched before the `who || !hasProfile` fallback.
  // No profile is selected while the parent area is open, so an earlier
  // `!hasProfile` check would swallow these and make the Parent Area unreachable.
  it('selects the parent gate with no profile (NOT who)', () => {
    expect(selectScreen({ name: 'parentGate' }, false)).toEqual({
      key: 'parentGate',
      kind: 'parentGate',
    });
  });

  it('selects the parent area with no profile (NOT who)', () => {
    expect(selectScreen({ name: 'parent' }, false)).toEqual({ key: 'parent', kind: 'parent' });
  });

  it('keeps parent screens stable even if a profile happens to be set', () => {
    expect(selectScreen({ name: 'parentGate' }, true)).toEqual({
      key: 'parentGate',
      kind: 'parentGate',
    });
    expect(selectScreen({ name: 'parent' }, true)).toEqual({ key: 'parent', kind: 'parent' });
  });
});
