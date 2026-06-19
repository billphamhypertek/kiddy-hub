import { describe, it, expect, vi } from 'vitest';
import { createAudioManager, type AudioManifest } from './AudioManager';
import type { SpeechEngine } from './speechEngine';
import type { SfxEngine } from './sfxEngine';

const MANIFEST: AudioManifest = {
  voices: {
    hello: { text: 'Xin chào', lang: 'vi-VN' },
  },
  sfx: ['tap', 'correct'],
};

/** Fake speech engine that records calls and lets the test control completion. */
function makeSpeech() {
  const calls: { text: string; lang: string; onDone: () => void }[] = [];
  const cancels: ReturnType<typeof vi.fn>[] = [];
  const speech: SpeechEngine = {
    speak(text, lang, onDone) {
      const cancel = vi.fn();
      calls.push({ text, lang, onDone });
      cancels.push(cancel);
      return cancel;
    },
  };
  return { speech, calls, cancels };
}

function makeSfx() {
  const played: string[] = [];
  const sfx: SfxEngine = { play: (name) => played.push(name) };
  return { sfx, played };
}

describe('AudioManager', () => {
  it('plays a known sfx by name', () => {
    const { speech } = makeSpeech();
    const { sfx, played } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    am.playSfx('tap');
    expect(played).toEqual(['tap']);
  });

  it('does not play sfx when sound is off', () => {
    const { speech } = makeSpeech();
    const { sfx, played } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    am.setSoundOn(false);
    am.playSfx('tap');
    expect(played).toEqual([]);
  });

  it('speaks a known voice key with its text + lang', () => {
    const { speech, calls } = makeSpeech();
    const { sfx } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    void am.speak('hello');
    expect(calls).toHaveLength(1);
    expect(calls[0].text).toBe('Xin chào');
    expect(calls[0].lang).toBe('vi-VN');
  });

  it('resolves speak() when the engine reports done', async () => {
    const { speech, calls } = makeSpeech();
    const { sfx } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    const promise = am.speak('hello');
    calls[0].onDone();
    await expect(promise).resolves.toBeUndefined();
  });

  it('resolves speak() immediately when the key is missing', async () => {
    const { speech, calls } = makeSpeech();
    const { sfx } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    await expect(am.speak('does-not-exist')).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('resolves speak() immediately when voice is off', async () => {
    const { speech, calls } = makeSpeech();
    const { sfx } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    am.setVoiceOn(false);
    await expect(am.speak('hello')).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('resolves the previous speak() and cancels it when a new one preempts', async () => {
    const { speech, cancels } = makeSpeech();
    const { sfx } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    const first = am.speak('hello');
    void am.speak('hello'); // preempts the first
    expect(cancels[0]).toHaveBeenCalledTimes(1);
    await expect(first).resolves.toBeUndefined(); // not left hanging
  });

  it('stopVoice cancels and resolves the current speak()', async () => {
    const { speech, cancels } = makeSpeech();
    const { sfx } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    const promise = am.speak('hello');
    am.stopVoice();
    expect(cancels[0]).toHaveBeenCalledTimes(1);
    await expect(promise).resolves.toBeUndefined();
  });

  it('speakText reads arbitrary text with the given lang', async () => {
    const { speech, calls } = makeSpeech();
    const { sfx } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    const promise = am.speakText('seven', 'en-US');
    expect(calls).toHaveLength(1);
    expect(calls[0].text).toBe('seven');
    expect(calls[0].lang).toBe('en-US');
    calls[0].onDone();
    await expect(promise).resolves.toBeUndefined();
  });

  it('speakText defaults to vi-VN and resolves immediately when voice is off or text empty', async () => {
    const { speech, calls } = makeSpeech();
    const { sfx } = makeSfx();
    const am = createAudioManager(speech, sfx, MANIFEST);
    void am.speakText('Na');
    expect(calls[0].lang).toBe('vi-VN');

    am.setVoiceOn(false);
    await expect(am.speakText('Na')).resolves.toBeUndefined();
    am.setVoiceOn(true);
    await expect(am.speakText('')).resolves.toBeUndefined();
    expect(calls).toHaveLength(1); // only the first call reached the engine
  });
});
