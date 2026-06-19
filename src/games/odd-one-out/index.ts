import type { GameHost, GameModule } from '../GameModule';
import { OddOneOutScene } from './OddOneOutScene';

export const oddOneOut: GameModule = {
  id: 'odd-one-out',
  categoryId: 'logic',
  title: 'Vật Lạ Trong Nhóm',
  iconKey: '🔍',
  skill: 'Phân loại, loại trừ',
  levels: 3,
  createScene: (host: GameHost, level: number) => new OddOneOutScene(host, level),
};
