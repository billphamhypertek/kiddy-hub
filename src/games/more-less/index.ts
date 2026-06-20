import type { GameModule } from '../GameModule';

export const moreLess: GameModule = {
  id: 'more-less',
  categoryId: 'numbers',
  title: 'Nhiều hơn – Ít hơn',
  iconKey: '⚖️',
  skill: 'So sánh số lượng',
  levels: 3,
  loadScene: () =>
    import('./MoreLessScene').then((m) => (host, level) => new m.MoreLessScene(host, level)),
};
