import { describe, it, expect } from 'vitest';
import { childBridgeLine, shouldShowBridge, bridgeForGame } from './realWorldBridge';
import type { SkillId } from '../data/types';

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

const VALID_VOICE_KEYS = new Set([
  'fox.bridge.count',
  'fox.bridge.letter',
  'fox.bridge.color',
  'fox.bridge.generic',
]);

describe('childBridgeLine (pure, exhaustive)', () => {
  it('returns a non-empty child-facing line + valid voiceKey for every skill', () => {
    for (const skill of ALL_SKILLS) {
      const { text, voiceKey } = childBridgeLine(skill);
      expect(text.trim().length).toBeGreaterThan(0);
      expect(VALID_VOICE_KEYS.has(voiceKey)).toBe(true);
    }
  });

  it('maps number skills to the counting bridge', () => {
    expect(childBridgeLine('number-vi').voiceKey).toBe('fox.bridge.count');
    expect(childBridgeLine('number-en').voiceKey).toBe('fox.bridge.count');
  });

  it('maps letter skills to the letter bridge', () => {
    expect(childBridgeLine('letter-vi').voiceKey).toBe('fox.bridge.letter');
    expect(childBridgeLine('letter-en').voiceKey).toBe('fox.bridge.letter');
  });

  it('maps colour/shape skills to the colour bridge', () => {
    expect(childBridgeLine('color-vi').voiceKey).toBe('fox.bridge.color');
    expect(childBridgeLine('color-en').voiceKey).toBe('fox.bridge.color');
    expect(childBridgeLine('shape').voiceKey).toBe('fox.bridge.color');
  });

  it('falls back to the generic bridge for skill-level games', () => {
    expect(childBridgeLine('pattern').voiceKey).toBe('fox.bridge.generic');
    expect(childBridgeLine('memory').voiceKey).toBe('fox.bridge.generic');
  });
});

describe('bridgeForGame (resolves the primary skill of a game)', () => {
  it('uses the first skill mapped to a known game', () => {
    expect(bridgeForGame('counting-fun').voiceKey).toBe('fox.bridge.count');
    expect(bridgeForGame('letter-spotting').voiceKey).toBe('fox.bridge.letter');
    expect(bridgeForGame('shapes-colors').voiceKey).toBe('fox.bridge.color');
  });

  it('falls back to the generic bridge for an unknown / non-SR game', () => {
    expect(bridgeForGame('memory-match').voiceKey).toBe('fox.bridge.generic');
    expect(bridgeForGame('totally-unknown-game').voiceKey).toBe('fox.bridge.generic');
  });
});

describe('shouldShowBridge (sparse ~1/3, deterministic via rng)', () => {
  it('is deterministic for a given rng value', () => {
    expect(shouldShowBridge(() => 0.1)).toBe(true);
    expect(shouldShowBridge(() => 0.1)).toBe(true);
    expect(shouldShowBridge(() => 0.9)).toBe(false);
  });

  it('shows on roughly a third of rounds (sparse, not every round)', () => {
    let shown = 0;
    const n = 3000;
    // a simple LCG sweeping the unit interval
    let s = 7;
    const rng = (): number => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    for (let i = 0; i < n; i++) if (shouldShowBridge(rng)) shown++;
    const ratio = shown / n;
    expect(ratio).toBeGreaterThan(0.25);
    expect(ratio).toBeLessThan(0.42);
  });

  it('never shows for the whole [1/3, 1) range and always for [0, 1/3)', () => {
    expect(shouldShowBridge(() => 0)).toBe(true);
    expect(shouldShowBridge(() => 0.32)).toBe(true);
    expect(shouldShowBridge(() => 0.34)).toBe(false);
    expect(shouldShowBridge(() => 0.99)).toBe(false);
  });
});
