import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { buildBoard, gridForLevel, starsForFlips, type Card } from './memoryLogic';

interface CardView {
  card: Card;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
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

  constructor(host: GameHost, level: number) {
    super({ key: 'memory-match' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#efe6ff');
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('memory.prompt'));

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

    cards.forEach((card, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = x0 + c * (cell + gap);
      const y = y0 + r * (cell + gap);
      const rect = this.add
        .rectangle(x, y, cell, cell, 0xb89bff)
        .setStrokeStyle(6, 0x8a5cff)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, card.faceKey, { fontSize: '64px' })
        .setOrigin(0.5)
        .setVisible(false);
      const view: CardView = { card, rect, label, matched: false, faceUp: false };
      rect.on('pointerdown', () => this.flip(view));
      this.views.push(view);
    });
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
      if (this.matchedPairs === gridForLevel(this.level).pairs) this.finish();
    } else {
      this.busy = true;
      this.host.playSfx('wrong');
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
    this.host.awardStars(stars);
    this.host.complete({
      gameId: 'memory-match',
      level: this.level,
      score: this.matchedPairs,
      stars,
    });
  }
}
