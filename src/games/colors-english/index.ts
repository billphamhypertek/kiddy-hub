import type { GameHost, GameModule } from '../GameModule';
import { ColorsEnglishScene } from './ColorsEnglishScene';

export const colorsEnglish: GameModule = {
  id: 'colors-english',
  categoryId: 'english',
  title: 'Colors',
  iconKey: '🎨',
  skill: 'Tên màu EN',
  levels: 3,
  createScene: (host: GameHost, level: number) => new ColorsEnglishScene(host, level),
};
