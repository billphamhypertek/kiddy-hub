import { describe, it, expect, vi } from 'vitest';
import { createAudioManager, type PlayFn } from './AudioManager';

const MANIFEST = {
  voices: { hello: 'hello.mp3', empty: '' },
  sfx: { tap: 'tap.mp3' },
};

function makePlay() {
  const calls: { src: string; onEnd: () => void }[] = [];
  const stop = vi.fn();
  const play: PlayFn = (src, onEnd) => {
    calls.push({ src, onEnd });
    return stop;
  };
  return { play, calls, stop };
}

describe('AudioManager', () => {
  it('plays a known sfx by key', () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    am.playSfx('tap');
    expect(calls).toHaveLength(1);
    expect(calls[0].src).toBe('tap.mp3');
  });

  it('does not play sfx when sound is off', () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    am.setSoundOn(false);
    am.playSfx('tap');
    expect(calls).toHaveLength(0);
  });

  it('resolves speak() immediately for an empty/missing source', async () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    await expect(am.speak('empty')).resolves.toBeUndefined();
    await expect(am.speak('does-not-exist')).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('resolves speak() when playback fires onEnd', async () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    const promise = am.speak('hello');
    expect(calls).toHaveLength(1);
    calls[0].onEnd(); // simulate clip finishing
    await expect(promise).resolves.toBeUndefined();
  });

  it('stops the previous voice clip when a new one starts', () => {
    const { play, stop } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    am.speak('hello');
    am.speak('hello');
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('resolves speak() immediately when voice is off', async () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    am.setVoiceOn(false);
    await expect(am.speak('hello')).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });
});
