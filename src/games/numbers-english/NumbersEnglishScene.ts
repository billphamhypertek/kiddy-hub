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
import {
  animateIn,
  popCorrect,
  flyStars,
  squashStretchPop,
  sparkleBurst,
  tilePress,
  idleBreathe,
  type MotionObject,
} from '../../art/sceneMotion';
import { distractorsToDim } from '../scaffold';
import { hintKeyForSkill, HINT_FEWER_KEY } from '../masteryMap';
import { QUESTIONS_PER_GAME, generateRound, starsFor, maxNumberForLevel, type NumbersEnRound } from './numbersEnLogic';

const SKILL = 'number-en';

export class NumbersEnglishScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: NumbersEnRound;
  private layer?: Phaser.GameObjects.Container;
  private buddy?: SceneBuddy;
  private optionObjs: Array<{
    value: number;
    tile: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    btn: Phaser.GameObjects.Rectangle;
  }> = [];

  constructor(host: GameHost, level: number) {
    super({ key: 'numbers-english' });
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

  /** Re-read the prompt then the English number word in its native voice. */
  private sayTarget(): void {
    void this.host
      .speak('numbersen.prompt')
      .then(() => this.host.speakText(this.current.word, 'en-US'));
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    const pool = Array.from({ length: maxNumberForLevel(this.level) }, (_, i) => String(i + 1));
    const seed = this.host.pickItem?.(SKILL, pool);
    this.current = generateRound(this.level, Math.random, seed ? Number(seed) : undefined);
    this.optionObjs = [];
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
    const wordText = this.add
      .text(width / 2, height / 2 - 70, this.current.word, { fontSize: '72px', color: '#ff7043', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.layer.add(wordText);
    // GĐ6.4 — số đích "thở" nhẹ lúc chờ (calm-safe; chết theo layer mỗi round).
    idleBreathe(this, wordText as unknown as MotionObject);
    this.sayTarget();

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 150) / 2;
    const y = height - 120;
    const entrance: MotionObject[] = [prompt];
    opts.forEach((num, i) => {
      const x = optStartX + i * 150;
      const tile = addOptionTile(this, x, y, 122);
      this.layer!.add(tile);
      const btn = this.add
        .rectangle(x, y, 110, 110, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, String(num), { fontSize: '60px', color: '#5b4636', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => {
        // GĐ6.4 — phản hồi bấm xúc giác (visual-only); KHÔNG đổi luồng choose.
        tilePress(this, tile as unknown as MotionObject);
        this.choose(num, btn, tile, label);
      });
      this.layer!.add(btn);
      this.layer!.add(label);
      this.optionObjs.push({ value: num, tile, label, btn });
      entrance.push(tile, label);
    });
    // Visual-only entrance; hit areas are already live so taps work immediately.
    animateIn(this, entrance);
  }

  private choose(
    num: number,
    btn: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Text,
  ): void {
    if (this.roundResolved) return;
    if (num === this.current.target) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
      popCorrect(this, label);
      // GĐ6.4 — juice đúng (visual-only, calm-safe, không đổi flow).
      squashStretchPop(this, label);
      sparkleBurst(this, label.x, label.y);
      this.buddy?.cheer();
      if (!this.answeredThisRound) {
        this.correctCount++;
        this.host.recordItemResult?.(SKILL, String(this.current.target), true);
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
    const itemKey = String(this.current.target);
    this.host.recordItemResult?.(SKILL, itemKey, false);
    const keepN = this.host.hint?.(SKILL, itemKey) ?? Infinity;
    const correctIndex = this.optionObjs.findIndex((o) => o.value === this.current.target);
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
    this.host.complete({ gameId: 'numbers-english', level: this.level, score: this.correctCount, stars });
  }
}
