/**
 * KiddyHub — Shared Phaser scene MOTION helpers (Giai đoạn 4 · Phần D2).
 *
 * A tiny, tasteful motion toolbox every game scene uses so the Phaser layer
 * speaks the same timing language as the React/CSS layer (D1). It reuses the
 * shared tokens from `src/motion/tokens.ts` (durations / easings / stagger) and
 * the non-React `prefersReducedMotion()` accessibility check, and builds on the
 * Part-B3 art in `sceneArt.ts` (it does not replace `shakeOption` / `celebrate`,
 * it complements them):
 *
 *   - `animateIn(scene, objects, opts?)` — a gentle staggered entrance (fade +
 *     small scale/slide-up) for an array of static objects (prompt text, option
 *     tiles + labels, mascot). VISUAL-ONLY.
 *   - `popCorrect(scene, obj)` — a quick scale bounce + a few self-destructing
 *     sparkle stars on a correct answer.
 *   - `flyStars(scene, fromX, fromY)` — a star-award flourish: gold stars fly up
 *     toward the HUD (top-right) and fade.
 *
 * ── The interactivity contract (this is where regressions hide) ──────────────
 * `animateIn` is PURELY decorative. It NEVER calls `setInteractive`, never
 * attaches a pointer handler, and never gates anything behind tween completion.
 * A scene wires up its hit areas independently (and BEFORE or after calling
 * `animateIn` — order doesn't matter), so a tap that lands mid-entrance is
 * handled immediately by the scene's own handler.
 *
 * ── Safe end-states ──────────────────────────────────────────────────────────
 * `animateIn` first CAPTURES each object's already-final transform (the scene
 * has placed it correctly), then nudges it to a start offset and tweens back to
 * that captured target. The tween's explicit end value IS the natural final
 * transform, and an `onStop` handler snaps the object to the exact target if the
 * tween is ever killed early (round advance / scene restart). So an object can
 * never be stranded at alpha 0 / scale 0. Reduced-motion → place at final state
 * instantly, no tween at all.
 *
 * ── Drag pieces ──────────────────────────────────────────────────────────────
 * Drag games must only pass their STATIC furniture (prompt, baskets/slots,
 * tray backings) to `animateIn` — never the draggable pieces — so entrance
 * tweens can never fight the drag handlers (which write `x`/`y` directly).
 */
import type Phaser from 'phaser';
import { addArt as addArtRaw, type ArtScene } from './svg';
import { starArt } from './stars';
import { durations, easings, stagger } from '../motion/tokens';
import { prefersReducedMotion } from '../motion/prefersReducedMotion';

/** Depths for D2's transient motion FX — above gameplay, below the celebrate burst. */
const FX_DEPTH = 900;

/**
 * Map a conceptual easing token onto its Phaser `Easing` name, so Phaser tweens
 * feel identical to the CSS animations that use the same token name.
 *   - `enter`    → decelerate (good for things entering)
 *   - `standard` → calm ease-in-out
 *   - `pop`      → gentle child-friendly overshoot
 */
const PHASER_EASE: Record<keyof typeof easings, string> = {
  enter: 'Cubic.easeOut',
  standard: 'Sine.easeInOut',
  pop: 'Back.easeOut',
};

/** Thin wrapper over B1's `addArt` returning a real Phaser `Image` for chaining. */
function addArt(
  scene: Phaser.Scene,
  key: string,
  svg: string,
  x: number,
  y: number,
  size: number,
): Phaser.GameObjects.Image {
  return addArtRaw(scene as unknown as ArtScene, key, svg, x, y, size) as unknown as Phaser.GameObjects.Image;
}

/**
 * The minimal surface `animateIn` / `popCorrect` need from an object. Every
 * Phaser display object (Text, Image, Rectangle, Graphics, Container) exposes
 * these, so a scene can pass a heterogeneous array. We read/write `scaleX` and
 * `scaleY` SEPARATELY (never the unified `scale`) so objects sized with a
 * non-square `setDisplaySize(w, h)` — e.g. the more-less tap frames or sorting
 * baskets — keep their aspect ratio through the entrance and at its final state.
 * `popCorrect` likewise bounces `scaleX`/`scaleY` independently so non-square
 * objects aren't distorted. Fields are optional because some objects (e.g.
 * Graphics) are positioned by `x`/`y` only.
 */
