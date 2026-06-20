import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScreenTransition } from './ScreenTransition';

afterEach(() => {
  // @ts-expect-error — jsdom omits matchMedia; we may have added it.
  delete window.matchMedia;
  vi.restoreAllMocks();
});

describe('ScreenTransition', () => {
  it('wraps children with the animated class by default (motion on)', () => {
    const { container } = render(
      <ScreenTransition screenKey="map">
        <p>Hello</p>
      </ScreenTransition>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(container.querySelector('.screen-enter')).not.toBeNull();
    expect(container.querySelector('.screen-enter--off')).toBeNull();
  });

  it('renders without animation when reduced motion is preferred', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
    const { container } = render(
      <ScreenTransition screenKey="map">
        <p>Hello</p>
      </ScreenTransition>,
    );
    expect(container.querySelector('.screen-enter--off')).not.toBeNull();
    expect(container.querySelector('.screen-enter')).toBeNull();
  });

  it('remounts the wrapper when the screen key changes', () => {
    const { container, rerender } = render(
      <ScreenTransition screenKey="map">
        <p>One</p>
      </ScreenTransition>,
    );
    const first = container.querySelector('.screen-enter');
    rerender(
      <ScreenTransition screenKey="garden">
        <p>Two</p>
      </ScreenTransition>,
    );
    const second = container.querySelector('.screen-enter');
    expect(screen.getByText('Two')).toBeInTheDocument();
    // A different keyed node means React remounted (animation replays).
    expect(second).not.toBe(first);
  });
});
