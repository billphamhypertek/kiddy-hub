import type { GameModule } from '../GameModule';

export const colorsEnglish: GameModule = {
  id: 'colors-english',
  categoryId: 'english',
  title: 'Colors',
  iconKey: '🎨',
  skill: 'Tên màu EN',
  levels: 3,
  loadScene: () =>
    import('./ColorsEnglishScene').then(
      (m) => (host, level) => new m.ColorsEnglishScene(host, level),
    ),
};
