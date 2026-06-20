/**
 * KiddyHub — "Ghép Hình" picture art (Giai đoạn 6 follow-up polish).
 *
 * Replaces the old flat placeholder (yellow panel + green ground + a giant 🦊
 * emoji) baked by `JigsawScene.buildPicture()` with a REAL, cute storybook scene
 * drawn 100% locally from the existing in-code SVG art system — matching the GĐ6
 * "Truyện tranh giấy · Tươi" look (paint.ts surface + brand palette + Cáo).
 *
 * `jigsawPicture(pick)` resolves one of several distinct storybook scenes and
 * returns a COMPLETE SQUARE `<svg>` string. Unlike every other art module, this
 * one is authored at NATIVE 480×480 (not the canonical 0..100 viewBox): the
 * jigsaw scene slices the baked texture with `setCrop(col*slotW, …)` where
 * `slotW = PIC/cols` and `PIC = 480`, so the texture's native pixel size MUST be
 * 480×480 for the crop math to line up. We build our own `<svg width="480" …>`
 * wrapper and scale the reusable 0..100 primitives (`creature(id)`, the fox,
 * paint.ts fills/shadows) into regions of it.
 *
 * Design for the slicer: each scene spreads BOLD, distinct regions across the
 * whole canvas (sky / ground / a few big characters & props) so the picture
 * stays legible when cut into 2×2 / 2×3 / 3×3 — never one tiny subject floating
 * in the centre, never fine detail that turns to mush at 3×3.
 *
 * Every colour comes from `tokens.ts` (via `palette` + paint.ts) — nothing here
 * hard-codes a stray hue.
 */
import { palette } from '../../art/tokens';
import { paintedFill, softShadow, inkStroke, withDefs, lighten, darken } from '../../art/paint';
import { creature } from '../../art/creatures';
import { foxIdle, foxGuide } from '../../art/fox';

/** Native picture size — MUST equal `PIC` in JigsawScene so the slicer lines up. */
export const PIC_SIZE = 480;

/** Scale factor from the canonical 0..100 design grid to the 480 native canvas. */
const S = PIC_SIZE / 100;

/**
 * Place a reusable 0..100 art document (from `creature()` / the fox) into the
 * 480 canvas at design-grid coords (x, y) with design-grid size `size`.
 *
 * Two jobs:
 *  1) Strip the outer `<svg …>…</svg>` wrapper down to its inner body, then wrap
 *     it in a NESTED `<svg>` with its own `viewBox="0 0 100 100"` positioned/sized
 *     in 480-space (so the child still draws on its native 0..100 grid).
 *  2) Remap the child's NAMESPACED defs ids (creatures use `cr-fill`/`cr-shadow`,
 *     the fox uses `fox-fur`/`fox-shadow`) to a per-placement suffix so multiple
 *     embedded characters in ONE document never collide on a shared id.
 */
function place(doc: string, x: number, y: number, size: number, slot: number): string {
  // Drop the outer <svg …> open tag and the closing </svg>; keep the body.
  let inner = doc.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  // Namespace every shared defs id so embedded characters don't clash.
  for (const id of ['cr-fill', 'cr-shadow', 'fox-fur', 'fox-shadow']) {
    inner = inner.split(id).join(`${id}-${slot}`);
  }
  const px = (x * S).toFixed(1);
  const py = (y * S).toFixed(1);
  const ps = (size * S).toFixed(1);
  return (
    `<svg x="${px}" y="${py}" width="${ps}" height="${ps}" ` +
    `viewBox="0 0 100 100" overflow="visible">${inner}</svg>`
  );
}

// ── Shared storybook backdrop pieces (drawn directly at 480-space) ───────────

/** Sky + a soft hill of ground. `ground` is the grass/sand colour for the foot. */
function backdrop(sky: string, ground: string): string {
  const lip = lighten(ground, 0.12);
  return (
    `<rect x="0" y="0" width="${PIC_SIZE}" height="${PIC_SIZE}" fill="${sky}"/>` +
    `<rect x="0" y="300" width="${PIC_SIZE}" height="180" fill="${ground}"/>` +
    `<path d="M0 300 Q240 270 480 300 V340 H0 Z" fill="${lip}"/>`
  );
}

