import type { GameModule } from '../GameModule';

export const numbersEnglish: GameModule = {
  id: 'numbers-english',
  categoryId: 'english',
  title: 'Numbers 1–10',
  iconKey: '🔟',
  skill: 'Số đếm EN',
  levels: 3,
  loadScene: () =>
    import('./NumbersEnglishScene').then(
      (m) => (host, level) => new m.NumbersEnglishScene(host, level),
    ),
};
