import type { GameModule } from '../GameModule';

export const jigsaw: GameModule = {
  id: 'jigsaw',
  categoryId: 'shapes',
  title: 'Ghép Hình',
  iconKey: '🎨',
  skill: 'Tư duy không gian',
  levels: 3,
  loadScene: () =>
    import('./JigsawScene').then((m) => (host, level) => new m.JigsawScene(host, level)),
};
