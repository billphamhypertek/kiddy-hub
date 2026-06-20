import { afterEach, describe, it, expect, vi } from 'vitest';
import type Phaser from 'phaser';
import {
  animateIn,
  popCorrect,
  flyStars,
  squashStretchPop,
  sparkleBurst,
  tilePress,
  idleBreathe,
  bouncePop,
} from './sceneMotion';
import { setCalmMode } from '../motion/calmMode';

/**
 * D2 motion-helper contract tests. These lock in the load-bearing guarantees:
 *   - the helpers are VISUAL-ONLY (they never call `setInteractive`);
 *   - `animateIn` leaves objects at their natural final state (never stranded at
 *     alpha 0 / scale 0), both on natural completion and if a tween is stopped;
 *   - reduced-motion short-circuits to the instant final state with no tweens.
 *
 * We drive the helpers with a tiny fake scene (the real Phaser is stubbed for
 * the whole test run) and a tiny fake display object that records calls.
 */

interface TweenConfig {
  targets: unknown;
  onComplete?: () => void;
  onStop?: () => void;
  [k: string]: unknown;
}

interface FakeObj {
  x: number;
  y: number;
  alpha: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  interactiveCalls: number;
  setAlpha(v: number): FakeObj;
  setInteractive(): FakeObj;
  destroy: ReturnType<typeof vi.fn>;
}

/** A fake display object that records its transform + interactivity calls. The
 *  helpers accept any Phaser display object; we cast at the call site. The
 *  default scaleX/scaleY differ (1 vs 0.5) so the non-square-preservation
 *  assertions are meaningful. */
function makeObj(x = 100, y = 200, scaleX = 1, scaleY = 0.5): FakeObj {
  const obj: FakeObj = {
    x,
    y,
    alpha: 1,
    scale: 1,
    scaleX,
    scaleY,
    interactiveCalls: 0,
    setAlpha(v: number) {
      this.alpha = v;
      return this;
    },
    setInteractive() {
      this.interactiveCalls++;
      return this;
    },
    destroy: vi.fn(),
  };
  return obj;
}

/** Cast a fake object to the broad `MotionObject` shape the helpers accept. */
function asMotion(obj: FakeObj): Phaser.GameObjects.GameObject {
  return obj as unknown as Phaser.GameObjects.GameObject;
}

/** A minimal fake scene capturing every tween config the helpers add. */
function makeScene() {
  const tweens: TweenConfig[] = [];
  const images: Array<Record<string, unknown>> = [];
  const scene = {
    scale: { width: 1024, height: 768 },
    tweens: {
      add(config: TweenConfig) {
        tweens.push(config);
        return config;
      },
    },
    textures: {
      exists: () => true, // pretend the sparkle texture is already registered
      addBase64: () => {},
    },
    add: {
      image() {
        const img = {
          setOrigin() {
            return img;
          },
          setDisplaySize() {
            return img;
          },
          setDepth() {
            return img;
          },
          setAlpha() {
            return img;
          },
          destroy: vi.fn(),
        } as Record<string, unknown>;
        images.push(img);
        return img;
      },
    },
  };
  return { scene: scene as unknown as Phaser.Scene, tweens, images };
}

afterEach(() => {
  // @ts-expect-error — jsdom omits matchMedia; we may have added it.
  delete window.matchMedia;
  setCalmMode(false);
  vi.restoreAllMocks();
});

function setReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

