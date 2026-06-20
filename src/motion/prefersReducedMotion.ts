/**
 * KiddyHub — `prefersReducedMotion` (Giai đoạn 4 · Phần D2).
 *
 * A plain (non-React) sibling of D1's `usePrefersReducedMotion` hook. The Phaser
 * scene layer lives outside React, so it cannot call a hook; this function reads
 * the same OS-level `prefers-reduced-motion` accessibility setting on demand and
 * is used by the shared Phaser motion helpers to decide whether to animate.
 *
 * jsdom (the test environment) does NOT implement `window.matchMedia`, so we
 * guard the access behind a feature check and default to "motion ON" (i.e. NOT
 * reduced) when it's unavailable — matching the hook's behaviour and the
 * real-world default for users with no preference set.
 *
 * GĐ5E1 — "Chế độ êm" (calm mode): the result is ORed with the synchronous
 * calm-mode mirror (`isCalmMode()`), so the parent's explicit calm setting forces
 * reduced motion across every Phaser call-site WITHOUT touching any of them. The
 * OR is one-directional: calm can only ADD a reason to reduce — it can never turn
 * motion ON over a guardian's OS reduce choice.
 */
import { isCalmMode } from './calmMode';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Returns `true` when the user (or their guardian) prefers reduced motion — either
 * because calm mode is on (synchronous mirror) OR the OS query matches. Read on
 * demand, right before deciding whether to play an animation. Defaults to `false`
 * (motion allowed) when `window.matchMedia` is unavailable (e.g. under jsdom) and
 * calm mode is off, so it never throws in tests or non-DOM environments.
 */
export function prefersReducedMotion(): boolean {
  if (isCalmMode()) return true;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}
