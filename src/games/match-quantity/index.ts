import type { GameHost, GameModule } from '../GameModule';
import { MatchQuantityScene } from './MatchQuantityScene';

export const matchQuantity: GameModule = {
  id: 'match-quantity',
  categoryId: 'numbers',
  title: 'Ghép Số với Lượng',
  iconKey: '🔢',
  skill: 'Liên hệ số ↔ lượng',
  levels: 3,
  createScene: (host: GameHost, level: number) => new MatchQuantityScene(host, level),
};
