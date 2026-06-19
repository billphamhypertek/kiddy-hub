import { registerGame } from './registry';
import { countingFun } from './counting-fun';

/** Registers every game module. Call once at app startup. */
export function registerAllGames(): void {
  registerGame(countingFun);
}
