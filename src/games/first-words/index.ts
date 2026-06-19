import type { GameHost, GameModule } from '../GameModule';
import { FirstWordsScene } from './FirstWordsScene';

export const firstWords: GameModule = {
  id: 'first-words',
  categoryId: 'english',
  title: 'First Words',
  iconKey: '🌎',
  skill: 'Từ vựng tiếng Anh cơ bản',
  levels: 3,
  createScene: (host: GameHost, level: number) => new FirstWordsScene(host, level),
};
