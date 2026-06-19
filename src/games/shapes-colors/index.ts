import type { GameHost, GameModule } from '../GameModule';
import { ShapesColorsScene } from './ShapesColorsScene';

export const shapesColors: GameModule = {
  id: 'shapes-colors',
  categoryId: 'shapes',
  title: 'Nhận Diện Màu & Hình',
  iconKey: '🔺',
  skill: 'Màu sắc, hình khối',
  levels: 3,
  createScene: (host: GameHost, level: number) => new ShapesColorsScene(host, level),
};
