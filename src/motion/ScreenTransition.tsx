/**
 * KiddyHub — `<ScreenTransition>` wrapper (Giai đoạn 4 · Phần D1).
 *
 * Plays a short ENTER animation (cross-fade + subtle slide-up, ~250ms) whenever
 * the active screen changes. The animation is keyed off `screenKey`: changing
 * the key remounts the inner wrapper so the CSS entrance animation re-runs.
 *
 * Enter-only by design — we deliberately avoid exit choreography to keep things
 * simple and robust (no orphaned timers, no double-mount). When the user
 * prefers reduced motion we render the children instantly with no animation.
 */
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

interface Props {
  /** Identifier of the active screen. Changing it replays the entrance. */
  screenKey: string;
  children: ReactNode;
}

export function ScreenTransition({ screenKey, children }: Props): JSX.Element {
  const reduced = usePrefersReducedMotion();

  // `key` forces React to remount on screen change so the CSS animation re-runs.
  // With reduced motion we render a plain wrapper (no animation class).
  return (
    <div key={screenKey} className={reduced ? 'screen-enter--off' : 'screen-enter'}>
      {children}
    </div>
  );
}
