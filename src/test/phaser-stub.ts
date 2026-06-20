// Test-only stub for Phaser. Phaser runs canvas feature-detection at import
// time, which crashes under jsdom. Tests never exercise real rendering
// (scenes are verified manually), so 'phaser' is aliased to this stub for the
// test run only (see test.alias in vite.config.ts). Production uses real Phaser.
//
// The stub is intentionally a *forgiving* fake: every game object and manager
// method is a chainable no-op returning a proxy, so a scene's `create()` can be
// constructed/run under tests without throwing — including the Giai đoạn 4·B3
// art helpers (`add.image`, `add.graphics`, `textures.addBase64`/`exists`,
// tween/time/input calls). It does not render anything.

/** A chainable no-op proxy: any property access returns a function that
 *  records nothing and returns the proxy itself, so fluent calls like
 *  `add.image(...).setOrigin(0.5).setDisplaySize(64, 64).setDepth(1)` work. */
function chainable(): unknown {
  const target = function (): unknown {
    return proxy;
  };
  const proxy: unknown = new Proxy(target, {
    get(_t, prop) {
      // Common scalar reads some code paths might do; keep them harmless.
      if (prop === 'x' || prop === 'y' || prop === 'scale' || prop === 'alpha') return 0;
      if (prop === Symbol.toPrimitive) return () => 0;
      return chainable();
    },
    apply() {
      return proxy;
    },
  });
  return proxy;
}

/** A texture manager fake: tracks registered keys so `loadSvgTexture` stays
 *  idempotent under tests, matching real Phaser semantics. */
class TextureManager {
  private keys = new Set<string>();
  exists(key: string): boolean {
    return this.keys.has(key);
  }
  addBase64(key: string): void {
    this.keys.add(key);
  }
  get(): unknown {
    return chainable();
  }
}

/** Minimal factory bag (`scene.add.*`) — every maker returns a chainable proxy. */
const addFactory: Record<string, () => unknown> = new Proxy(
  {},
  {
    get() {
      return () => chainable();
    },
  },
);

export class Scene {
  add = addFactory as unknown as Record<string, (...args: unknown[]) => unknown>;
  scale = { width: 1024, height: 768 };
  cameras = { main: { setBackgroundColor: (): void => {} } };
  tweens = { add: (): unknown => chainable() };
  time = { delayedCall: (): unknown => chainable() };
  input = {
    setDraggable: (): void => {},
    on: (): void => {},
  };
  textures = new TextureManager();
  constructor(_config?: unknown) {}
}

export class Game {
  constructor(_config?: unknown) {}
  destroy(_removeCanvas?: boolean): void {}
}

export const AUTO = 0;
export const Scale = { FIT: 0, CENTER_BOTH: 0 };

/** A couple of math/geom helpers some scenes import off the Phaser namespace. */
export const Math = {
  Distance: {
    Between: (x1: number, y1: number, x2: number, y2: number): number =>
      globalThis.Math.hypot(x2 - x1, y2 - y1),
  },
};
export const Geom = {
  Point: class {
    constructor(
      public x = 0,
      public y = 0,
    ) {}
  },
};

export default { Scene, Game, AUTO, Scale, Math, Geom };
