import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type WordRound } from './wordLogic';

export class FirstWordsScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: WordRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'first-words' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#ffe6df');
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
      .on('pointerdown', () => void this.host.speak('firstwords.prompt'));
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
    // UI in Vietnamese; the English word is shown small as a learning aid.
    const prompt = this.add
      .text(width / 2, 90, `Hãy tìm: ${this.current.target.word}`, {
        fontSize: '38px',
        color: '#8a2b1a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('firstwords.prompt');

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 160) / 2;
    const y = height / 2 + 40;
    opts.forEach((item, i) => {
      const x = optStartX + i * 160;
      const btn = this.add
        .rectangle(x, y, 130, 130, 0xffffff)
        .setStrokeStyle(6, 0xff8a65)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, item.emoji, { fontSize: '66px' }).setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(item.word, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(word: string, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (word === this.current.target.word) {
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
    this.host.complete({
      gameId: 'first-words',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
