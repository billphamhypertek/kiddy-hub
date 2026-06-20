import type { Screen } from './screens';
import { needsOnboarding } from './onboarding';

/**
 * Logical screen to render. Mirrors `Screen['name']` but collapses the
 * `who`/no-profile fallback into a single `who` kind so callers don't have to
 * re-derive it. Pure decision data — no React, no JSX.
 */
export type ScreenKind =
  | 'parentGate'
  | 'parent'
  | 'onboarding'
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
 * Decides which screen to show from the navigation state, whether a child
 * profile is currently selected (`hasProfile`), and whether ANY profile exists
 * at all (`hasAnyProfile`). This is the single source of the routing branch
 * that `App.tsx` renders.
 *
 * Order matters:
 *  1. `parentGate`/`parent` are matched FIRST. `hasProfile` is false while the
 *     parent gate is open (a profile is only set when a child is chosen, which
 *     also navigates away), so checking `!hasProfile` first would swallow those
 *     two screens and make the Parent Area unreachable — the exact regression
 *     review found in D1.
 *  2. First-run onboarding (`!hasAnyProfile`) is matched next: with zero
 *     profiles, any child-facing screen (incl. an explicit `onboarding`) routes
 *     to `onboarding` instead of the old text-only `who` dead-end. The
 *     parent-flow exclusion above means the parent area still wins.
 *
 * `hasAnyProfile` defaults to `true` so legacy two-arg callers (and existing
 * tests) keep their behaviour: no onboarding unless a caller opts in by passing
 * `false`.
 */
export function selectScreen(
  screen: Screen,
  hasProfile: boolean,
  hasAnyProfile = true,
): ScreenSelection {
  if (screen.name === 'parentGate') {
    return { key: 'parentGate', kind: 'parentGate' };
  }
  if (screen.name === 'parent') {
    return { key: 'parent', kind: 'parent' };
  }
  // First-run: no profiles yet → gentle Cáo-guided onboarding instead of the
  // bare zero-profile `who` screen. `needsOnboarding` already excludes the
  // parent flow (handled above) so this is safe to check before the `who`
  // fallback. The key embeds the step so the transition replays per step.
  if (!hasAnyProfile && needsOnboarding(0, screen)) {
    const step = screen.name === 'onboarding' ? screen.step : 'welcome';
    return { key: `onboarding:${step}`, kind: 'onboarding' };
  }
  if (screen.name === 'who' || screen.name === 'onboarding' || !hasProfile) {
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
  // screen.name === 'game' — `from` is intentionally NOT part of the key so the
  // deep-link ("Luyện tiếp") routes identically to a normal launch.
  return { key: `game:${screen.gameId}`, kind: 'game' };
}
