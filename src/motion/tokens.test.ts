import { describe, it, expect } from 'vitest';
import {
  durations,
  easings,
  stagger,
  staggerDelayMs,
  MOTION_CSS_VARS,
  injectMotionTokens,
} from './tokens';

describe('motion tokens', () => {
  it('keeps durations short and tasteful (180–350ms)', () => {
    for (const ms of Object.values(durations)) {
      expect(ms).toBeGreaterThanOrEqual(180);
      expect(ms).toBeLessThanOrEqual(350);
    }
  });

  it('exposes standard easing strings', () => {
    expect(easings.standard).toMatch(/cubic-bezier/);
    expect(easings.enter).toMatch(/cubic-bezier/);
    expect(easings.pop).toMatch(/cubic-bezier/);
  });

  it('computes a per-index stagger delay clamped to the max', () => {
    expect(staggerDelayMs(0)).toBe(0);
    expect(staggerDelayMs(2)).toBe(2 * stagger.step);
    expect(staggerDelayMs(1000)).toBe(stagger.max);
  });

  it('injects the token CSS custom properties onto :root', () => {
    injectMotionTokens();
    const root = document.documentElement;
    for (const name of Object.keys(MOTION_CSS_VARS)) {
      expect(root.style.getPropertyValue(name)).not.toBe('');
    }
    expect(root.style.getPropertyValue('--motion-duration-base')).toBe('250ms');
  });
});
