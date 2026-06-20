import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, celebrate } from '../../art/sceneArt';
import { addArt, type ArtScene } from '../../art/svg';
import {
  ROUNDS_PER_GAME,
  chooseDifferences,
  differenceCountForLevel,
  allFound,
  starsForRounds,
  type DifferenceSpot,
} from './spotDifferenceLogic';
import { buildScene } from './gardenScene';

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
    this.layer.add(this.frame(leftX, topY));
    this.layer.add(this.frame(this.rightX, this.rightY));

    // Progress "X / N".
    this.progressText = this.add
      .text(width / 2, topY + PIC + 36, this.progressLabel(), {
        fontSize: '28px',
        color: '#5b4636',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(this.progressText);

    // Invisible tap hotspots over each chosen difference on the RIGHT image.
    // IMPORTANT: hotspots are created BEFORE the catch-all miss-rect below. Both are
    // children of `this.layer` (a Container); for container children Phaser's input
    // hit-test ties on render index, and `input.topOnly` keeps the earlier-created
    // object. So CREATION ORDER — not setDepth (inert for container children) — is
    // what makes a hotspot win over the overlapping miss-rect. Do not reorder.
    this.input.topOnly = true;
    this.chosen.forEach((spot) => this.addHotspot(spot));

    // Catch-all over the right image → "try again" on a tap that misses every diff.
    const miss = this.add
      .rectangle(this.rightX + PIC / 2, this.rightY + PIC / 2, PIC, PIC, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    miss.on('pointerdown', () => this.onMiss());
    this.layer.add(miss);
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
    this.tweens.add({ targets: ring, scale: { from: 0.6, to: 1 }, duration: 220, ease: 'Back.easeOut' });
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
    this.host.awardStars(stars);
    this.host.complete({
      gameId: 'spot-difference',
      level: this.level,
      score: this.roundsCleared,
      stars,
    });
  }
}
