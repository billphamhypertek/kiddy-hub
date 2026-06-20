/**
 * KiddyHub — Full parametric creature / object kit (Giai đoạn 6 · 6.2).
 *
 * The CANONICAL storybook kit that retires emoji as game CONTENT (spec §5). A
 * small set of body TEMPLATES (quadruped / bird / amphibian / bug / fish /
 * produce / vehicle / tool / dot / label) is reused across a data-driven
 * `id → config` CATALOG; the resolver `creature(id)` composes each into a
 * complete `<svg>` on the storybook surface (painted gradient + soft warm
 * shadow + brown ink stroke). Every colour comes from the config / tokens —
 * nothing hard-codes a stray hue. The 6.1 pilot kit (`creaturesCounting.ts`)
 * now re-exports from here, so the six counting animals live in ONE place.
 *
 * Authored on the canonical 0..100 viewBox via `svgDoc()`, like every art module.
 */
import { svgDoc } from './svg';
import { paintedFill, softShadow, inkStroke, withDefs } from './paint';
import { palette } from './tokens';

const FILL_ID = 'cr-fill';
const SHADOW_ID = 'cr-shadow';

type TemplateName =
  | 'quadruped'
  | 'bird'
  | 'amphibian'
  | 'bug'
  | 'wing'
  | 'fish'
  | 'produce'
  | 'leafy'
  | 'vehicle'
  | 'wheeled'
  | 'air'
  | 'tool'
  | 'round'
  | 'dot'
  | 'label';

export interface CreatureConfig {
  /** Which body template to draw. */
  template: TemplateName;
  /** Main body hue (gets the painted gradient). */
  body: string;
  /** Belly / cheek / wing / beak / accent hue. */
  accent: string;
  /** Optional third detail hue (stripes, leaves, windows…). */
  detail?: string;
}

/** Two big friendly eyes centred around (cx, cy). */
function eyes(cx: number, cy: number, r = 5.4): string {
  const e = (x: number): string =>
    `<circle cx="${x}" cy="${cy}" r="${r}" fill="#fff" ${inkStroke()}/>` +
    `<circle cx="${x + 0.6}" cy="${cy + 0.6}" r="${r * 0.55}" fill="${palette.ink}"/>` +
    `<circle cx="${x + 1.6}" cy="${cy - 1}" r="${r * 0.2}" fill="#fff"/>`;
  return e(cx - 9) + e(cx + 9);
}

/** A small friendly smile arc centred at (cx, cy). */
function smile(cx: number, cy: number, w = 12): string {
  return `<path d="M${cx - w / 2} ${cy} q${w / 2} ${w * 0.55} ${w} 0" fill="none" ${inkStroke()}/>`;
}

// ── Animal templates ────────────────────────────────────────────────────────
function quadruped(c: CreatureConfig): string {
  // generic 4-leg-ish round animal: body + head + two ears + nose + eyes + smile.
  return (
    `<ellipse cx="50" cy="64" rx="25" ry="20" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // body
    `<circle cx="50" cy="40" r="19" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // head
    `<path d="M38 25 C33 7 45 8 46 27 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // ear L
    `<path d="M62 25 C67 7 55 8 54 27 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // ear R
    `<ellipse cx="44" cy="44" rx="6" ry="5" fill="${c.accent}"/>` + // cheek L
    `<ellipse cx="56" cy="44" rx="6" ry="5" fill="${c.accent}"/>` + // cheek R
    `<circle cx="50" cy="44" r="2.6" fill="${palette.ink}"/>` + // nose
    eyes(50, 38) +
    smile(50, 48, 10)
  );
}

