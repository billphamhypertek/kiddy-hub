import type Phaser from 'phaser';
import type { CategoryId } from '../data/types';

export interface GameResult {
  gameId: string;
  level: number;
  score: number;
  stars: number;
}

export interface GameHost {
  speak(key: string): Promise<void>;
  /** Speak dynamic content (e.g. an English word) in the given language. */
  speakText(text: string, lang?: string): Promise<void>;
  playSfx(key: string): void;
  awardStars(n: number): void;
  complete(result: GameResult): void;
  goHome(): void;
}

/** Builds a fresh scene for a given host + level. Lives in the game's Scene
 *  module so importing it pulls in Phaser. */
export type SceneFactory = (host: GameHost, level: number) => Phaser.Scene;

export interface GameModule {
  id: string;
  categoryId: CategoryId;
  title: string;
  iconKey: string;
  skill: string;
  levels: number;
  /**
   * Lazily loads the game's scene factory. The module's top level stays
   * Phaser-free: it only references the heavy `<Name>Scene.ts` (and therefore
   * `phaser`) through this dynamic `import()`. This keeps the menu/registry
   * graph out of the initial bundle so Phaser loads only when a game starts.
   */
  loadScene(): Promise<SceneFactory>;
}
