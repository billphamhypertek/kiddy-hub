import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
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
    this.cameras.main.setBackgroundColor('#fff7da');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('oddoneout.prompt'));
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
    items.forEach((emoji, i) => {
      const x = startX + i * 150;
      const btn = this.add
        .rectangle(x, y, 120, 120, 0xffffff)
        .setStrokeStyle(6, 0xffd36e)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, emoji, { fontSize: '64px' }).setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(i, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(index: number, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (index === this.current.oddIndex) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
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
      this.tweens.add({ targets: btn, x: btn.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'odd-one-out', level: this.level, score: this.correctCount, stars });
  }
}