function bird(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="60" rx="26" ry="24" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // body
    `<circle cx="50" cy="36" r="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // head
    `<path d="M50 38 l16 6 l-16 6 Z" fill="${c.accent}" ${inkStroke()}/>` + // beak
    `<path d="M22 60 q-10 4 -2 12 q8 -2 8 -8 Z" fill="${c.accent}" ${inkStroke()}/>` + // wing
    eyes(50, 34)
  );
}

function amphibian(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="58" rx="28" ry="24" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="38" cy="34" r="9" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // eye bump L
    `<circle cx="62" cy="34" r="9" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // eye bump R
    `<circle cx="38" cy="34" r="4" fill="#fff" ${inkStroke()}/><circle cx="38" cy="35" r="2.2" fill="${palette.ink}"/>` +
    `<circle cx="62" cy="34" r="4" fill="#fff" ${inkStroke()}/><circle cx="62" cy="35" r="2.2" fill="${palette.ink}"/>` +
    `<ellipse cx="42" cy="60" rx="5" ry="4" fill="${c.accent}"/>` +
    `<ellipse cx="58" cy="60" rx="5" ry="4" fill="${c.accent}"/>` +
    smile(50, 60, 20)
  );
}

function bug(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="54" rx="22" ry="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M40 42 H60 M40 54 H60" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>` + // stripes
    `<ellipse cx="34" cy="40" rx="12" ry="8" fill="#fff" opacity="0.85" ${inkStroke()}/>` + // wing L
    `<ellipse cx="66" cy="40" rx="12" ry="8" fill="#fff" opacity="0.85" ${inkStroke()}/>` + // wing R
    eyes(50, 50, 4.2)
  );
}

function wing(c: CreatureConfig): string {
  // butterfly: symmetric coloured wings + a thin body line.
  return (
    `<line x1="50" y1="30" x2="50" y2="74" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="36" cy="42" r="14" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="64" cy="42" r="14" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="36" cy="64" r="11" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="64" cy="64" r="11" fill="url(#${FILL_ID})" ${inkStroke()}/>`
  );
}

function fish(c: CreatureConfig): string {
  return (
    `<path d="M70 50 l16 -12 v24 Z" fill="${c.accent}" ${inkStroke()}/>` + // tail
    `<ellipse cx="46" cy="50" rx="28" ry="20" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M40 30 q6 8 0 16" fill="none" stroke="${c.accent}" stroke-width="3" stroke-linecap="round"/>` + // fin
    `<circle cx="36" cy="46" r="4.4" fill="#fff" ${inkStroke()}/><circle cx="35" cy="47" r="2.4" fill="${palette.ink}"/>` +
    smile(40, 54, 8)
  );
}

// ── Produce / object templates ──────────────────────────────────────────────
function produce(c: CreatureConfig): string {
  // round fruit/food: body circle + a little leaf + stem.
  return (
    `<circle cx="50" cy="56" r="28" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M50 30 q2 -10 12 -12 q-2 10 -12 12 Z" fill="${c.detail ?? palette.success}" ${inkStroke()}/>` + // leaf
    `<line x1="50" y1="30" x2="50" y2="22" stroke="${palette.ink}" stroke-width="3" stroke-linecap="round"/>` + // stem
    `<ellipse cx="40" cy="48" rx="6" ry="9" fill="#fff" opacity="0.35"/>` // shine
  );
}

function leafy(c: CreatureConfig): string {
  // banana / curved produce.
  return (
    `<path d="M28 40 C30 70 70 78 78 56 C70 64 40 60 38 38 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M28 40 l-3 -6" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>`
  );
}

function vehicle(c: CreatureConfig): string {
  // bus / boxy body on two wheels + windows.
  return (
    `<rect x="20" y="36" width="60" height="30" rx="8" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<rect x="26" y="42" width="14" height="12" rx="3" fill="${c.detail ?? palette.backgroundSky}" ${inkStroke()}/>` +
    `<rect x="44" y="42" width="14" height="12" rx="3" fill="${c.detail ?? palette.backgroundSky}" ${inkStroke()}/>` +
    `<rect x="62" y="42" width="12" height="12" rx="3" fill="${c.detail ?? palette.backgroundSky}" ${inkStroke()}/>` +
    `<circle cx="34" cy="68" r="8" fill="${palette.ink}"/><circle cx="34" cy="68" r="3.5" fill="${c.accent}"/>` +
    `<circle cx="66" cy="68" r="8" fill="${palette.ink}"/><circle cx="66" cy="68" r="3.5" fill="${c.accent}"/>`
  );
}

