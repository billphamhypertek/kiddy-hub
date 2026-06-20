import { describe, it, expect, vi } from 'vitest';
import { createPrerecordedEngine, type AudioPlayer, type ClipIndex } from './prerecordedEngine';
import type { SpeechEngine } from './speechEngine';

/** A fake player that records calls and lets the test fire onDone / cancel by hand. */
function fakePlayer() {
  const calls: Array<{ url: string; onDone: () => void; cancel: () => void; cancelled: boolean }> =
    [];
  const player: AudioPlayer = {
    play(url, onDone) {
      const rec = { url, onDone, cancel: () => {}, cancelled: false };
      rec.cancel = () => {
        rec.cancelled = true;
      };
      calls.push(rec);
      return rec.cancel;
    },
  };
  return { player, calls };
}

/** A fake fallback SpeechEngine (spy on speak; returns a cancel spy). */
function fakeFallback() {
  const cancel = vi.fn();
  const speak = vi.fn<SpeechEngine['speak']>(() => cancel);
  const fallback: SpeechEngine = { speak };
  return { fallback, speak, cancel };
}

const CLIPS: ClipIndex = {
  'vi-VN|Giỏi quá!': '/voice/aaa111.mp3',
  'en-US|A': '/voice/bbb222.mp3',
  'vi-VN|A': '/voice/ccc333.mp3',
};

describe('createPrerecordedEngine', () => {
  it('plays the clip for a known key and never touches the fallback', () => {
    const { player, calls } = fakePlayer();
    const { fallback, speak: fb } = fakeFallback();
    const engine = createPrerecordedEngine(CLIPS, fallback, player);

    const onDone = vi.fn();
    engine.speak('Giỏi quá!', 'vi-VN', onDone);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/voice/aaa111.mp3');
    expect(fb).not.toHaveBeenCalled();

    // onDone propagates when the player finishes.
    expect(onDone).not.toHaveBeenCalled();
    calls[0].onDone();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('cancel() pauses the player and resolves (idempotent)', () => {
    const { player, calls } = fakePlayer();
    const { fallback } = fakeFallback();
    const engine = createPrerecordedEngine(CLIPS, fallback, player);

    const cancel = engine.speak('Giỏi quá!', 'vi-VN', () => {});
    expect(calls[0].cancelled).toBe(false);
    cancel();
    expect(calls[0].cancelled).toBe(true);
    // Calling twice must not throw.
    expect(() => cancel()).not.toThrow();
  });

  it('delegates to the fallback when there is no clip', () => {
    const { player, calls } = fakePlayer();
    const { fallback, speak: fb, cancel: fbCancel } = fakeFallback();
    const engine = createPrerecordedEngine(CLIPS, fallback, player);

    const onDone = vi.fn();
    const cancel = engine.speak('Bông', 'vi-VN', onDone); // child name → no clip

    expect(calls).toHaveLength(0); // player untouched
    expect(fb).toHaveBeenCalledTimes(1);
    expect(fb).toHaveBeenCalledWith('Bông', 'vi-VN', onDone);

    // The returned cancel is the fallback's cancel.
    cancel();
    expect(fbCancel).toHaveBeenCalledTimes(1);
  });

  it('normalizes the lookup key as `${lang}|${text.trim()}`', () => {
    const { player, calls } = fakePlayer();
    const { fallback, speak: fb } = fakeFallback();
    const engine = createPrerecordedEngine(CLIPS, fallback, player);

    // Extra surrounding whitespace still matches the trimmed key.
    engine.speak('  Giỏi quá! ', 'vi-VN', () => {});
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/voice/aaa111.mp3');
    expect(fb).not.toHaveBeenCalled();
  });

  it('separates clips by language (same text, different lang)', () => {
    const { player, calls } = fakePlayer();
    const { fallback } = fakeFallback();
    const engine = createPrerecordedEngine(CLIPS, fallback, player);

    engine.speak('A', 'en-US', () => {});
    engine.speak('A', 'vi-VN', () => {});

    expect(calls.map((c) => c.url)).toEqual(['/voice/bbb222.mp3', '/voice/ccc333.mp3']);
  });

  it('is jsdom-safe with the real default player (Audio undefined → onDone now, no throw)', () => {
    // No player injected → real default AudioPlayer; jsdom has no `Audio`.
    const { fallback, speak: fb } = fakeFallback();
    const hadAudio = 'Audio' in globalThis;
    const prevAudio = (globalThis as { Audio?: unknown }).Audio;
    delete (globalThis as { Audio?: unknown }).Audio;
    try {
      const engine = createPrerecordedEngine(CLIPS, fallback);
      const onDone = vi.fn();
      expect(() => engine.speak('Giỏi quá!', 'vi-VN', onDone)).not.toThrow();
      // Has a clip, but no Audio → no-op that still resolves immediately.
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(fb).not.toHaveBeenCalled();
    } finally {
      if (hadAudio) (globalThis as { Audio?: unknown }).Audio = prevAudio;
    }
  });
});
