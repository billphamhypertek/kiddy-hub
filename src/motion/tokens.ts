/**
 * KiddyHub — Motion tokens (Giai đoạn 4 · Phần D1).
 *
 * Single source of truth for animation timing across the app. Both the React /
 * CSS layer (D1) and the Phaser scenes (D2) import these so the whole product
 * shares one timing language. Keep the set tiny and tasteful: short durations,
 * a couple of standard easings, a small stagger step. Nothing here should be
 * hard-coded at a call site — import the token instead.
 *
 * Durations are in milliseconds. Easings are CSS `<easing-function>` strings;
 * D2 maps the conceptual easing name onto Phaser's `Easing` equivalents.
 */

/** Animation durations in milliseconds. */
export const durations = {
  /** Tiny acknowledgements (icon pop, tap feedback). */
  fast: 180,
  /** Screen cross-fade / element entrance — the default. */
  base: 250,
  /** Larger reveals that deserve a touch more time. */
  slow: 350,
} as const;

/** Standard easing curves as CSS `<easing-function>` strings. */
export const easings = {
  /** Calm ease-in-out for cross-fades and slides. */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Decelerate — good for things entering the screen. */
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  /** A gentle, child-friendly overshoot for pops (not bouncy-annoying). */
  pop: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
} as const;

/**
 * Per-item delay step for staggered list/grid entrances (ms). Each successive
 * item starts this much later than the previous one.
 */
export const stagger = {
  step: 50,
  /** Cap so a long list never feels slow — delay never exceeds this. */
  max: 600,
} as const;

export type DurationToken = keyof typeof durations;
export type EasingToken = keyof typeof easings;

/**
 * Stagger delay for the item at `index`, clamped to {@link stagger.max}.
 * Returns a value in milliseconds suitable for `animation-delay`.
 */
export function staggerDelayMs(index: number): number {
  return Math.min(index * stagger.step, stagger.max);
}

/**
 * The CSS custom properties that expose these tokens to stylesheets. Injected
 * once on the document root (see {@link injectMotionTokens}) so `.css` files can
 * reference `var(--motion-duration-base)` etc. and stay in sync with this file.
 */
export const MOTION_CSS_VARS: Record<string, string> = {
  '--motion-duration-fast': `${durations.fast}ms`,
  '--motion-duration-base': `${durations.base}ms`,
  '--motion-duration-slow': `${durations.slow}ms`,
  '--motion-ease-standard': easings.standard,
  '--motion-ease-enter': easings.enter,
  '--motion-ease-pop': easings.pop,
  '--motion-stagger-step': `${stagger.step}ms`,
};

/**
 * Write the motion tokens onto the document root as CSS custom properties.
 * Safe to call multiple times and safe in non-DOM environments (no-op when
 * `document` is absent, e.g. SSR). Idempotent.
 */
export function injectMotionTokens(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [name, value] of Object.entries(MOTION_CSS_VARS)) {
    root.style.setProperty(name, value);
  }
}
