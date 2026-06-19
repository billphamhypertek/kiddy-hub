import type { AudioManager } from '../audio/AudioManager';
import type { GameHost, GameResult } from './GameModule';

export interface GameHostDeps {
  audio: Pick<AudioManager, 'speak' | 'speakText' | 'playSfx'>;
  onAward: (n: number) => void;
  onComplete: (result: GameResult) => void;
  onHome: () => void;
}

export function createGameHost(deps: GameHostDeps): GameHost {
  return {
    speak: (key) => deps.audio.speak(key),
    speakText: (text, lang) => deps.audio.speakText(text, lang),
    playSfx: (key) => deps.audio.playSfx(key),
    awardStars: (n) => deps.onAward(n),
    complete: (result) => deps.onComplete(result),
    goHome: () => deps.onHome(),
  };
}
