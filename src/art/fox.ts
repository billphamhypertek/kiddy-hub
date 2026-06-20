/**
 * KiddyHub — Cáo (fox) mascot (Giai đoạn 4 · Phần B1).
 *
 * The face of the app: orange body, cream belly/cheeks/tail-tip, big friendly
 * eyes, soft rounded outline. Three poses, all on the canonical 0..100 viewBox:
 *   - guide():  waving, welcoming — used to lead the child on the map.
 *   - cheer():  arms up, celebrating — reward / correct-answer moments.
 *   - idle():   standing, calm smile — neutral presence.
 *
 * Every colour, stroke and proportion comes from `tokens.ts`, so the mascot
 * restyles consistently with the rest of the art. Functions return a complete
 * `<svg>` string via `svgDoc()`.
 */
import { svgDoc } from './svg';
import { fox, stroke } from './tokens';
import { paintedFill, softShadow, withDefs } from './paint';

const SW = stroke.width;
const SW_THIN = stroke.thin;

// Namespaced ids per fox document (one doc per texture → ids never collide).
const FUR_ID = 'fox-fur';
const SHADOW_ID = 'fox-shadow';

/**
 * Wrap a pose body in storybook defs (GĐ6.1): a painted orange-fur gradient
 * (lighten→hue→darken depth) + a single soft warm shadow carried by the whole
 * group (cheap — one filter per fox). The fur fill is referenced via
 * `fill="url(#fox-fur)"` from the body/head/tail/arm paths.
 */
function painted(inner: string, title?: string): string {
  const defs = paintedFill(FUR_ID, fox.body) + softShadow(SHADOW_ID);
  return svgDoc(withDefs(defs, `<g filter="url(#${SHADOW_ID})">${inner}</g>`), title);
}

/** The painted-fur reference used everywhere the orange body fur is drawn. */
const FUR = `url(#${FUR_ID})`;

/** Tail — drawn first so the body overlaps its base. `up` lifts it for cheer. */
function tail(up: boolean): string {
  // A fat curled tail on the fox's left with a cream tip.
  const base = up
    ? // raised, swishing happily
      'M22 70 C2 64 -1 44 12 33 C18 47 26 55 33 62 Z'
    : // resting low
      'M24 76 C4 76 0 56 12 46 C19 58 28 64 35 68 Z';
  const tip = up ? 'M12 33 C5 36 3 44 8 50 C14 47 16 40 16 36 Z' : 'M12 46 C5 50 4 58 9 63 C15 60 17 53 17 49 Z';
  return (
    `<path d="${base}" fill="${fox.bodyDark}" stroke="${fox.ink}" stroke-width="${SW}"/>` +
    `<path d="${tip}" fill="${fox.cream}" stroke="${fox.ink}" stroke-width="${SW_THIN}"/>`
  );
}

/** Rounded body + cream belly. Sits low and centred. */
function body(): string {
  return (
    // main body blob
    `<path d="M30 92 C26 70 32 56 50 56 C68 56 74 70 70 92 Z" ` +
    `fill="${FUR}" stroke="${fox.ink}" stroke-width="${SW}"/>` +
    // cream belly
    `<path d="M40 90 C38 74 43 66 50 66 C57 66 62 74 60 90 Z" fill="${fox.cream}"/>` +
    // two little feet
    `<ellipse cx="41" cy="91" rx="6" ry="4" fill="${fox.bodyDark}" stroke="${fox.ink}" stroke-width="${SW_THIN}"/>` +
    `<ellipse cx="59" cy="91" rx="6" ry="4" fill="${fox.bodyDark}" stroke="${fox.ink}" stroke-width="${SW_THIN}"/>`
  );
}

/**
 * Head: rounded cheeks, big pointy-but-soft ears, huge eyes, tiny nose,
 * warm smile, cheek blush. `look` nudges the pupils for a touch of life.
 */
function head(look: 'center' | 'side' = 'center'): string {
  const px = look === 'side' ? 1.6 : 0; // pupil x-offset
  return (
    // ears (behind head)
    `<path d="M30 30 C26 14 30 9 38 14 C42 18 43 26 42 32 Z" fill="${FUR}" stroke="${fox.ink}" stroke-width="${SW}"/>` +
    `<path d="M70 30 C74 14 70 9 62 14 C58 18 57 26 58 32 Z" fill="${FUR}" stroke="${fox.ink}" stroke-width="${SW}"/>` +
    `<path d="M33 27 C31 18 33 15 37 18 C39 21 40 25 39 29 Z" fill="${fox.cream}"/>` +
    `<path d="M67 27 C69 18 67 15 63 18 C61 21 60 25 61 29 Z" fill="${fox.cream}"/>` +
    // head shape (slightly wider than tall, rounded)
    `<path d="M50 18 C68 18 76 30 76 42 C76 56 64 64 50 64 C36 64 24 56 24 42 C24 30 32 18 50 18 Z" ` +
    `fill="${FUR}" stroke="${fox.ink}" stroke-width="${SW}"/>` +
    // cream muzzle/cheeks mask (the friendly white face)
    `<path d="M50 36 C62 36 66 46 64 53 C61 60 55 62 50 62 C45 62 39 60 36 53 C34 46 38 36 50 36 Z" fill="${fox.cream}"/>` +
    // cheek blush
    `<circle cx="35" cy="49" r="4" fill="${fox.blush}" opacity="0.8"/>` +
    `<circle cx="65" cy="49" r="4" fill="${fox.blush}" opacity="0.8"/>` +
    // eyes (big, friendly) — white, dark pupil, catch-light
    eye(40, 41, px) +
    eye(60, 41, px) +
    // nose
    `<path d="M50 50 C53 50 54 52 53 54 C52 56 48 56 47 54 C46 52 47 50 50 50 Z" fill="${fox.ink}"/>` +
    // smile
    `<path d="M44 56 C47 60 53 60 56 56" fill="none" stroke="${fox.ink}" stroke-width="${SW_THIN}"/>`
  );
}

