import { describe, it, expect, beforeAll } from 'vitest';
import {
  OFFLINE_TIP_BY_SKILL,
  PRACTICE_GAME_BY_SKILL,
  PRIVACY_NOTE,
  HEALTHY_USE_NOTE,
  offlineTip,
} from './parentTips';
import { registerAllGames } from '../games';
import { getGame, _clearRegistry } from '../games/registry';
import type { SkillId } from '../data/types';

/** The full, canonical SkillId union (kept in sync with src/data/types.ts). */
const ALL_SKILLS: SkillId[] = [
  'letter-vi',
  'letter-en',
  'number-vi',
  'number-en',
  'word-en',
  'color-en',
  'shape',
  'color-vi',
  'pattern',
  'compare',
  'classify',
  'memory',
  'assemble',
  'observe',
  'quantity',
];

describe('OFFLINE_TIP_BY_SKILL', () => {
  it('is exhaustive over the SkillId union — every skill has a non-empty tip', () => {
    for (const skill of ALL_SKILLS) {
      const tip = OFFLINE_TIP_BY_SKILL[skill];
      expect(tip, skill).toBeDefined();
      expect(tip.trim().length, skill).toBeGreaterThan(0);
    }
    // No EXTRA keys beyond the union (catches stale entries after a skill rename).
    expect(Object.keys(OFFLINE_TIP_BY_SKILL).sort()).toEqual([...ALL_SKILLS].sort());
  });

  it('gives concrete, reasonably-sized Vietnamese activity tips (not stubs)', () => {
    for (const skill of ALL_SKILLS) {
      const tip = OFFLINE_TIP_BY_SKILL[skill];
      // long enough to be a real sentence, short enough to fit a card line
      expect(tip.length, skill).toBeGreaterThan(15);
      expect(tip.length, skill).toBeLessThan(120);
    }
  });
});

describe('offlineTip()', () => {
  it('returns the mapped tip for a known skill', () => {
    expect(offlineTip('shape')).toBe(OFFLINE_TIP_BY_SKILL['shape']);
  });

  it('falls back to a gentle generic line for an unknown skill', () => {
    // @ts-expect-error — exercising the runtime fallback with an off-union value
    expect(offlineTip('not-a-skill').length).toBeGreaterThan(0);
  });
});

describe('PRACTICE_GAME_BY_SKILL', () => {
  beforeAll(() => {
    _clearRegistry();
    registerAllGames();
  });

  it('points every mapped skill at a gameId that exists in the registry', () => {
    for (const [skill, gameId] of Object.entries(PRACTICE_GAME_BY_SKILL)) {
      expect(gameId, skill).toBeTruthy();
      expect(getGame(gameId!), `${skill} → ${gameId}`).toBeDefined();
    }
  });

  it('covers every per-item SR skill (the ones with a practice game)', () => {
    // skill-level-only skills intentionally have NO per-item practice game.
    const perItemSkills: SkillId[] = [
      'letter-vi',
      'letter-en',
      'number-vi',
      'number-en',
      'word-en',
      'color-en',
      'shape',
      'color-vi',
    ];
    for (const skill of perItemSkills) {
      expect(PRACTICE_GAME_BY_SKILL[skill], skill).toBeTruthy();
    }
  });

  it('does NOT invent practice games for skill-level-only skills', () => {
    const skillLevelOnly: SkillId[] = [
      'pattern',
      'compare',
      'classify',
      'memory',
      'assemble',
      'observe',
      'quantity',
    ];
    for (const skill of skillLevelOnly) {
      expect(PRACTICE_GAME_BY_SKILL[skill], skill).toBeUndefined();
    }
  });
});

describe('static notes', () => {
  it('PRIVACY_NOTE keeps its core trust claims (anti-deletion guard)', () => {
    const lower = PRIVACY_NOTE.toLowerCase();
    expect(lower).toContain('không quảng cáo');
    expect(lower).toContain('không thu thập');
    expect(lower).toContain('trên máy');
  });

  it('HEALTHY_USE_NOTE invites going outside and never tracks screen-time', () => {
    expect(HEALTHY_USE_NOTE).toContain('ra ngoài');
    // no-guilt / no-vanity: it must not talk about minutes "đã chơi"
    expect(HEALTHY_USE_NOTE).not.toContain('phút đã chơi');
  });
});
