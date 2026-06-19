import type { GameHost, GameModule } from '../GameModule';
import { CountingFunScene } from './CountingFunScene';

export const countingFun: GameModule = {
  id: 'counting-fun',
  categoryId: 'numbers',
  title: 'Đếm Vui',
  iconKey: '🦆',
  skill: 'Đếm và nhận diện số',
  levels: 3,
  createScene: (host: GameHost, level: number) => new CountingFunScene(host, level),
};
