import type { GameModule } from '../GameModule';

export const firstWords: GameModule = {
  id: 'first-words',
  categoryId: 'english',
  title: 'First Words',
  iconKey: '🌎',
  skill: 'Từ vựng tiếng Anh cơ bản',
  levels: 3,
  loadScene: () =>
    import('./FirstWordsScene').then((m) => (host, level) => new m.FirstWordsScene(host, level)),
};
