import type { GameModule } from '../GameModule';

export const matchQuantity: GameModule = {
  id: 'match-quantity',
  categoryId: 'numbers',
  title: 'Ghép Số với Lượng',
  iconKey: '🔢',
  skill: 'Liên hệ số ↔ lượng',
  levels: 3,
  loadScene: () =>
    import('./MatchQuantityScene').then(
      (m) => (host, level) => new m.MatchQuantityScene(host, level),
    ),
};
