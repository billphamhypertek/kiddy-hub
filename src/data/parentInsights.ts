import { db } from './db';
import { getMasterySummary, type SkillMastery } from './mastery';
import { getWeeklyStars } from './stars';
import { getWeekKey } from './week';
import { getGame } from '../games/registry';
import {
  OFFLINE_TIP_BY_SKILL,
  PRACTICE_GAME_BY_SKILL,
} from '../content/parentTips';
import type { SkillId } from './types';

/**
 * SkillId → tên kỹ năng tiếng Việt đời thường (KHÔNG mã, KHÔNG tiếng Anh kỹ
 * thuật). Bảng tra cứng, thuần, EXHAUSTIVE over the SkillId union (test enforces
 * this). Phần B không sinh tên-người — đó là việc của Phần C.
 */
export const SKILL_LABEL: Record<SkillId, string> = {
  // --- per-item SR (mục rời rạc) ---
  'letter-vi': 'Nhận mặt chữ',
  'letter-en': 'Chữ cái tiếng Anh',
  'number-vi': 'Đếm số',
  'number-en': 'Số tiếng Anh',
  'word-en': 'Từ vựng tiếng Anh',
  'color-en': 'Màu tiếng Anh',
  shape: 'Hình khối',
  'color-vi': 'Màu sắc',
  // --- skill-level only ---
  pattern: 'Tìm quy luật',
  compare: 'So sánh nhiều ít',
  classify: 'Phân loại',
  memory: 'Trí nhớ',
  assemble: 'Ghép hình',
  observe: 'Quan sát tinh',
  quantity: 'Ghép số và lượng',
};

/** Thuần: SkillId → tên tiếng Việt đời thường (fallback = id nếu skill lạ). */
export function skillLabel(skillId: SkillId): string {
  return SKILL_LABEL[skillId] ?? skillId;
}

export type SkillStatus = 'mastered' | 'emerging' | 'practice-next';

export interface ChildSkillView {
  skillId: SkillId;
  label: string; // skillLabel(skillId)
  status: SkillStatus; // trạng thái TỔNG của skill (luật rút gọn §4.4)
  masteredCount: number; // |mastered| (box ≥ MASTERED_BOX)
  emergingCount: number; // |emerging| (1 ≤ box < MASTERED_BOX)
  practiceCount: number; // |practiceNext| (box 0)
  total: number; // số mục đã từng gặp trong skill
  accuracy: number; // 0..1 (tích luỹ, từ SkillMastery của B — KHÔNG nhãn "tuần")
  practiceGameId?: string; // chỉ khi status='practice-next' → trò để luyện
  practiceGameTitle?: string; // getGame(practiceGameId)?.title (nếu đã đăng ký)
  tip: string; // gợi ý đời thực (OFFLINE_TIP_BY_SKILL); '' nếu không gắn
}

/**
 * Luật trạng thái TỔNG của một skill: ưu tiên báo "điều cần làm" trước.
 *   practice-next  nếu có mục box 0 (hay sai)
 *   emerging       nếu đang lên tay, chưa thạo hết
 *   mastered       nếu mọi mục đã gặp đều box ≥ MASTERED_BOX
 */
function overallStatus(s: SkillMastery): SkillStatus {
  if (s.practiceNext.length > 0) return 'practice-next';
  if (s.emerging.length > 0) return 'emerging';
  return 'mastered';
}

const STATUS_ORDER: Record<SkillStatus, number> = {
  'practice-next': 0,
  emerging: 1,
  mastered: 2,
};

/** Thứ tự skill ổn định = thứ tự khai báo SKILL_LABEL. */
const SKILL_ORDER: Record<SkillId, number> = Object.fromEntries(
  (Object.keys(SKILL_LABEL) as SkillId[]).map((s, i) => [s, i]),
) as Record<SkillId, number>;

