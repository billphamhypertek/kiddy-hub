import type { GameModule } from '../GameModule';

export const sorting: GameModule = {
  id: 'sorting',
  categoryId: 'logic',
  title: 'Phân Loại',
  iconKey: '🧺',
  skill: 'Nhóm gộp theo thuộc tính',
  levels: 3,
  loadScene: () =>
    import('./SortingScene').then((m) => (host, level) => new m.SortingScene(host, level)),
};
