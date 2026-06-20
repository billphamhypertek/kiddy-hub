import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, addOptionTile, celebrate, shakeOption } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type OddRound } from './oddOneOutLogic';

export class OddOneOutScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: OddRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'odd-one-out' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'logic');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('oddoneout.prompt'),
    });
    this.nextRound();
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    this.current = generateRound(this.level, Math.random);
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;
    const prompt = this.add
      .text(width / 2, 100, 'Chạm vào vật khác nhóm', {
        fontSize: '36px',
        color: '#8a6d00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('oddoneout.prompt');

    const items = this.current.items;
    const startX = width / 2 - ((items.length - 1) * 150) / 2;
    const y = height / 2 + 30;
    const entrance: MotionObject[] = [prompt];
    items.forEach((emoji, i) => {
      const x = startX + i * 150;
      const tile = addOptionTile(this, x, y, 132);
      this.layer!.add(tile);
      const btn = this.add
        .rectangle(x, y, 120, 120, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, emoji, { fontSize: '64px' }).setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(i, btn, tile, label));
      this.layer!.add(btn);
      this.layer!.add(label);
      entrance.push(tile, label);
    });
    // Visual-only entrance; hit areas are already live so taps work immediately.
    animateIn(this, entrance);
  }

  private choose(
    index: number,
    btn: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
  ): void {
    if (this.roundResolved) return;
    if (index === this.current.oddIndex) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
      popCorrect(this, label);
      if (!this.answeredThisRound) this.correctCount++;
      this.answeredThisRound = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      this.answeredThisRound = true;
      this.host.playSfx('wrong');
      void this.host.speak('feedback.tryagain');
      shakeOption(this, tile, label, btn);
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    celebrate(this);
    flyStars(this, this.scale.width / 2, this.scale.height / 2);
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'odd-one-out', level: this.level, score: this.correctCount, stars });
  }
}
