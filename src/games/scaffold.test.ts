import { describe, it, expect } from 'vitest';
import { distractorsToDim, scaffoldReduces } from './scaffold';
import { NO_REDUCTION, SCAFFOLD_KEEP } from './masterySession';

describe('distractorsToDim', () => {
  it('dims down to 2 visible (correct + 1 distractor) for a 3-option round', () => {
    // correct at index 1; keep 2 → keep {1} plus lowest distractor {0}; dim {2}.
    expect(distractorsToDim(3, 1, SCAFFOLD_KEEP)).toEqual([2]);
  });

  it('dims down to 2 visible for a 5-option round (keeps correct + 1)', () => {
    // correct at index 3; keep {3} + lowest distractor {0}; dim {1,2,4}.
    expect(distractorsToDim(5, 3, SCAFFOLD_KEEP)).toEqual([1, 2, 4]);
  });

  it('never dims the correct option', () => {
    for (let correct = 0; correct < 4; correct++) {
      const dim = distractorsToDim(4, correct, SCAFFOLD_KEEP);
      expect(dim).not.toContain(correct);
    }
  });

  it('leaves a 2-option round untouched (already minimal)', () => {
    expect(distractorsToDim(2, 0, SCAFFOLD_KEEP)).toEqual([]);
  });

  it('dims nothing when scaffold has faded (NO_REDUCTION)', () => {
    expect(distractorsToDim(5, 0, NO_REDUCTION)).toEqual([]);
  });

  it('never collapses below 2 visible even if keepN < 2', () => {
    // keepN = 1 is clamped up to 2.
    expect(distractorsToDim(4, 0, 1)).toEqual([2, 3]);
  });

  it('is a no-op for an invalid correctIndex', () => {
    expect(distractorsToDim(3, -1, SCAFFOLD_KEEP)).toEqual([]);
    expect(distractorsToDim(3, 5, SCAFFOLD_KEEP)).toEqual([]);
  });
});

describe('scaffoldReduces', () => {
  it('is true for a weak item on a >2 option round', () => {
    expect(scaffoldReduces(SCAFFOLD_KEEP, 3)).toBe(true);
  });
  it('is false once faded', () => {
    expect(scaffoldReduces(NO_REDUCTION, 3)).toBe(false);
  });
  it('is false when already at the minimum 2 options', () => {
    expect(scaffoldReduces(SCAFFOLD_KEEP, 2)).toBe(false);
  });
});
