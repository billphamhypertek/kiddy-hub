import type { GameModule } from '../GameModule';

export const shapesColors: GameModule = {
  id: 'shapes-colors',
  categoryId: 'shapes',
  title: 'Nhận Diện Màu & Hình',
  iconKey: '🔺',
  skill: 'Màu sắc, hình khối',
  levels: 3,
  loadScene: () =>
    import('./ShapesColorsScene').then(
      (m) => (host, level) => new m.ShapesColorsScene(host, level),
    ),
};
