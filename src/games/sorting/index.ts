import type { GameHost, GameModule } from '../GameModule';
import { SortingScene } from './SortingScene';

export const sorting: GameModule = {
  id: 'sorting',
  categoryId: 'logic',
  title: 'Phân Loại',
  iconKey: '🧺',
  skill: 'Nhóm gộp theo thuộc tính',
  levels: 3,
  createScene: (host: GameHost, level: number) => new SortingScene(host, level),
};
