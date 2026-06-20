import { describe, it, expect } from 'vitest';
import { SKILLS_FOR_GAME, hintKeyForSkill, HINT_FEWER_KEY } from './masteryMap';
import { AUDIO_MANIFEST } from '../audio/audioManifest';
import type { SkillId } from '../data/types';

const DISCRETE_GAMES = [
  'counting-fun',
  'letter-spotting',
  'first-letter',
  'abc-english',
  'numbers-english',
  'first-words',
  'colors-english',
  'shapes-colors',
];

describe('SKILLS_FOR_GAME', () => {
  it('maps every discrete-item game to at least one skill', () => {
    for (const gameId of DISCRETE_GAMES) {
      expect(SKILLS_FOR_GAME[gameId]?.length, gameId).toBeGreaterThan(0);
    }
  });

  it('records BOTH shape and color-vi for shapes-colors', () => {
    expect(SKILLS_FOR_GAME['shapes-colors']).toEqual(['shape', 'color-vi']);
  });

  it('two letter-vi games share the same skill (cross-context mastery)', () => {
    expect(SKILLS_FOR_GAME['letter-spotting']).toEqual(['letter-vi']);
    expect(SKILLS_FOR_GAME['first-letter']).toEqual(['letter-vi']);
  });
});

describe('hintKeyForSkill', () => {
  it('maps each per-item skill family to a manifest hint key', () => {
    const cases: Array<[SkillId, string]> = [
      ['letter-vi', 'hint.letter'],
      ['letter-en', 'hint.letter'],
      ['number-vi', 'hint.number'],
      ['number-en', 'hint.number'],
      ['word-en', 'hint.word'],
      ['color-en', 'hint.colorshape'],
      ['color-vi', 'hint.colorshape'],
      ['shape', 'hint.colorshape'],
    ];
    for (const [skill, key] of cases) expect(hintKeyForSkill(skill)).toBe(key);
  });

  it('every hint key it can return exists in the manifest (no missing clip)', () => {
    const skills: SkillId[] = [
      'letter-vi',
      'letter-en',
      'number-vi',
      'number-en',
      'word-en',
      'color-en',
      'color-vi',
      'shape',
    ];
    for (const s of skills) expect(AUDIO_MANIFEST.voices).toHaveProperty(hintKeyForSkill(s));
    expect(AUDIO_MANIFEST.voices).toHaveProperty(HINT_FEWER_KEY);
  });
});