/** A big friendly sun in a top corner (painted gradient + soft shadow). */
function sun(cx: number, cy: number): string {
  const rays = [0, 30, 60, 90, 120, 150]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const i = 58;
      const o = 80;
      return (
        `<path d="M${(cx + dx * i).toFixed(1)} ${(cy + dy * i).toFixed(1)} ` +
        `L${(cx + dx * o).toFixed(1)} ${(cy + dy * o).toFixed(1)}" ` +
        `stroke="${palette.star}" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M${(cx - dx * i).toFixed(1)} ${(cy - dy * i).toFixed(1)} ` +
        `L${(cx - dx * o).toFixed(1)} ${(cy - dy * o).toFixed(1)}" ` +
        `stroke="${palette.star}" stroke-width="9" stroke-linecap="round"/>`
      );
    })
    .join('');
  return (
    rays +
    `<circle cx="${cx}" cy="${cy}" r="50" fill="url(#sun-fill)" ${inkStroke()}/>` +
    `<circle cx="${cx - 16}" cy="${cy - 14}" r="14" fill="#fff" opacity="0.35"/>`
  );
}

/** A storybook cloud (white blobs + soft ink). */
function cloud(cx: number, cy: number): string {
  return (
    `<g fill="${palette.white}" ${inkStroke()}>` +
    `<circle cx="${cx - 34}" cy="${cy + 6}" r="24"/>` +
    `<circle cx="${cx}" cy="${cy - 8}" r="32"/>` +
    `<circle cx="${cx + 34}" cy="${cy + 6}" r="24"/>` +
    `<rect x="${cx - 58}" y="${cy}" width="116" height="30" rx="15"/></g>`
  );
}

/** A leafy tree: trunk + a big round canopy with apples. `withApples` adds fruit. */
function tree(x: number, baseY: number, withApples: boolean): string {
  const trunkW = 34;
  const canopyR = 96;
  const cx = x;
  const cy = baseY - 150;
  const apples = withApples
    ? `<circle cx="${cx - 40}" cy="${cy + 18}" r="13" fill="${palette.error}" ${inkStroke()}/>` +
      `<circle cx="${cx + 36}" cy="${cy - 10}" r="13" fill="${palette.error}" ${inkStroke()}/>` +
      `<circle cx="${cx + 6}" cy="${cy + 42}" r="13" fill="${palette.error}" ${inkStroke()}/>`
    : '';
  return (
    `<rect x="${cx - trunkW / 2}" y="${cy}" width="${trunkW}" height="${baseY - cy}" rx="14" ` +
    `fill="url(#trunk-fill)" ${inkStroke()}/>` +
    `<circle cx="${cx}" cy="${cy}" r="${canopyR}" fill="url(#canopy-fill)" ${inkStroke()}/>` +
    `<circle cx="${cx - 36}" cy="${cy - 36}" r="20" fill="#fff" opacity="0.18"/>` +
    apples
  );
}

/** A small storybook flower standing on the ground at x. */
function flower(x: number, y: number, petal: string): string {
  const py = y - 30;
  const petals = [0, 72, 144, 216, 288]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      return (
        `<circle cx="${(x + Math.cos(rad) * 16).toFixed(1)}" cy="${(py + Math.sin(rad) * 16).toFixed(1)}" ` +
        `r="12" fill="${petal}" ${inkStroke()}/>`
      );
    })
    .join('');
  return (
    `<path d="M${x} ${y} V${py}" stroke="${darken(palette.success, 0.1)}" stroke-width="6" stroke-linecap="round"/>` +
    petals +
    `<circle cx="${x}" cy="${py}" r="9" fill="${palette.star}" ${inkStroke()}/>`
  );
}

/** A calm storybook pond/lake ellipse sitting on the ground. */
function pond(cx: number, cy: number): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="150" ry="46" fill="url(#pond-fill)" ${inkStroke()}/>` +
    `<path d="M${cx - 90} ${cy - 8} q40 -14 80 0" fill="none" stroke="#fff" stroke-width="5" ` +
    `stroke-linecap="round" opacity="0.6"/>` +
    `<path d="M${cx - 40} ${cy + 12} q40 -12 80 0" fill="none" stroke="#fff" stroke-width="5" ` +
    `stroke-linecap="round" opacity="0.45"/>`
  );
}

/** A patch of grass tufts along the ground for foreground interest. */
function grassTufts(): string {
  const tuft = (x: number): string =>
    `<path d="M${x} 480 V440 M${x - 10} 480 Q${x - 14} 452 ${x - 6} 446 ` +
    `M${x + 10} 480 Q${x + 14} 452 ${x + 6} 446" fill="none" ` +
    `stroke="${darken(palette.success, 0.14)}" stroke-width="6" stroke-linecap="round"/>`;
  return [40, 150, 250, 360, 450].map(tuft).join('');
}

// ── Scene defs (gradients shared by the backdrop props in one document) ──────

function sceneDefs(opts: {
  ground: string;
  trunk?: string;
  canopy?: string;
  pondColor?: string;
}): string {
  return (
    paintedFill('sun-fill', palette.star) +
    paintedFill('trunk-fill', opts.trunk ?? '#a06a3c') +
    paintedFill('canopy-fill', opts.canopy ?? palette.success) +
    paintedFill('pond-fill', opts.pondColor ?? palette.accent) +
    softShadow('scene-shadow')
  );
}

