import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, addOptionTile, celebrate, shakeOption } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  type ShapeColorRound,
  type ShapeOption,
  type ShapeName,
} from './shapeColorLogic';

export class ShapesColorsScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: ShapeColorRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'shapes-colors' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'shapes');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('shapecolor.prompt'),
    });
    this.nextRound();
  }

  private shapeLabel(shape: ShapeName): string {
    return { circle: 'hình tròn', square: 'hình vuông', triangle: 'hình tam giác', star: 'hình ngôi sao' }[shape];
  }

  private promptText(): string {
    const r = this.current;
    if (r.mode === 'shape') return `Chạm ${this.shapeLabel(r.targetShape!)}`;
    if (r.mode === 'color') return `Chạm màu ${r.targetColor!.name}`;
    return `Chạm ${this.shapeLabel(r.targetShape!)} màu ${r.targetColor!.name}`;
  }

  /**
   * Draws a filled shape of `opt` with half-size `s`, positioned at (x, y) via the
   * object's own transform and drawn around its LOCAL origin (0,0). Returns the
   * `Graphics` handle. Because the primitives are local-origin, tweening `g.x`
   * (shake) and `g.scale` (entrance/pop) animate around the shape's CENTRE, not
   * the world origin.
   */
  private drawShape(opt: ShapeOption, x: number, y: number, s: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.setPosition(x, y);
    g.fillStyle(opt.color.hex, 1);
    switch (opt.shape) {
      case 'circle':
        g.fillCircle(0, 0, s);
        break;
      case 'square':
        g.fillRect(-s, -s, s * 2, s * 2);
        break;
      case 'triangle':
        g.fillTriangle(0, -s, -s, s, s, s);
        break;
      case 'star':
        this.fillStar(g, 0, 0, s);
        break;
    }
    this.layer!.add(g);
    return g;
  }

  private fillStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s : s * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    g.fillPoints(
      pts.reduce<Phaser.Geom.Point[]>((acc, _v, i) => {
        if (i % 2 === 0) acc.push(new Phaser.Geom.Point(pts[i], pts[i + 1]));
        return acc;
      }, []),
      true,
    );
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
      .text(width / 2, 100, this.promptText(), {
        fontSize: '36px',
        color: '#0b6b4f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('shapecolor.prompt');

    const opts = this.current.options;
    const startX = width / 2 - ((opts.length - 1) * 150) / 2;
    const y = height / 2 + 30;
    const entrance: MotionObject[] = [prompt];
    opts.forEach((opt, i) => {
      const x = startX + i * 150;
      const tile = addOptionTile(this, x, y, 140);
      this.layer!.add(tile);
      const hit = this.add
        .rectangle(x, y, 130, 130, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      const shape = this.drawShape(opt, x, y, 50);
      hit.on('pointerdown', () => this.choose(i, hit, tile, shape));
      this.layer!.add(hit);
      entrance.push(tile, shape);
    });
    // Visual-only entrance; hit areas are already live so taps work immediately.
    animateIn(this, entrance);
  }

  private choose(
    index: number,
    hit: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    shape: Phaser.GameObjects.Graphics,
  ): void {
    if (this.roundResolved) return;
    if (index === this.current.correctIndex) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      hit.setStrokeStyle(8, 0x2ecc71).setFillStyle(0x9be08a, 0.3);
      popCorrect(this, shape);
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
      shakeOption(this, tile, shape, hit);
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    celebrate(this);
    flyStars(this, this.scale.width / 2, this.scale.height / 2);
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'shapes-colors', level: this.level, score: this.correctCount, stars });
  }
}
