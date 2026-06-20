import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  addSceneBackground,
  addChrome,
  addOptionTile,
  celebrate,
  shakeOption,
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
  private buddy?: SceneBuddy;

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
      const cx = startX + i * 84;
      const cy = height / 2 - 40;
      if (tok === '?') {
        this.layer!.add(
          this.add
            .text(cx, cy, '?', { fontSize: '56px', color: '#5b4636', fontStyle: 'bold' })
            .setOrigin(0.5),
        );
      } else {
        const id = emojiToCreatureId(tok);
        this.layer!.add(
          addArt(this as unknown as ArtScene, `creature-${id}`, creature(id), cx, cy, 66) as unknown as Phaser.GameObjects.Image,
        );
      }
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
      const id = emojiToCreatureId(tok);
      const label = addArt(
        this as unknown as ArtScene,
        `creature-${id}`,
        creature(id),
        x,
        y,
        72,
      ) as unknown as Phaser.GameObjects.Image;
      btn.on('pointerdown', () => {
        // GĐ6.4 — phản hồi bấm xúc giác (visual-only); KHÔNG đổi luồng choose.
        tilePress(this, tile as unknown as MotionObject);
        this.choose(tok, btn, tile, label);
      });
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
    label: Phaser.GameObjects.Image,
  ): void {
    if (this.roundResolved) return;
    if (tok === this.current.answer) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
      popCorrect(this, label);
      // GĐ6.4 — juice đúng (visual-only, calm-safe, không đổi flow).
      squashStretchPop(this, label as unknown as MotionObject);
      sparkleBurst(this, label.x, label.y);
      this.buddy?.cheer();
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
      this.buddy?.encourage();
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
