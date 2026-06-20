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
import { animateIn, popCorrect, flyStars } from '../../art/sceneMotion';
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type MoreLessRound } from './moreLessLogic';

export class MoreLessScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: MoreLessRound;
  private layer?: Phaser.GameObjects.Container;
  private buddy?: SceneBuddy;

  constructor(host: GameHost, level: number) {
    super({ key: 'more-less' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'numbers');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('moreless.prompt'),
    });
    // GĐ6.3 — Cáo đồng hành (visual-only): hiện diện khi chơi, phản ứng đúng/sai.
    this.buddy = addBuddy(this);
    this.nextRound();
  }

  /** Draws one group of `count` emoji as a small grid centred at (cx, cy). */
  private drawGroup(cx: number, count: number, emoji: string): void {
    const cols = Math.min(3, count);
    const cellW = 56;
    const cellH = 56;
    const startX = cx - ((cols - 1) * cellW) / 2;
    const topY = 210;
    const id = emojiToCreatureId(emoji);
    const svg = creature(id);
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const t = addArt(
        this as unknown as ArtScene,
        `creature-${id}`,
        svg,
        startX + col * cellW,
        topY + row * cellH,
        50,
      ) as unknown as Phaser.GameObjects.Image;
      this.layer!.add(t);
    }
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
    const label = this.current.want === 'more' ? 'NHIỀU hơn' : 'ÍT hơn';
    const prompt = this.add
      .text(width / 2, 110, `Chạm nhóm có ${label}`, {
        fontSize: '38px',
        color: '#a01a3a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('moreless.prompt');

    const leftX = width * 0.3;
    const rightX = width * 0.7;
    const frameY = height / 2 + 30;
    const frameW = width * 0.34;
    const frameH = 320;
    // Soft rounded tile behind each tap group (decorative backing only).
    const leftTile = addOptionTile(this, leftX, frameY, Math.max(frameW, frameH)).setDisplaySize(frameW, frameH);
    const rightTile = addOptionTile(this, rightX, frameY, Math.max(frameW, frameH)).setDisplaySize(frameW, frameH);
    this.layer.add(leftTile);
    this.layer.add(rightTile);
    // Tap frames (transparent hit areas; the tile shows through). The pink stroke
    // outlines the group and flashes green on a correct pick.
    const leftFrame = this.add
      .rectangle(leftX, frameY, frameW, frameH, 0xffffff, 0.001)
      .setStrokeStyle(6, 0xff8fab)
      .setInteractive({ useHandCursor: true });
    const rightFrame = this.add
      .rectangle(rightX, frameY, frameW, frameH, 0xffffff, 0.001)
      .setStrokeStyle(6, 0xff8fab)
      .setInteractive({ useHandCursor: true });
    this.layer.add(leftFrame);
    this.layer.add(rightFrame);
    // Visual-only entrance; tap frames are already interactive so taps work immediately.
    animateIn(this, [prompt, leftTile, rightTile, leftFrame, rightFrame]);
    this.drawGroup(leftX, this.current.leftCount, this.current.emoji);
    this.drawGroup(rightX, this.current.rightCount, this.current.emoji);

    leftFrame.on('pointerdown', () => this.choose('left', leftFrame, leftTile));
    rightFrame.on('pointerdown', () => this.choose('right', rightFrame, rightTile));
  }

  private isCorrect(side: 'left' | 'right'): boolean {
    const { leftCount, rightCount, want } = this.current;
    const leftWins = want === 'more' ? leftCount > rightCount : leftCount < rightCount;
    return side === (leftWins ? 'left' : 'right');
  }

  private choose(
    side: 'left' | 'right',
    frame: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
  ): void {
    if (this.roundResolved) return;
    if (this.isCorrect(side)) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      frame.setFillStyle(0x9be08a);
      popCorrect(this, frame);
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
      // Shake the VISIBLE tile + frame together (the frame itself is a transparent
      // hit rect, so shaking it alone would be invisible).
      shakeOption(this, tile, frame);
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
    this.host.complete({ gameId: 'more-less', level: this.level, score: this.correctCount, stars });
  }
}
