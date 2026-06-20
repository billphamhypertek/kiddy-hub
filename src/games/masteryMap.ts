import type { SkillId } from '../data/types';

/**
 * Static lookup: discrete-item gameId → the SkillId(s) it records per-item
 * spaced-repetition mastery for (§8.3). Games NOT listed here are skill-level
 * only (or non-SR) and simply never call host.pickItem/recordItemResult.
 *
 * shapes-colors is a two-axis game: it records BOTH 'shape' and 'color-vi'
 * depending on the round mode (§4.2).
 */
export const SKILLS_FOR_GAME: Record<string, SkillId[]> = {
  'counting-fun': ['number-vi'],
  'letter-spotting': ['letter-vi'],
  'first-letter': ['letter-vi'],
  'abc-english': ['letter-en'],
  'numbers-english': ['number-en'],
  'first-words': ['word-en'],
  'colors-english': ['color-en'],
  'shapes-colors': ['shape', 'color-vi'],
};

/**
 * The manifest key for the teaching hint spoken when scaffolding kicks in,
 * grouped by skill family (§9.3). Reused across the matching skills so we keep
 * the clip set small.
 */
const HINT_KEY_BY_SKILL: Record<SkillId, string> = {
  'letter-vi': 'hint.letter',
  'letter-en': 'hint.letter',
  'number-vi': 'hint.number',
  'number-en': 'hint.number',
  'word-en': 'hint.word',
  'color-en': 'hint.colorshape',
  'color-vi': 'hint.colorshape',
  shape: 'hint.colorshape',
  // skill-level-only families have no per-item hint; fall back to the warm line.
  pattern: 'hint.tryagain.warm',
  compare: 'hint.tryagain.warm',
  classify: 'hint.tryagain.warm',
  memory: 'hint.tryagain.warm',
  assemble: 'hint.tryagain.warm',
  observe: 'hint.tryagain.warm',
  quantity: 'hint.tryagain.warm',
};

/** Manifest clip key spoken when scaffolding announces "fewer choices". */
export const HINT_FEWER_KEY = 'hint.fewer';

/** The teaching-hint manifest key for a skill (warm fallback if unknown). */
export function hintKeyForSkill(skillId: SkillId): string {
  return HINT_KEY_BY_SKILL[skillId] ?? 'hint.tryagain.warm';
}
