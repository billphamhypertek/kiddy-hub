/**
 * KiddyHub — per-child sticker-book collection (GĐ5 D2 §6).
 *
 * Stickers unlock from REAL mastery milestones (box ≥ MASTERED_BOX, via B's
 * getMasterySummary) — NOT from stars. The set is FIXED & FINITE (12 stickers)
 * so the book is completable: there is a ceiling, no infinite grind, no
 * variable-reward (every rule is deterministic). Decision #4: ceiling ≈ 12.
 *
 * `unlockedStickers` is PURE (inject `summary`) → fully unit-tested. The repo
 * (`getCollection` / `syncCollection`) reads B's summary, computes the unlocked
 * set, and upserts only the NEW ones (recording `unlockedAt` so the UI can flag
 * a gentle "Mới!"). Called when the sticker-book opens / after a round — never
 * inside the round lifecycle.
 */
import { db } from './db';
import type { SkillMastery } from './mastery';
import type { CollectionSticker, SkillId } from './types';

export type StickerRule =
  | { kind: 'totalMastered'; atLeast: number } // total mastered items across every skill
  | { kind: 'skillMastered'; skillId: SkillId; atLeast: number } // N mastered in one skill
  | { kind: 'skillsTouched'; atLeast: number }; // distinct skills with any progress

export interface StickerMilestone {
  id: string;
  label: string; // Vietnamese, dễ thương
  art: string; // SVG key reused from garden/star/fox art
  rule: StickerRule;
}

/**
 * The fixed sticker set (12). Mix of: the very first mastery, cumulative totals
 * (5/10/15), per-skill depth (numbers/letters/colours/shapes/English), and a
 * couple of breadth ("explorer") stickers. Tuned so a child playing regularly
 * collects them over a few weeks, then the book is DONE.
 */
export const STICKER_MILESTONES: StickerMilestone[] = [
  { id: 'first-mastery', label: 'Ngôi sao đầu tiên', art: 'flower', rule: { kind: 'totalMastered', atLeast: 1 } },
  { id: 'mastered-5', label: 'Năm điều đã thạo', art: 'bush', rule: { kind: 'totalMastered', atLeast: 5 } },
  { id: 'mastered-10', label: 'Mười điều đã thạo', art: 'tree', rule: { kind: 'totalMastered', atLeast: 10 } },
  { id: 'mastered-15', label: 'Mười lăm điều đã thạo', art: 'butterflies', rule: { kind: 'totalMastered', atLeast: 15 } },
  { id: 'numbers-5', label: 'Bạn của những con số', art: 'star', rule: { kind: 'skillMastered', skillId: 'number-vi', atLeast: 5 } },
  { id: 'numbers-all', label: 'Đếm giỏi tới mười', art: 'pond', rule: { kind: 'skillMastered', skillId: 'number-vi', atLeast: 10 } },
  { id: 'letters-5', label: 'Bạn của chữ cái', art: 'rabbit', rule: { kind: 'skillMastered', skillId: 'letter-vi', atLeast: 5 } },
  { id: 'letters-10', label: 'Mười chữ cái thân quen', art: 'tree', rule: { kind: 'skillMastered', skillId: 'letter-vi', atLeast: 10 } },
  { id: 'colors-touch', label: 'Cầu vồng sắc màu', art: 'flower', rule: { kind: 'skillMastered', skillId: 'color-vi', atLeast: 1 } },
  { id: 'shapes-touch', label: 'Thế giới hình khối', art: 'bush', rule: { kind: 'skillMastered', skillId: 'shape', atLeast: 1 } },
  { id: 'english-5', label: 'Bạn nhỏ tiếng Anh', art: 'star', rule: { kind: 'skillMastered', skillId: 'word-en', atLeast: 5 } },
  { id: 'explorer-3', label: 'Nhà thám hiểm', art: 'butterflies', rule: { kind: 'skillsTouched', atLeast: 3 } },
];

/** Number of mastered items in one skill (box ≥ MASTERED_BOX, from B). */
function masteredIn(summary: SkillMastery[], skillId: SkillId): number {
  return summary.find((s) => s.skillId === skillId)?.mastered.length ?? 0;
}

/** Total mastered items across all skills. */
function totalMastered(summary: SkillMastery[]): number {
  return summary.reduce((sum, s) => sum + s.mastered.length, 0);
}

/** Distinct skills the child has any progress in (mastered OR emerging). */
function skillsTouched(summary: SkillMastery[]): number {
  return summary.filter((s) => s.mastered.length + s.emerging.length > 0).length;
}

function ruleMet(rule: StickerRule, summary: SkillMastery[]): boolean {
  switch (rule.kind) {
    case 'totalMastered':
      return totalMastered(summary) >= rule.atLeast;
    case 'skillMastered':
      return masteredIn(summary, rule.skillId) >= rule.atLeast;
    case 'skillsTouched':
      return skillsTouched(summary) >= rule.atLeast;
  }
}

/**
 * PURE: which sticker ids are unlocked for this mastery summary. Returns ids in
 * STICKER_MILESTONES order; only ever ids from the fixed set (finite/bounded).
 */
export function unlockedStickers(summary: SkillMastery[]): string[] {
  return STICKER_MILESTONES.filter((s) => ruleMet(s.rule, summary)).map((s) => s.id);
}

/** Read a child's earned stickers (read-only). */
export function getCollection(profileId: number): Promise<CollectionSticker[]> {
  return db.collection.where('profileId').equals(profileId).toArray();
}

/**
 * Compute the unlocked set from B's summary and persist any NEWLY-earned ones
 * (idempotent: already-owned stickers are skipped). Returns the ids earned for
 * the FIRST time this call, so the UI can celebrate just those. `now` injectable.
 */
export async function syncCollection(
  profileId: number,
  summary: SkillMastery[],
  now: number = Date.now(),
): Promise<string[]> {
  const unlocked = unlockedStickers(summary);
  const owned = new Set((await getCollection(profileId)).map((s) => s.stickerId));
  const newly = unlocked.filter((id) => !owned.has(id));
  if (newly.length > 0) {
    await db.collection.bulkAdd(
      newly.map((stickerId) => ({ profileId, stickerId, unlockedAt: now })),
    );
  }
  return newly;
}
