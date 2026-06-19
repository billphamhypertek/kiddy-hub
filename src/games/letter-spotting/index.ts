import type { GameHost, GameModule } from '../GameModule';
import { LetterSpottingScene } from './LetterSpottingScene';

export const letterSpotting: GameModule = {
  id: 'letter-spotting',
  categoryId: 'letters',
  title: 'Bé Nhận Mặt Chữ',
  iconKey: '🔤',
  skill: 'Nhận diện mặt chữ cái',
  levels: 3,
  createScene: (host: GameHost, level: number) => new LetterSpottingScene(host, level),
};