function eye(cx: number, cy: number, px: number): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="6.4" fill="${fox.white}" stroke="${fox.ink}" stroke-width="${SW_THIN}"/>` +
    `<circle cx="${cx + px}" cy="${cy + 0.6}" r="4" fill="${fox.ink}"/>` +
    `<circle cx="${cx + px + 1.4}" cy="${cy - 1}" r="1.4" fill="${fox.eyeShine}"/>`
  );
}

/**
 * A chunky rounded arm rendered as a thick capped stroke + a cream paw.
 * `dir` = -1 left, +1 right. `raised` lifts the paw up beside the head;
 * `waving` tilts a raised paw outward for a friendly wave.
 * Arms attach near the shoulders (just below the head) and read clearly
 * because the thick stroke is outlined.
 */
function arm(dir: -1 | 1, raised: boolean, waving = false): string {
  const shoulderX = 50 + dir * 20;
  const sy = 66;
  let handX: number;
  let handY: number;
  let ctrlX: number;
  let ctrlY: number;
  if (raised) {
    // up beside the head; waving paw goes a touch higher & wider
    handX = 50 + dir * (waving ? 33 : 30);
    handY = waving ? 26 : 30;
    ctrlX = 50 + dir * 34;
    ctrlY = 52;
  } else {
    // resting down along the body
    handX = 50 + dir * 26;
    handY = 84;
    ctrlX = 50 + dir * 30;
    ctrlY = 74;
  }
  const limb = `M${shoulderX} ${sy} Q${ctrlX} ${ctrlY} ${handX} ${handY}`;
  return (
    // outline (drawn first, slightly thicker) → soft dark edge
    `<path d="${limb}" fill="none" stroke="${fox.ink}" stroke-width="11"/>` +
    // fur fill on top
    `<path d="${limb}" fill="none" stroke="${FUR}" stroke-width="8"/>` +
    // cream paw
    `<circle cx="${handX}" cy="${handY}" r="5.5" fill="${fox.cream}" stroke="${fox.ink}" stroke-width="${SW_THIN}"/>`
  );
}

/** GUIDE — friendly wave/point, welcoming the child to follow. */
export function foxGuide(title = 'Cáo dẫn đường'): string {
  return painted(
    tail(false) +
      body() +
      arm(-1, false) + // left arm relaxed
      arm(1, true, true) + // right arm raised, waving
      head('side'),
    title,
  );
}

/** CHEER — both arms up, celebrating a reward. */
export function foxCheer(title = 'Cáo cổ vũ'): string {
  return painted(
    tail(true) +
      body() +
      arm(-1, true) +
      arm(1, true) +
      head('center') +
      // little sparkles around the head
      `<g fill="${fox.cream}" stroke="${fox.ink}" stroke-width="1">` +
      sparkle(20, 22) +
      sparkle(80, 24) +
      sparkle(50, 6) +
      `</g>`,
    title,
  );
}

/** IDLE — standing calmly with a soft smile. */
export function foxIdle(title = 'Cáo'): string {
  return painted(tail(false) + body() + arm(-1, false) + arm(1, false) + head('center'), title);
}

// ─── Storybook expressions (GĐ6.1) — additive; foxPoses (stable API) unchanged ──

/** THINK — head tilted, a little "?" bubble — for scaffolding / idle curiosity. */
export function foxThink(title = 'Cáo suy nghĩ'): string {
  return painted(
    tail(false) +
      body() +
      arm(-1, false) +
      arm(1, false) +
      `<g transform="rotate(-8 50 40)">${head('side')}</g>` +
      // a soft "?" bubble near the right ear
      `<circle cx="80" cy="20" r="11" fill="${fox.cream}" stroke="${fox.ink}" stroke-width="${SW_THIN}"/>` +
      `<text x="80" y="25" text-anchor="middle" font-size="14" font-weight="800" fill="${fox.ink}" font-family="'Baloo 2','Comic Sans MS',system-ui,sans-serif">?</text>`,
    title,
  );
}

/** POINT — one paw raised toward an answer. `dir` = -1 left, +1 right. */
export function foxPoint(dir: -1 | 1 = 1, title = 'Cáo chỉ'): string {
  return painted(
    tail(false) + body() + arm((-dir) as -1 | 1, false) + arm(dir, true) + head('side'),
    title,
  );
}

/** NOD — head dipped in a friendly "yes". Static SVG; the nod motion is a tween. */
export function foxNod(title = 'Cáo gật'): string {
  return painted(
    tail(false) +
      body() +
      arm(-1, false) +
      arm(1, false) +
      `<g transform="translate(0 3)">${head('center')}</g>`,
    title,
  );
}

function sparkle(x: number, y: number): string {
  return `<path d="M${x} ${y - 4} L${x + 1.4} ${y - 1.4} L${x + 4} ${y} L${x + 1.4} ${y + 1.4} L${x} ${y + 4} L${x - 1.4} ${y + 1.4} L${x - 4} ${y} L${x - 1.4} ${y - 1.4} Z"/>`;
}

/** All three poses, keyed by name — handy for galleries / the style board. */
export const foxPoses = {
  guide: foxGuide,
  cheer: foxCheer,
  idle: foxIdle,
} as const;

/** New storybook expressions (GĐ6.1) — kept SEPARATE from foxPoses (stable API). */
export const foxExpressions = {
  think: foxThink,
  point: (): string => foxPoint(1),
  nod: foxNod,
} as const;

export type FoxPose = keyof typeof foxPoses;
export type FoxExpression = keyof typeof foxExpressions;
