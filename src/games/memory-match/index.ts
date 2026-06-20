import type { GameModule } from '../GameModule';

export const memoryMatch: GameModule = {
  id: 'memory-match',
  categoryId: 'memory',
  title: 'Lật Hình Tìm Cặp',
  iconKey: '🧠',
  skill: 'Trí nhớ ngắn hạn',
  levels: 3,
  loadScene: () =>
    import('./MemoryMatchScene').then((m) => (host, level) => new m.MemoryMatchScene(host, level)),
};
