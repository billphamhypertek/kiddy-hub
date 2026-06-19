import type { GameHost, GameModule } from '../GameModule';
import { NumbersEnglishScene } from './NumbersEnglishScene';

export const numbersEnglish: GameModule = {
  id: 'numbers-english',
  categoryId: 'english',
  title: 'Numbers 1–10',
  iconKey: '🔟',
  skill: 'Số đếm EN',
  levels: 3,
  createScene: (host: GameHost, level: number) => new NumbersEnglishScene(host, level),
};
