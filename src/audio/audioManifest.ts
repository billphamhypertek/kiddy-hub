import type { AudioManifest } from './AudioManager';

// Phase 1 uses placeholder/empty sources. AudioManager treats '' as a silent
// no-op, so the app runs with no audio files. Real assets land in Phase 4.
export const AUDIO_MANIFEST: AudioManifest = {
  voices: {
    'counting.prompt': '',
    'feedback.correct': '',
    'feedback.tryagain': '',
    'reward.cheer': '',
    'who.title': '',
  },
  sfx: {
    tap: '',
    correct: '',
    wrong: '',
    star: '',
  },
};
