import type { GameHost, GameModule } from '../GameModule';
import { AbcEnglishScene } from './AbcEnglishScene';

export const abcEnglish: GameModule = {
  id: 'abc-english',
  categoryId: 'english',
  title: 'ABC',
  iconKey: '🔤',
  skill: 'Bảng chữ cái EN',
  levels: 3,
  createScene: (host: GameHost, level: number) => new AbcEnglishScene(host, level),
};
