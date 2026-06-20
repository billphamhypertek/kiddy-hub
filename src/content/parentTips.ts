import type { SkillId } from '../data/types';

/**
 * Một hoạt động OFFLINE tiếng Việt cho mỗi skill — nối việc học ra đời thực
 * (bridge-to-real-world). Mỗi skill đúng MỘT tip, hành-động-được, dịu, hướng
 * cha-mẹ-cùng-chơi. EXHAUSTIVE over the SkillId union (a test enforces this).
 *
 * Tip là *hoạt động cho skill*, không phụ thuộc trạng thái — UI bọc bằng câu
 * dẫn khác nhau cho "đã thạo" vs "nên luyện" (DRY: một nguồn nội dung).
 */
export const OFFLINE_TIP_BY_SKILL: Record<SkillId, string> = {
  // --- per-item SR (mục rời rạc) ---
  'number-vi': 'Cùng đếm 3 món đồ thật quanh nhà — thìa, dép, hay quả cam nhé!',
  'number-en': 'Vừa xếp đồ vừa đếm “one, two, three” cùng bé thử xem!',
  'letter-vi': 'Đi tìm chữ cái trên hộp sữa, bìa sách quanh nhà với bé nào.',
  'letter-en': 'Chỉ vào chữ trên đồ chơi và đọc tên chữ tiếng Anh cùng bé nhé.',
  'word-en': 'Gọi tên vài đồ vật bằng tiếng Anh khi chơi cùng bé: cat, dog, ball…',
  'color-en': 'Hỏi bé “what color?” khi mặc áo, ăn trái cây — vui mà nhớ lâu!',
  'color-vi': 'Đi “săn” đồ vật cùng màu quanh nhà: tìm hết đồ màu đỏ xem nào!',
  shape: 'Cùng tìm hình tròn, hình vuông trên đồ vật thật trong bếp nhé.',
  // --- skill-level only ---
  pattern: 'Xếp xen kẽ hai loại đồ (thìa–nĩa–thìa–nĩa) và hỏi bé tiếp theo là gì.',
  compare: 'Bày hai nhóm đồ và hỏi bé bên nào nhiều hơn — đếm để kiểm tra nhé.',
  classify: 'Cùng bé phân loại đồ chơi theo nhóm: thú, xe, khối… vừa dọn vừa học!',
  memory: 'Chơi “úp cốc giấu đồ” cùng bé — rèn trí nhớ mà cười suốt buổi.',
  assemble: 'Cho bé ghép lại hộp đồ chơi hoặc xếp khối thành ngôi nhà nhỏ nhé.',
  observe: 'Chơi “tìm điểm khác” với hai bức tranh hoặc hai góc phòng nha.',
  quantity: 'Đặt số que tính đúng bằng số ngón tay bé giơ lên — vui lắm đó!',
};

/** Gợi ý đời thực cho một skill (câu dịu chung nếu skill lạ). */
export function offlineTip(skillId: SkillId): string {
  return OFFLINE_TIP_BY_SKILL[skillId] ?? 'Cùng chơi và học với bé ngoài đời nhé!';
}

/**
 * skill → một gameId luyện kỹ năng đó, cho nút "Luyện tiếp" deep-link.
 * Hard-code (suy ra từ SKILLS_FOR_GAME, đã đảo) để tránh nhập nhằng khi hai
 * game cùng một skill (vd letter-spotting + first-letter cùng 'letter-vi').
 * Skill-level-only KHÔNG có per-item practice → cố tình bỏ trống (UI ẩn nút,
 * vẫn hiện tip đời thực). Một test khẳng định mọi gameId tồn tại trong registry.
 */
export const PRACTICE_GAME_BY_SKILL: Partial<Record<SkillId, string>> = {
  'number-vi': 'counting-fun',
  'letter-vi': 'letter-spotting',
  'letter-en': 'abc-english',
  'number-en': 'numbers-english',
  'word-en': 'first-words',
  'color-en': 'colors-english',
  shape: 'shapes-colors',
  'color-vi': 'shapes-colors',
};

/** Quyền riêng tư là tính năng — khối tĩnh "huy hiệu tin cậy" cho người mua. */
export const PRIVACY_NOTE = [
  'Hoạt động 100% trên máy này — không gửi dữ liệu đi đâu cả.',
  'Không quảng cáo. Không thu thập dữ liệu. Không tài khoản online.',
  'Mọi tiến bộ của bé chỉ bạn xem được, ngay trên thiết bị.',
].join('\n');

/**
 * Nhắc dùng lành mạnh — dịu, hướng cha mẹ, theo AAP. KHÔNG đo screen-time,
 * KHÔNG đếm phiên, KHÔNG cảnh báo, KHÔNG guilt: chỉ một lời mời ra ngoài chơi.
 */
export const HEALTHY_USE_NOTE = [
  'KiddyHub là bạn học bổ trợ — không phải để giữ bé.',
  'Khoảng 15–20 phút mỗi lần, rồi cùng bé ra ngoài chơi',
  'và thực hành những điều vừa học nhé!',
].join('\n');
