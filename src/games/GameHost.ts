import type { AudioManager } from '../audio/AudioManager';
import type { GameHost, GameResult } from './GameModule';
import type { MasterySession } from './masterySession';

export interface GameHostDeps {
  audio: Pick<AudioManager, 'speak' | 'speakText' | 'playSfx'>;
  onAward: (n: number) => void;
  onComplete: (result: GameResult) => void;
  onHome: () => void;
  /**
   * Optional in-memory spaced-repetition session (GĐ5B). When present, the host
   * exposes pickItem/recordItemResult/hint backed by it; when absent those
   * methods stay undefined and discrete games degrade to legacy behaviour.
   */
  session?: MasterySession;
}

export function createGameHost(deps: GameHostDeps): GameHost {
  const { session } = deps;
  return {
    speak: (key) => deps.audio.speak(key),
    speakText: (text, lang) => deps.audio.speakText(text, lang),
    playSfx: (key) => deps.audio.playSfx(key),
    awardStars: (n) => deps.onAward(n),
    complete: (result) => deps.onComplete(result),
    goHome: () => deps.onHome(),
    // SR/scaffolding methods exist only when a session was supplied, so a
    // host without one (tests, non-SR flows) keeps these undefined and
    // `host.pickItem?.()` calls in scenes are no-ops (legacy behaviour).
    ...(session
      ? {
          pickItem: (skillId, pool) => session.pick(skillId, pool),
          recordItemResult: (skillId, itemKey, correct) =>
            session.record(skillId, itemKey, correct),
          hint: (skillId, itemKey) => session.hintFor(skillId, itemKey),
        }
      : {}),
  };
}