describe('animateIn', () => {
  it('adds one entrance tween per object and never touches interactivity', () => {
    const { scene, tweens } = makeScene();
    const a = makeObj();
    const b = makeObj();
    animateIn(scene, [asMotion(a), asMotion(b)]);
    expect(tweens).toHaveLength(2);
    expect(a.interactiveCalls).toBe(0);
    expect(b.interactiveCalls).toBe(0);
  });

  it('captures the final transform and lands the tween back at it on completion', () => {
    const { scene, tweens } = makeScene();
    // Non-square (scaleX 1, scaleY 0.5) → the entrance must preserve aspect.
    const obj = makeObj(50, 300, 1, 0.5);
    animateIn(scene, [asMotion(obj)]);
    // Mid-entrance the object is nudged off its final state (faded/raised/shrunk),
    // but each axis is scaled by the same factor so the aspect ratio is kept.
    expect(obj.alpha).toBe(0);
    expect(obj.scaleX / obj.scaleY).toBeCloseTo(2);
    // The tween's explicit end values ARE the captured final transform.
    expect(tweens[0].y).toBe(300);
    expect(tweens[0].alpha).toBe(1);
    expect(tweens[0].scaleX).toBe(1);
    expect(tweens[0].scaleY).toBe(0.5);
    // On completion the object is settled exactly at its final state.
    tweens[0].onComplete?.();
    expect(obj.alpha).toBe(1);
    expect(obj.scaleX).toBe(1);
    expect(obj.scaleY).toBe(0.5);
    expect(obj.y).toBe(300);
  });

  it('settles to the final state if the tween is stopped early (safe end-state)', () => {
    const { scene, tweens } = makeScene();
    const obj = makeObj(0, 120, 1, 0.5);
    animateIn(scene, [asMotion(obj)]);
    expect(obj.alpha).toBe(0); // stranded mid-animation...
    tweens[0].onStop?.(); // ...until interrupted (round advance / scene restart)
    expect(obj.alpha).toBe(1);
    expect(obj.scaleX).toBe(1);
    expect(obj.scaleY).toBe(0.5); // non-square aspect restored, not forced square
    expect(obj.y).toBe(120);
  });

  it('under reduced motion places objects at final state with NO tween', () => {
    setReducedMotion(true);
    const { scene, tweens } = makeScene();
    const obj = makeObj(10, 20, 1, 0.5);
    animateIn(scene, [asMotion(obj)]);
    expect(tweens).toHaveLength(0);
    expect(obj.alpha).toBe(1);
    expect(obj.scaleX).toBe(1);
    expect(obj.scaleY).toBe(0.5);
    expect(obj.y).toBe(20);
  });

  it('ignores null/undefined entries and is a no-op for an empty list', () => {
    const { scene, tweens } = makeScene();
    animateIn(scene, [null, undefined]);
    expect(tweens).toHaveLength(0);
  });
});

describe('popCorrect', () => {
  it('adds a bounce tween + sparkle tweens, never touching interactivity', () => {
    const { scene, tweens } = makeScene();
    const obj = makeObj();
    popCorrect(scene, asMotion(obj));
    expect(tweens.length).toBeGreaterThan(1); // 1 bounce + several sparkles
    expect(obj.interactiveCalls).toBe(0);
    // The bounce yoyos, so its end scale equals the start scale (no stranding).
    expect(tweens[0].yoyo).toBe(true);
  });

  it('is a no-op for a missing target', () => {
    const { scene, tweens } = makeScene();
    popCorrect(scene, null);
    expect(tweens).toHaveLength(0);
  });

  it('does nothing under reduced motion', () => {
    setReducedMotion(true);
    const { scene, tweens } = makeScene();
    popCorrect(scene, asMotion(makeObj()));
    expect(tweens).toHaveLength(0);
  });
});

describe('flyStars', () => {
  it('adds a few star tweens aimed toward the top-right HUD', () => {
    const { scene, tweens } = makeScene();
    flyStars(scene, 500, 400);
    expect(tweens.length).toBeGreaterThan(0);
    // Stars fly toward the top-right (small y, large x near the right edge).
    expect(tweens[0].y).toBe(40);
    expect(tweens[0].x).toBe(scene.scale.width - 80);
  });

  it('does nothing under reduced motion', () => {
    setReducedMotion(true);
    const { scene, tweens } = makeScene();
    flyStars(scene, 500, 400);
    expect(tweens).toHaveLength(0);
  });
});

// ─── GĐ6.1 juice toolkit — every function must honour prefersReducedMotion() /
//     calmMode (a reduced / no-op branch) and never touch interactivity. ────────

