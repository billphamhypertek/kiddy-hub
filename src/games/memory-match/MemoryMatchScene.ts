import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, celebrate, addBuddy, type SceneBuddy } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
import { buildBoard, gridForLevel, starsForFlips, type Card } from './memoryLogic';

interface CardView {
  card: Card;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Image;
  matched: boolean;
  faceUp: boolean;
}

export class MemoryMatchScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private views: CardView[] = [];
  private first: CardView | null = null;
  private flips = 0;
  private matchedPairs = 0;
  private busy = false; // guards the third tap while two cards resolve
  private finished = false;
  private buddy?: SceneBuddy;

  constructor(host: GameHost, level: number) {
    super({ key: 'memory-match' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'memory');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('memory.prompt'),
    });
    // GĐ6.3 — Cáo đồng hành (visual-only): hiện diện khi chơi, phản ứng đúng/sai.
    this.buddy = addBuddy(this);
    void this.host.speak('memory.prompt');
    this.layoutBoard();
  }

  private layoutBoard(): void {
    const { rows, cols } = gridForLevel(this.level);
    const cards = buildBoard(this.level, Math.random);
    const { width, height } = this.scale;
    const cell = 120;
    const gap = 20;
    const boardW = cols * cell + (cols - 1) * gap;
    const boardH = rows * cell + (rows - 1) * gap;
    const x0 = (width - boardW) / 2 + cell / 2;
    const y0 = (height - boardH) / 2 + cell / 2 + 30;

    const entrance: MotionObject[] = [];
    cards.forEach((card, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = x0 + c * (cell + gap);
      const y = y0 + r * (cell + gap);
      const rect = this.add
        .rectangle(x, y, cell, cell, 0xb89bff)
        .setStrokeStyle(6, 0x8a5cff)
        .setInteractive({ useHandCursor: true });
      const id = emojiToCreatureId(card.faceKey);
      const label = (
        addArt(this as unknown as ArtScene, `creature-${id}`, creature(id), x, y, 96) as unknown as Phaser.GameObjects.Image
      ).setVisible(false);
      const view: CardView = { card, rect, label, matched: false, faceUp: false };
      rect.on('pointerdown', () => this.flip(view));
      this.views.push(view);
      // Animate the face-down card backs only (labels stay hidden until flipped).
      entrance.push(rect);
    });
    // Visual-only entrance; cards are already interactive so taps work immediately.
    animateIn(this, entrance);
  }

  private flip(view: CardView): void {
    if (this.busy || view.faceUp || view.matched || this.finished) return;
    view.faceUp = true;
    view.label.setVisible(true);
    view.rect.setFillStyle(0xffffff);

    if (!this.first) {
      this.first = view;
      return;
    }

    // Second card of a flip-pair.
    this.flips++;
    const first = this.first;
    this.first = null;

    if (first.card.pairId === view.card.pairId) {
      this.host.playSfx('correct');
      first.matched = true;
      view.matched = true;
      this.matchedPairs++;
      first.rect.setFillStyle(0x9be08a);
      view.rect.setFillStyle(0x9be08a);
      popCorrect(this, view.label);
      this.buddy?.cheer();
      if (this.matchedPairs === gridForLevel(this.level).pairs) this.finish();
    } else {
      this.busy = true;
      this.host.playSfx('wrong');
      this.buddy?.encourage();
      this.time.delayedCall(700, () => {
        for (const v of [first, view]) {
          v.faceUp = false;
          v.label.setVisible(false);
          v.rect.setFillStyle(0xb89bff);
        }
        this.busy = false;
      });
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const stars = starsForFlips(this.flips, gridForLevel(this.level).pairs);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    celebrate(this);
    flyStars(this, this.scale.width / 2, this.scale.height / 2);
    this.host.awardStars(stars);
    this.host.complete({
      gameId: 'memory-match',
      level: this.level,
      score: this.matchedPairs,
      stars,
    });
  }
}
