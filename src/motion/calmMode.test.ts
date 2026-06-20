import { afterEach, describe, it, expect, vi } from 'vitest';
import { setCalmMode, isCalmMode, subscribeCalmMode } from './calmMode';

afterEach(() => {
  // Always reset the module-level mirror so tests don't bleed into each other.
  setCalmMode(false);
  vi.restoreAllMocks();
});

describe('calmMode module mirror', () => {
  it('defaults to off (false)', () => {
    expect(isCalmMode()).toBe(false);
  });

  it('round-trips setCalmMode → isCalmMode', () => {
    setCalmMode(true);
    expect(isCalmMode()).toBe(true);
    setCalmMode(false);
    expect(isCalmMode()).toBe(false);
  });

  it('notifies subscribers when the value changes', () => {
    const seen: boolean[] = [];
    const unsubscribe = subscribeCalmMode((on) => seen.push(on));
    setCalmMode(true);
    setCalmMode(false);
    unsubscribe();
    setCalmMode(true); // after unsubscribe — must NOT be observed
    expect(seen).toEqual([true, false]);
  });

  it('does not notify when the value is unchanged (no spurious renders)', () => {
    const cb = vi.fn();
    const unsubscribe = subscribeCalmMode(cb);
    setCalmMode(false); // already false
    expect(cb).not.toHaveBeenCalled();
    setCalmMode(true);
    setCalmMode(true); // same value again
    expect(cb).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('subscribe returns an idempotent unsubscribe', () => {
    const cb = vi.fn();
    const unsubscribe = subscribeCalmMode(cb);
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
    setCalmMode(true);
    expect(cb).not.toHaveBeenCalled();
  });
});
