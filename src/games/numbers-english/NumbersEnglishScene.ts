import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type NumbersEnRound } from './numbersEnLogic';

export class NumbersEnglishScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: NumbersEnRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'numbers-english' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff1ea');
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
      .on('pointerdown', () => void this.host.speak('numbersen.prompt'));
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
      .text(width / 2, 90, 'Nghe và chạm đúng số', {
        fontSize: '34px',
        color: '#a8431f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    // English word as a learning aid alongside the placeholder voice.
    this.layer.add(
      this.add
        .text(width / 2, height / 2 - 70, this.current.word, { fontSize: '72px', color: '#ff7043', fontStyle: 'bold' })
        .setOrigin(0.5),
    );
    void this.host.speak('numbersen.prompt');

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 150) / 2;
    const y = height - 120;
    opts.forEach((num, i) => {
      const x = optStartX + i * 150;
      const btn = this.add
        .rectangle(x, y, 110, 110, 0xffffff)
        .setStrokeStyle(6, 0xff7043)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, String(num), { fontSize: '60px', color: '#444', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(num, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(num: number, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (num === this.current.target) {
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
    this.host.complete({ gameId: 'numbers-english', level: this.level, score: this.correctCount, stars });
  }
}
