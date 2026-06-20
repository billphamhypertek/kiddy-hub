import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, addOptionTile, celebrate, shakeOption } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type LetterRound } from './letterLogic';

export class LetterSpottingScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: LetterRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'letter-spotting' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'letters');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => this.sayTarget(),
    });
    this.nextRound();
  }

  /** Re-read the prompt then the target Vietnamese letter aloud. */
  private sayTarget(): void {
    void this.host
      .speak('letter.prompt')
      .then(() => this.host.speakText(this.current.target, 'vi-VN'));
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
      .text(width / 2, 110, `Hãy tìm chữ "${this.current.target}"`, {
        fontSize: '40px',
        color: '#7a3e00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    this.sayTarget();

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 150) / 2;
    const y = height / 2 + 40;
    const entrance: MotionObject[] = [prompt];
    opts.forEach((letter, i) => {
      const x = optStartX + i * 150;
      const tile = addOptionTile(this, x, y, 132);
      this.layer!.add(tile);
      const btn = this.add
        .rectangle(x, y, 120, 120, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, letter, { fontSize: '64px', color: '#5b4636', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(letter, btn, tile, label));
      this.layer!.add(btn);
      this.layer!.add(label);
      entrance.push(tile, label);
    });
    // Visual-only entrance; hit areas are already live so taps work immediately.
    animateIn(this, entrance);
  }

  private choose(
    letter: string,
    btn: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
  ): void {
    if (this.roundResolved) return;
    if (letter === this.current.target) {
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
      this.answeredThisRound = true; // first try wrong -> round not counted
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
    this.host.complete({
      gameId: 'letter-spotting',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
