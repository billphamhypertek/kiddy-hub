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
 *
 * GĐ5E1 — "Chế độ êm" (calm mode): the value is ORed with the synchronous
 * calm-mode mirror, and the hook subscribes to its tiny pub-sub so a parent
 * toggling calm mode live-updates every consumer without prop-drilling. The OR is
 * one-directional — calm can only ADD reduce, never force motion ON over the OS.
 */
import { useEffect, useState } from 'react';
import { isCalmMode, subscribeCalmMode } from './calmMode';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Read the OS query defensively (jsdom has no matchMedia). */
function readOsReduced(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

/** Effective reduced = calm mode OR the OS preference. */
function readPrefersReduced(): boolean {
  return isCalmMode() || readOsReduced();
}

/**
 * Returns `true` when reduced motion is in effect — because calm mode is on OR
 * the OS prefers reduced motion. Live-updates if either the OS setting OR the
 * calm-mode toggle changes while the app is open, and cleans up both listeners
 * on unmount.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(readPrefersReduced);

  useEffect(() => {
    // Calm-mode toggle (pub-sub) re-reads the full effective value — works even
    // under jsdom (no matchMedia). The OS `change` event honours the event's own
    // `matches` (ORed with calm) so it reflects the new OS state immediately.
    const syncEffective = (): void => setReduced(readPrefersReduced());
    const unsubscribeCalm = subscribeCalmMode(syncEffective);

    let mql: MediaQueryList | undefined;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      mql = window.matchMedia(QUERY);
      const onOsChange = (e: MediaQueryListEvent): void => setReduced(isCalmMode() || e.matches);
      mql.addEventListener('change', onOsChange);
      // Sync once in case the value changed between the initial render and effect.
      syncEffective();
      return () => {
        unsubscribeCalm();
        mql?.removeEventListener('change', onOsChange);
      };
    }

    // No matchMedia (jsdom): still sync once and keep the calm subscription.
    syncEffective();
    return unsubscribeCalm;
  }, []);

  return reduced;
}
