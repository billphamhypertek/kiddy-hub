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
import { drawSwatchPattern } from '../../art/swatchPattern';
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
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  SHAPES,
  COLORS,
  type ShapeColorRound,
  type ShapeOption,
  type ShapeName,
} from './shapeColorLogic';

const SHAPE_SKILL = 'shape';
const COLOR_SKILL = 'color-vi';

export class ShapesColorsScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: ShapeColorRound;
  private layer?: Phaser.GameObjects.Container;
  private buddy?: SceneBuddy;
  // Per-round option objects (indexed like current.options) for scaffolding.
  private optionObjs: Array<{
    tile: Phaser.GameObjects.Image;
    shape: Phaser.GameObjects.Graphics;
    hit: Phaser.GameObjects.Rectangle;
    // GĐ5E2 — colourblind second-signal layers (decorative, non-interactive).
    // `label` only exists on color/both rounds (shape rounds already disambiguate).
    pattern: Phaser.GameObjects.Graphics;
    label?: Phaser.GameObjects.Text;
  }> = [];

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
    // GĐ6.3 — Cáo đồng hành (visual-only): hiện diện khi chơi, phản ứng đúng/sai.
    this.buddy = addBuddy(this);
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
    // SR seeds BOTH axes; the logic applies whichever the chosen mode needs and
    // leaves the other random. No session ⇒ seeds undefined ⇒ legacy round.
    const shapeSeed = this.host.pickItem?.(SHAPE_SKILL, [...SHAPES]) as ShapeName | undefined;
    const colorSeed = this.host.pickItem?.(
      COLOR_SKILL,
      COLORS.map((c) => c.name),
    );
    this.current = generateRound(this.level, Math.random, { shape: shapeSeed, color: colorSeed });
    this.optionObjs = [];
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
      hit.on('pointerdown', () => {
        // GĐ6.4 — tile lún khi bấm (visual-only; hit-area vẫn là hit 130×130;
        // KHÔNG đụng pattern/label tín hiệu mù màu GĐ5E).
        tilePress(this, tile as unknown as MotionObject);
        this.choose(i, hit, tile, shape);
      });
      this.layer!.add(hit);
      // GĐ5E2 — colourblind safety on the COLOUR axis. Shape rounds already
      // disambiguate by silhouette; only color/both rounds depend on hue, so we
      // add the second signal there: a DISTINCT monochrome glyph over the shape
      // + a VN colour name under the option. Both are decorative, NON-interactive
      // children (no hit area, no handler) so they never intercept `hit`'s tap —
      // the 130×130 hit rect is unchanged.
      const pattern = drawSwatchPattern(this, x, y, 64, opt.color.name);
      this.layer!.add(pattern);
      let label: Phaser.GameObjects.Text | undefined;
      if (this.current.mode !== 'shape') {
        label = this.add
          .text(x, y + 80, opt.color.name, { fontSize: '22px', color: '#5b4636', fontStyle: 'bold' })
          .setOrigin(0.5)
          .setStroke('#ffffff', 4);
        this.layer!.add(label);
      }
      this.optionObjs.push({ tile, shape, hit, pattern, label });
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
      // GĐ6.4 — juice đúng trên shape (Graphics tâm tại x/y; KHÔNG đụng pattern/label).
      squashStretchPop(this, shape);
      sparkleBurst(this, shape.x, shape.y);
      this.buddy?.cheer();
      if (!this.answeredThisRound) {
        this.correctCount++;
        this.recordRound(true);
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
      shakeOption(this, tile, shape, hit);
      this.buddy?.encourage();
    }
  }

  /**
   * Record the round's first-try outcome into the skill(s) the mode exercises:
   * 'shape' → shape only, 'color' → color-vi only, 'both' → both (§4.2/§8.4).
   */
  private recordRound(correct: boolean): void {
    const r = this.current;
    if (r.mode === 'shape' || r.mode === 'both') {
      this.host.recordItemResult?.(SHAPE_SKILL, r.targetShape!, correct);
    }
    if (r.mode === 'color' || r.mode === 'both') {
      this.host.recordItemResult?.(COLOR_SKILL, r.targetColor!.name, correct);
    }
  }

  /**
   * Wrong FIRST try: record the miss for the active skill(s), dim distractors
   * down to the weakest axis's keep-count, then speak a teaching hint. The
   * scaffold reduction uses the SHAPE axis when shape is exercised, else colour.
   */
  private scaffold(): void {
    this.recordRound(false);
    const r = this.current;
    // Choose how many options to keep from the axis being tested (use the more
    // aggressive reduction if both axes ask to reduce).
    const keeps: number[] = [];
    if (r.mode === 'shape' || r.mode === 'both') {
      keeps.push(this.host.hint?.(SHAPE_SKILL, r.targetShape!) ?? Infinity);
    }
    if (r.mode === 'color' || r.mode === 'both') {
      keeps.push(this.host.hint?.(COLOR_SKILL, r.targetColor!.name) ?? Infinity);
    }
    const keepN = keeps.length > 0 ? Math.min(...keeps) : Infinity;
    const dim = distractorsToDim(this.optionObjs.length, r.correctIndex, keepN);
    for (const i of dim) {
      const o = this.optionObjs[i];
      // Fade the second-signal layers too (label only exists on color/both rounds).
      const extra = o.label ? [o.pattern, o.label] : [o.pattern];
      dimDistractor(this, o.tile, o.shape, o.hit, ...extra);
    }
    if (dim.length > 0) {
      void this.host.speak(HINT_FEWER_KEY).then(() => this.host.speak(hintKeyForSkill(SHAPE_SKILL)));
    } else {
      void this.host.speak(hintKeyForSkill(SHAPE_SKILL));
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
