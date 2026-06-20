import type { GameModule } from '../GameModule';

export const letterSpotting: GameModule = {
  id: 'letter-spotting',
  categoryId: 'letters',
  title: 'Bé Nhận Mặt Chữ',
  iconKey: '🔤',
  skill: 'Nhận diện mặt chữ cái',
  levels: 3,
  loadScene: () =>
    import('./LetterSpottingScene').then(
      (m) => (host, level) => new m.LetterSpottingScene(host, level),
    ),
};
