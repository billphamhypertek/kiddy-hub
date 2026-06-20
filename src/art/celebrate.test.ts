import { afterEach, describe, it, expect, vi } from 'vitest';
import type Phaser from 'phaser';
import { celebrate } from './sceneArt';
import { setCalmMode } from '../motion/calmMode';

/**
 * GĐ5E1 — `celebrate()` reduced/calm guard.
 *
 * Full burst: Cáo grows in (Back.easeOut) + an 8-star flying burst → many tweens
 * and many image objects. Reduced/calm: a static Cáo + a single fade-out tween,
 * NO star burst. SFX + voice are fired by the scene separately, so this guard is
 * VISUAL-ONLY and cannot touch the success/`finished` flow.
 *
 * Driven by a tiny fake scene (real Phaser is stubbed for the test run).
 */

interface TweenConfig {
  targets: unknown;
  onComplete?: () => void;
  [k: string]: unknown;
}

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
      exists: () => true,
      addBase64: () => {},
    },
    add: {
      image() {
        const img: Record<string, unknown> = {
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
        };
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

function setOsReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

describe('celebrate', () => {
  it('plays the full burst (fox grow + 8 flying stars) at normal motion', () => {
    setOsReducedMotion(false);
    const { scene, tweens, images } = makeScene();
    celebrate(scene);
    // 1 fox image + 8 star images.
    expect(images).toHaveLength(9);
    // 1 fox grow tween + 8 star tweens (the fade-out is added in onComplete).
    expect(tweens).toHaveLength(9);
  });

  it('under calm mode: a static fox + a single fade tween, NO star burst', () => {
    setOsReducedMotion(false); // OS does NOT prefer reduced — calm is the reason
    setCalmMode(true);
    const { scene, tweens, images } = makeScene();
    celebrate(scene);
    // Only the fox image — the 8-star burst is dropped.
    expect(images).toHaveLength(1);
    // Exactly one tween (the gentle fade-out); no grow tween, no star tweens.
    expect(tweens).toHaveLength(1);
    expect(tweens[0].alpha).toBe(0);
  });

  it('under OS reduced motion (calm off): same reduced burst', () => {
    setOsReducedMotion(true);
    setCalmMode(false);
    const { scene, tweens, images } = makeScene();
    celebrate(scene);
    expect(images).toHaveLength(1);
    expect(tweens).toHaveLength(1);
  });

  it('still destroys the fox when the fade tween completes (no leak)', () => {
    setCalmMode(true);
    const { scene, tweens, images } = makeScene();
    celebrate(scene);
    tweens[0].onComplete?.();
    expect(images[0].destroy).toHaveBeenCalled();
  });
});
