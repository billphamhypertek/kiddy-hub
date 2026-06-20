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
  type MotionObject,
} from '../../art/sceneMotion';
import { distractorsToDim } from '../scaffold';
import { hintKeyForSkill, HINT_FEWER_KEY } from '../masteryMap';
import { QUESTIONS_PER_GAME, generateRound, starsFor, LETTERS, type LetterRound } from './letterLogic';

const SKILL = 'letter-vi';

export class LetterSpottingScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: LetterRound;
  private layer?: Phaser.GameObjects.Container;
  private buddy?: SceneBuddy;
  private optionObjs: Array<{
    value: string;
    tile: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    btn: Phaser.GameObjects.Rectangle;
  }> = [];

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
    // GĐ6.3 — Cáo đồng hành (visual-only): hiện diện khi chơi, phản ứng đúng/sai.
    this.buddy = addBuddy(this);
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
    const seed = this.host.pickItem?.(SKILL, LETTERS);
    this.current = generateRound(this.level, Math.random, seed);
    this.optionObjs = [];
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
      btn.on('pointerdown', () => {
        // GĐ6.4 — phản hồi bấm xúc giác (visual-only); KHÔNG đổi luồng choose.
        tilePress(this, tile as unknown as MotionObject);
        this.choose(letter, btn, tile, label);
      });
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
      // GĐ6.4 — juice đúng (visual-only, calm-safe, không đổi flow).
      squashStretchPop(this, label);
      sparkleBurst(this, label.x, label.y);
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
      this.answeredThisRound = true; // first try wrong -> round not counted
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
    this.host.complete({
      gameId: 'letter-spotting',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
