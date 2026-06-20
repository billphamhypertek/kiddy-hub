import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, celebrate, addBuddy, type SceneBuddy } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars } from '../../art/sceneMotion';
import { addArt, type ArtScene } from '../../art/svg';
import {
  ROUNDS_PER_GAME,
  chooseDifferences,
  differenceCountForLevel,
  allFound,
  starsForRounds,
  type DifferenceSpot,
} from './spotDifferenceLogic';
import { buildScene } from './gardenArt';

/** Rendered size (px, square) of each garden image. */
const PIC = 360;
/** The art's design viewBox edge — catalog coords live in 0..PIC after scaling. */
const ART_VB = 100;
/** Brand soft-brown ink (#5b4636) as a Phaser numeric colour, for frame strokes. */
const INK = 0x5b4636;

export class SpotDifferenceScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private roundsCleared = 0;
  private roundResolved = false;
  private finished = false;

  private chosen: DifferenceSpot[] = [];
  private found = new Set<string>();
  private layer?: Phaser.GameObjects.Container;
  private progressText?: Phaser.GameObjects.Text;
  private buddy?: SceneBuddy;

  /** Top-left of the right (changed) image — catalog coords map relative to it. */
  private rightX = 0;
  private rightY = 0;

  constructor(host: GameHost, level: number) {
    super({ key: 'spot-difference' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'memory');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('spotdiff.prompt'),
    });
    // GĐ6.3 — Cáo đồng hành (visual-only): hiện diện khi chơi, phản ứng đúng/sai.
    this.buddy = addBuddy(this);
    this.nextRound();
  }

  private nextRound(): void {
    if (this.roundIndex >= ROUNDS_PER_GAME) {
      this.finish();
      return;
    }
    this.roundResolved = false;
    this.found = new Set<string>();
    this.chosen = chooseDifferences(this.level, Math.random);

    this.layer?.destroy();
    this.layer = this.add.container(0, 0);
    const { width, height } = this.scale;

    const prompt = this.add
      .text(width / 2, 70, 'Tìm điểm khác nhau giữa hai bức tranh', {
        fontSize: '30px',
        color: '#5b4636',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('spotdiff.prompt');

    // Two copies of the same scene: left = pristine, right = changed variant.
    const gap = 40;
    const topY = height / 2 - PIC / 2 + 20;
    const leftX = width / 2 - PIC - gap / 2;
    this.rightX = width / 2 + gap / 2;
    this.rightY = topY;

    const changedIds = this.chosen.map((c) => c.id);
    const leftImg = addArt(
      this as unknown as ArtScene,
      'spotdiff-left',
      buildScene([]),
      leftX + PIC / 2,
      topY + PIC / 2,
      PIC,
    ) as unknown as Phaser.GameObjects.Image;
    const rightKey = `spotdiff-right-${changedIds.slice().sort().join('_')}`;
    const rightImg = addArt(
      this as unknown as ArtScene,
      rightKey,
      buildScene(changedIds),
      this.rightX + PIC / 2,
      this.rightY + PIC / 2,
      PIC,
    ) as unknown as Phaser.GameObjects.Image;
    this.layer.add(leftImg);
    this.layer.add(rightImg);

    // Soft frames around both pictures.
    const leftFrame = this.frame(leftX, topY);
    const rightFrame = this.frame(this.rightX, this.rightY);
    this.layer.add(leftFrame);
    this.layer.add(rightFrame);

    // Progress "X / N".
    this.progressText = this.add
      .text(width / 2, topY + PIC + 36, this.progressLabel(), {
        fontSize: '28px',
        color: '#5b4636',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(this.progressText);

    // Entrance for the two pictures + frames + prompt + progress (visual-only).
    // Added BEFORE the hotspots/miss-rect below, and it creates no interactive
    // objects, so the load-bearing creation order of the hit areas is untouched.
    animateIn(this, [prompt, leftImg, rightImg, leftFrame, rightFrame, this.progressText]);

    // For overlapping interactive children of a Container, Phaser's hit-test sorts
    // by camera renderList index (render/insertion order) and `input.topOnly` keeps
    // the LAST-added (highest-index) object. So the catch-all miss-rect is added
    // BEFORE the hotspots; the hotspots, added last, win the hit-test on overlap,
    // while a tap that hits only the miss-rect still fires onMiss. setDepth does not
    // reorder container children — add-order is the lever. Do not reorder.
    this.input.topOnly = true;

    // Catch-all over the right image → "try again" on a tap that misses every diff.
    // Added FIRST so the per-difference hotspots below win on overlap (see above).
    const miss = this.add
      .rectangle(this.rightX + PIC / 2, this.rightY + PIC / 2, PIC, PIC, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    miss.on('pointerdown', () => this.onMiss());
    this.layer.add(miss);

    // Invisible tap hotspots over each chosen difference on the RIGHT image. Added
    // AFTER the miss-rect so each wins the topOnly hit-test where it overlaps it.
    this.chosen.forEach((spot) => this.addHotspot(spot));
  }

  /** Map a catalog (0..100) coordinate onto the rendered right image. */
  private toScreen(v: number): number {
    return (v / ART_VB) * PIC;
  }

  private addHotspot(spot: DifferenceSpot): void {
    const cx = this.rightX + this.toScreen(spot.x);
    const cy = this.rightY + this.toScreen(spot.y);
    const r = this.toScreen(spot.radius);
    const hit = this.add
      .circle(cx, cy, r, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.onHit(spot, hit));
    this.layer!.add(hit);
  }

  private onHit(spot: DifferenceSpot, hit: Phaser.GameObjects.Arc): void {
    if (this.roundResolved) return;
    if (this.found.has(spot.id)) {
      this.onMiss(); // already found here → treat as a gentle miss
      return;
    }
    this.found.add(spot.id);
    this.host.playSfx('tap');
    void this.host.speak('feedback.correct');

    // Highlight ring marking the spot as found; disable further taps on it.
    const ring = this.add
      .circle(hit.x, hit.y, hit.radius, 0x000000, 0)
      .setStrokeStyle(4, 0x06d6a0);
    ring.setDepth(2);
    this.layer!.add(ring);
    // Juicy "found it" feedback: a quick scale bounce on the ring + sparkle stars.
    // (Replaces the old plain reveal tween; popCorrect owns the ring's scale so
    // there's no competing scale tween, and it touches no round/finish guard.)
    popCorrect(this, ring);
    this.buddy?.cheer();
    hit.disableInteractive();

    this.progressText?.setText(this.progressLabel());

    if (allFound(this.found, this.chosen)) {
      this.roundResolved = true;
      this.roundsCleared++;
      this.host.playSfx('correct');
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    }
  }

  private onMiss(): void {
    if (this.roundResolved) return;
    this.host.playSfx('wrong');
    void this.host.speak('feedback.tryagain');
    this.buddy?.encourage();
  }

  private progressLabel(): string {
    const total = differenceCountForLevel(this.level);
    return `${this.found.size} / ${total}`;
  }

  private frame(x: number, y: number): Phaser.GameObjects.Rectangle {
    return this.add
      .rectangle(x + PIC / 2, y + PIC / 2, PIC + 10, PIC + 10)
      .setStrokeStyle(5, INK);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const stars = starsForRounds(this.roundsCleared, ROUNDS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    celebrate(this);
    flyStars(this, this.scale.width / 2, this.scale.height / 2);
    this.host.awardStars(stars);
    this.host.complete({
      gameId: 'spot-difference',
      level: this.level,
      score: this.roundsCleared,
      stars,
    });
  }
}
