/**
 * KiddyHub — Minimal creature kit for the counting-fun pilot (Giai đoạn 6 · 6.1).
 *
 * Establishes the PARAMETRIC pattern the full `creatures.ts` kit (6.2) will grow
 * from: a tiny set of body templates + a data-driven id→config map, resolved by
 * `creature(id)` into a complete storybook `<svg>` (painted gradient fur/skin +
 * soft shadow + brown ink stroke). 6.1 only covers the six animals counting-fun
 * uses (duck/rabbit/frog/bee/fish/butterfly); 6.2 audits + extends to every game.
 *
 * Every colour comes from the config / tokens; nothing hard-codes a stray hue.
 * Authored on the canonical 0..100 viewBox via `svgDoc()`, like every art module.
 */
import { svgDoc } from './svg';
import { paintedFill, softShadow, inkStroke, withDefs } from './paint';
import { palette } from './tokens';

export const COUNTING_CREATURE_IDS = ['duck', 'rabbit', 'frog', 'bee', 'fish', 'butterfly'] as const;
export type CreatureId = (typeof COUNTING_CREATURE_IDS)[number];

interface CreatureConfig {
  /** Main body hue (gets a painted gradient). */
  body: string;
  /** Belly / cheek / wing / beak accent. */
  accent: string;
  /** Which template to draw. */
  template: 'bird' | 'quadruped' | 'amphibian' | 'bug' | 'fish' | 'wing';
}

const CONFIG: Record<CreatureId, CreatureConfig> = {
  duck: { body: '#ffd166', accent: '#ff8c42', template: 'bird' },
  rabbit: { body: '#f4e3ef', accent: '#ffb3a7', template: 'quadruped' },
  frog: { body: '#06d6a0', accent: '#bdf5e6', template: 'amphibian' },
  bee: { body: '#ffd166', accent: '#5b4636', template: 'bug' },
  fish: { body: '#7cc6fe', accent: '#bfeaff', template: 'fish' },
  butterfly: { body: '#b388ff', accent: '#ff8fab', template: 'wing' },
};

const FILL_ID = 'cr-fill';
const SHADOW_ID = 'cr-shadow';

/** Two big friendly eyes centred around (cx, cy). */
function eyes(cx: number, cy: number): string {
  const e = (x: number): string =>
    `<circle cx="${x}" cy="${cy}" r="5.4" fill="#fff" ${inkStroke()}/>` +
    `<circle cx="${x + 0.6}" cy="${cy + 0.6}" r="3" fill="${palette.ink}"/>` +
    `<circle cx="${x + 1.6}" cy="${cy - 1}" r="1.1" fill="#fff"/>`;
  return e(cx - 9) + e(cx + 9);
}

function bird(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="60" rx="26" ry="24" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // body
    `<circle cx="50" cy="36" r="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // head
    `<path d="M50 38 l16 6 l-16 6 Z" fill="${c.accent}" ${inkStroke()}/>` + // beak
    eyes(50, 34)
  );
}

function quadruped(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="62" rx="24" ry="20" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="50" cy="40" r="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M40 24 C36 6 46 8 46 26 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // ear L
    `<path d="M60 24 C64 6 54 8 54 26 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // ear R
    `<circle cx="50" cy="46" r="2.6" fill="${c.accent}"/>` + // nose
    eyes(50, 40)
  );
}

function amphibian(_c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="58" rx="28" ry="24" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="38" cy="34" r="9" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // eye bump L
    `<circle cx="62" cy="34" r="9" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // eye bump R
    `<circle cx="38" cy="34" r="4" fill="#fff" ${inkStroke()}/><circle cx="38" cy="35" r="2.2" fill="${palette.ink}"/>` +
    `<circle cx="62" cy="34" r="4" fill="#fff" ${inkStroke()}/><circle cx="62" cy="35" r="2.2" fill="${palette.ink}"/>` +
    `<path d="M40 62 q10 8 20 0" fill="none" ${inkStroke()}/>` // smile
  );
}

function bug(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="54" rx="22" ry="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M40 42 H60 M40 54 H60" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>` + // stripes
    `<ellipse cx="34" cy="40" rx="12" ry="8" fill="#fff" opacity="0.8" ${inkStroke()}/>` + // wing L
    `<ellipse cx="66" cy="40" rx="12" ry="8" fill="#fff" opacity="0.8" ${inkStroke()}/>` + // wing R
    eyes(50, 50)
  );
}

function fish(c: CreatureConfig): string {
  return (
    `<path d="M70 50 l16 -12 v24 Z" fill="${c.accent}" ${inkStroke()}/>` + // tail
    `<ellipse cx="46" cy="50" rx="28" ry="20" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="36" cy="46" r="4.4" fill="#fff" ${inkStroke()}/><circle cx="35" cy="47" r="2.4" fill="${palette.ink}"/>`
  );
}

function wing(c: CreatureConfig): string {
  return (
    `<line x1="50" y1="30" x2="50" y2="74" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="36" cy="42" r="14" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="64" cy="42" r="14" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="36" cy="64" r="11" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="64" cy="64" r="11" fill="url(#${FILL_ID})" ${inkStroke()}/>`
  );
}

const TEMPLATES: Record<CreatureConfig['template'], (c: CreatureConfig) => string> = {
  bird,
  quadruped,
  amphibian,
  bug,
  fish,
  wing,
};

/** Resolve a creature id → a complete storybook <svg>. Unknown id → safe blob. */
export function creature(id: string, title = ''): string {
  const cfg = (CONFIG as Record<string, CreatureConfig>)[id];
  if (!cfg) {
    // Safe fallback: a friendly painted blob (never blank, never throws).
    const defs = paintedFill(FILL_ID, palette.primary) + softShadow(SHADOW_ID);
    return svgDoc(
      withDefs(
        defs,
        `<g filter="url(#${SHADOW_ID})"><circle cx="50" cy="52" r="30" fill="url(#${FILL_ID})" ${inkStroke()}/>${eyes(50, 48)}</g>`,
      ),
      title,
    );
  }
  const defs = paintedFill(FILL_ID, cfg.body) + softShadow(SHADOW_ID);
  const body = TEMPLATES[cfg.template](cfg);
  return svgDoc(withDefs(defs, `<g filter="url(#${SHADOW_ID})">${body}</g>`), title);
}

/** Map a counting-fun emoji to a creature id (DRY for the scene). Unknown → 'duck'. */
const EMOJI_TO_ID: Record<string, CreatureId> = {
  '🦆': 'duck',
  '🐰': 'rabbit',
  '🐸': 'frog',
  '🐝': 'bee',
  '🐟': 'fish',
  '🦋': 'butterfly',
};

export function emojiToCreatureId(emoji: string): CreatureId {
  return EMOJI_TO_ID[emoji] ?? 'duck';
}
