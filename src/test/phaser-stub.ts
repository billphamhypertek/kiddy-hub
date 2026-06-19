// Test-only stub for Phaser. Phaser runs canvas feature-detection at import
// time, which crashes under jsdom. Tests never exercise real rendering
// (scenes are verified manually), so 'phaser' is aliased to this stub for the
// test run only (see test.alias in vite.config.ts). Production uses real Phaser.
export class Scene {
  constructor(_config?: unknown) {}
}
export class Game {
  constructor(_config?: unknown) {}
  destroy(_removeCanvas?: boolean): void {}
}
export const AUTO = 0;
export const Scale = { FIT: 0, CENTER_BOTH: 0 };
export default { Scene, Game, AUTO, Scale };
