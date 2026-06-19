import type { GameHost, GameModule } from '../GameModule';
import { MemoryMatchScene } from './MemoryMatchScene';

export const memoryMatch: GameModule = {
  id: 'memory-match',
  categoryId: 'memory',
  title: 'Lật Hình Tìm Cặp',
  iconKey: '🧠',
  skill: 'Trí nhớ ngắn hạn',
  levels: 3,
  createScene: (host: GameHost, level: number) => new MemoryMatchScene(host, level),
};
