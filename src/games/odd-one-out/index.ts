import type { GameModule } from '../GameModule';

export const oddOneOut: GameModule = {
  id: 'odd-one-out',
  categoryId: 'logic',
  title: 'Vật Lạ Trong Nhóm',
  iconKey: '🔍',
  skill: 'Phân loại, loại trừ',
  levels: 3,
  loadScene: () =>
    import('./OddOneOutScene').then((m) => (host, level) => new m.OddOneOutScene(host, level)),
};
