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
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
import { distractorsToDim } from '../scaffold';
import { hintKeyForSkill, HINT_FEWER_KEY } from '../masteryMap';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  WORD_BANK,
  type FirstLetterRound,
} from './firstLetterLogic';

const SKILL = 'letter-vi';
// SR pool = the first letters that words in the bank actually start with.
const FIRST_LETTER_POOL = [...new Set(WORD_BANK.map((e) => e.letter))];

export class FirstLetterScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: FirstLetterRound;
  private layer?: Phaser.GameObjects.Container;
  private buddy?: SceneBuddy;
  private optionObjs: Array<{
    value: string;
    tile: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
    btn: Phaser.GameObjects.Rectangle;
  }> = [];

  constructor(host: GameHost, level: number) {
    super({ key: 'first-letter' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'letters');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('firstletter.prompt'),
    });
    // GĐ6.3 — Cáo đồng hành (visual-only): hiện diện khi chơi, phản ứng đúng/sai.
    this.buddy = addBuddy(this);
    this.nextRound();
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    const seed = this.host.pickItem?.(SKILL, FIRST_LETTER_POOL);
    this.current = generateRound(this.level, Math.random, seed);
    this.optionObjs = [];
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;
    const prompt = this.add
      .text(width / 2, 80, 'Chữ cái đầu tiên là chữ gì?', {
        fontSize: '34px',
        color: '#1b4f8a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('firstletter.prompt');

    const pictureId = emojiToCreatureId(this.current.entry.emoji);
    this.layer.add(
      addArt(
        this as unknown as ArtScene,
        `creature-${pictureId}`,
        creature(pictureId),
        width / 2,
        height / 2 - 60,
        160,
      ) as unknown as Phaser.GameObjects.Image,
    );
    this.layer.add(
      this.add
        .text(width / 2, height / 2 + 30, this.current.entry.word, {
          fontSize: '48px',
          color: '#333',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 140) / 2;
    const y = height - 120;
    const entrance: MotionObject[] = [prompt];
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
    if (letter === this.current.entry.letter) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      // Cheer, then reinforce by reading the first letter aloud (Vietnamese).
      const target = this.current.entry.letter;
      void this.host.speak('feedback.correct').then(() => this.host.speakText(target, 'vi-VN'));
      btn.setFillStyle(0x9be08a);
      popCorrect(this, label);
      // GĐ6.4 — juice đúng (visual-only, calm-safe, không đổi flow).
      squashStretchPop(this, label);
      sparkleBurst(this, label.x, label.y);
      this.buddy?.cheer();
      if (!this.answeredThisRound) {
        this.correctCount++;
        this.host.recordItemResult?.(SKILL, target, true);
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
    const itemKey = this.current.entry.letter;
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
    this.host.complete({ gameId: 'first-letter', level: this.level, score: this.correctCount, stars });
  }
}