function wheeled(c: CreatureConfig): string {
  // car: lower body + cabin + two wheels.
  return (
    `<path d="M16 60 L24 46 H50 L60 36 H70 L78 60 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<rect x="40" y="40" width="20" height="12" rx="3" fill="${c.detail ?? palette.backgroundSky}" ${inkStroke()}/>` +
    `<rect x="14" y="58" width="68" height="8" rx="4" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="32" cy="68" r="9" fill="${palette.ink}"/><circle cx="32" cy="68" r="4" fill="${c.accent}"/>` +
    `<circle cx="64" cy="68" r="9" fill="${palette.ink}"/><circle cx="64" cy="68" r="4" fill="${c.accent}"/>`
  );
}

function air(c: CreatureConfig): string {
  // plane / rocket: pointed fuselage + fin/wings.
  return (
    `<path d="M20 52 L66 44 L82 50 L66 56 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // fuselage
    `<path d="M40 50 L34 32 L48 48 Z" fill="${c.accent}" ${inkStroke()}/>` + // top wing
    `<path d="M40 52 L34 70 L48 54 Z" fill="${c.accent}" ${inkStroke()}/>` + // bottom wing
    `<circle cx="64" cy="50" r="4" fill="#fff" ${inkStroke()}/>` // window
  );
}

function tool(c: CreatureConfig): string {
  // generic tool: a handle + a head, accent-coloured.
  return (
    `<rect x="44" y="40" width="9" height="44" rx="4" fill="${c.accent}" ${inkStroke()}/>` + // handle
    `<rect x="30" y="28" width="40" height="16" rx="6" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // head
    `<circle cx="50" cy="36" r="3" fill="${palette.ink}" opacity="0.4"/>`
  );
}

function round(c: CreatureConfig): string {
  // ball / balloon / generic round object: a sphere with a highlight + accent band.
  return (
    `<circle cx="50" cy="52" r="30" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M22 50 q28 -16 56 0" fill="none" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>` +
    `<ellipse cx="40" cy="42" rx="8" ry="11" fill="#fff" opacity="0.4"/>`
  );
}

function dot(_c: CreatureConfig): string {
  // pattern token: a clean painted disc with a soft ink ring (colour from body).
  return (
    `<circle cx="50" cy="50" r="30" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<ellipse cx="42" cy="42" rx="8" ry="10" fill="#fff" opacity="0.35"/>`
  );
}

function label(c: CreatureConfig): string {
  // sorting basket label: a soft rounded badge tinted by body, accent ring.
  return (
    `<rect x="18" y="26" width="64" height="48" rx="14" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="50" cy="50" r="16" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="44" cy="46" r="4" fill="#fff" opacity="0.7"/>`
  );
}

const TEMPLATES: Record<TemplateName, (c: CreatureConfig) => string> = {
  quadruped,
  bird,
  amphibian,
  bug,
  wing,
  fish,
  produce,
  leafy,
  vehicle,
  wheeled,
  air,
  tool,
  round,
  dot,
  label,
};

/**
 * The full catalog. Each id maps to a template + colours. Animals reuse the
 * quadruped/bird/etc templates with their own palette; produce/vehicles/tools
 * likewise. Colours are friendly storybook hues (some from `palette`).
 */
