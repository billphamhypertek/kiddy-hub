import type { GameHost, GameModule } from '../GameModule';
import { JigsawScene } from './JigsawScene';

export const jigsaw: GameModule = {
  id: 'jigsaw',
  categoryId: 'shapes',
  title: 'Ghép Hình',
  iconKey: '🎨',
  skill: 'Tư duy không gian',
  levels: 3,
  createScene: (host: GameHost, level: number) => new JigsawScene(host, level),
};
