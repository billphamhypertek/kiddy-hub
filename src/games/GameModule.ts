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

export interface GameModule {
  id: string;
  categoryId: CategoryId;
  title: string;
  iconKey: string;
  skill: string;
  levels: number;
  createScene(host: GameHost, level: number): Phaser.Scene;
}
