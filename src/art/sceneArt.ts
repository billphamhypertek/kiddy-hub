/**
 * KiddyHub — Shared Phaser scene art helpers (Giai đoạn 4 · Phần B3).
 *
 * One small toolbox every game scene uses to wear the final illustrated look,
 * all built on B1's `loadSvgTexture` / `addArt` so there is ONE art system:
 *
 *   - `addSceneBackground(scene, categoryId)` — soft pastel gradient sky tinted
 *     by the game's category colour, with a few drifting clouds, drawn behind
 *     everything.
 *   - `addChrome(scene, { onHome, onReplay })` — SVG round home + speaker
 *     buttons replacing the old 🏠 / 🔊 emoji, same positions & tap behaviour.
 *   - `addOptionTile(scene, x, y, size)` — the approved rounded answer-tile,
 *     placed BEHIND an option. Visual backing only — no hit area, so it never
 *     changes interaction.
 *   - `celebrate(scene)` — a short, non-blocking reward flourish (Cáo cheering
 *     + flying gold stars) for level/round completion.
 *
 * VISUAL-ONLY: these helpers add art behind / around the existing interactive
 * objects. They never move or remove a hit area, and `celebrate()` runs purely
 * on tweens (it touches none of a scene's round/finish guards or the audio /
 * awardStars flow), so the double-advance protection stays intact.
 *
 * Everything is authored on the canonical 0..100 viewBox and imported from
 * `tokens.ts`; nothing here hard-codes a colour.
 */
import type Phaser from 'phaser';
import { addArt as addArtRaw, type ArtScene } from './svg';
import { palette, type IslandKey } from './tokens';
import { homeButtonArt, speakerButtonArt, optionTileArt, cloudArt } from './chrome';
import { foxCheer } from './fox';
import { starArt } from './stars';

/** Depths reserved for B3 art so it always sits behind / above gameplay. */
const DEPTH = {
  background: -1000,
  cloud: -990,
  tile: -1, // just behind an option's content + hit area (which sit at depth 0)
  chrome: 100,
  celebrate: 1000,
} as const;

/** Chrome button render size (px) — matches the old 40px emoji visual weight. */
const CHROME_SIZE = 60;

/**
 * Thin wrapper over B1's `addArt` that returns a real Phaser `Image` (so we can
 * chain `setDepth` etc.). A `Phaser.Scene` structurally satisfies the minimal
 * `ArtScene` interface the adapter needs.
 */
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

/** Lighten a `#rrggbb` colour toward white by `amount` (0..1) → pastel tint. */
function tint(hex: string, amount: number): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return (lr << 16) | (lg << 8) | lb;
}

/**
 * Soft pastel backdrop tinted by the game's category colour: a vertical
 * gradient sky (very pale at the top → a gentle wash of the category hue near
 * the foot) plus three drifting clouds. Drawn first, far behind everything.
 */
export function addSceneBackground(scene: Phaser.Scene, categoryId: IslandKey): void {
  const { width, height } = scene.scale;
  const base = palette.island[categoryId] ?? palette.accent;
  const top = tint(base, 0.86); // almost-white wash
  const bottom = tint(base, 0.5); // soft pastel of the category hue

  const g = scene.add.graphics();
  // fillGradientStyle(topLeft, topRight, bottomLeft, bottomRight, alpha)
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, width, height);
  g.setDepth(DEPTH.background);

  // A few clouds for life. Sizes/positions are decorative and deterministic.
  const clouds: Array<{ x: number; y: number; s: number }> = [
    { x: width * 0.18, y: height * 0.16, s: 120 },
    { x: width * 0.82, y: height * 0.1, s: 90 },
    { x: width * 0.62, y: height * 0.24, s: 70 },
  ];
  clouds.forEach((c) => {
    addArt(scene, 'art-cloud', cloudArt(), c.x, c.y, c.s).setDepth(DEPTH.cloud);
  });
}

/** Callbacks for the two chrome buttons. */
export interface ChromeHandlers {
  onHome: () => void;
  onReplay: () => void;
}

/**
 * Replace the 🏠 (home, top-left) and 🔊 (speaker, top-right) emoji buttons with
 * SVG round buttons wired to the same callbacks, in the same corners and with
 * the same tap behaviour (a quick press-shrink for feedback). The hit area is a
 * circle matching the button, so taps land exactly as before.
 */
export function addChrome(scene: Phaser.Scene, handlers: ChromeHandlers): void {
  const { width } = scene.scale;
  // Old emoji sat with origin (0,0) at (24,18); centre the round buttons over
  // roughly the same footprint so taps land in the same corner.
  const homeX = 24 + CHROME_SIZE / 2;
  const homeY = 18 + CHROME_SIZE / 2;
  const speakerX = width - 64 + CHROME_SIZE / 2;
  const speakerY = 18 + CHROME_SIZE / 2;

  makeButton(scene, 'art-btn-home', homeButtonArt(), homeX, homeY, handlers.onHome);
  makeButton(scene, 'art-btn-speaker', speakerButtonArt(), speakerX, speakerY, handlers.onReplay);
}

/** Build one tappable round SVG button with a press-shrink feedback. */
function makeButton(
  scene: Phaser.Scene,
  key: string,
  svg: string,
  x: number,
  y: number,
  onTap: () => void,
): Phaser.GameObjects.Image {
  const img = addArt(scene, key, svg, x, y, CHROME_SIZE);
  img.setDepth(DEPTH.chrome);
  // Circular hit area centred on the texture so the round shape taps cleanly.
  img.setInteractive({ useHandCursor: true });
  img.on('pointerdown', () => {
    scene.tweens.add({ targets: img, scale: img.scale * 0.88, duration: 80, yoyo: true });
    onTap();
  });
  return img;
}

