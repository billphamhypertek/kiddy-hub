import { Howl } from 'howler';
import type { PlayFn } from './AudioManager';

/** Real audio engine. Returns a stop() handle for each clip. */
export function createHowlerPlayer(): PlayFn {
  return (src, onEnd) => {
    const howl = new Howl({ src: [src], html5: true });
    howl.once('end', onEnd);
    howl.play();
    return () => howl.stop();
  };
}
