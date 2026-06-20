import { db } from './db';
import { applyResult, freshRow, MASTERED_BOX, type MasteryRow } from './leitner';
import type { ItemMastery, SkillId } from './types';

export type MasteryBucket = 'mastered' | 'emerging' | 'practice-next';

export interface SkillMastery {
  skillId: SkillId;
  total: number; // số mục đã từng gặp trong skill
  mastered: string[]; // itemKey box ≥ MASTERED_BOX (đang thạo)
  emerging: string[]; // đã gặp, 1 ≤ box < MASTERED_BOX
  practiceNext: string[]; // box 0 (hay sai) — ưu tiên luyện
  accuracy: number; // Σcorrect/Σseen (0..1) toàn skill
}

/** THUẦN: phân loại một hàng mastery thành bucket cho Phần C. */
export function bucketOf(row: Pick<MasteryRow, 'box'>): MasteryBucket {
  if (row.box >= MASTERED_BOX) return 'mastered';
  if (row.box === 0) return 'practice-next';
  return 'emerging';
}

/** Đọc một hàng mục cụ thể (theo [profileId+skillId+itemKey]). */
export function getMasteryRow(
  profileId: number,
  skillId: SkillId,
  itemKey: string,
): Promise<ItemMastery | undefined> {
  return db.itemMastery.where({ profileId, skillId, itemKey }).first();
}

/** Đọc toàn bộ hàng mastery của một skill (load khi vào trò / Phần C). */
export function getMasteryRows(profileId: number, skillId: SkillId): Promise<ItemMastery[]> {
  return db.itemMastery.where({ profileId, skillId }).toArray();
}

/**
 * Nạp một lần các hàng mastery của (các) skill trò dùng thành Map có khoá
 * `${skillId}|${itemKey}` — đúng dạng MasterySession cache cần (§8.2/§8.3).
 * GameContainer await cái này TRƯỚC khi boot scene, rồi tiêm vào session.
 */
export async function loadMasteryMap(
  profileId: number,
  skillIds: SkillId[],
): Promise<Map<string, MasteryRow>> {
  const map = new Map<string, MasteryRow>();
  for (const skillId of skillIds) {
    const rows = await getMasteryRows(profileId, skillId);
    for (const r of rows) {
      map.set(`${skillId}|${r.itemKey}`, {
        itemKey: r.itemKey,
        box: r.box,
        dueAt: r.dueAt,
        seenCount: r.seenCount,
        correctCount: r.correctCount,
        lastResult: r.lastResult,
        lastSeenAt: r.lastSeenAt,
        masteredAt: r.masteredAt,
      });
    }
  }
  return map;
}

/**
 * Upsert thẳng một MasteryRow đã tính sẵn (dùng cho MasterySession flush).
 * Tạo hàng lần đầu / cập nhật theo [profileId+skillId+itemKey].
 */
export async function upsertMastery(
  profileId: number,
  skillId: SkillId,
  row: MasteryRow,
): Promise<void> {
  const existing = await getMasteryRow(profileId, skillId, row.itemKey);
  const next: ItemMastery = {
    profileId,
    skillId,
    itemKey: row.itemKey,
    seenCount: row.seenCount,
    correctCount: row.correctCount,
    box: row.box,
    dueAt: row.dueAt,
    lastResult: row.lastResult,
    lastSeenAt: row.lastSeenAt,
    masteredAt: row.masteredAt,
  };
  if (existing) {
    await db.itemMastery.update(existing.id!, next);
  } else {
    await db.itemMastery.add(next);
  }
}

/**
 * Ghi một kết quả round vào mastery: đọc hàng (hoặc fresh) → applyResult thuần
 * → upsert. Trả MasteryRow mới (đã áp). now tiêm được để test.
 */
export async function recordItemResult(
  profileId: number,
  skillId: SkillId,
  itemKey: string,
  correct: boolean,
  now: number = Date.now(),
): Promise<MasteryRow> {
  const existing = await getMasteryRow(profileId, skillId, itemKey);
  const base: MasteryRow = existing
    ? {
        itemKey: existing.itemKey,
        box: existing.box,
        dueAt: existing.dueAt,
        seenCount: existing.seenCount,
        correctCount: existing.correctCount,
        lastResult: existing.lastResult,
        lastSeenAt: existing.lastSeenAt,
        masteredAt: existing.masteredAt,
      }
    : freshRow(itemKey, now);
  const next = applyResult(base, correct, now);
  await upsertMastery(profileId, skillId, next);
  return next;
}

/** Mục đến hạn (cho Phần D — "phiêu lưu hôm nay"), sắp theo dueAt tăng dần. */
export async function getDueItems(
  profileId: number,
  now: number,
  limit?: number,
): Promise<ItemMastery[]> {
  const rows = await db.itemMastery
    .where('[profileId+dueAt]')
    .between([profileId, -Infinity], [profileId, now], true, true)
    .toArray();
  rows.sort((a, b) => a.dueAt - b.dueAt);
  return limit === undefined ? rows : rows.slice(0, limit);
}

/** Tổng hợp mọi skill cho Phần C (read-only). */
export async function getMasterySummary(profileId: number): Promise<SkillMastery[]> {
  const rows = await db.itemMastery.where('profileId').equals(profileId).toArray();
  const bySkill = new Map<SkillId, ItemMastery[]>();
  for (const r of rows) {
    const list = bySkill.get(r.skillId) ?? [];
    list.push(r);
    bySkill.set(r.skillId, list);
  }
  const out: SkillMastery[] = [];
  for (const [skillId, list] of bySkill) {
    const mastered: string[] = [];
    const emerging: string[] = [];
    const practiceNext: string[] = [];
    let seen = 0;
    let correct = 0;
    for (const r of list) {
      seen += r.seenCount;
      correct += r.correctCount;
      const b = bucketOf(r);
      if (b === 'mastered') mastered.push(r.itemKey);
      else if (b === 'practice-next') practiceNext.push(r.itemKey);
      else emerging.push(r.itemKey);
    }
    out.push({
      skillId,
      total: list.length,
      mastered,
      emerging,
      practiceNext,
      accuracy: seen > 0 ? correct / seen : 0,
    });
  }
  return out;
}
