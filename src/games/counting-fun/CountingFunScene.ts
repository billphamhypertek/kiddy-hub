import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  type CountingRound,
} from './countingLogic';

export class CountingFunScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: CountingRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'counting-fun' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#dff3ff');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    const home = this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true });
    home.on('pointerdown', () => this.host.goHome());

    const listen = this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true });
    listen.on('pointerdown', () => void this.host.speak('counting.prompt'));
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
      .text(width / 2, 90, `Có mấy chú ${this.current.animal}?`, {
        fontSize: '34px',
        color: '#22335a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('counting.prompt');

    const startX = width / 2 - ((this.current.count - 1) * 72) / 2;
    for (let i = 0; i < this.current.count; i++) {
      const sprite = this.add
        .text(startX + i * 72, height / 2 - 30, this.current.animal, { fontSize: '60px' })
        .setOrigin(0.5);
      this.layer.add(sprite);
    }

    const optY = height - 130;
    const optStartX = width / 2 - ((this.current.options.length - 1) * 140) / 2;
    this.current.options.forEach((opt, i) => {
      const x = optStartX + i * 140;
      const btn = this.add
        .rectangle(x, optY, 104, 104, 0xffffff)
        .setStrokeStyle(6, 0xffd36e)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, optY, String(opt), { fontSize: '52px', color: '#444', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(opt, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(opt: number, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (opt === this.current.count) {
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
      if (!this.answeredThisRound) this.correctCount++;
      this.answeredThisRound = true;
      this.roundResolved = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      this.answeredThisRound = true; // first try was wrong -> round not counted
      this.host.playSfx('wrong');
      void this.host.speak('feedback.tryagain');
      this.tweens.add({ targets: btn, x: btn.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({
      gameId: 'counting-fun',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