const CATALOG: Record<string, CreatureConfig> = {
  // ── Counting subset (6.1) — kept identical so the pilot is unchanged ──
  duck: { template: 'bird', body: '#ffd166', accent: '#ff8c42' },
  rabbit: { template: 'quadruped', body: '#f4e3ef', accent: '#ffb3a7' },
  frog: { template: 'amphibian', body: '#06d6a0', accent: '#bdf5e6' },
  bee: { template: 'bug', body: '#ffd166', accent: '#5b4636' },
  fish: { template: 'fish', body: '#7cc6fe', accent: '#bfeaff' },
  butterfly: { template: 'wing', body: '#b388ff', accent: '#ff8fab' },

  // ── Quadruped animals ──
  cat: { template: 'quadruped', body: '#ffb877', accent: '#ffd9b0' },
  dog: { template: 'quadruped', body: '#c89464', accent: '#f0d6bd' },
  tiger: { template: 'quadruped', body: '#ff9e4f', accent: '#fff0d6' },
  cow: { template: 'quadruped', body: '#f4f0ea', accent: '#d8b08a' },
  bear: { template: 'quadruped', body: '#a9744f', accent: '#e8cdb4' },
  elephant: { template: 'quadruped', body: '#b8c3cf', accent: '#dde6ee' },
  fox: { template: 'quadruped', body: '#ff8c42', accent: '#fff3e2' },
  panda: { template: 'quadruped', body: '#f6f6f6', accent: '#3a3a3a' },
  lion: { template: 'quadruped', body: '#f4b860', accent: '#c47f2e' },
  monkey: { template: 'quadruped', body: '#b07a4f', accent: '#e8c9a8' },
  turtle: { template: 'quadruped', body: '#06d6a0', accent: '#8be3c7' },

  // ── Birds ──
  bird: { template: 'bird', body: '#7cc6fe', accent: '#ffb703' },
  chicken: { template: 'bird', body: '#fff6e6', accent: '#ff8c42' },

  // ── Produce / food ──
  apple: { template: 'produce', body: '#ff6b6b', accent: '#ffd166', detail: '#06d6a0' },
  banana: { template: 'leafy', body: '#ffd166', accent: '#7a5c1e' },
  grapes: { template: 'produce', body: '#b388ff', accent: '#7a52cc', detail: '#06d6a0' },
  strawberry: { template: 'produce', body: '#ff5d7a', accent: '#ffd166', detail: '#06d6a0' },
  peach: { template: 'produce', body: '#ffb3a7', accent: '#ff8fab', detail: '#06d6a0' },
  watermelon: { template: 'produce', body: '#ff6b8a', accent: '#06d6a0', detail: '#06d6a0' },
  cake: { template: 'round', body: '#ffd9ec', accent: '#ff8fab' },
  milk: { template: 'round', body: '#f4faff', accent: '#7cc6fe' },
  egg: { template: 'round', body: '#fff6e6', accent: '#ffd166' },
  bread: { template: 'round', body: '#e6b877', accent: '#a06a3c' },

  // ── Objects ──
  ball: { template: 'round', body: '#ff8fab', accent: '#7cc6fe' },
  book: { template: 'round', body: '#7cc6fe', accent: '#ffd166' },
  cup: { template: 'round', body: '#ff8c42', accent: '#fff3e2' },
  hat: { template: 'round', body: '#b388ff', accent: '#ffd166' },
  key: { template: 'tool', body: '#ffd166', accent: '#c9a200' },
  star: { template: 'round', body: '#ffd166', accent: '#ff8c42' },
  flower: { template: 'round', body: '#ff8fab', accent: '#ffd166' },
  balloon: { template: 'round', body: '#ff6b6b', accent: '#ffd166' },
  tree: { template: 'round', body: '#06d6a0', accent: '#a06a3c' },
  sun: { template: 'round', body: '#ffd166', accent: '#ff8c42' },

  // ── Vehicles ──
  car: { template: 'wheeled', body: '#ff6b6b', accent: '#5b4636', detail: '#bfeaff' },
  bus: { template: 'vehicle', body: '#ffb703', accent: '#5b4636', detail: '#bfeaff' },
  bicycle: { template: 'wheeled', body: '#06d6a0', accent: '#5b4636', detail: '#bfeaff' },
  airplane: { template: 'air', body: '#7cc6fe', accent: '#ff8c42' },
  train: { template: 'vehicle', body: '#ff8fab', accent: '#5b4636', detail: '#bfeaff' },
  rocket: { template: 'air', body: '#ff6b6b', accent: '#ffd166' },

  // ── Tools ──
  hammer: { template: 'tool', body: '#b8c3cf', accent: '#a06a3c' },
  scissors: { template: 'tool', body: '#7cc6fe', accent: '#ff8fab' },
  wrench: { template: 'tool', body: '#b8c3cf', accent: '#5b4636' },
  ruler: { template: 'tool', body: '#ffd166', accent: '#ff8c42' },
  paintbrush: { template: 'tool', body: '#b388ff', accent: '#a06a3c' },

  // ── Pattern dots (colour tokens) ──
  'dot-red': { template: 'dot', body: '#ff5d5d', accent: '#ff5d5d' },
  'dot-blue': { template: 'dot', body: '#4f93ff', accent: '#4f93ff' },
  'dot-yellow': { template: 'dot', body: '#ffd23f', accent: '#ffd23f' },
  'dot-green': { template: 'dot', body: '#2ecf8f', accent: '#2ecf8f' },
  'dot-purple': { template: 'dot', body: '#b06bff', accent: '#b06bff' },

  // ── Sorting basket labels ──
  'label-animals': { template: 'label', body: '#ffd9b0', accent: '#ff8c42' },
  'label-food': { template: 'label', body: '#ffd9ec', accent: '#ff8fab' },
  'label-vehicles': { template: 'label', body: '#bfeaff', accent: '#7cc6fe' },
};

