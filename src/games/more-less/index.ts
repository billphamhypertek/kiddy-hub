import type { GameHost, GameModule } from '../GameModule';
import { MoreLessScene } from './MoreLessScene';

export const moreLess: GameModule = {
  id: 'more-less',
  categoryId: 'numbers',
  title: 'Nhiều hơn – Ít hơn',
  iconKey: '⚖️',
  skill: 'So sánh số lượng',
  levels: 3,
  createScene: (host: GameHost, level: number) => new MoreLessScene(host, level),
};
