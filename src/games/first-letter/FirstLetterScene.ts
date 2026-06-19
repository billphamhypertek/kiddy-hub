import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  type FirstLetterRound,
} from './firstLetterLogic';

export class FirstLetterScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: FirstLetterRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'first-letter' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#eef6ff');
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
      .on('pointerdown', () => void this.host.speak('firstletter.prompt'));
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
      .text(width / 2, 80, 'Chữ cái đầu tiên là chữ gì?', {
        fontSize: '34px',
        color: '#1b4f8a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('firstletter.prompt');

    this.layer.add(
      this.add.text(width / 2, height / 2 - 60, this.current.entry.emoji, { fontSize: '120px' }).setOrigin(0.5),
    );
    this.layer.add(
      this.add
        .text(width / 2, height / 2 + 30, this.current.entry.word, {
          fontSize: '48px',
          color: '#333',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 140) / 2;
    const y = height - 120;
    opts.forEach((letter, i) => {
      const x = optStartX + i * 140;
      const btn = this.add
        .rectangle(x, y, 110, 110, 0xffffff)
        .setStrokeStyle(6, 0x7cc6fe)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, letter, { fontSize: '60px', color: '#444', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(letter, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(letter: string, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (letter === this.current.entry.letter) {
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
    this.host.complete({ gameId: 'first-letter', level: this.level, score: this.correctCount, stars });
  }
}