/** Every id the kit can draw (for the style board + the contract tests). */
export const CREATURE_IDS = Object.keys(CATALOG) as readonly string[];

/** The six counting animals (re-sourced here; `creaturesCounting.ts` re-exports). */
export const COUNTING_CREATURE_IDS = ['duck', 'rabbit', 'frog', 'bee', 'fish', 'butterfly'] as const;

/**
 * Resolve an id → a complete storybook <svg>. Unknown id → a safe friendly blob
 * (never blank, never throws), so a scene can never strand a wrong sprite.
 */
export function creature(id: string, title = ''): string {
  const cfg = CATALOG[id];
  if (!cfg) {
    const defs = paintedFill(FILL_ID, palette.primary) + softShadow(SHADOW_ID);
    return svgDoc(
      withDefs(
        defs,
        `<g filter="url(#${SHADOW_ID})"><circle cx="50" cy="52" r="30" fill="url(#${FILL_ID})" ${inkStroke()}/>${eyes(50, 48)}${smile(50, 60, 12)}</g>`,
      ),
      title,
    );
  }
  const defs = paintedFill(FILL_ID, cfg.body) + softShadow(SHADOW_ID);
  const body = TEMPLATES[cfg.template](cfg);
  return svgDoc(withDefs(defs, `<g filter="url(#${SHADOW_ID})">${body}</g>`), title);
}

/**
 * Map a CONTENT emoji (as stored in a game's *Logic.ts) to a creature id. The
 * single translation layer so every scene's render call is `creature(emojiToId(e))`
 * while logic keeps emitting its existing emoji tokens (byte-output unchanged).
 * Unknown emoji → a stable fallback id (never blank).
 */
const EMOJI_TO_ID: Record<string, string> = {
  // counting + animals
  '🦆': 'duck', '🐰': 'rabbit', '🐸': 'frog', '🐝': 'bee', '🐟': 'fish', '🦋': 'butterfly',
  '🐱': 'cat', '🐶': 'dog', '🐯': 'tiger', '🐮': 'cow', '🐻': 'bear', '🐘': 'elephant',
  '🦊': 'fox', '🐼': 'panda', '🦁': 'lion', '🐵': 'monkey', '🐢': 'turtle',
  '🐦': 'bird', '🐔': 'chicken',
  // produce / food
  '🍎': 'apple', '🍌': 'banana', '🍇': 'grapes', '🍓': 'strawberry', '🍑': 'peach',
  '🍉': 'watermelon', '🍰': 'cake', '🥛': 'milk', '🥚': 'egg', '🍞': 'bread',
  // objects
  '⚽': 'ball', '📖': 'book', '☕': 'cup', '🎩': 'hat', '🔑': 'key', '⭐': 'star',
  '🌸': 'flower', '🌷': 'flower', '🎈': 'balloon', '🌳': 'tree', '☀️': 'sun',
  // vehicles
  '🚗': 'car', '🚌': 'bus', '🚲': 'bicycle', '✈️': 'airplane', '🚂': 'train', '🚀': 'rocket',
  // tools
  '🔨': 'hammer', '✂️': 'scissors', '🔧': 'wrench', '📏': 'ruler', '🖌️': 'paintbrush',
  // pattern colour tokens
  '🔴': 'dot-red', '🔵': 'dot-blue', '🟡': 'dot-yellow', '🟢': 'dot-green', '🟣': 'dot-purple',
  // sorting basket labels
  '🐾': 'label-animals', '🍽️': 'label-food', '🚦': 'label-vehicles',
};

export function emojiToCreatureId(emoji: string): string {
  return EMOJI_TO_ID[emoji] ?? 'star';
}
