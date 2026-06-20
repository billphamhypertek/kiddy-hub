/**
 * KiddyHub — "Tìm Điểm Khác" scene art: the fox's garden, drawn as ONE SVG with
 * toggleable parts (Giai đoạn 4 · Phần C).
 *
 * `buildScene(changedIds)` renders the whole garden on the canonical 0..100
 * viewBox. For every id present in `changedIds` it draws the "changed" variant
 * of that part instead of the original; an empty array gives the pristine left
 * image. The ids match `DIFFERENCE_CATALOG` in spotDifferenceLogic, so the same
 * id both selects a tap region (logic) and flips a detail (art) — one source of
 * truth for what differs.
 *
 * Style follows the brand bible via `tokens.ts`: soft brown ink (#5b4636),
 * rounded caps, bright pastels. Returned as a complete `<svg>` string through
 * `svgDoc()`, consumed by the scene via B1's `loadSvgTexture` / `addArt`.
 */
import { svgDoc } from '../../art/svg';
import { palette, stroke } from '../../art/tokens';

const INK = palette.ink;
const SW = stroke.width;
const SW_THIN = stroke.thin;

/** Convenience: is this difference id active (i.e. show the changed variant)? */
function on(changed: ReadonlySet<string>, id: string): boolean {
  return changed.has(id);
}

/** Sky + ground backdrop the garden sits on (never changes). */
function backdrop(): string {
  return (
    `<rect x="0" y="0" width="100" height="100" rx="6" fill="#cdeefe"/>` + // sky
    `<rect x="0" y="62" width="100" height="38" fill="#bde8a3"/>` + // grass
    `<path d="M0 62 Q50 56 100 62 V70 H0 Z" fill="#a9df8a"/>` // soft hill lip
  );
}

/** Sun in the top-right; `resized` variant draws it noticeably bigger. */
function sun(changed: ReadonlySet<string>): string {
  const r = on(changed, 'sun') ? 13 : 9;
  const rays = `<g stroke="${palette.star}" stroke-width="${SW}">${[0, 45, 90, 135]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const i = r + 3;
      const o = r + 8;
      return `<path d="M${80 + dx * i} ${18 + dy * i} L${80 + dx * o} ${18 + dy * o}"/><path d="M${80 - dx * i} ${18 - dy * i} L${80 - dx * o} ${18 - dy * o}"/>`;
    })
    .join('')}</g>`;
  return (
    rays +
    `<circle cx="80" cy="18" r="${r}" fill="${palette.star}" stroke="${INK}" stroke-width="${SW_THIN}"/>`
  );
}

/** A fluffy cloud; `moved` variant shifts it to the right. */
function cloud(changed: ReadonlySet<string>): string {
  const cx = on(changed, 'cloud') ? 42 : 30;
  return (
    `<g fill="${palette.white}" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<circle cx="${cx - 8}" cy="18" r="6"/>` +
    `<circle cx="${cx}" cy="14" r="8"/>` +
    `<circle cx="${cx + 8}" cy="18" r="6"/>` +
    `<rect x="${cx - 14}" y="16" width="28" height="8" rx="4"/></g>`
  );
}

/** A little bird in the sky; `moved` variant slides it along. */
function bird(changed: ReadonlySet<string>): string {
  const cx = on(changed, 'bird') ? 58 : 50;
  const cy = 26;
  return (
    `<g fill="#7cc6fe" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<ellipse cx="${cx}" cy="${cy}" rx="6" ry="4"/>` + // body
    `<circle cx="${cx + 5}" cy="${cy - 2}" r="3"/>` + // head
    `<path d="M${cx + 8} ${cy - 2} l4 -1 l-3 3 z" fill="${palette.star}"/></g>` + // beak
    `<path d="M${cx - 2} ${cy} q-5 -5 -9 -1" fill="none" stroke="${INK}" stroke-width="${SW_THIN}"/>` // wing
  );
}

