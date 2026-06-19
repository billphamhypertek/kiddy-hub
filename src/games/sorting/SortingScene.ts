import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { generateRound, starsFor, type SortingRound } from './sortingLogic';

interface BasketInfo {
  index: number;
  x: number;
  y: number;
}

export class SortingScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private round!: SortingRound;
  private baskets: BasketInfo[] = [];
  private placed = 0;
  private correct = 0;
  private finished = false;

  constructor(host: GameHost, level: number) {
    super({ key: 'sorting' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff7da');
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('sorting.prompt'));
    this.add
      .text(width / 2, 70, 'Kéo mỗi vật vào đúng giỏ', { fontSize: '34px', color: '#8a6d00', fontStyle: 'bold' })
      .setOrigin(0.5);
    void this.host.speak('sorting.prompt');

    this.round = generateRound(this.level, Math.random);
    this.buildBasketsAndPile();
  }

  private buildBasketsAndPile(): void {
    const { width, height } = this.scale;

    // Baskets across the top.
    const bN = this.round.baskets.length;
    const basketY = 200;
    this.round.baskets.forEach((basket, i) => {
      const x = width / 2 - ((bN - 1) * 220) / 2 + i * 220;
      this.add.rectangle(x, basketY, 170, 130, 0xffffff, 0.6).setStrokeStyle(6, 0xffd36e);
      this.add.text(x, basketY, basket.label, { fontSize: '72px' }).setOrigin(0.5);
      this.baskets.push({ index: i, x, y: basketY });
    });

    // Pile items along the bottom in shuffled pileOrder.
    const trayY = height - 110;
    const order = this.round.pileOrder;
    order.forEach((pileIdx, k) => {
      const item = this.round.pile[pileIdx];
      const x = width / 2 - ((order.length - 1) * 90) / 2 + k * 90;
      const obj = this.add
        .text(x, trayY, item.emoji, { fontSize: '56px' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true, draggable: true });
      obj.setData('basketIndex', item.basketIndex);
      obj.setData('homeX', x);
      obj.setData('homeY', trayY);
      this.input.setDraggable(obj);
    });

    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Text, dx: number, dy: number) => {
      obj.x = dx;
      obj.y = dy;
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Text) => this.onDrop(obj));
  }

  private onDrop(obj: Phaser.GameObjects.Text): void {
    if (this.finished) return;
    const wantBasket = obj.getData('basketIndex') as number;

    // Nearest basket within snap distance.
    let best: BasketInfo | undefined;
    let bestDist = Infinity;
    for (const b of this.baskets) {
      const d = Phaser.Math.Distance.Between(obj.x, obj.y, b.x, b.y);
      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }

    const SNAP = 110;
    if (best && bestDist <= SNAP && best.index === wantBasket) {
      // Correct: tuck into the basket and lock.
      obj.x = best.x + (Math.random() - 0.5) * 60;
      obj.y = best.y + 10;
      this.input.setDraggable(obj, false);
      obj.disableInteractive();
      this.host.playSfx('correct');
      this.correct++;
      this.placed++;
      if (this.placed === this.round.pile.length) this.finish();
    } else if (best && bestDist <= SNAP) {
      // Dropped in a basket, but the wrong one: count as placed (wrong) and lock,
      // so the board still completes (no "stuck" item) but the child loses a point.
      obj.x = best.x + (Math.random() - 0.5) * 60;
      obj.y = best.y + 10;
      this.input.setDraggable(obj, false);
      obj.disableInteractive();
      this.host.playSfx('wrong');
      this.placed++;
      if (this.placed === this.round.pile.length) this.finish();
    } else {
      // Not near any basket: bounce back home, try again.
      this.host.playSfx('wrong');
      const homeX = obj.getData('homeX') as number;
      const homeY = obj.getData('homeY') as number;
      obj.x = homeX;
      obj.y = homeY;
      this.tweens.add({ targets: obj, x: homeX + 8, duration: 60, yoyo: true, repeat: 2 });
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const total = this.round.pile.length;
    const stars = starsFor(this.correct, total);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'sorting', level: this.level, score: total, stars });
  }
}