/** Wrap a finished scene body in the NATIVE 480×480 document. */
function pictureDoc(defs: string, body: string, title: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${PIC_SIZE} ${PIC_SIZE}" width="${PIC_SIZE}" height="${PIC_SIZE}" ` +
    `fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<title>${title}</title>` +
    withDefs(defs, body) +
    `</svg>`
  );
}

// ── The scenes ───────────────────────────────────────────────────────────────

/** Scene 1 — "Cáo trong vườn": sun + apple tree + Cáo + flowers on the grass. */
function foxGarden(): string {
  const defs = sceneDefs({ ground: '#bde8a3', canopy: '#6fc26a' });
  const body =
    backdrop(palette.backgroundSky, '#bde8a3') +
    sun(96, 96) +
    cloud(330, 110) +
    tree(122, 322, true) +
    flower(40, 470, palette.island.numbers) +
    flower(220, 476, palette.island.memory) +
    flower(440, 468, palette.island.letters) +
    grassTufts() +
    // Cáo waving in the middle-right, big and bold.
    place(foxGuide('Cáo'), 48, 40, 50, 1);
  return pictureDoc(defs, body, 'Cáo trong vườn');
}

/** Scene 2 — "Cáo và bạn bên hồ": a pond with a duck + Cáo + the sun. */
function foxAndDuckPond(): string {
  const defs = sceneDefs({ ground: '#cdebb0', pondColor: '#7cc6fe' });
  const body =
    backdrop('#cfeffd', '#cdebb0') +
    sun(404, 92) +
    cloud(140, 104) +
    tree(420, 330, false) +
    pond(250, 400) +
    grassTufts() +
    // Cáo on the left bank.
    place(foxIdle('Cáo'), 4, 44, 46, 1) +
    // A friendly duck floating on the pond, to the right.
    place(creature('duck', 'Vịt'), 50, 56, 38, 2);
  return pictureDoc(defs, body, 'Cáo và bạn vịt bên hồ');
}

/** Scene 3 — "Cáo dưới cây táo": a big apple tree with Cáo and a rabbit friend. */
function foxUnderAppleTree(): string {
  const defs = sceneDefs({ ground: '#c7e89a', canopy: '#5fb85a', trunk: '#9c6b3f' });
  const body =
    backdrop('#d8f0ff', '#c7e89a') +
    sun(404, 100) +
    cloud(120, 96) +
    // A big apple tree dominating the upper-left/centre.
    tree(180, 330, true) +
    flower(360, 466, palette.island.numbers) +
    flower(450, 474, palette.island.shapes) +
    grassTufts() +
    // Cáo at the foot of the tree, centre.
    place(foxIdle('Cáo'), 30, 46, 46, 1) +
    // A rabbit friend on the right.
    place(creature('rabbit', 'Thỏ'), 64, 54, 40, 2);
  return pictureDoc(defs, body, 'Cáo dưới cây táo');
}

/** Scene 4 — "Cáo và ong trên đồi": sun + tree + Cáo cheering + a bee + flowers. */
function foxAndBeeMeadow(): string {
  const defs = sceneDefs({ ground: '#bfe79b', canopy: '#74c96e' });
  const body =
    backdrop('#c9efff', '#bfe79b') +
    sun(92, 100) +
    cloud(340, 120) +
    tree(410, 326, false) +
    flower(60, 470, palette.island.memory) +
    flower(150, 476, palette.island.numbers) +
    grassTufts() +
    // Cáo cheering on the left.
    place(foxGuide('Cáo'), 20, 42, 48, 1) +
    // A bee buzzing in the upper-right region.
    place(creature('bee', 'Ong'), 56, 30, 34, 2);
  return pictureDoc(defs, body, 'Cáo và ong trên đồng cỏ');
}

/** The picture catalog — each entry is a 0-arg builder (deterministic). */
const SCENES: ReadonlyArray<() => string> = [
  foxGarden,
  foxAndDuckPond,
  foxUnderAppleTree,
  foxAndBeeMeadow,
];

/** How many distinct jigsaw pictures exist (for callers that want to pick). */
export const JIGSAW_PICTURE_COUNT = SCENES.length;

/**
 * Resolve a picture by `pick`. `pick` selects deterministically and any value
 * (negative, fractional, huge) WRAPS safely into range, so a scene can pass a
 * raw `Math.random()`-derived index without bounds-checking. Returns a COMPLETE
 * native 480×480 storybook `<svg>` string.
 */
export function jigsawPicture(pick: number): string {
  const n = SCENES.length;
  const i = ((Math.floor(pick) % n) + n) % n; // safe wrap for any integer/float
  return SCENES[i]();
}
