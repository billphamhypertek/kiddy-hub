import { afterEach, describe, it, expect, vi } from 'vitest';
import { prefersReducedMotion } from './prefersReducedMotion';

afterEach(() => {
  // Restore any matchMedia we installed for a given test (jsdom omits it).
  // @ts-expect-error — jsdom omits matchMedia; we may have added it.
  delete window.matchMedia;
  vi.restoreAllMocks();
});

describe('prefersReducedMotion (plain, non-React)', () => {
  it('defaults to false (motion allowed) when matchMedia is absent (jsdom safe)', () => {
    expect(typeof window.matchMedia).not.toBe('function');
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns true when the reduce-motion media query matches', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(true);
  });

  it('returns false when the media query does not match', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
  });

  it('reads the value on every call (no caching)', () => {
    let matches = false;
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
    matches = true;
    expect(prefersReducedMotion()).toBe(true);
  });
});
