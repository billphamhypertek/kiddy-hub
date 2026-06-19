import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type ColorsEnRound } from './colorsEnLogic';

export class ColorsEnglishScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: ColorsEnRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'colors-english' });
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
      .on('pointerdown', () => this.sayTarget());
  }

  /** Re-read the prompt then the English colour name in its native voice. */
  private sayTarget(): void {
    void this.host
      .speak('colorsen.prompt')
      .then(() => this.host.speakText(this.current.target.name, 'en-US'));
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
      .text(width / 2, 90, 'Nghe và chạm đúng màu', {
        fontSize: '34px',
        color: '#a8431f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    // English colour word as a learning aid alongside the placeholder voice.
    this.layer.add(
      this.add
        .text(width / 2, height / 2 - 90, this.current.target.name, { fontSize: '64px', color: '#ff7043', fontStyle: 'bold' })
        .setOrigin(0.5),
    );
    this.sayTarget();

    const opts = this.current.options;
    const startX = width / 2 - ((opts.length - 1) * 170) / 2;
    const y = height / 2 + 60;
    opts.forEach((color, i) => {
      const x = startX + i * 170;
      const swatch = this.add
        .rectangle(x, y, 130, 130, color.hex)
        .setStrokeStyle(6, 0xffffff)
        .setInteractive({ useHandCursor: true });
      swatch.on('pointerdown', () => this.choose(color.name, swatch));
      this.layer!.add(swatch);
    });
  }

  private choose(name: string, swatch: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (name === this.current.target.name) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      swatch.setStrokeStyle(10, 0x2ecc71);
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
      this.tweens.add({ targets: swatch, x: swatch.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'colors-english', level: this.level, score: this.correctCount, stars });
  }
}
