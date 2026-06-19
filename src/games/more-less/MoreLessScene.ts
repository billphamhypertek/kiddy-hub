import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
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

  constructor(host: GameHost, level: number) {
    super({ key: 'more-less' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff0f3');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('moreless.prompt'));
  }

  /** Draws one group of `count` emoji as a small grid centred at (cx, cy). */
  private drawGroup(cx: number, count: number, emoji: string): void {
    const cols = Math.min(3, count);
    const cellW = 56;
    const cellH = 56;
    const startX = cx - ((cols - 1) * cellW) / 2;
    const topY = 210;
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const t = this.add
        .text(startX + col * cellW, topY + row * cellH, emoji, { fontSize: '44px' })
        .setOrigin(0.5);
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
    // Tap frames behind each group.
    const leftFrame = this.add
      .rectangle(leftX, height / 2 + 30, width * 0.34, 320, 0xffffff)
      .setStrokeStyle(6, 0xff8fab)
      .setInteractive({ useHandCursor: true });
    const rightFrame = this.add
      .rectangle(rightX, height / 2 + 30, width * 0.34, 320, 0xffffff)
      .setStrokeStyle(6, 0xff8fab)
      .setInteractive({ useHandCursor: true });
    this.layer.add(leftFrame);
    this.layer.add(rightFrame);
    this.drawGroup(leftX, this.current.leftCount, this.current.emoji);
    this.drawGroup(rightX, this.current.rightCount, this.current.emoji);

    leftFrame.on('pointerdown', () => this.choose('left', leftFrame));
    rightFrame.on('pointerdown', () => this.choose('right', rightFrame));
  }

  private isCorrect(side: 'left' | 'right'): boolean {
    const { leftCount, rightCount, want } = this.current;
    const leftWins = want === 'more' ? leftCount > rightCount : leftCount < rightCount;
    return side === (leftWins ? 'left' : 'right');
  }

  private choose(side: 'left' | 'right', frame: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (this.isCorrect(side)) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      frame.setFillStyle(0x9be08a);
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
      this.tweens.add({ targets: frame, x: frame.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'more-less', level: this.level, score: this.correctCount, stars });
  }
}
