import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, addOptionTile, celebrate, shakeOption } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type AbcRound } from './abcLogic';

export class AbcEnglishScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: AbcRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'abc-english' });
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

  /** Re-read the prompt then the English target letter in its native voice. */
  private sayTarget(): void {
    void this.host
      .speak('abc.prompt')
      .then(() => this.host.speakText(this.current.target, 'en-US'));
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
    // UI is Vietnamese; the answer letters are English. Show the target letter as a
    // visual aid in addition to the (placeholder) voice prompt.
    const prompt = this.add
      .text(width / 2, 90, 'Nghe và chạm đúng chữ', {
        fontSize: '34px',
        color: '#a8431f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    const targetText = this.add
      .text(width / 2, height / 2 - 70, this.current.target, { fontSize: '110px', color: '#ff7043', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.layer.add(targetText);
    this.sayTarget();

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 140) / 2;
    const y = height - 120;
    // The big target letter joins the staggered entrance (it has a safe final
    // state, so an interrupted tween never strands it) — prompt, then target,
    // then the option tiles/labels.
    const entrance: MotionObject[] = [prompt, targetText];
    opts.forEach((letter, i) => {
      const x = optStartX + i * 140;
      const tile = addOptionTile(this, x, y, 122);
      this.layer!.add(tile);
      const btn = this.add
        .rectangle(x, y, 110, 110, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, letter, { fontSize: '60px', color: '#5b4636', fontStyle: 'bold' })
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
    this.host.complete({ gameId: 'abc-english', level: this.level, score: this.correctCount, stars });
  }
}