describe('squashStretchPop', () => {
  it('adds tweens on a target and never touches interactivity', () => {
    const { scene, tweens } = makeScene();
    const obj = makeObj();
    squashStretchPop(scene, asMotion(obj));
    expect(tweens.length).toBeGreaterThan(0);
    expect(obj.interactiveCalls).toBe(0);
  });
  it('is a no-op for a missing target', () => {
    const { scene, tweens } = makeScene();
    squashStretchPop(scene, null);
    expect(tweens).toHaveLength(0);
  });
  it('does nothing under reduced motion', () => {
    setReducedMotion(true);
    const { scene, tweens } = makeScene();
    squashStretchPop(scene, asMotion(makeObj()));
    expect(tweens).toHaveLength(0);
  });
  it('does nothing under calm mode (OS motion ON)', () => {
    setReducedMotion(false);
    setCalmMode(true);
    const { scene, tweens } = makeScene();
    squashStretchPop(scene, asMotion(makeObj()));
    expect(tweens).toHaveLength(0);
  });
});

describe('sparkleBurst', () => {
  it('spawns sparkle images + tweens at normal motion', () => {
    const { scene, tweens, images } = makeScene();
    sparkleBurst(scene, 100, 100);
    expect(images.length).toBeGreaterThan(0);
    expect(tweens.length).toBeGreaterThan(0);
  });
  it('does nothing under reduced motion (no images, no tweens)', () => {
    setReducedMotion(true);
    const { scene, tweens, images } = makeScene();
    sparkleBurst(scene, 100, 100);
    expect(tweens).toHaveLength(0);
    expect(images).toHaveLength(0);
  });
  it('does nothing under calm mode (no images, no tweens)', () => {
    setReducedMotion(false);
    setCalmMode(true);
    const { scene, tweens, images } = makeScene();
    sparkleBurst(scene, 100, 100);
    expect(tweens).toHaveLength(0);
    expect(images).toHaveLength(0);
  });
});

describe('tilePress', () => {
  it('adds a press tween normally', () => {
    const { scene, tweens } = makeScene();
    tilePress(scene, asMotion(makeObj()));
    expect(tweens.length).toBeGreaterThan(0);
  });
  it('is a no-op under reduced motion', () => {
    setReducedMotion(true);
    const { scene, tweens } = makeScene();
    tilePress(scene, asMotion(makeObj()));
    expect(tweens).toHaveLength(0);
  });
  it('is a no-op for a missing target', () => {
    const { scene, tweens } = makeScene();
    tilePress(scene, null);
    expect(tweens).toHaveLength(0);
  });
});

describe('idleBreathe', () => {
  it('adds a single looping tween normally', () => {
    const { scene, tweens } = makeScene();
    idleBreathe(scene, asMotion(makeObj()));
    expect(tweens).toHaveLength(1);
    expect(tweens[0].repeat).toBe(-1);
  });
  it('is a no-op under reduced motion', () => {
    setReducedMotion(true);
    const { scene, tweens } = makeScene();
    idleBreathe(scene, asMotion(makeObj()));
    expect(tweens).toHaveLength(0);
  });
  it('is a no-op for a missing target', () => {
    const { scene, tweens } = makeScene();
    idleBreathe(scene, null);
    expect(tweens).toHaveLength(0);
  });
});

describe('bouncePop', () => {
  it('adds an entrance tween normally', () => {
    const { scene, tweens } = makeScene();
    bouncePop(scene, asMotion(makeObj()));
    expect(tweens).toHaveLength(1);
  });
  it('under reduced motion sets base scale with NO tween (never stranded tiny)', () => {
    setReducedMotion(true);
    const { scene, tweens } = makeScene();
    const obj = makeObj(0, 0, 1, 0.5);
    bouncePop(scene, asMotion(obj));
    expect(tweens).toHaveLength(0);
    expect(obj.scaleX).toBe(1);
    expect(obj.scaleY).toBe(0.5);
  });
  it('is a no-op for a missing target', () => {
    const { scene, tweens } = makeScene();
    bouncePop(scene, null);
    expect(tweens).toHaveLength(0);
  });
});