/** Thuần: map một SkillMastery của B → view tiếng người cho UI (không DB). */
export function toSkillView(s: SkillMastery): ChildSkillView {
  const status = overallStatus(s);
  const practiceGameId =
    status === 'practice-next' ? PRACTICE_GAME_BY_SKILL[s.skillId] : undefined;
  // Tip chỉ gắn cho practice-next (khích lệ) và mastered (khen + đời thực);
  // emerging giữ gọn để không ngợp (§5.3).
  const tip =
    status === 'practice-next' || status === 'mastered'
      ? OFFLINE_TIP_BY_SKILL[s.skillId]
      : '';
  return {
    skillId: s.skillId,
    label: skillLabel(s.skillId),
    status,
    masteredCount: s.mastered.length,
    emergingCount: s.emerging.length,
    practiceCount: s.practiceNext.length,
    total: s.total,
    accuracy: s.accuracy,
    practiceGameId,
    practiceGameTitle: practiceGameId ? getGame(practiceGameId)?.title : undefined,
    tip,
  };
}

/**
 * Đọc-only: gói getMasterySummary(B) thành view tiếng người cho dashboard mỗi
 * bé. Bỏ qua skill chưa có dữ liệu (total === 0). Sắp xếp practice-next trước,
 * rồi emerging, rồi mastered; trong cùng nhóm theo thứ tự khai báo SKILL_LABEL.
 */
export async function getChildMastery(profileId: number): Promise<ChildSkillView[]> {
  const summary = await getMasterySummary(profileId);
  return summary
    .filter((s) => s.total > 0)
    .map(toSkillView)
    .sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;
      return SKILL_ORDER[a.skillId] - SKILL_ORDER[b.skillId];
    });
}

export interface WeeklyRecap {
  weekKey: string;
  newlyMastered: { skillId: SkillId; label: string; itemKey: string }[]; // masteredAt ∈ tuần này
  newlyMasteredCount: number; // = newlyMastered.length
  stars: number; // getWeeklyStars(profileId, weekKey)
  topSkill?: { skillId: SkillId; label: string }; // skill có nhiều "mới thạo" nhất tuần
}

/**
 * Đọc-only: thẻ tổng kết tuần — những gì TÍNH ĐƯỢC hôm nay từ dữ liệu B + stars.
 * KHÔNG có "phút đã chơi", KHÔNG "accuracy trend" (schema chỉ có tổng tích luỹ).
 *
 * Quét trong-bộ-nhớ hàng itemMastery của bé (profileId đã index — không thêm
 * index/schema nào) rồi lọc masteredAt ∈ weekKey. Tái dùng getWeeklyStars.
 */
export async function getWeeklyMasteryRecap(
  profileId: number,
  weekKey: string = getWeekKey(new Date()),
): Promise<WeeklyRecap> {
  const rows = await db.itemMastery.where('profileId').equals(profileId).toArray();
  const newlyMastered = rows
    .filter((r) => r.masteredAt != null && getWeekKey(new Date(r.masteredAt)) === weekKey)
    .map((r) => ({ skillId: r.skillId, label: skillLabel(r.skillId), itemKey: r.itemKey }));

  const stars = await getWeeklyStars(profileId, weekKey);

  // topSkill = skill có nhiều "mới thạo" nhất; tie → skill đầu theo SKILL_ORDER.
  let topSkill: { skillId: SkillId; label: string } | undefined;
  if (newlyMastered.length > 0) {
    const counts = new Map<SkillId, number>();
    for (const m of newlyMastered) counts.set(m.skillId, (counts.get(m.skillId) ?? 0) + 1);
    let bestSkill: SkillId | undefined;
    let bestCount = -1;
    for (const [skillId, count] of counts) {
      if (
        count > bestCount ||
        (count === bestCount && bestSkill != null && SKILL_ORDER[skillId] < SKILL_ORDER[bestSkill])
      ) {
        bestSkill = skillId;
        bestCount = count;
      }
    }
    if (bestSkill != null) topSkill = { skillId: bestSkill, label: skillLabel(bestSkill) };
  }

  return {
    weekKey,
    newlyMastered,
    newlyMasteredCount: newlyMastered.length,
    stars,
    topSkill,
  };
}