/**
 * Place the approved rounded answer-tile BEHIND an option at (x, y), sized to
 * `size`. Returns the image (already depth-sorted behind content) so the caller
 * can keep a handle if needed. This adds NO interactivity: the scene's existing
 * option object keeps its own hit area on top, so taps and drags are unchanged.
 *
 * @param accent optional ring tint (defaults to the warm star gold).
 */
export function addOptionTile(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  accent: string = palette.star,
): Phaser.GameObjects.Image {
  // One texture per accent colour keeps the cache small while allowing tints;
  // `addArt` registers it idempotently on first use.
  const key = `art-tile-${accent.replace('#', '')}`;
  const img = addArt(scene, key, optionTileArt(accent), x, y, size);
  img.setDepth(DEPTH.tile);
  return img;
}

/**
 * Minimal shape the wrong-answer shake needs: any Phaser game object exposing a
 * tweenable `x`. Covers `Image`, `Text`, `Rectangle`, `Graphics`, etc.
 */
type Shakeable = { x: number };

/**
 * The shared wrong-answer "try again" wiggle. Tweens every passed object's `x`
 * by +8px with a fast yoyo, three times — the exact timing/feel the scenes used
 * before B3 moved the visible glyph/tile off the (now transparent) hit rect.
 *
 * Pass the VISIBLE pieces of an option (its tile image and label/glyph), and
 * optionally the hit rect too; they shake in lockstep because each shares the
 * same starting `x`. VISUAL-ONLY: it only animates `x`, touching no hit area,
 * round/finish guard, or gameplay state.
 */
export function shakeOption(scene: Phaser.Scene, ...objects: Shakeable[]): void {
  objects.forEach((obj) => {
    scene.tweens.add({ targets: obj, x: obj.x + 8, duration: 60, yoyo: true, repeat: 3 });
  });
}

/** Anything we can fade + (optionally) make non-interactive for scaffolding. */
type Dimmable = {
  setAlpha?: (a: number) => unknown;
  disableInteractive?: () => unknown;
};

/**
 * Scaffolding fade (GĐ5B §9.2): visually dim ONE distractor option and take it
 * out of play WITHOUT destroying or removing it. Pass the visible pieces (tile +
 * glyph/swatch/shape) and the hit rect of a single distractor option.
 *
 * It only fades alpha (to 0.22) and calls `disableInteractive()` on the hit
 * object — it NEVER moves, resizes, or removes a game object, so layout, the
 * round/finish guards, and every remaining hit area stay exactly intact. The
 * next round rebuilds the option layer from scratch, so no undo is needed.
 *
 * Tween via the scene so the dim is smooth and interruption-safe (its final
 * state is a plain alpha, harmless if the round advances mid-tween).
 */
export function dimDistractor(scene: Phaser.Scene, ...objects: Dimmable[]): void {
  objects.forEach((obj) => {
    // Remove interactivity immediately so a tap during the fade can't pick it.
    obj.disableInteractive?.();
    // Smoothly fade, falling back to an instant set if tweens aren't available.
    if (typeof scene.tweens?.add === 'function') {
      scene.tweens.add({ targets: obj, alpha: 0.22, duration: 200 });
    } else {
      obj.setAlpha?.(0.22);
    }
  });
}

/**
 * A short, non-blocking reward flourish for the success / completion moment:
 * the Cáo mascot pops up cheering in the centre, a burst of gold stars flies
 * outward, and everything fades/cleans itself up via tweens.
 *
 * Pure decoration: it neither calls into nor awaits the scene's gameplay flow,
 * so it cannot interfere with `roundResolved` / `finished` double-advance
 * guards, the completion callback, or `awardStars`. Safe to fire right next to
 * the existing `host.speak('reward.cheer')` / `awardStars` calls.
 */
export function celebrate(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const cx = width / 2;
  const cy = height / 2;

  // Cáo cheering, popping in with a little bounce, then fading away.
  const fox = addArt(scene, 'art-fox-cheer', foxCheer(), cx, cy, 0);
  fox.setDepth(DEPTH.celebrate);
  scene.tweens.add({
    targets: fox,
    displayWidth: 220,
    displayHeight: 220,
    ease: 'Back.easeOut',
    duration: 360,
    onComplete: () => {
      scene.tweens.add({
        targets: fox,
        alpha: 0,
        delay: 700,
        duration: 350,
        onComplete: () => fox.destroy(),
      });
    },
  });

  // A burst of gold stars flying outward from the mascot.
  const STARS = 8;
  for (let i = 0; i < STARS; i++) {
    const angle = (i / STARS) * Math.PI * 2;
    const dist = 150 + (i % 3) * 30;
    const star = addArt(scene, 'art-star', starArt(), cx, cy, 46);
    star.setDepth(DEPTH.celebrate + 1);
    star.setAlpha(0);
    scene.tweens.add({
      targets: star,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      alpha: { from: 1, to: 0 },
      angle: 180,
      ease: 'Cubic.easeOut',
      duration: 900,
      delay: 120 + (i % 4) * 40,
      onComplete: () => star.destroy(),
    });
  }
}
