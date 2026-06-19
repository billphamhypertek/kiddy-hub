/**
 * Pluggable sound-effects engine. The real implementation synthesises short,
 * pleasant blips with the Web Audio API (no audio files); tests inject a fake.
 */
export interface SfxEngine {
  play(name: string): void;
}

type NoteOsc = OscillatorNode['type'];

interface Note {
  freq: number;
  start: number; // seconds, offset from now
  duration: number; // seconds
  type?: NoteOsc;
  gain?: number; // peak gain (0..1)
}

// Each effect is a tiny sequence of notes with a quick gain envelope.
const RECIPES: Record<string, Note[]> = {
  // Short, soft click.
  tap: [{ freq: 600, start: 0, duration: 0.08, type: 'sine', gain: 0.18 }],
  // Cheerful rising two-note "ding-ding".
  correct: [
    { freq: 660, start: 0, duration: 0.12, type: 'sine', gain: 0.22 },
    { freq: 880, start: 0.12, duration: 0.16, type: 'sine', gain: 0.22 },
  ],
  // Low, gentle buzz (not harsh).
  wrong: [{ freq: 160, start: 0, duration: 0.22, type: 'square', gain: 0.14 }],
  // Sparkle: three quick ascending high notes.
  star: [
    { freq: 880, start: 0, duration: 0.1, type: 'triangle', gain: 0.18 },
    { freq: 1175, start: 0.1, duration: 0.1, type: 'triangle', gain: 0.18 },
    { freq: 1568, start: 0.2, duration: 0.16, type: 'triangle', gain: 0.18 },
  ],
};

/**
 * Real engine backed by the Web Audio API. A single `AudioContext` is created
 * lazily on first use and `resume()`d to satisfy browser autoplay policy.
 * Unknown names and missing Web Audio support are safe no-ops.
 */
export function createWebAudioSfxEngine(): SfxEngine {
  let ctx: AudioContext | null = null;

  function ensureCtx(): AudioContext | null {
    if (ctx) return ctx;
    const Ctor =
      typeof window !== 'undefined'
        ? (window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext)
        : undefined;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  }

  function playNote(audio: AudioContext, note: Note): void {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const t0 = audio.currentTime + note.start;
    const peak = note.gain ?? 0.2;
    osc.type = note.type ?? 'sine';
    osc.frequency.setValueAtTime(note.freq, t0);
    // Quick attack, exponential-ish decay to avoid clicks/pops.
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + note.duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + note.duration + 0.02);
  }

  return {
    play(name) {
      const recipe = RECIPES[name];
      if (!recipe) return; // unknown effect -> no-op
      const audio = ensureCtx();
      if (!audio) return; // no Web Audio support -> no-op
      // Autoplay policy: contexts can start suspended until a user gesture.
      void audio.resume?.();
      for (const note of recipe) playNote(audio, note);
    },
  };
}
