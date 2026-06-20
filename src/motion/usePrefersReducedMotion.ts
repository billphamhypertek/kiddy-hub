/**
 * KiddyHub — `usePrefersReducedMotion` hook (Giai đoạn 4 · Phần D1).
 *
 * Reads the OS-level `prefers-reduced-motion` accessibility setting and keeps
 * it live. When the user (or their guardian) has "reduce motion" turned on we
 * disable every non-essential animation in the app.
 *
 * jsdom (the test environment) does NOT implement `window.matchMedia`, so we
 * guard every access behind a feature check and default to "motion ON"
 * (i.e. NOT reduced) when it's unavailable. That keeps component tests from
 * crashing and matches the real-world default for users with no preference set.
 */
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Read the current value defensively (jsdom has no matchMedia). */
function readPrefersReduced(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

/**
 * Returns `true` when the user prefers reduced motion. Live-updates if the OS
 * setting changes while the app is open, and cleans up its listener on unmount.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(readPrefersReduced);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent): void => setReduced(e.matches);

    // Sync once in case the value changed between the initial render and effect.
    setReduced(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
