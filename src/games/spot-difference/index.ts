import type { GameModule } from '../GameModule';

export const spotDifference: GameModule = {
  id: 'spot-difference',
  categoryId: 'memory',
  title: 'Tìm Điểm Khác',
  iconKey: '🔎',
  skill: 'Quan sát chi tiết',
  levels: 3,
  loadScene: () =>
    import('./SpotDifferenceScene').then(
      (m) => (host, level) => new m.SpotDifferenceScene(host, level),
    ),
};
