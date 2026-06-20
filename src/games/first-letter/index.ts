import type { GameModule } from '../GameModule';

export const firstLetter: GameModule = {
  id: 'first-letter',
  categoryId: 'letters',
  title: 'Chữ Cái Đầu Tiên',
  iconKey: '🅰️',
  skill: 'Âm đầu của từ',
  levels: 3,
  loadScene: () =>
    import('./FirstLetterScene').then((m) => (host, level) => new m.FirstLetterScene(host, level)),
};
