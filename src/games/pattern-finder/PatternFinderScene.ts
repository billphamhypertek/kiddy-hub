import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, addOptionTile, celebrate, shakeOption } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type PatternRound } from './patternLogic';

export class PatternFinderScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: PatternRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'pattern-finder' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'logic');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('pattern.prompt'),
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
      .text(width / 2, 90, 'Ô tiếp theo là gì?', {
        fontSize: '36px',
        color: '#8a6d00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('pattern.prompt');

    // Sequence row (+ a "?" cell at the end).
    const cells = [...this.current.sequence, '?'];
    const startX = width / 2 - ((cells.length - 1) * 84) / 2;
    cells.forEach((tok, i) => {
      const cell = this.add
        .text(startX + i * 84, height / 2 - 40, tok, { fontSize: '56px' })
        .setOrigin(0.5);
      this.layer!.add(cell);
    });

    // Option buttons.
    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 130) / 2;
    const y = height - 130;
    const entrance: MotionObject[] = [prompt];
    opts.forEach((tok, i) => {
      const x = optStartX + i * 130;
      const tile = addOptionTile(this, x, y, 112);
      this.layer!.add(tile);
      const btn = this.add
        .rectangle(x, y, 100, 100, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, tok, { fontSize: '48px' }).setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(tok, btn, tile, label));
      this.layer!.add(btn);
      this.layer!.add(label);
      entrance.push(tile, label);
    });
    // Visual-only entrance; hit areas are already live so taps work immediately.
    animateIn(this, entrance);
  }

  private choose(
    tok: string,
    btn: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
  ): void {
    if (this.roundResolved) return;
    if (tok === this.current.answer) {
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
    this.host.complete({
      gameId: 'pattern-finder',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
