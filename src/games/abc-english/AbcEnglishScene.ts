import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  addSceneBackground,
  addChrome,
  addOptionTile,
  celebrate,
  shakeOption,
  dimDistractor,
  addBuddy,
  type SceneBuddy,
} from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
import { distractorsToDim } from '../scaffold';
import { hintKeyForSkill, HINT_FEWER_KEY } from '../masteryMap';
import { QUESTIONS_PER_GAME, generateRound, starsFor, letterPoolForLevel, type AbcRound } from './abcLogic';

const SKILL = 'letter-en';

export class AbcEnglishScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: AbcRound;
  private layer?: Phaser.GameObjects.Container;
  private buddy?: SceneBuddy;
  private optionObjs: Array<{
    value: string;
    tile: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    btn: Phaser.GameObjects.Rectangle;
  }> = [];

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
    // GĐ6.3 — Cáo đồng hành (visual-only): hiện diện khi chơi, phản ứng đúng/sai.
    this.buddy = addBuddy(this);
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
    const seed = this.host.pickItem?.(SKILL, letterPoolForLevel(this.level));
    this.current = generateRound(this.level, Math.random, seed);
    this.optionObjs = [];
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
      this.optionObjs.push({ value: letter, tile, label, btn });
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
      this.buddy?.cheer();
      if (!this.answeredThisRound) {
        this.correctCount++;
        this.host.recordItemResult?.(SKILL, this.current.target, true);
      }
      this.answeredThisRound = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      const firstTry = !this.answeredThisRound;
      this.answeredThisRound = true;
      this.host.playSfx('wrong');
      if (firstTry) this.scaffold();
      else void this.host.speak('feedback.tryagain');
      shakeOption(this, tile, label, btn);
      this.buddy?.encourage();
    }
  }

  /** Wrong FIRST try: record the miss, dim distractors, speak a teaching hint. */
  private scaffold(): void {
    const itemKey = this.current.target;
    this.host.recordItemResult?.(SKILL, itemKey, false);
    const keepN = this.host.hint?.(SKILL, itemKey) ?? Infinity;
    const correctIndex = this.optionObjs.findIndex((o) => o.value === itemKey);
    const dim = distractorsToDim(this.optionObjs.length, correctIndex, keepN);
    for (const i of dim) {
      const o = this.optionObjs[i];
      dimDistractor(this, o.tile, o.label, o.btn);
    }
    const hintKey = hintKeyForSkill(SKILL);
    if (dim.length > 0) void this.host.speak(HINT_FEWER_KEY).then(() => this.host.speak(hintKey));
    else void this.host.speak(hintKey);
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
