import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, addOptionTile, celebrate, shakeOption, dimDistractor } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
import { distractorsToDim } from '../scaffold';
import { hintKeyForSkill, HINT_FEWER_KEY } from '../masteryMap';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  maxCountForLevel,
  type CountingRound,
} from './countingLogic';

const SKILL = 'number-vi';

export class CountingFunScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: CountingRound;
  private layer?: Phaser.GameObjects.Container;
  // Per-round option objects, kept so a wrong first try can dim distractors.
  private optionObjs: Array<{
    value: number;
    tile: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    btn: Phaser.GameObjects.Rectangle;
  }> = [];

  constructor(host: GameHost, level: number) {
    super({ key: 'counting-fun' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'numbers');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('counting.prompt'),
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
    // SR: ask the session for the next count to drill, then seed it into the
    // (still pure) round generator. No session ⇒ seed undefined ⇒ legacy round.
    const pool = Array.from({ length: maxCountForLevel(this.level) }, (_, i) => String(i + 1));
    const seed = this.host.pickItem?.(SKILL, pool);
    this.current = generateRound(this.level, Math.random, seed ? Number(seed) : undefined);
    this.optionObjs = [];
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
    const entrance: MotionObject[] = [prompt];
    this.current.options.forEach((opt, i) => {
      const x = optStartX + i * 140;
      const tile = addOptionTile(this, x, optY, 116);
      this.layer!.add(tile);
      const btn = this.add
        .rectangle(x, optY, 104, 104, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, optY, String(opt), { fontSize: '52px', color: '#5b4636', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(opt, btn, tile, label));
      this.layer!.add(btn);
      this.layer!.add(label);
      this.optionObjs.push({ value: opt, tile, label, btn });
      entrance.push(tile, label);
    });
    // Entrance is visual-only; hit areas above are already live, so a tap during
    // the animation still works.
    animateIn(this, entrance);
  }

  private choose(
    opt: number,
    btn: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
  ): void {
    if (this.roundResolved) return;
    if (opt === this.current.count) {
      this.host.playSfx('correct');
      // Cheer, then reinforce the number-word link by reading the count aloud.
      const count = this.current.count;
      void this.host.speak('feedback.correct').then(() => this.host.speakText(String(count), 'vi-VN'));
      btn.setFillStyle(0x9be08a);
      popCorrect(this, label);
      // SR: record first-try outcome once (correct only if no wrong try yet).
      if (!this.answeredThisRound) {
        this.correctCount++;
        this.host.recordItemResult?.(SKILL, String(count), true);
      }
      this.answeredThisRound = true;
      this.roundResolved = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      const firstTry = !this.answeredThisRound;
      this.answeredThisRound = true; // first try was wrong -> round not counted
      this.host.playSfx('wrong');
      if (firstTry) this.scaffold();
      else void this.host.speak('feedback.tryagain');
      shakeOption(this, tile, label, btn);
    }
  }

  /**
   * Wrong FIRST try (no-lose, GĐ5B §9): record the miss, optionally dim
   * distractors down to `keepN` options, then speak a teaching hint. Never
   * destroys/moves an option — only fades + disables — so guards & layout hold.
   */
  private scaffold(): void {
    const itemKey = String(this.current.count);
    this.host.recordItemResult?.(SKILL, itemKey, false);
    const keepN = this.host.hint?.(SKILL, itemKey) ?? Infinity;
    const correctIndex = this.optionObjs.findIndex((o) => o.value === this.current.count);
    const dim = distractorsToDim(this.optionObjs.length, correctIndex, keepN);
    for (const i of dim) {
      const o = this.optionObjs[i];
      dimDistractor(this, o.tile, o.label, o.btn);
    }
    const hintKey = hintKeyForSkill(SKILL);
    if (dim.length > 0) {
      void this.host.speak(HINT_FEWER_KEY).then(() => this.host.speak(hintKey));
    } else {
      void this.host.speak(hintKey);
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
      gameId: 'counting-fun',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
