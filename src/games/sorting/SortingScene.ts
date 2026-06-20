import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, addOptionTile, celebrate } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
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
    addSceneBackground(this, 'logic');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('sorting.prompt'),
    });
    const { width } = this.scale;
    const prompt = this.add
      .text(width / 2, 70, 'Kéo mỗi vật vào đúng giỏ', { fontSize: '34px', color: '#8a6d00', fontStyle: 'bold' })
      .setOrigin(0.5);
    void this.host.speak('sorting.prompt');

    this.round = generateRound(this.level, Math.random);
    this.buildBasketsAndPile(prompt);
  }

  /**
   * @param prompt the page title, animated in with the static furniture. Only
   *   STATIC furniture (prompt, basket backings/outlines/labels, the home tiles
   *   under each pile item) is passed to `animateIn` — the draggable pile emoji
   *   are NEVER animated, so the entrance can't fight the drag handlers.
   */
  private buildBasketsAndPile(prompt: Phaser.GameObjects.Text): void {
    const { width, height } = this.scale;
    const furniture: MotionObject[] = [prompt];

    // Baskets across the top.
    const bN = this.round.baskets.length;
    const basketY = 200;
    this.round.baskets.forEach((basket, i) => {
      const x = width / 2 - ((bN - 1) * 220) / 2 + i * 220;
      // Soft tile behind each basket, then the basket outline + its label emoji.
      furniture.push(addOptionTile(this, x, basketY, 180).setDisplaySize(186, 146));
      furniture.push(this.add.rectangle(x, basketY, 170, 130, 0xffffff, 0.001).setStrokeStyle(6, 0xffd36e));
      const labelId = emojiToCreatureId(basket.label);
      furniture.push(
        addArt(this as unknown as ArtScene, `creature-${labelId}`, creature(labelId), x, basketY, 100) as unknown as Phaser.GameObjects.Image,
      );
      this.baskets.push({ index: i, x, y: basketY });
    });

    // Pile items along the bottom in shuffled pileOrder.
    const trayY = height - 110;
    const order = this.round.pileOrder;
    order.forEach((pileIdx, k) => {
      const item = this.round.pile[pileIdx];
      const x = width / 2 - ((order.length - 1) * 90) / 2 + k * 90;
      // Static "home" tile under each pile item; the draggable emoji sits on top
      // and the tile stays put as the item is dragged out and (maybe) bounced back.
      furniture.push(addOptionTile(this, x, trayY, 84));
      const itemId = emojiToCreatureId(item.emoji);
      const obj = (
        addArt(this as unknown as ArtScene, `creature-${itemId}`, creature(itemId), x, trayY, 72) as unknown as Phaser.GameObjects.Image
      ).setInteractive({ useHandCursor: true, draggable: true });
      obj.setData('basketIndex', item.basketIndex);
      obj.setData('homeX', x);
      obj.setData('homeY', trayY);
      this.input.setDraggable(obj);
    });

    // Entrance for static furniture only; the draggable pile emoji are untouched.
    animateIn(this, furniture);

    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, dx: number, dy: number) => {
      obj.x = dx;
      obj.y = dy;
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => this.onDrop(obj));
  }

  private onDrop(obj: Phaser.GameObjects.Image): void {
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
      // Locked into the basket (no longer draggable) → a reward pop, not entrance.
      popCorrect(this, obj);
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
    celebrate(this);
    flyStars(this, this.scale.width / 2, this.scale.height / 2);
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'sorting', level: this.level, score: total, stars });
  }
}
