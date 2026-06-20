/**
 * KiddyHub — real-world bridge content (GĐ5 D2 §8). At the end of a round we
 * sometimes invite the child to try what they learned OFF the screen — a gentle,
 * skippable nudge that pushes them AWAY from the device (anti-engagement by
 * design, per the ethics contract). Sparse (~1/3 of rounds, decision #3) so it
 * never becomes a mandatory ritual.
 *
 * All functions are PURE (inject rng) → fully unit-tested. The voice lines live
 * in audioManifest.ts (`fox.bridge.*`); the texts here are CHILD-facing (short,
 * one happy instruction) — a distinct voice from the parent-facing parentTips.
 */
import { SKILLS_FOR_GAME } from '../games/masteryMap';
import type { SkillId } from '../data/types';

export interface BridgeLine {
  /** Child-facing, short, one happy instruction (vi-VN). */
  text: string;
  /** Manifest voice key Cáo speaks (`fox.bridge.*`). */
  voiceKey: string;
}

const COUNT: BridgeLine = {
  text: 'Bé thử đếm ba món đồ thật quanh nhà nhé!',
  voiceKey: 'fox.bridge.count',
};
const LETTER: BridgeLine = {
  text: 'Bé thử tìm một chữ cái trên hộp sữa xem nào!',
  voiceKey: 'fox.bridge.letter',
};
const COLOR: BridgeLine = {
  text: 'Bé thử tìm một món đồ cùng màu trong phòng nhé!',
  voiceKey: 'fox.bridge.color',
};
const GENERIC: BridgeLine = {
  text: 'Bé thử chơi điều vừa học ngoài đời với bố mẹ nha!',
  voiceKey: 'fox.bridge.generic',
};

/** Skill → child-facing bridge line. Exhaustive over SkillId. */
const BRIDGE_BY_SKILL: Record<SkillId, BridgeLine> = {
  'number-vi': COUNT,
  'number-en': COUNT,
  'letter-vi': LETTER,
  'letter-en': LETTER,
  'color-vi': COLOR,
  'color-en': COLOR,
  shape: COLOR,
  'word-en': GENERIC,
  pattern: GENERIC,
  compare: GENERIC,
  classify: GENERIC,
  memory: GENERIC,
  assemble: GENERIC,
  observe: GENERIC,
  quantity: GENERIC,
};

/** PURE: the child-facing bridge line for a skill (generic fallback). */
export function childBridgeLine(skillId: SkillId): BridgeLine {
  return BRIDGE_BY_SKILL[skillId] ?? GENERIC;
}

/** Resolve a game's primary skill, then its bridge line. Generic if unknown. */
export function bridgeForGame(gameId: string): BridgeLine {
  const primary = SKILLS_FOR_GAME[gameId]?.[0];
  return primary ? childBridgeLine(primary) : GENERIC;
}

/** Fraction of rounds that show the bridge — sparse, not every round. */
export const BRIDGE_CHANCE = 1 / 3;

/**
 * PURE: decide whether to show the bridge this round. Deterministic for a given
 * rng draw; ~1/3 over many rounds. Show when the draw lands in [0, BRIDGE_CHANCE).
 */
export function shouldShowBridge(rng: () => number): boolean {
  return rng() < BRIDGE_CHANCE;
}
