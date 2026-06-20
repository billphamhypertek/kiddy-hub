export type CategoryId = 'numbers' | 'letters' | 'logic' | 'memory' | 'shapes' | 'english';

export interface Profile {
  id?: number;
  name: string;
  avatarKey: string;
  birthYear?: number;
  createdAt: number;
}

export interface Progress {
  id?: number;
  profileId: number;
  gameId: string;
  level: number;
  bestScore: number;
  timesPlayed: number;
  lastPlayedAt: number;
}

export interface StarEvent {
  id?: number;
  profileId: number;
  amount: number;
  earnedAt: number;
  weekKey: string;
}

export interface Garden {
  id: 'family';
  totalStars: number;
  grownItems: string[];
}

export interface Settings {
  id: 'app';
  soundOn: boolean;
  voiceOn: boolean;
  language: 'vi' | 'en';
  /**
   * GĐ5E1 — "Chế độ êm": forces reduced motion across the whole app (React +
   * Phaser), ORed on top of the OS `prefers-reduced-motion`. Additive; defaults
   * `false` so behaviour is unchanged unless a parent turns it on.
   */
  calmMode: boolean;
}

export type SkillId =
  // --- per-item SR (mục rời rạc) ---
  | 'letter-vi' // chữ cái tiếng Việt (29, gồm Ă Â Ê Ô Ơ Ư Đ) — letter-spotting, first-letter
  | 'letter-en' // chữ cái tiếng Anh A–Z — abc-english
  | 'number-vi' // số đếm tiếng Việt 1..10 — counting-fun
  | 'number-en' // số tiếng Anh one..ten (1..10) — numbers-english
  | 'word-en' // từ vựng tiếng Anh — first-words
  | 'color-en' // màu tiếng Anh — colors-english
  | 'shape' // hình học — shapes-colors (chế độ shape/both)
  | 'color-vi' // màu tiếng Việt — shapes-colors (chế độ color/both)
  // --- skill-level only (không SR từng-mục; §6) ---
  | 'pattern' // pattern-finder
  | 'compare' // more-less
  | 'classify' // odd-one-out, sorting
  | 'memory' // memory-match
  | 'assemble' // jigsaw
  | 'observe' // spot-difference
  | 'quantity'; // match-quantity

/**
 * One earned sticker in a child's collection (GĐ5 D2 §6). Finite/completable:
 * a row only exists once the child crosses the milestone's mastery rule, and a
 * child can never own more than the fixed STICKER_MILESTONES set. `unlockedAt`
 * lets the UI flag newly-earned stickers with a gentle "Mới!" (no FOMO).
 */
export interface CollectionSticker {
  id?: number;
  profileId: number;
  stickerId: string;
  unlockedAt: number; // ms epoch — when the milestone was first reached
}

export type ItemResult = 'correct' | 'wrong';

export interface ItemMastery {
  id?: number;
  profileId: number;
  skillId: SkillId;
  itemKey: string; // mục học, dạng chuỗi chuẩn hoá. Skill-level dùng '*'.
  seenCount: number; // số lần mục được trình ra (1 round = +1)
  correctCount: number; // số lần đúng-ngay-lần-đầu (first-try correct)
  box: number; // hộp Leitner 0..5 (0 = mới/hay sai, 5 = thạo bền)
  dueAt: number; // ms epoch — mốc nên ôn lại (quá hạn = ưu tiên)
  lastResult: ItemResult;
  lastSeenAt: number; // ms — chống drill liên tiếp + tín hiệu "gần đây" cho C
  masteredAt?: number; // ms — mốc lần đầu đạt ngưỡng "đã thạo" (box ≥ 4); feeds C
}
