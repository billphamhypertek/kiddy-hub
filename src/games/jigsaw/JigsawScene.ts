import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, celebrate, addBuddy, type SceneBuddy } from '../../art/sceneArt';
import {
  animateIn,
  popCorrect,
  flyStars,
  squashStretchPop,
  sparkleBurst,
  type MotionObject,
} from '../../art/sceneMotion';
import { loadSvgTexture, type ArtScene } from '../../art/svg';
import {
  gridForLevel,
  isCorrectDrop,
  sliceGrid,
  starsForMisplacements,
  type Piece,
} from './jigsawLogic';
import { jigsawPicture, JIGSAW_PICTURE_COUNT } from './jigsawArt';

const PIC = 480; // native picture size (square) — MUST match jigsawArt's PIC_SIZE
const TEX_KEY = 'jigsaw-pic';

export class JigsawScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private misses = 0;
  private placed = 0;
  private finished = false;
  private rows = 2;
  private cols = 2;
  private slotW = 0;
  private slotH = 0;
  private boardX = 0;
  private boardY = 0;
  private buddy?: SceneBuddy;

  constructor(host: GameHost, level: number) {
    super({ key: 'jigsaw' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'shapes');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('jigsaw.prompt'),
    });
    // GĐ6.3 — Cáo đồng hành (visual-only). The bottom is a wide drag tray, so the
    // buddy sits mid-left (between the home button and the board), clear of every
    // tray piece and the picture board.
    this.buddy = addBuddy(this, { x: 70, y: this.scale.height * 0.46, size: 96 });
    void this.host.speak('jigsaw.prompt');

    this.preparePicture();
  }

  /**
   * Register a cute storybook scene (drawn 100% locally in `jigsawArt.ts`) as the
   * jigsaw picture under TEX_KEY, then build the board/pieces from it.
   *
   * A different scene is picked per play (like other games' `Math.random`), so we
   * drop any texture left under TEX_KEY from a previous play first, then register
   * the freshly chosen SVG. `loadSvgTexture` uses `textures.addBase64`, which is
   * ASYNCHRONOUS — the texture is NOT ready on this tick — so we build the
   * board/pieces only once the texture is available: immediately if it already
   * exists (idempotent), otherwise on the texture's add event. Building from a
   * fully-loaded texture keeps the `setCrop` slot math (PIC/cols × PIC/rows) exact.
   */
  private preparePicture(): void {
    const pick = Math.floor(Math.random() * JIGSAW_PICTURE_COUNT);
    if (this.textures.exists(TEX_KEY)) this.textures.remove(TEX_KEY);
    loadSvgTexture(this as unknown as ArtScene, TEX_KEY, jigsawPicture(pick));

    if (this.textures.exists(TEX_KEY)) {
      this.buildBoardAndPieces();
    } else {
      this.textures.once(`addtexture-${TEX_KEY}`, () => this.buildBoardAndPieces());
    }
  }

  private buildBoardAndPieces(): void {
    const grid = gridForLevel(this.level);
    this.rows = grid.rows;
    this.cols = grid.cols;
    this.slotW = PIC / this.cols;
    this.slotH = PIC / this.rows;

    const { width } = this.scale;
    this.boardX = width / 2 - PIC / 2;
    this.boardY = 110;

    // Target board: faint outlined slots. These are STATIC furniture — collected
    // for the entrance. The draggable tray pieces below are NEVER animated, so
    // the entrance can't fight the drag handlers.
    const furniture: MotionObject[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        furniture.push(
          this.add
            .rectangle(
              this.boardX + c * this.slotW + this.slotW / 2,
              this.boardY + r * this.slotH + this.slotH / 2,
              this.slotW - 4,
              this.slotH - 4,
              0xffffff,
              0.25,
            )
            .setStrokeStyle(3, 0x06a37a),
        );
      }
    }
    animateIn(this, furniture);

    // Tray pieces (shuffled). Each piece crops its own region from the baked texture.
    const pieces = sliceGrid(this.level, Math.random);
    const trayY = this.boardY + PIC + 90;
    pieces.forEach((piece, i) => {
      const img = this.add
        .image(0, 0, TEX_KEY)
        .setCrop(piece.col * this.slotW, piece.row * this.slotH, this.slotW, this.slotH)
        .setDisplaySize(this.slotW, this.slotH);
      // Position so the cropped region sits at the tray slot.
      const trayX = width / 2 - (pieces.length * (this.slotW + 8)) / 2 + i * (this.slotW + 8);
      img.setPosition(
        trayX - piece.col * this.slotW + this.slotW / 2,
        trayY - piece.row * this.slotH + this.slotH / 2,
      );
      img.setInteractive({ useHandCursor: true, draggable: true });
      img.setData('piece', piece);
      this.input.setDraggable(img);
    });

    this.input.on(
      'drag',
      (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, dx: number, dy: number) => {
        obj.x = dx;
        obj.y = dy;
      },
    );
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) =>
      this.onDrop(obj),
    );
  }

  private onDrop(obj: Phaser.GameObjects.Image): void {
    if (this.finished) return;
    const piece = obj.getData('piece') as Piece;
    // The image is anchored so its cropped region is offset; compute the region centre.
    const regionCx = obj.x + (piece.col + 0.5) * this.slotW - this.slotW / 2;
    const regionCy = obj.y + (piece.row + 0.5) * this.slotH - this.slotH / 2;
    const col = Math.floor((regionCx - this.boardX) / this.slotW);
    const row = Math.floor((regionCy - this.boardY) / this.slotH);

    if (
      row >= 0 &&
      row < this.rows &&
      col >= 0 &&
      col < this.cols &&
      isCorrectDrop(piece, row, col)
    ) {
      // Snap the cropped region into its slot and lock the piece.
      obj.x =
        this.boardX +
        piece.col * this.slotW +
        this.slotW / 2 -
        (piece.col + 0.5) * this.slotW +
        this.slotW / 2;
      obj.y =
        this.boardY +
        piece.row * this.slotH +
        this.slotH / 2 -
        (piece.row + 0.5) * this.slotH +
        this.slotH / 2;
      this.input.setDraggable(obj, false);
      obj.disableInteractive();
      this.host.playSfx('correct');
      // Piece locked into its slot (no longer draggable) → a reward pop.
      popCorrect(this, obj);
      // GĐ6.4 — juice ở khoảnh khắc SNAP/khoá đúng (toạ độ đã snap → interruption-safe).
      squashStretchPop(this, obj as unknown as MotionObject);
      sparkleBurst(this, obj.x, obj.y);
      this.buddy?.cheer();
      this.placed++;
      if (this.placed === this.rows * this.cols) this.finish();
    } else {
      this.misses++;
      this.host.playSfx('wrong');
      this.buddy?.encourage();
      this.tweens.add({ targets: obj, x: obj.x + 8, duration: 60, yoyo: true, repeat: 2 });
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const stars = starsForMisplacements(this.misses);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    celebrate(this);
    flyStars(this, this.scale.width / 2, this.scale.height / 2);
    this.host.awardStars(stars);
    this.host.complete({
      gameId: 'jigsaw',
      level: this.level,
      score: this.rows * this.cols,
      stars,
    });
  }
}
