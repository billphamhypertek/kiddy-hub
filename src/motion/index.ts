/**
 * KiddyHub — Motion foundation barrel (Giai đoạn 4 · Phần D1).
 *
 * Shared timing language + reduced-motion plumbing used by the React/CSS layer
 * (D1) and, later, the Phaser scenes (D2). Import from `../motion` rather than
 * reaching into individual files.
 */
export {
  durations,
  easings,
  stagger,
  staggerDelayMs,
  injectMotionTokens,
  MOTION_CSS_VARS,
} from './tokens';
export type { DurationToken, EasingToken } from './tokens';
export { usePrefersReducedMotion } from './usePrefersReducedMotion';
export { prefersReducedMotion } from './prefersReducedMotion';
export { ScreenTransition } from './ScreenTransition';
