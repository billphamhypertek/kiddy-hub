import type { GameModule } from '../GameModule';

export const patternFinder: GameModule = {
  id: 'pattern-finder',
  categoryId: 'logic',
  title: 'Tìm Quy Luật',
  iconKey: '🧩',
  skill: 'Nhận ra quy luật chuỗi',
  levels: 3,
  loadScene: () =>
    import('./PatternFinderScene').then(
      (m) => (host, level) => new m.PatternFinderScene(host, level),
    ),
};
