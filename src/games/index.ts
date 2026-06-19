import { registerGame } from './registry';
import { countingFun } from './counting-fun';
import { letterSpotting } from './letter-spotting';
import { patternFinder } from './pattern-finder';
import { firstWords } from './first-words';
import { memoryMatch } from './memory-match';
import { jigsaw } from './jigsaw';
import { moreLess } from './more-less';
import { firstLetter } from './first-letter';
import { oddOneOut } from './odd-one-out';

/** Registers every game module. Call once at app startup. */
export function registerAllGames(): void {
  registerGame(countingFun);
  registerGame(letterSpotting);
  registerGame(patternFinder);
  registerGame(firstWords);
  registerGame(memoryMatch);
  registerGame(jigsaw);
  registerGame(moreLess);
  registerGame(firstLetter);
  registerGame(oddOneOut);
}
