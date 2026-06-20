import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

function Probe() {
  const reduced = usePrefersReducedMotion();
  return <span data-testid="v">{reduced ? 'reduced' : 'motion'}</span>;
}

afterEach(() => {
  // Restore any matchMedia we installed for a given test.
  // @ts-expect-error — jsdom omits matchMedia; we may have added it.
  delete window.matchMedia;
  vi.restoreAllMocks();
});

describe('usePrefersReducedMotion', () => {
  it('defaults to NOT reduced when matchMedia is absent (jsdom safe)', () => {
    expect(typeof window.matchMedia).not.toBe('function');
    render(<Probe />);
    expect(screen.getByTestId('v')).toHaveTextContent('motion');
  });

  it('reports reduced when the media query matches', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
    render(<Probe />);
    expect(screen.getByTestId('v')).toHaveTextContent('reduced');
  });

  it('subscribes to changes and cleans up the listener on unmount', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    let handler: ((e: MediaQueryListEvent) => void) | undefined;
    addEventListener.mockImplementation((_: string, h: (e: MediaQueryListEvent) => void) => {
      handler = h;
    });
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener,
      removeEventListener,
    }) as unknown as typeof window.matchMedia;

    const { unmount } = render(<Probe />);
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(screen.getByTestId('v')).toHaveTextContent('motion');

    act(() => handler?.({ matches: true } as MediaQueryListEvent));
    expect(screen.getByTestId('v')).toHaveTextContent('reduced');

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