interface Animatable {
  x: number;
  y: number;
  alpha?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  setAlpha?: (value: number) => unknown;
}

/**
 * What a scene actually hands these helpers: any Phaser display object. We
 * accept the broad `GameObject` type (plus null/undefined for convenience) at
 * the boundary and treat each as an {@link Animatable} internally — every
 * display object the scenes pass carries the transform fields above.
 */
export type MotionObject = Phaser.GameObjects.GameObject | null | undefined;

/** Narrow a passed display object to the tweenable shape used internally. */
function asAnimatable(obj: Phaser.GameObjects.GameObject): Animatable {
  return obj as unknown as Animatable;
}

/** Tuning for {@link animateIn}. */
export interface AnimateInOptions {
  /** Upward slide distance (px) the objects rise from. Default 18. */
  rise?: number;
  /** Start scale the objects grow from (1 = no scale). Default 0.9. */
  fromScale?: number;
  /** Per-item stagger step (ms). Defaults to the shared `stagger.step`. */
  step?: number;
  /** Base duration (ms). Defaults to the shared `durations.base`. */
  duration?: number;
}

/**
 * Gentle staggered entrance for an array of STATIC objects (prompt, option tiles
 * + labels, mascot). Each object fades in while rising a few px and scaling up
 * from `fromScale` to its natural scale, offset by a small per-index stagger.
 *
 * VISUAL-ONLY: it captures each object's already-final transform, animates from
 * an offset back to that captured value, and never touches interactivity. Pass
 * objects in the order you want them to appear (prompt first, then options).
 *
 * Under reduced motion every object is left exactly at its final state with no
 * tween. Objects without a tweenable transform are skipped harmlessly.
 */
export function animateIn(
  scene: Phaser.Scene,
  objects: MotionObject[],
  opts: AnimateInOptions = {},
): void {
  const list = objects.filter((o): o is Phaser.GameObjects.GameObject => !!o).map(asAnimatable);
  if (list.length === 0) return;

  // Reduced motion (or no animation system): leave everything at its final state.
  if (prefersReducedMotion()) return;

  const rise = opts.rise ?? 18;
  const fromScale = opts.fromScale ?? 0.9;
  const step = opts.step ?? stagger.step;
  const duration = opts.duration ?? durations.base;

  list.forEach((obj, i) => {
    // Capture the natural final transform the scene already placed the object at.
    // scaleX / scaleY are read independently so a non-square display size (e.g.
    // a wide tap frame) is preserved — tweening the unified `scale` would force
    // it square and distort it permanently at settle.
    const finalY = obj.y;
    const finalScaleX = typeof obj.scaleX === 'number' ? obj.scaleX : 1;
    const finalScaleY = typeof obj.scaleY === 'number' ? obj.scaleY : 1;
    const finalAlpha = typeof obj.alpha === 'number' ? obj.alpha : 1;

    // Nudge to the start offset (small, so an interrupted entrance still reads).
    obj.y = finalY + rise;
    obj.setAlpha?.(0);
    obj.scaleX = finalScaleX * fromScale;
    obj.scaleY = finalScaleY * fromScale;

    const delay = Math.min(i * step, stagger.max);

    // Snap to the exact captured final state. Used both on natural completion
    // AND if the tween is stopped early (round advance / scene restart), so an
    // object is never stranded mid-animation at alpha 0 / scale 0 / offset Y.
    const settle = (): void => {
      obj.y = finalY;
      obj.setAlpha?.(finalAlpha);
      obj.scaleX = finalScaleX;
      obj.scaleY = finalScaleY;
    };

    scene.tweens.add({
      targets: obj,
      y: finalY,
      alpha: finalAlpha,
      scaleX: finalScaleX,
      scaleY: finalScaleY,
      ease: PHASER_EASE.enter,
      duration,
      delay,
      onComplete: settle,
      onStop: settle,
    });
  });
}

