export type PlayFn = (src: string, onEnd: () => void) => () => void;

export interface AudioManifest {
  voices: Record<string, string>;
  sfx: Record<string, string>;
}

export interface AudioManager {
  playSfx(key: string): void;
  speak(key: string): Promise<void>;
  stopVoice(): void;
  setSoundOn(on: boolean): void;
  setVoiceOn(on: boolean): void;
}

export function createAudioManager(play: PlayFn, manifest: AudioManifest): AudioManager {
  let soundOn = true;
  let voiceOn = true;
  let stopCurrentVoice: (() => void) | null = null;

  function stopVoice(): void {
    if (stopCurrentVoice) {
      stopCurrentVoice();
      stopCurrentVoice = null;
    }
  }

  return {
    playSfx(key) {
      if (!soundOn) return;
      const src = manifest.sfx[key];
      if (!src) return; // missing/empty -> silent no-op (placeholder phase)
      play(src, () => {});
    },
    speak(key) {
      return new Promise<void>((resolve) => {
        if (!voiceOn) return resolve();
        const src = manifest.voices[key];
        if (!src) return resolve(); // missing/empty -> silent no-op
        stopVoice();
        stopCurrentVoice = play(src, () => {
          stopCurrentVoice = null;
          resolve();
        });
      });
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
