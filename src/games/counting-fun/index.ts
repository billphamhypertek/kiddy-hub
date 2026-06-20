import type { GameModule } from '../GameModule';

export const countingFun: GameModule = {
  id: 'counting-fun',
  categoryId: 'numbers',
  title: 'Đếm Vui',
  iconKey: '🦆',
  skill: 'Đếm và nhận diện số',
  levels: 3,
  loadScene: () =>
    import('./CountingFunScene').then(
      (m) => (host, level) => new m.CountingFunScene(host, level),
    ),
};
