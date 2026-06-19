import { describe, it, expect } from 'vitest';
import { getWeekKey } from './week';

describe('getWeekKey', () => {
  it('formats as YYYY-Www', () => {
    expect(getWeekKey(new Date(2026, 5, 19))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('returns ISO week 1 for 2026-01-01 (a Thursday)', () => {
    expect(getWeekKey(new Date(2026, 0, 1))).toBe('2026-W01');
  });

  it('returns 2026-W25 for 2026-06-19', () => {
    expect(getWeekKey(new Date(2026, 5, 19))).toBe('2026-W25');
  });

  it('rolls a late-December date into next ISO year', () => {
    // 2025-12-29 is a Monday whose Thursday is 2026-01-01 -> ISO week 1 of 2026
    expect(getWeekKey(new Date(2025, 11, 29))).toBe('2026-W01');
  });
});
