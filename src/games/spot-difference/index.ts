import type { GameHost, GameModule } from '../GameModule';
import { SpotDifferenceScene } from './SpotDifferenceScene';

export const spotDifference: GameModule = {
  id: 'spot-difference',
  categoryId: 'memory',
  title: 'Tìm Điểm Khác',
  iconKey: '🔎',
  skill: 'Quan sát chi tiết',
  levels: 3,
  createScene: (host: GameHost, level: number) => new SpotDifferenceScene(host, level),
};
