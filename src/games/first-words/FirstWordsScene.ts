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
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
import { distractorsToDim } from '../scaffold';
import { hintKeyForSkill, HINT_FEWER_KEY } from '../masteryMap';
import { QUESTIONS_PER_GAME, generateRound, starsFor, WORD_BANK, type WordRound } from './wordLogic';

const SKILL = 'word-en';
function wordPoolForLevel(level: number): string[] {
  const bank = level <= 1 ? WORD_BANK[1] : level === 2 ? WORD_BANK[2] : WORD_BANK[3];
  return bank.map((w) => w.word);
}

export class FirstWordsScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: WordRound;
  private layer?: Phaser.GameObjects.Container;
  private buddy?: SceneBuddy;
  private optionObjs: Array<{
    value: string;
    tile: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Image;
    btn: Phaser.GameObjects.Rectangle;
  }> = [];

  constructor(host: GameHost, level: number) {
    super({ key: 'first-words' });
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

  /** Re-read the prompt then the English target word in its native voice. */
  private sayTarget(): void {
    void this.host
      .speak('firstwords.prompt')
      .then(() => this.host.speakText(this.current.target.word, 'en-US'));
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    const seed = this.host.pickItem?.(SKILL, wordPoolForLevel(this.level));
    this.current = generateRound(this.level, Math.random, seed);
    this.optionObjs = [];
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
    this.sayTarget();

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 160) / 2;
    const y = height / 2 + 40;
    const entrance: MotionObject[] = [prompt];
    opts.forEach((item, i) => {
      const x = optStartX + i * 160;
      const tile = addOptionTile(this, x, y, 142);
      this.layer!.add(tile);
      const btn = this.add
        .rectangle(x, y, 130, 130, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      const id = emojiToCreatureId(item.emoji);
      const label = addArt(
        this as unknown as ArtScene,
        `creature-${id}`,
        creature(id),
        x,
        y,
        108,
      ) as unknown as Phaser.GameObjects.Image;
      btn.on('pointerdown', () => this.choose(item.word, btn, tile, label));
      this.layer!.add(btn);
      this.layer!.add(label);
      this.optionObjs.push({ value: item.word, tile, label, btn });
      entrance.push(tile, label);
    });
    // Visual-only entrance; hit areas are already live so taps work immediately.
    animateIn(this, entrance);
  }

  private choose(
    word: string,
    btn: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Image,
  ): void {
    if (this.roundResolved) return;
    if (word === this.current.target.word) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
      popCorrect(this, label);
      this.buddy?.cheer();
      if (!this.answeredThisRound) {
        this.correctCount++;
        this.host.recordItemResult?.(SKILL, this.current.target.word, true);
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
    const itemKey = this.current.target.word;
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
    this.host.complete({
      gameId: 'first-words',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