/** Tree on the left with one apple; the apple `recolored` variant turns gold. */
function tree(changed: ReadonlySet<string>): string {
  const appleFill = on(changed, 'apple') ? palette.star : '#ff5d5d';
  return (
    `<rect x="22" y="40" width="6" height="24" rx="2" fill="#9c6b3f" stroke="${INK}" stroke-width="${SW_THIN}"/>` + // trunk
    `<circle cx="25" cy="34" r="16" fill="#6fc26a" stroke="${INK}" stroke-width="${SW}"/>` + // canopy
    `<circle cx="26" cy="40" r="4" fill="${appleFill}" stroke="${INK}" stroke-width="${SW_THIN}"/>` // apple
  );
}

/** A bush bottom-right; `resized` variant draws it smaller. */
function bush(changed: ReadonlySet<string>): string {
  const s = on(changed, 'bush') ? 0.6 : 1;
  const r = (v: number): number => Math.round(v * s * 10) / 10;
  return (
    `<g fill="#5fb85a" stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<circle cx="${70 - r(8)}" cy="72" r="${r(8)}"/>` +
    `<circle cx="70" cy="${72 - r(4)}" r="${r(10)}"/>` +
    `<circle cx="${70 + r(8)}" cy="72" r="${r(8)}"/></g>`
  );
}

/** A butterfly fluttering over the grass; `removed` variant omits it entirely. */
function butterfly(changed: ReadonlySet<string>): string {
  if (on(changed, 'butterfly')) return '';
  const cx = 64;
  const cy = 40;
  return (
    `<g stroke="${INK}" stroke-width="${SW_THIN}">` +
    `<ellipse cx="${cx - 4}" cy="${cy - 2}" rx="4" ry="5" fill="#ff9ad1"/>` +
    `<ellipse cx="${cx + 4}" cy="${cy - 2}" rx="4" ry="5" fill="#ff9ad1"/>` +
    `<ellipse cx="${cx - 4}" cy="${cy + 4}" rx="3" ry="4" fill="#ffc2e6"/>` +
    `<ellipse cx="${cx + 4}" cy="${cy + 4}" rx="3" ry="4" fill="#ffc2e6"/>` +
    `<path d="M${cx} ${cy - 6} V${cy + 6}" fill="none"/></g>`
  );
}

/** A flower at a given x on the grass. */
function flower(x: number, petal: string): string {
  const y = 80;
  const petals = [0, 72, 144, 216, 288]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      return `<circle cx="${(x + Math.cos(rad) * 4).toFixed(1)}" cy="${(y - 6 + Math.sin(rad) * 4).toFixed(1)}" r="3" fill="${petal}" stroke="${INK}" stroke-width="1"/>`;
    })
    .join('');
  return (
    `<path d="M${x} ${y} V${y - 6}" stroke="#4f9e3f" stroke-width="${SW_THIN}"/>` +
    petals +
    `<circle cx="${x}" cy="${y - 6}" r="2.4" fill="${palette.star}" stroke="${INK}" stroke-width="1"/>`
  );
}

/** Left flower — `removed` variant omits it. */
function flowerLeft(changed: ReadonlySet<string>): string {
  if (on(changed, 'flowerLeft')) return '';
  return flower(16, '#ff8fab');
}

/** Right flower — `recolored` variant changes its petals from purple to orange. */
function flowerRight(changed: ReadonlySet<string>): string {
  const petal = on(changed, 'flowerRight') ? '#ff8c42' : '#b388ff';
  return flower(84, petal);
}

/**
 * Build the whole garden as one SVG string. `changedIds` lists the difference
 * ids whose "changed" variant should be drawn (empty = pristine left image).
 */
export function buildScene(changedIds: string[]): string {
  const changed = new Set(changedIds);
  const inner =
    backdrop() +
    sun(changed) +
    cloud(changed) +
    bird(changed) +
    tree(changed) +
    bush(changed) +
    butterfly(changed) +
    flowerLeft(changed) +
    flowerRight(changed);
  return svgDoc(inner, 'Vườn của Cáo');
}
