import type { Screen } from './screens';

/**
 * Logical screen to render. Mirrors `Screen['name']` but collapses the
 * `who`/no-profile fallback into a single `who` kind so callers don't have to
 * re-derive it. Pure decision data — no React, no JSX.
 */
export type ScreenKind =
  | 'parentGate'
  | 'parent'
  | 'who'
  | 'map'
  | 'category'
  | 'garden'
  | 'game';

export interface ScreenSelection {
  /** Stable identity for the active screen; drives the transition replay. */
  key: string;
  kind: ScreenKind;
}

/**
 * Decides which screen to show from the navigation state plus whether a child
 * profile is currently selected. This is the single source of the routing
 * branch that `App.tsx` renders.
 *
 * Order matters: `parentGate` and `parent` MUST be matched before the
 * `who || !hasProfile` fallback. `hasProfile` is false while the parent gate is
 * open (a profile is only set when a child is chosen, which also navigates
 * away), so checking `!hasProfile` first would swallow those two screens and
 * make the Parent Area unreachable — the exact regression review found in D1.
 */
export function selectScreen(screen: Screen, hasProfile: boolean): ScreenSelection {
  if (screen.name === 'parentGate') {
    return { key: 'parentGate', kind: 'parentGate' };
  }
  if (screen.name === 'parent') {
    return { key: 'parent', kind: 'parent' };
  }
  if (screen.name === 'who' || !hasProfile) {
    return { key: 'who', kind: 'who' };
  }
  if (screen.name === 'map') {
    return { key: 'map', kind: 'map' };
  }
  if (screen.name === 'category') {
    return { key: `category:${screen.categoryId}`, kind: 'category' };
  }
  if (screen.name === 'garden') {
    return { key: 'garden', kind: 'garden' };
  }
  // screen.name === 'game'
  return { key: `game:${screen.gameId}`, kind: 'game' };
}
