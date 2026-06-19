import type { AudioManifest } from './AudioManager';

// Phase 1 uses placeholder/empty sources. AudioManager treats '' as a silent
// no-op, so the app runs with no audio files. Real assets land in Phase 4.
export const AUDIO_MANIFEST: AudioManifest = {
  voices: {
    'counting.prompt': '',
    'letter.prompt': '',
    'pattern.prompt': '',
    'firstwords.prompt': '',
    'memory.prompt': '',
    'jigsaw.prompt': '',
    'moreless.prompt': '',
    'firstletter.prompt': '',
    'oddoneout.prompt': '',
    'abc.prompt': '',
    'numbersen.prompt': '',
    'shapecolor.prompt': '',
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