/**
 * Reward pop on a CORRECT answer: a quick scale bounce on the chosen object
 * (≈1 → 1.18 → 1 with a gentle overshoot) plus a few sparkle stars that fan out
 * around it and self-destruct.
 *
 * NON-BLOCKING and side-effect-free with respect to gameplay: it neither reads
 * nor writes any round/finish guard, scoring, or the choose()/advance flow — the
 * scene has already resolved the answer before (or independently of) calling
 * this. Under reduced motion it does nothing (the scene's own colour-flip and
 * SFX already signal success).
 *
 * It bounces `scaleX` and `scaleY` INDEPENDENTLY (each captured separately) so a
 * non-square target — e.g. a jigsaw piece sized via `setDisplaySize(w, h)` with
 * w≠h — keeps its aspect ratio. Tweening the unified `scale` would force the two
 * axes equal and permanently squish a non-square object to its average scale at
 * settle. For a square object this is identical to a single uniform bounce.
 */
export function popCorrect(scene: Phaser.Scene, target?: MotionObject): void {
  if (!target) return;
  if (prefersReducedMotion()) return;
  const obj = asAnimatable(target);

  const baseScaleX = typeof obj.scaleX === 'number' && obj.scaleX > 0 ? obj.scaleX : 1;
  const baseScaleY = typeof obj.scaleY === 'number' && obj.scaleY > 0 ? obj.scaleY : 1;

  // Quick bounce, always returning to the captured base scales (yoyo guarantees
  // each end value equals its start value, so it cannot strand a wrong scale).
  scene.tweens.add({
    targets: obj,
    scaleX: baseScaleX * 1.18,
    scaleY: baseScaleY * 1.18,
    duration: durations.fast,
    ease: PHASER_EASE.pop,
    yoyo: true,
  });

  // A little ring of sparkle stars around the object.
  const cx = obj.x;
  const cy = obj.y;
  const SPARKS = 5;
  for (let i = 0; i < SPARKS; i++) {
    const angle = -Math.PI / 2 + (i / SPARKS) * Math.PI * 2;
    const dist = 56 + (i % 2) * 18;
    const star = addArt(scene, 'art-star', starArt(), cx, cy, 28);
    star.setDepth(FX_DEPTH);
    star.setAlpha(0);
    scene.tweens.add({
      targets: star,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      alpha: { from: 1, to: 0 },
      scale: { from: 0.4, to: 1 },
      angle: 160,
      ease: 'Cubic.easeOut',
      duration: durations.slow + 150,
      delay: i * 24,
      onComplete: () => star.destroy(),
    });
  }
}

/**
 * Star-award flourish: a handful of gold stars rise from (fromX, fromY) and fly
 * up toward the HUD / star area (the chrome sits top-right; the real React star
 * counter lives outside the canvas, so this is a gesture toward it), fading as
 * they go. Purely decorative — fire it right beside the scene's `awardStars`.
 * No-op under reduced motion.
 */
export function flyStars(scene: Phaser.Scene, fromX: number, fromY: number): void {
  if (prefersReducedMotion()) return;

  const { width } = scene.scale;
  // Aim toward the top-right where the speaker chrome / star HUD sits.
  const targetX = width - 80;
  const targetY = 40;

  const STARS = 5;
  for (let i = 0; i < STARS; i++) {
    const spread = (i - (STARS - 1) / 2) * 26;
    const star = addArt(scene, 'art-star', starArt(), fromX + spread, fromY, 40);
    star.setDepth(FX_DEPTH);
    star.setAlpha(0);
    scene.tweens.add({
      targets: star,
      x: targetX,
      y: targetY,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 0.5 },
      ease: PHASER_EASE.standard,
      duration: durations.slow + 350,
      delay: i * 70,
      onComplete: () => star.destroy(),
    });
  }
}
