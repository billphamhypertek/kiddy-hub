import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  gridForLevel,
  isCorrectDrop,
  sliceGrid,
  starsForMisplacements,
  type Piece,
} from './jigsawLogic';

const PIC = 480; // placeholder picture size (square)
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

  constructor(host: GameHost, level: number) {
    super({ key: 'jigsaw' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#e2fff2');
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('jigsaw.prompt'));
    void this.host.speak('jigsaw.prompt');

    this.buildPicture();
    this.buildBoardAndPieces();
  }

  /** Placeholder picture: a coloured panel + big emoji, baked to a texture, then sliced.
   *  Phase 4 only swaps this drawing for a real AI image. */
  private buildPicture(): void {
    const rt = this.add.renderTexture(0, 0, PIC, PIC).setVisible(false);
    const g = this.add.graphics();
    g.fillStyle(0xffd166, 1).fillRect(0, 0, PIC, PIC);
    g.fillStyle(0x06d6a0, 1).fillRect(0, PIC * 0.6, PIC, PIC * 0.4); // ground
    rt.draw(g, 0, 0);
    const emoji = this.add.text(PIC / 2, PIC / 2, '🦊', { fontSize: '300px' }).setOrigin(0.5);
    rt.draw(emoji, PIC / 2, PIC / 2);
    g.destroy();
    emoji.destroy();
    rt.saveTexture(TEX_KEY);
    rt.destroy();
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

    // Target board: faint outlined slots.
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.add
          .rectangle(
            this.boardX + c * this.slotW + this.slotW / 2,
            this.boardY + r * this.slotH + this.slotH / 2,
            this.slotW - 4,
            this.slotH - 4,
            0xffffff,
            0.25,
          )
          .setStrokeStyle(3, 0x06a37a);
      }
    }

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
      this.placed++;
      if (this.placed === this.rows * this.cols) this.finish();
    } else {
      this.misses++;
      this.host.playSfx('wrong');
      this.tweens.add({ targets: obj, x: obj.x + 8, duration: 60, yoyo: true, repeat: 2 });
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const stars = starsForMisplacements(this.misses);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({
      gameId: 'jigsaw',
      level: this.level,
      score: this.rows * this.cols,
      stars,
    });
  }
}
