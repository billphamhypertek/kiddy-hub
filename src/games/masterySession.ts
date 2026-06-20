import { pickNextItem, type Rng } from '../data/srScheduler';
import { applyResult, freshRow, type MasteryRow } from '../data/leitner';
import type { SkillId } from '../data/types';

/**
 * Số option nên còn khi scaffolding cho mục "hay sai" (box ≤ 1).
 * box ≥ SCAFFOLD_BOX → không giảm (giàn giáo đã rút) ⇒ trả NO_REDUCTION.
 */
export const SCAFFOLD_KEEP = 2;
export const SCAFFOLD_BOX = 2; // box ≥ này thì thôi giảm lựa chọn
/** Sentinel: "không giảm lựa chọn" (giữ nguyên số option đầy đủ). */
export const NO_REDUCTION = Infinity;

function cacheKey(skillId: SkillId, itemKey: string): string {
  return `${skillId}|${itemKey}`;
}

export interface MasterySession {
  /** Chọn itemKey kế tiếp cho round (đồng bộ, từ cache đã nạp). */
  pick(skillId: SkillId, pool: string[]): string;
  /** Ghi kết quả first-try của round: applyResult vào cache + flush (fire-and-forget). */
  record(skillId: SkillId, itemKey: string, correct: boolean): void;
  /** Scaffolding: số option nên còn cho mục (NO_REDUCTION nếu đã lên tay). */
  hintFor(skillId: SkillId, itemKey: string): number;
}

export interface MasterySessionDeps {
  /** Cache nạp sẵn (key = `${skillId}|${itemKey}`). Session mutate trực tiếp. */
  rows: Map<string, MasteryRow>;
  now: () => number;
  rng: Rng;
  /** Fire-and-forget Dexie upsert; không await trong vòng round. */
  persist: (skillId: SkillId, row: MasteryRow) => void;
}

export function createMasterySession(deps: MasterySessionDeps): MasterySession {
  const { rows, now, rng, persist } = deps;
  // lastPicked theo skill (chống lặp tức thì xuyên round trong phiên).
  const lastPicked = new Map<SkillId, string>();

  function rowsForSkill(skillId: SkillId, pool: string[]): Map<string, MasteryRow> {
    const sub = new Map<string, MasteryRow>();
    for (const key of pool) {
      const existing = rows.get(cacheKey(skillId, key));
      if (existing) sub.set(key, existing);
    }
    return sub;
  }

  return {
    pick(skillId, pool) {
      const picked = pickNextItem({
        pool,
        rows: rowsForSkill(skillId, pool),
        now: now(),
        rng,
        lastPicked: lastPicked.get(skillId),
      });
      if (picked) lastPicked.set(skillId, picked);
      return picked;
    },

    record(skillId, itemKey, correct) {
      const t = now();
      const key = cacheKey(skillId, itemKey);
      const base = rows.get(key) ?? freshRow(itemKey, t);
      const next = applyResult(base, correct, t);
      rows.set(key, next); // cập nhật cache trong-bộ-nhớ
      persist(skillId, next); // flush async ngầm (không await)
    },

    hintFor(skillId, itemKey) {
      const row = rows.get(cacheKey(skillId, itemKey));
      // Chưa gặp hoặc box thấp (hay sai) → giảm xuống SCAFFOLD_KEEP.
      if (!row || row.box < SCAFFOLD_BOX) return SCAFFOLD_KEEP;
      // box ≥ SCAFFOLD_BOX (đang lên tay) → rút giàn giáo, không giảm.
      return NO_REDUCTION;
    },
  };
}
