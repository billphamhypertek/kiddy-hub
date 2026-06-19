import type { SpeechEngine } from './speechEngine';
import type { SfxEngine } from './sfxEngine';

export interface VoiceEntry {
  text: string;
  lang: string;
}

export interface AudioManifest {
  voices: Record<string, VoiceEntry>;
  sfx: string[];
}

export interface AudioManager {
  playSfx(name: string): void;
  /** Speak a static voice key from the manifest. */
  speak(key: string): Promise<void>;
  /** Speak arbitrary dynamic content (e.g. an English word). */
  speakText(text: string, lang?: string): Promise<void>;
  stopVoice(): void;
  setSoundOn(on: boolean): void;
  setVoiceOn(on: boolean): void;
}

export function createAudioManager(
  speech: SpeechEngine,
  sfx: SfxEngine,
  manifest: AudioManifest,
): AudioManager {
  let soundOn = true;
  let voiceOn = true;
  // Cancel handle for the utterance currently speaking (key or dynamic text).
  let cancelCurrent: (() => void) | null = null;

  function stopVoice(): void {
    if (cancelCurrent) {
      const cancel = cancelCurrent;
      cancelCurrent = null;
      cancel(); // resolves the pending promise via its onDone wrapper
    }
  }

  /** Shared speak path. Resolves on done, on preempt/cancel, and when off/empty. */
  function utter(text: string, lang: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!voiceOn || !text) return resolve();
      // Preempt any current voice so a newer line takes over cleanly. The old
      // line's promise resolves via its own onDone wrapper.
      stopVoice();
      let settled = false;
      let rawCancel: (() => void) | null = null;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        // Only clear the global handle if we're still the active utterance.
        if (cancelCurrent === handle) cancelCurrent = null;
        resolve();
      };
      // The handle both cancels the engine and settles this promise. Defined
      // before speech.speak() so a synchronous onDone (e.g. the no-op path of a
      // real engine without speechSynthesis) doesn't hit the temporal dead zone.
      const handle = (): void => {
        rawCancel?.();
        finish();
      };
      cancelCurrent = handle;
      rawCancel = speech.speak(text, lang, finish);
    });
  }

  return {
    playSfx(name) {
      if (!soundOn) return;
      sfx.play(name);
    },
    speak(key) {
      const entry = manifest.voices[key];
      if (!entry) return Promise.resolve(); // missing key -> silent no-op
      return utter(entry.text, entry.lang);
    },
    speakText(text, lang = 'vi-VN') {
      return utter(text, lang);
    },
    stopVoice,
    setSoundOn(on) {
      soundOn = on;
    },
    setVoiceOn(on) {
      voiceOn = on;
    },
  };
}
