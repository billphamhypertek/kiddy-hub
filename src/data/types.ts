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
