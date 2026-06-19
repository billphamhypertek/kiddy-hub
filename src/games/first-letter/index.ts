import type { GameHost, GameModule } from '../GameModule';
import { FirstLetterScene } from './FirstLetterScene';

export const firstLetter: GameModule = {
  id: 'first-letter',
  categoryId: 'letters',
  title: 'Chữ Cái Đầu Tiên',
  iconKey: '🅰️',
  skill: 'Âm đầu của từ',
  levels: 3,
  createScene: (host: GameHost, level: number) => new FirstLetterScene(host, level),
};
