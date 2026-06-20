import type { ItemResult } from './types';

/**
 * Leitner box → interval table (ms). Pure data; box index = box number.
 * box 0 & 1 cố tình ngắn để mục vừa sai quay lại NGAY trong phiên.
 */
export const BOX_INTERVALS_MS = [
  0, // box 0: mới / vừa sai → đến hạn NGAY (ưu tiên đưa lại trong phiên)
  20 * 60_000, // box 1: ~20 phút (đưa lại sớm trong/sau phiên ngắn)
  24 * 3_600_000, // box 2: 1 ngày
  3 * 24 * 3_600_000, // box 3: 3 ngày
  7 * 24 * 3_600_000, // box 4: 1 tuần   ← "đã thạo" bắt đầu từ đây
  14 * 24 * 3_600_000, // box 5: 2 tuần
];

export const MAX_BOX = 5;

/**
 * Ngưỡng "đã thạo": box ≥ MASTERED_BOX ⇒ masteredAt được đặt (feeds Phần C & D).
 * Đây là HẰNG SỐ duy nhất điều chỉnh "thạo dễ/khó hơn" — đổi một dòng là đủ.
 */
export const MASTERED_BOX = 4;

/** Hình con của ItemMastery đủ cho scheduler & Leitner thuần (không phụ thuộc Dexie). */
export interface MasteryRow {
  itemKey: string;
  box: number;
  dueAt: number;
  seenCount: number;
  correctCount: number;
  lastResult: ItemResult;
  lastSeenAt: number;
  masteredAt?: number;
}

/** Hàng khởi tạo cho mục chưa từng gặp (đến hạn ngay, box 0). */
export function freshRow(itemKey: string, now: number): MasteryRow {
  return {
    itemKey,
    box: 0,
    dueAt: now,
    seenCount: 0,
    correctCount: 0,
    lastResult: 'wrong',
    lastSeenAt: 0,
  };
}

/**
 * Thuần: áp một kết quả → hàng mới (KHÔNG ghi DB ở đây).
 * Đúng: box +1 (cap MAX_BOX). Sai: rớt về 0. dueAt theo bảng box mới.
 * masteredAt đặt MỘT LẦN khi lần đầu chạm box ≥ MASTERED_BOX; không xoá khi lùi hộp.
 */
export function applyResult(row: MasteryRow, correct: boolean, now: number): MasteryRow {
  const box = correct ? Math.min(MAX_BOX, row.box + 1) : 0;
  const dueAt = now + BOX_INTERVALS_MS[box];
  const masteredAt = row.masteredAt ?? (box >= MASTERED_BOX ? now : undefined);
  return {
    ...row,
    box,
    dueAt,
    seenCount: row.seenCount + 1,
    correctCount: row.correctCount + (correct ? 1 : 0),
    lastResult: correct ? 'correct' : 'wrong',
    lastSeenAt: now,
    masteredAt,
  };
}
