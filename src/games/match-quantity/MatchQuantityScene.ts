import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { addSceneBackground, addChrome, addOptionTile, celebrate, addBuddy, type SceneBuddy } from '../../art/sceneArt';
import {
  animateIn,
  popCorrect,
  flyStars,
  squashStretchPop,
  sparkleBurst,
  type MotionObject,
} from '../../art/sceneMotion';
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
import { generateRound, starsFor, type MatchQuantityRound } from './matchQuantityLogic';

interface SlotInfo {
  pairIndex: number; // which pair this group represents
  x: number;
  y: number;
  filled: boolean;
}

export class MatchQuantityScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private round!: MatchQuantityRound;
  private slots: SlotInfo[] = [];
  private placedFirstTry = 0;
  private placed = 0;
  private finished = false;
  private buddy?: SceneBuddy;

  constructor(host: GameHost, level: number) {
    super({ key: 'match-quantity' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    addSceneBackground(this, 'numbers');
    addChrome(this, {
      onHome: () => this.host.goHome(),
      onReplay: () => void this.host.speak('matchquantity.prompt'),
    });
    // GĐ6.3 — Cáo đồng hành (visual-only): hiện diện khi chơi, phản ứng đúng/sai.
    this.buddy = addBuddy(this);
    const { width } = this.scale;
    const prompt = this.add
      .text(width / 2, 80, 'Kéo số vào nhóm đúng', { fontSize: '34px', color: '#a01a3a', fontStyle: 'bold' })
      .setOrigin(0.5);
    void this.host.speak('matchquantity.prompt');

    this.round = generateRound(this.level, Math.random);
    this.buildGroupsAndTiles(prompt);
  }

  /**
   * @param prompt the page title, animated in alongside the static furniture.
   *   Only STATIC furniture (prompt, emoji groups, slot backings/outlines) is
   *   passed to `animateIn` — the draggable number tiles are NEVER animated, so
   *   the entrance can't fight the drag handlers.
   */
  private buildGroupsAndTiles(prompt: Phaser.GameObjects.Text): void {
    const { width, height } = this.scale;
    const rowGapY = 150;
    const topY = 170;
    const furniture: MotionObject[] = [prompt];

    // Each pair = a row: emoji group on the left, an empty drop slot on the right.
    this.round.pairs.forEach((pair, i) => {
      const y = topY + i * rowGapY;
      // Emoji group.
      const groupX = width * 0.32;
      const startX = groupX - ((Math.min(5, pair.value) - 1) * 46) / 2;
      const id = emojiToCreatureId(pair.emoji);
      const svg = creature(id);
      for (let k = 0; k < pair.value; k++) {
        const col = k % 5;
        const row = Math.floor(k / 5);
        furniture.push(
          addArt(
            this as unknown as ArtScene,
            `creature-${id}`,
            svg,
            startX + col * 46,
            y - 20 + row * 40,
            44,
          ) as unknown as Phaser.GameObjects.Image,
        );
      }
      // Drop slot (target): a soft tile backing + the dashed-looking outline.
      const slotX = width * 0.7;
      furniture.push(addOptionTile(this, slotX, y, 122));
      furniture.push(
        this.add
          .rectangle(slotX, y, 110, 110, 0xffffff, 0.001)
          .setStrokeStyle(5, 0xff8fab),
      );
      this.slots.push({ pairIndex: i, x: slotX, y, filled: false });
    });
    // Entrance for static furniture only; draggable tiles below are untouched.
    animateIn(this, furniture);

    // Number tiles along the bottom, in shuffled tileOrder.
    const trayY = height - 90;
    const n2 = this.round.tileOrder.length;
    this.round.tileOrder.forEach((pairIndex, k) => {
      const value = this.round.pairs[pairIndex].value;
      const trayX = width / 2 - ((n2 - 1) * 130) / 2 + k * 130;
      const tile = this.add
        .rectangle(trayX, trayY, 100, 100, 0xffd166)
        .setStrokeStyle(5, 0xe0a800)
        .setInteractive({ useHandCursor: true, draggable: true });
      const label = this.add
        .text(trayX, trayY, String(value), { fontSize: '52px', color: '#5a3d00', fontStyle: 'bold' })
        .setOrigin(0.5);
      tile.setData('value', value);
      tile.setData('label', label);
      tile.setData('homeX', trayX);
      tile.setData('homeY', trayY);
      this.input.setDraggable(tile);
    });

    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Rectangle, dx: number, dy: number) => {
      obj.x = dx;
      obj.y = dy;
      (obj.getData('label') as Phaser.GameObjects.Text).setPosition(dx, dy);
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Rectangle) => this.onDrop(obj));
  }

  private onDrop(tile: Phaser.GameObjects.Rectangle): void {
    if (this.finished) return;
    const value = tile.getData('value') as number;
    const label = tile.getData('label') as Phaser.GameObjects.Text;

    // Find the nearest unfilled slot within snapping distance.
    let best: SlotInfo | undefined;
    let bestDist = Infinity;
    for (const s of this.slots) {
      if (s.filled) continue;
      const d = Phaser.Math.Distance.Between(tile.x, tile.y, s.x, s.y);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }

    const SNAP = 80;
    if (best && bestDist <= SNAP && this.round.pairs[best.pairIndex].value === value) {
      // Correct placement: snap + lock.
      tile.x = best.x;
      tile.y = best.y;
      label.setPosition(best.x, best.y);
      best.filled = true;
      this.input.setDraggable(tile, false);
      tile.disableInteractive();
      this.host.playSfx('correct');
      // The tile is now locked (no longer draggable), so a pop on its label can't
      // fight a drag; this is the correct-placement reward, not an entrance tween.
      popCorrect(this, label);
      // GĐ6.4 — juice ở khoảnh khắc SNAP/khoá đúng (toạ độ đã snap → interruption-safe).
      squashStretchPop(this, label as unknown as MotionObject);
      sparkleBurst(this, label.x, label.y);
      this.buddy?.cheer();
      this.placed++;
      if (!tile.getData('missed')) this.placedFirstTry++; // counts only if this tile had no prior wrong drop
      if (this.placed === this.round.pairs.length) this.finish();
    } else {
      // Wrong drop: bounce home; this tile no longer earns a first-try point.
      this.host.playSfx('wrong');
      this.buddy?.encourage();
      tile.setData('missed', true);
      const homeX = tile.getData('homeX') as number;
      const homeY = tile.getData('homeY') as number;
      tile.x = homeX;
      tile.y = homeY;
      label.setPosition(homeX, homeY);
      this.tweens.add({ targets: [tile, label], x: homeX + 8, duration: 60, yoyo: true, repeat: 2 });
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const total = this.round.pairs.length;
    // First-try correct = tiles placed without a prior wrong drop. We approximate
    // by counting placements where the tile was never marked 'missed'.
    const stars = starsFor(this.placedFirstTry, total);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    celebrate(this);
    flyStars(this, this.scale.width / 2, this.scale.height / 2);
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'match-quantity', level: this.level, score: total, stars });
  }
}
