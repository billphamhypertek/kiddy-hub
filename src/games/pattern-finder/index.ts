import type { GameHost, GameModule } from '../GameModule';
import { PatternFinderScene } from './PatternFinderScene';

export const patternFinder: GameModule = {
  id: 'pattern-finder',
  categoryId: 'logic',
  title: 'Tìm Quy Luật',
  iconKey: '🧩',
  skill: 'Nhận ra quy luật chuỗi',
  levels: 3,
  createScene: (host: GameHost, level: number) => new PatternFinderScene(host, level),
};
