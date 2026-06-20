import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, addOptionTile, celebrate } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
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
    addSceneBackground(this, 'english');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => this.sayTarget(),
    });
    this.nextRound();
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
    const entrance: MotionObject[] = [prompt];
    opts.forEach((color, i) => {
      const x = startX + i * 170;
      // Tile frames the colour swatch (slightly larger than the swatch itself).
      const tile = addOptionTile(this, x, y, 152);
      this.layer!.add(tile);
      const swatch = this.add
        .rectangle(x, y, 130, 130, color.hex)
        .setStrokeStyle(6, 0xffffff)
        .setInteractive({ useHandCursor: true });
      swatch.on('pointerdown', () => this.choose(color.name, swatch));
      this.layer!.add(swatch);
      entrance.push(tile, swatch);
    });
    // Visual-only entrance; hit areas are already live so taps work immediately.
    animateIn(this, entrance);
  }

  private choose(name: string, swatch: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (name === this.current.target.name) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      swatch.setStrokeStyle(10, 0x2ecc71);
      popCorrect(this, swatch);
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
    celebrate(this);
    flyStars(this, this.scale.width / 2, this.scale.height / 2);
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'colors-english', level: this.level, score: this.correctCount, stars });
  }
}
