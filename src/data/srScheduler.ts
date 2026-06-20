import { freshRow, type MasteryRow } from './leitner';

export type Rng = () => number;

export interface PickArgs {
  pool: string[]; // itemKey ứng viên của level/trò hiện tại (đã String hoá)
  rows: Map<string, MasteryRow>; // mastery hiện có theo itemKey (thiếu = chưa gặp)
  now: number;
  rng: Rng; // () => number, tiêm được (test xác định)
  lastPicked?: string; // mục round ngay trước (chống lặp tức thì)
}

/**
 * Tầng ưu tiên (số nhỏ hơn = ưu tiên cao hơn).
 * Thứ tự HIỆU LỰC theo §5.4: đến-hạn&yếu (T2) > đến-hạn (T3) > mới (T1) > lấp đầy (T4)
 * — "mục mới nhỏ giọt": T1 đứng trước T4 nhưng SAU T2/T3 (ôn mục hay sai trước khi nạp mới).
 */
function tierOf(row: MasteryRow, now: number): number {
  if (row.seenCount === 0) return 3; // T1: mới (chưa gặp) — sau T2/T3, trước T4
  if (row.dueAt <= now && row.box <= 1) return 1; // T2: đến hạn & yếu — ưu tiên cao nhất
  if (row.dueAt <= now) return 2; // T3: đến hạn (đã gặp)
  return 4; // T4: chưa đến hạn (lấp đầy)
}

/** So sánh trong cùng tầng: (box tăng, dueAt tăng, lastSeenAt tăng). */
function rank(a: MasteryRow, b: MasteryRow): number {
  if (a.box !== b.box) return a.box - b.box;
  if (a.dueAt !== b.dueAt) return a.dueAt - b.dueAt;
  return a.lastSeenAt - b.lastSeenAt;
}

/** Hai hàng "ngang hạng" theo rank (cùng box/dueAt/lastSeenAt). */
function tied(a: MasteryRow, b: MasteryRow): boolean {
  return a.box === b.box && a.dueAt === b.dueAt && a.lastSeenAt === b.lastSeenAt;
}

function rngPick<T>(arr: T[], rng: Rng): T {
  const i = Math.min(arr.length - 1, Math.max(0, Math.floor(rng() * arr.length)));
  return arr[i];
}

/**
 * Chọn 1 itemKey kế tiếp từ pool, ưu tiên đến-hạn/hay-sai nhưng giữ đa dạng.
 * THUẦN & xác định (tiêm now/rng). Không bao giờ ném.
 */
export function pickNextItem(args: PickArgs): string {
  const { pool, rows, now, rng, lastPicked } = args;

  // Pool rỗng (không nên xảy ra): không có gì để chọn.
  if (pool.length === 0) return '';

  // 1. Chuẩn hoá ứng viên: row có sẵn hoặc freshRow.
  const candidates: MasteryRow[] = pool.map((key) => rows.get(key) ?? freshRow(key, now));

  // 2. Loại lặp tức thì: bỏ lastPicked NẾU còn ≥ 2 ứng viên khác.
  let working = candidates;
  if (lastPicked !== undefined) {
    const others = candidates.filter((r) => r.itemKey !== lastPicked);
    if (others.length >= 2) working = others;
  }

  // 3. Phân tầng — chọn tầng cao nhất (số nhỏ nhất) còn ứng viên.
  let bestTier = Infinity;
  for (const r of working) bestTier = Math.min(bestTier, tierOf(r, now));
  const inTier = working.filter((r) => tierOf(r, now) === bestTier);

  // 4. Sắp theo rank, lấy nhóm "tốt nhất ngang nhau", rng chọn trong nhóm.
  inTier.sort(rank);
  const best = inTier[0];
  const topGroup = inTier.filter((r) => tied(r, best));
  return rngPick(topGroup, rng).itemKey;
}
