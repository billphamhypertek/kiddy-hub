import type { GameModule } from '../GameModule';

export const abcEnglish: GameModule = {
  id: 'abc-english',
  categoryId: 'english',
  title: 'ABC',
  iconKey: '🔤',
  skill: 'Bảng chữ cái EN',
  levels: 3,
  loadScene: () =>
    import('./AbcEnglishScene').then((m) => (host, level) => new m.AbcEnglishScene(host, level)),
};
