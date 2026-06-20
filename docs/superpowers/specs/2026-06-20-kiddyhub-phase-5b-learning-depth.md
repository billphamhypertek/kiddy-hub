# KiddyHub — Giai đoạn 5 · Phần B: Chiều sâu học tập (Phase 5B Design)

> **Trạng thái:** Đặc tả (design SPEC) — chờ duyệt. Triển khai chia **B1 (data model + SR scheduler, thuần + test đầy đủ)** rồi **B2 (tích hợp trò + scaffolding + clip gợi ý)** — xem §11.
> **Bản đồ GĐ5:** [`2026-06-20-kiddyhub-phase-5-roadmap.md`](./2026-06-20-kiddyhub-phase-5-roadmap.md) (§2 Phần B, §3 nguyên tắc, §4 data model, §6 ranh giới) — đây là **hợp đồng** của Phần B.
> **Tiền lệ giọng:** [`2026-06-20-kiddyhub-phase-5a-voice-neural.md`](./2026-06-20-kiddyhub-phase-5a-voice-neural.md) — câu gợi-ý-dạy MỚI ở Phần B phải đi qua **đúng pipeline** Piper (`scripts/build-voice-clips.mjs`) + có clip + test chống-drift bao phủ.
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md) — "Giai đoạn 5 / Phần B".

---

## 1. Mục tiêu Phần B

Biến "gây vui" thành "thật sự dạy". Hai đòn bẩy chính (Four Pillars; Springer 2024; Mrs Wordsmith / Language Gems):

1. **Lặp lại ngắt quãng (spaced repetition)** trên **từng mục học rời rạc** (chữ Việt, chữ Anh, số, từ EN, màu, hình): mục **hay sai** quay lại **sớm**, mục **đã thạo** **thưa dần** — ghi nhớ dài hạn tăng tới ~200% so với học dồn.
2. **Phản hồi gợi-ý-dạy (scaffolding)**: sai → **giảm số lựa chọn** (bớt nhiễu) + **gợi ý có giọng giải thích vì sao** (Cáo dạy), thay cho feedback chỉ-rung-"thử lại". Khi mục lên tay → **rút giàn giáo** (khôi phục số lựa chọn đầy đủ).

Nền dữ liệu: bảng Dexie **`itemMastery`** (bé × mục) — số lần gặp/đúng, hộp Leitner, hạn ôn `dueAt`. **Phần C** đọc-only bảng này để hiện "đã thạo / đang lên / nên luyện tiếp".

**DoD Phần B:** mục đã thạo thưa dần, mục hay sai quay lại sớm; sai lần 1 → giảm lựa chọn + gợi ý giọng; dữ liệu mastery bền qua reload; **scheduler là hàm THUẦN có test**; **không phá** guard `roundResolved`/`finished`, không phá `generateRound` thuần; clip gợi ý mới qua đúng pipeline Piper + test chống-drift.

> **Ngoài phạm vi Phần B:** đổi cơ chế cốt lõi từng trò; áp SR cho trò **không có "mục" rời rạc** (ghép hình, tìm điểm khác, hơn-kém, tìm bạn khác, phân loại, chuỗi, lật hình — chỉ ghi **mastery kỹ năng tổng**, xem §6); UI phụ huynh (đó là Phần C — B chỉ phơi **read API**); onboarding/curation/"phiêu lưu hôm nay" (Phần D dùng `dueAt` của B nhưng tự build).

## 2. Ranh giới — KHÔNG đụng tới gì (theo roadmap §6)

- **Logic & guard trò chơi:** `*Logic.ts` (`generateRound`, `optionCountForLevel`, `starsFor`…), `progression.ts`, `applyCompletion.ts`, `registry.ts`, `index.ts`, guard `roundResolved`/`finished`/`answeredThisRound`, drag-snap/hit-area — **không phá**. `generateRound` **giữ thuần & đồng bộ** (nhận `rng`, không async, không I/O). SR **bọc ngoài** nó (chọn `target` rồi truyền vào — xem §5), không sửa thân hàm.
- **`AudioManager` (`src/audio/AudioManager.ts`)** — **giữ nguyên hoàn toàn** (interface + nội tại). Gợi ý giọng phát qua `host.speak(key)` / `host.speakText(text,lang)` **đã có** — không thêm method âm thanh mới vào `AudioManager`.
- **`audioManifest.ts`** — **chỉ thêm** key gợi-ý mới (§9), không sửa 20 key cũ. Clip mới sinh qua `build-voice-clips.mjs` (thêm nguồn vào `enumerateClips()`), commit, test chống-drift bao phủ.
- **`prerecordedEngine.ts` / `voiceClips.ts` / pipeline Piper** — không sửa kiến trúc; chỉ **thêm dòng** vào tập clip.
- **Bảng Dexie cũ** (`profiles`/`progress`/`starEvents`/`garden`/`settings`) — **không đụng schema/dữ liệu**. Chỉ **thêm bảng `itemMastery` + bump version** (additive — §4.3).
- **Hạ tầng test:** giữ alias `phaser → src/test/phaser-stub.ts`; `fake-indexeddb/auto` đã có trong `src/test/setup.ts` → repo `itemMastery` test được y như `progress.test.ts`. SR/scaffolding thuần test trong jsdom. **Không** làm đỏ 223 test hiện có; scene Phaser chỉ kiểm thử thủ công.
- **Triết lý trẻ thơ (no-lose):** scaffolding **giúp đỡ**, không phạt; sai **không** trừ sao, **không** "thua"; gợi ý dịu, Cáo ấm. **Không** drill cùng một mục mỗi lượt (chống chán — §5.4). Local-only tuyệt đối.

## 3. Bức tranh kiến trúc (một hình)

```
                 ┌──────────────────────── B1 (thuần, test đầy đủ) ───────────────────────┐
src/data/        │  itemMastery (Dexie bảng + version bump)                                │
  itemMastery.ts │   ├─ types: ItemMastery, SkillId, MasteryBucket                          │
  mastery.ts     │   ├─ repo (async): getMasteryRows / recordItemResult / getDueItems …    │
  srScheduler.ts │   └─ scheduler (THUẦN, sync): pickNextItem(pool, rows, now, rng) → key   │
                 │  leitner.ts: applyResult(row, correct, now) → row'  (box/dueAt thuần)    │
                 └─────────────────────────────────────────────────────────────────────────┘
                                  ▲ load 1 lần               │ flush async (fire-and-forget)
                                  │ (rows cho skill)         ▼
┌──────────────── B2 (tích hợp, kiểm thử tay) ───────────────────────────────────────────┐
│ GameHost (+ 2 method TUỲ CHỌN): pickItem(skillId, pool) , recordItemResult(...)         │
│   ↑ tiêm qua GameContainer.tsx (đã biết profileId) — MasterySession trong bộ nhớ        │
│ Scene mỗi trò rời rạc (8 trò): nextRound() hỏi host.pickItem → seed target vào          │
│   generateRound(level, rng, seedTarget?)  (chữ ký mở rộng tương thích-ngược)            │
│   choose(): đúng/sai → host.recordItemResult(...) + scaffolding (giảm lựa chọn + gợi ý) │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                  │ read-only
                                  ▼
                 Phần C: getMasterySummary(profileId) → {mastered, emerging, practiceNext}
```

**Bất biến cốt lõi (giải "đồng bộ vs async"):** scene Phaser **đồng bộ**, Dexie **bất đồng bộ**. Giải pháp: **`MasterySession`** — `GameContainer` đọc các hàng mastery của skill **một lần** (await **trước** khi boot scene) và đưa vào host dưới dạng cache trong-bộ-nhớ; scene gọi `host.pickItem(...)` / `host.recordItemResult(...)` **đồng bộ** (chọn từ cache, cập nhật cache + **flush xuống Dexie fire-and-forget**). Nhờ vậy `generateRound` vẫn thuần/đồng bộ, guard không đổi, và **không thêm await nào vào vòng đời round**.

---

## 4. Data model — bảng `itemMastery`

### 4.1 Kiểu (`src/data/types.ts`, thêm — không sửa kiểu cũ)

```ts
export type SkillId =
  // --- per-item SR (mục rời rạc) ---
  | 'letter-vi'   // chữ cái tiếng Việt (29, gồm Ă Â Ê Ô Ơ Ư Đ) — letter-spotting, first-letter
  | 'letter-en'   // chữ cái tiếng Anh A–Z — abc-english
  | 'number-vi'   // số đếm tiếng Việt 1..10 — counting-fun
  | 'number-en'   // số tiếng Anh one..ten (1..10) — numbers-english
  | 'word-en'     // từ vựng tiếng Anh — first-words
  | 'color-en'    // màu tiếng Anh — colors-english
  | 'shape'       // hình học — shapes-colors (chế độ shape/both)
  | 'color-vi'    // màu tiếng Việt — shapes-colors (chế độ color/both)
  // --- skill-level only (không SR từng-mục; §6) ---
  | 'pattern'     // pattern-finder
  | 'compare'     // more-less
  | 'classify'    // odd-one-out, sorting
  | 'memory'      // memory-match
  | 'assemble'    // jigsaw
  | 'observe'     // spot-difference
  | 'quantity';   // match-quantity

export interface ItemMastery {
  id?: number;
  profileId: number;
  skillId: SkillId;
  itemKey: string;        // mục học, dạng chuỗi chuẩn hoá (§4.2). Skill-level dùng '*'.
  seenCount: number;      // số lần mục được trình ra (1 round = +1)
  correctCount: number;   // số lần đúng-ngay-lần-đầu (first-try correct)
  box: number;            // hộp Leitner 0..5 (0 = mới/hay sai, 5 = thạo bền)
  dueAt: number;          // ms epoch — mốc nên ôn lại (quá hạn = ưu tiên)
  lastResult: 'correct' | 'wrong';
  lastSeenAt: number;     // ms — chống drill liên tiếp (§5.4) + tín hiệu "gần đây" cho C
  masteredAt?: number;    // ms — mốc lần đầu đạt ngưỡng "đã thạo" (box ≥ 4); feeds C
}
```

> **Điều chỉnh so với roadmap §4 (ghi rõ để orchestrator duyệt):**
> - Thêm **`lastSeenAt`** (roadmap không có) — cần cho luật "đừng lặp ngay mục vừa hỏi" (§5.4) và cho C biết "gần đây".
> - `skillId` của §4 viết `'number'` chung; **tách `number-vi` vs `number-en`** vì là hai kỹ năng/giọng khác nhau (Phần C hiện hai dòng khác nhau) — `itemKey` của cả hai là chuỗi `'1'..'10'` nên cần `skillId` để phân biệt. Tương tự thêm **`color-vi`** (shapes-colors dùng tên màu tiếng Việt) tách khỏi `color-en`.
> - `itemKey` **luôn là `string`** (roadmap để `7`/`'circle'` lẫn lộn) — chuẩn hoá `String(item)` để index Dexie đồng nhất (số lưu `'7'`).
> - Thêm **nhóm skill-level-only** (`pattern`/`compare`/…) với `itemKey='*'` để các trò không-rời-rạc vẫn có **một** hàng mastery kỹ năng tổng cho Phần C (xem §6).

### 4.2 Cách hình thành `itemKey` mỗi trò (chuẩn hoá)

| Trò | `skillId` | `itemKey` (string) | Nguồn pool |
|---|---|---|---|
| counting-fun | `number-vi` | `String(count)` → `'1'..'10'` | `1..maxCountForLevel(level)` |
| letter-spotting | `letter-vi` | chữ gốc `'A'`,`'Ă'`,`'Đ'`… | `LETTERS` (29) |
| first-letter | `letter-vi` | chữ đầu `entry.letter` (vd `'M'`) | `LETTER_POOL` ∪ các `entry.letter` |
| abc-english | `letter-en` | `'A'..'Z'` | `letterPoolForLevel(level)` |
| numbers-english | `number-en` | `String(target)` → `'1'..'10'` | `1..maxNumberForLevel(level)` |
| first-words | `word-en` | `target.word` (vd `'cat'`) | `WORD_BANK[bankFor(level)]` |
| colors-english | `color-en` | `target.name` (vd `'red'`) | `colorPoolForLevel(level)` |
| shapes-colors | `shape` và/hoặc `color-vi` | `targetShape` (`'circle'…`) / `targetColor.name` (`'đỏ'…`) | `SHAPES` / `COLORS` |

- **`itemKey` dùng đúng giá trị mà scene đã `speakText`** (vd `'cat'`, `'7'`, `'Đ'`) → trùng khoá clip Piper, dễ truy vết, Phần C đọc lại đọc được giọng.
- **shapes-colors là trò hai-mục:** mỗi round có `mode` ∈ `shape|color|both`. Round `shape` → ghi mục `shape`; round `color` → ghi mục `color-vi`; round `both` → ghi **cả hai** mục (cùng kết quả). SR chỉ "đề xuất target" cho **một** trục mỗi round (theo `mode` mà `generateRound` chọn) — xem §5.5. **first-letter & letter-spotting dùng chung `letter-vi`** nên thạo chữ ở trò này có lợi cho trò kia (chia sẻ mastery — đúng ý SR liên-ngữ-cảnh).

### 4.3 Dexie version bump (ADDITIVE — `src/data/db.ts`)

Bản hiện tại chỉ có `.version(1)`. Thêm **`.version(2)`** khai báo lại bảng cũ y nguyên + bảng mới. Dexie yêu cầu version mới liệt kê **toàn bộ** bảng còn tồn tại; bảng cũ giữ **đúng** primary key + index → **không migrate, không mất dữ liệu** (chỉ tạo store mới).

```ts
export class KiddyHubDB extends Dexie {
  profiles!: Table<Profile, number>;
  progress!: Table<Progress, number>;
  starEvents!: Table<StarEvent, number>;
  garden!: Table<Garden, string>;
  settings!: Table<Settings, string>;
  itemMastery!: Table<ItemMastery, number>;   // ← mới

  constructor() {
    super('kiddyhub');
    this.version(1).stores({
      profiles: '++id, createdAt',
      progress: '++id, profileId, gameId, [profileId+gameId]',
      starEvents: '++id, profileId, weekKey',
      garden: 'id',
      settings: 'id',
    });
    this.version(2).stores({
      // bảng cũ giữ NGUYÊN khai báo (Dexie cần liệt kê lại) — không đổi PK/index
      profiles: '++id, createdAt',
      progress: '++id, profileId, gameId, [profileId+gameId]',
      starEvents: '++id, profileId, weekKey',
      garden: 'id',
      settings: 'id',
      // bảng mới: PK ++id; index phục vụ 2 truy vấn nóng
      itemMastery:
        '++id, profileId, [profileId+skillId], [profileId+skillId+itemKey], [profileId+dueAt]',
    });
  }
}
```

- `[profileId+skillId+itemKey]` — upsert/đọc một hàng mục cụ thể (ghi kết quả round).
- `[profileId+skillId]` — load toàn bộ hàng của skill khi vào trò (MasterySession) + Phần C tổng hợp theo skill.
- `[profileId+dueAt]` — truy vấn "mục đến hạn" cho Phần D ("phiêu lưu hôm nay") không phải quét toàn bảng.

## 5. SR scheduler — Leitner boxes (THUẦN, có test)

### 5.1 Vì sao Leitner (không SM-2)

| Tiêu chí | **Leitner (chọn)** | SM-2 (SuperMemo) |
|---|---|---|
| Phù hợp tuổi 3–6 | ✅ rời rạc, dễ hiểu, đủ tốt cho pool nhỏ (≤29 mục) | ⚠ tinh chỉnh ease-factor — thừa cho pool nhỏ |
| Tín hiệu đầu vào | đúng/sai nhị phân (đúng hợp đồng `choose`) | cần "chất lượng nhớ" 0–5 — bé không tự đánh giá được |
| Thuần & test dễ | ✅ box→interval là bảng tra | ⚠ số học dấu phẩy động, khó assert |
| Triết lý no-lose | ✅ sai chỉ "lùi hộp", không phạt | tương đương |

Pool mỗi skill **rất nhỏ** (số: 10, chữ Việt: 29, chữ Anh: 26, từ EN: 18, màu: 8, hình: 4). Leitner 6 hộp là **vừa đủ** và minh bạch; SM-2 là over-engineering (YAGNI).

### 5.2 Box → interval & ngưỡng (`src/data/leitner.ts`, thuần)

```ts
export const BOX_INTERVALS_MS = [
  0,                       // box 0: mới / vừa sai → đến hạn NGAY (ưu tiên đưa lại trong phiên)
  20 * 60_000,             // box 1: ~20 phút (đưa lại sớm trong/sau phiên ngắn)
  24 * 3_600_000,          // box 2: 1 ngày
  3  * 24 * 3_600_000,     // box 3: 3 ngày
  7  * 24 * 3_600_000,     // box 4: 1 tuần   ← "đã thạo" bắt đầu từ đây
  14 * 24 * 3_600_000,     // box 5: 2 tuần
];
export const MAX_BOX = 5;
export const MASTERED_BOX = 4;        // box ≥ 4 ⇒ masteredAt được đặt (feeds C & D)

export interface MasteryRow {         // hình con của ItemMastery đủ cho scheduler thuần
  itemKey: string; box: number; dueAt: number; seenCount: number;
  correctCount: number; lastResult: 'correct' | 'wrong'; lastSeenAt: number; masteredAt?: number;
}

/** Thuần: áp một kết quả → hàng mới (KHÔNG ghi DB ở đây). */
export function applyResult(row: MasteryRow, correct: boolean, now: number): MasteryRow {
  const box = correct ? Math.min(MAX_BOX, row.box + 1) : 0;   // đúng: +1; sai: rớt về 0
  const dueAt = now + BOX_INTERVALS_MS[box];
  const masteredAt = row.masteredAt ?? (box >= MASTERED_BOX ? now : undefined);
  return {
    ...row, box, dueAt,
    seenCount: row.seenCount + 1,
    correctCount: row.correctCount + (correct ? 1 : 0),
    lastResult: correct ? 'correct' : 'wrong',
    lastSeenAt: now, masteredAt,
  };
}

/** Hàng khởi tạo cho mục chưa từng gặp. */
export function freshRow(itemKey: string, now: number): MasteryRow {
  return { itemKey, box: 0, dueAt: now, seenCount: 0, correctCount: 0,
           lastResult: 'wrong', lastSeenAt: 0 };
}
```

- **box 0 & 1** cố tình ngắn (đến-hạn-ngay / 20 phút) → mục **vừa sai** quay lại **ngay trong phiên** (đúng yêu cầu "hay sai quay lại sớm"), không phải đợi sang ngày.
- **`masteredAt` chỉ đặt một lần** (không xoá khi lùi hộp) → C/D hiểu "đã từng thạo"; trạng thái "đang thạo bây giờ" suy ra từ `box ≥ MASTERED_BOX` (§7).

### 5.3 Hàm chọn mục — `pickNextItem` (THUẦN, `src/data/srScheduler.ts`)

```ts
export interface PickArgs {
  pool: string[];                 // itemKey ứng viên của level/trò hiện tại (đã String hoá)
  rows: Map<string, MasteryRow>;  // mastery hiện có theo itemKey (thiếu = chưa gặp)
  now: number;
  rng: Rng;                       // () => number, tiêm được (test xác định)
  lastPicked?: string;            // mục round ngay trước (chống lặp tức thì)
}

/** Chọn 1 itemKey kế tiếp từ pool, ưu tiên đến-hạn/hay-sai nhưng giữ đa dạng. */
export function pickNextItem(args: PickArgs): string;
```

**Thuật toán (xác định, thuần, test được):**

1. **Chuẩn hoá ứng viên:** với mỗi `key ∈ pool`, lấy `row = rows.get(key) ?? freshRow(key, now)`.
2. **Loại lặp tức thì:** bỏ `lastPicked` khỏi ứng viên **nếu** còn ≥ 2 ứng viên khác (tránh hỏi y hệt 2 round liền — §5.4). Nếu pool chỉ có 1 mục thì giữ.
3. **Phân tầng ưu tiên (chọn tầng cao nhất còn ứng viên):**
   - **T1 — Mới (chưa gặp):** `seenCount === 0` → giới thiệu mục mới (đa dạng, không "vắt" mục cũ).
   - **T2 — Đến hạn & yếu:** `dueAt ≤ now` **và** `box ≤ 1` (đang sai/mới sai) — ôn gấp.
   - **T3 — Đến hạn:** `dueAt ≤ now` (box bất kỳ) — ôn theo lịch.
   - **T4 — Chưa đến hạn:** lấp đầy phiên bằng mục box thấp nhất (ít chắc nhất).
4. **Trong tầng đã chọn:** sắp theo `(box tăng, dueAt tăng, lastSeenAt tăng)` rồi lấy nhóm "tốt nhất ngang nhau" và **rng chọn ngẫu nhiên trong nhóm** → vừa ưu tiên đúng vừa **không nhàm** (không luôn cùng một mục).
5. Trả `itemKey`. **Không bao giờ ném**: pool rỗng (không nên xảy ra) → fallback `rng` chọn bừa trong `pool` gốc.

> **Tỷ lệ pha mục-mới vs ôn (chống "vắt" & chống "ngập"):** scheduler **ngầm** cân bằng qua phân tầng + chống-lặp: khi chưa có mục đến hạn (đầu hành trình) T1 trội → giới thiệu dần; khi mục cũ đến hạn, T2/T3 chen vào nhưng luật chống-lặp + rng-trong-nhóm giữ biến thiên. **Không** drill 5/5 round cùng một chữ.

### 5.4 Đa dạng & no-overwhelm (luật cứng)

- **Không lặp tức thì:** `lastPicked` bị loại nếu còn ứng viên khác (bước 2). `MasterySession` giữ `lastPicked` qua các round trong phiên.
- **Không drill một mục cả phiên:** rng-trong-nhóm (bước 4) + chống-lặp đảm bảo ≥ 2 mục khác nhau xuất hiện khi pool ≥ 2.
- **Mục mới nhỏ giọt:** T1 đứng trước T4 nhưng **sau** T2/T3 → mục hay sai vẫn được ôn trước khi nạp mục mới (không quá tải mục mới).

### 5.5 Tích hợp `generateRound` mà KHÔNG sửa thân hàm

`generateRound` các trò hiện **tự** chọn `target` rồi dựng `options`. Để SR "đặt hàng" target **mà không phá** logic distractor/guard:

- **Mở rộng chữ ký tương thích-ngược:** thêm tham số tuỳ chọn cuối:
  `generateRound(level, rng, seedTarget?)`. Khi `seedTarget` **undefined** → hành vi **y hệt** hôm nay (mọi test cũ xanh). Khi có → dùng `seedTarget` làm `target`/`count`/`entry`/`targetShape|targetColor` thay cho `pick(...)`, **phần dựng distractor giữ nguyên**.
- Đây là **một sửa nhỏ, cục bộ, có test** trong mỗi `*Logic.ts` — *không* phá guard (guard ở Scene), *không* đổi `optionCountForLevel`/`starsFor`. Là thay đổi hành-vi-học → đi qua **test logic thuần** (đúng roadmap §6: "Thay đổi hành vi học (B) phải đi qua test logic thuần").
- **Ánh xạ seed→target từng trò:**
  - counting-fun: `seedTarget` = số đếm (`count = Number(seed)`).
  - letter-spotting / abc-english: `target = seed`.
  - first-letter: seed là **chữ cái**; chọn `entry` ngẫu nhiên trong `WORD_BANK.filter(e => e.letter === seed)` (vẫn `pick` nếu không có) → distractor như cũ.
  - numbers-english: `target = Number(seed)`, `word = NUMBER_WORDS[target]`.
  - first-words: `target = bank.find(w => w.word === seed) ?? pick(bank)`.
  - colors-english: `target = pool.find(c => c.name === seed) ?? pick(pool)`.
  - shapes-colors: theo `mode` đã chọn, seed nạp vào `targetShape` (skill `shape`) **hoặc** `targetColor` (skill `color-vi`); trục còn lại vẫn random.

> **Vì sao seed-vào-logic chứ không lọc-ở-scene:** giữ **một** nguồn dựng round (logic thuần, test được), tránh scene tự xào options (dễ vỡ hit-area/guard). Scene chỉ **truyền** seed nhận từ `host.pickItem`.

## 6. Trò rời-rạc (SR đầy đủ) vs trò skill-level-only

**Đủ điều kiện SR từng-mục (8 trò)** — có **tập atom hữu hạn, ổn định, học-thuộc được**, scene đã `speakText` đúng atom đó:

`counting-fun` · `letter-spotting` · `first-letter` · `abc-english` · `numbers-english` · `first-words` · `colors-english` · `shapes-colors`.

**Chỉ ghi mastery KỸ NĂNG TỔNG (8 trò)** — *không* có atom để lặp ngắt quãng (lý do cụ thể):

| Trò | skillId | Vì sao không SR từng-mục |
|---|---|---|
| pattern-finder | `pattern` | "Mục" là **quy luật trừu tượng** (AB/ABC/AABB) sinh từ token ngẫu nhiên, không phải atom cố định để học thuộc; kỹ năng là *suy luận chuỗi*. |
| more-less | `compare` | So sánh **số lượng tức thời** giữa hai nhóm random — không có "mục" bền; kỹ năng là *so nhiều/ít*. |
| odd-one-out | `classify` | "Đáp án" là **quan hệ nhóm** (cái khác loại), không phải atom riêng; mỗi round nhóm/đáp án khác. |
| sorting | `classify` | Phân loại theo thuộc tính — kỹ năng quan hệ, không atom. |
| memory-match | `memory` | Kỹ năng *trí nhớ làm việc*; cặp hình là phương tiện, không phải mục học-thuộc. |
| jigsaw | `assemble` | Kỹ năng *ghép không gian*; mảnh không phải atom học-thuộc. |
| spot-difference | `observe` | Kỹ năng *quan sát*; điểm khác mỗi tranh khác. |
| match-quantity | `quantity` | Ghép số↔nhóm; gần đếm nhưng cơ chế kéo-thả/round khác — ghi kỹ năng tổng (có thể nâng cấp sau, YAGNI). |

**Ghi gì cho trò skill-level-only:** một hàng `itemMastery` với `itemKey = '*'`, cập nhật qua **chính `applyResult`** ở **cuối phiên** dựa trên `stars` (vd `correct = stars >= 2`), để Phần C có "đang lên tay kỹ năng X". **Không** chọn target (không gọi `pickItem`), **không** scaffolding bắt buộc (tuỳ trò, mặc định **không** ở B). → các trò này **gần như không đổi** (chỉ thêm **một** dòng `host.recordSkill(skillId, correct)` ở `finish()`, tuỳ chọn).

## 7. Read API cho Phần C (read-only, thuần + repo)

```ts
export type MasteryBucket = 'mastered' | 'emerging' | 'practice-next';

export interface SkillMastery {
  skillId: SkillId;
  total: number;                       // số mục đã từng gặp trong skill
  mastered: string[];                  // itemKey box ≥ 4 (đang thạo)
  emerging: string[];                  // đã gặp, 1 ≤ box < 4
  practiceNext: string[];              // box 0 (hay sai) — ưu tiên luyện
  accuracy: number;                    // Σcorrect/Σseen (0..1) toàn skill
}

// THUẦN (test dễ): phân loại 1 hàng.
export function bucketOf(row: MasteryRow): MasteryBucket {
  if (row.box >= MASTERED_BOX) return 'mastered';
  if (row.box === 0) return 'practice-next';
  return 'emerging';
}

// REPO (async, đọc-only — Phần C gọi):
export function getMasteryRows(profileId: number, skillId: SkillId): Promise<ItemMastery[]>;
export function getMasterySummary(profileId: number): Promise<SkillMastery[]>;     // gộp mọi skill
export function getDueItems(profileId: number, now: number, limit?: number): Promise<ItemMastery[]>; // cho Phần D
```

- **Ngưỡng "đã thạo" = box ≥ 4** (1 tuần+; tức bé trả lời đúng-lần-đầu ≥ 4 lần liên tiếp giãn dần). `practice-next` = box 0 (đang sai). Trung gian = `emerging`.
- Phần C **không ghi**; chỉ ba hàm đọc trên. Ngôn ngữ đời thường (vd "Đã thạo 12/29 chữ") do **C** dựng từ các con số này — B không format chuỗi tiếng người.

## 8. Tích hợp per-game (thay đổi TỐI THIỂU)

### 8.1 GameHost — thêm 2 method TUỲ CHỌN (không phá host cũ)

`src/games/GameModule.ts` (interface `GameHost`) thêm **optional** (trò không-SR khỏi cần):

```ts
export interface GameHost {
  /* …giữ nguyên speak/speakText/playSfx/awardStars/complete/goHome… */
  /** SR: chọn itemKey kế tiếp cho round (đồng bộ, từ session đã nạp). */
  pickItem?(skillId: SkillId, pool: string[]): string | undefined;
  /** SR: ghi kết quả first-try của round vào mastery (flush async ngầm). */
  recordItemResult?(skillId: SkillId, itemKey: string, correct: boolean): void;
  /** Scaffolding: gợi ý dạy có giọng + tín hiệu giảm lựa chọn (§9). */
  hint?(skillId: SkillId, itemKey: string): { speakKey?: string; reduceTo?: number };
}
```

- **Optional** ⇒ `GameHost.test.ts` cũ + scene chưa dùng vẫn xanh. Trò rời rạc dùng `host.pickItem?.(…)` (optional-chaining → an toàn khi host không có).

### 8.2 MasterySession — `src/games/masterySession.ts` (cầu sync↔async, test thuần)

```ts
export interface MasterySession {
  pick(skillId: SkillId, pool: string[]): string;          // dùng pickNextItem + rng + lastPicked
  record(skillId: SkillId, itemKey: string, correct: boolean): void; // applyResult vào cache + flush
  hintFor(skillId: SkillId, itemKey: string): number;      // số lựa chọn nên còn (scaffold) — §9
}
export function createMasterySession(deps: {
  rows: Map<string /*`${skillId}|${itemKey}`*/, MasteryRow>;   // nạp sẵn
  now: () => number;
  rng: Rng;
  persist: (skillId: SkillId, row: MasteryRow) => void;        // fire-and-forget Dexie upsert
}): MasterySession;
```

- `createMasterySession` **thuần & test được** (tiêm `now`/`rng`/`persist` giả) — đây là **trái tim B2 có test**, dù scene không test được.
- `persist` = `recordItemResult(profileId, skillId, row)` repo (upsert theo `[profileId+skillId+itemKey]`), gọi **không await** trong vòng round (không chặn UI). Mất một lần ghi do reload giữa chừng là **chấp nhận được** (không phải dữ liệu tài chính).

### 8.3 GameContainer.tsx — nạp session 1 lần (sửa ~10 dòng, một chỗ)

Trước khi boot scene, **await** nạp các hàng mastery của (các) skill mà trò dùng, dựng `MasterySession`, đưa vào `createGameHost`:

```ts
// (trong useEffect, trước loadScene)
const skillIds = SKILLS_FOR_GAME[gameId];            // bảng tra tĩnh; [] cho trò không-SR
const rows = await loadMasteryMap(profileId, skillIds); // repo đọc 1 lần (await trước boot)
const session = createMasterySession({ rows, now: Date.now, rng: Math.random,
  persist: (skillId, row) => void upsertMastery(profileId, skillId, row) });
const host = createGameHost({ audio, session, onAward, onComplete, onHome });
```

- `createGameHost` nhận thêm `session?` (optional) và bind `pickItem`/`recordItemResult`/`hint` vào nó (vài dòng trong `GameHost.ts`). Host **không async** — session đã trong bộ nhớ.
- `SKILLS_FOR_GAME` (`src/games/masteryMap.ts`) là **bảng tra tĩnh** `gameId → SkillId[]` (vd `'shapes-colors' → ['shape','color-vi']`). Test khẳng định mọi gameId rời-rạc có entry.

### 8.4 Sửa mỗi Scene rời rạc — 2–3 dòng (giữ guard nguyên)

Ví dụ **counting-fun** (`CountingFunScene.ts`):

```ts
// (1) trong nextRound(): xin target từ SR rồi seed vào generateRound (thuần)
const pool = countingPool(this.level);                         // = ['1'..String(max)]
const seed = this.host.pickItem?.('number-vi', pool);          // optional
this.current = generateRound(this.level, Math.random, seed ? Number(seed) : undefined);

// (2) trong choose(): khi đã chốt round, ghi kết quả first-try
//     (this.answeredThisRound = true ở nhánh sai ⇒ first-try đã sai)
this.host.recordItemResult?.('number-vi', String(this.current.count), !wasWrongFirstTry);
```

- **Guard không đổi:** `roundResolved`/`answeredThisRound` y nguyên; `recordItemResult` gọi **một lần** lúc round chốt (đúng) hoặc lúc sai-lần-đầu (ghi `correct=false`, rồi vẫn cho thử lại — no-lose). Cờ "first-try wrong" suy từ `answeredThisRound` đã có.
- Mỗi scene rời rạc nhận **đúng kiểu sửa này** (2 chỗ, ~3 dòng). `pool` lấy từ chính logic (`maxCountForLevel`, `letterPoolForLevel`, `WORD_BANK[bankFor]`…), không hard-code.
- shapes-colors: round-`both` ghi **hai** `recordItemResult` (shape + color-vi).

## 9. Scaffolding (gợi-ý-dạy) — giảm lựa chọn + gợi ý có giọng

### 9.1 Cơ chế (no-lose, fade khi lên tay)

Khi bé **sai lần đầu** một mục (`answeredThisRound` lần đầu = sai):

1. **Giảm số lựa chọn hiện** (bớt nhiễu): scene **làm mờ + vô hiệu hoá** (không xoá) các option-tile **distractor** xuống còn **2 lựa chọn** (đáp đúng + 1 nhiễu), giữ đáp đúng luôn hiển thị. → bé dễ tìm đúng ⇒ kết thúc bằng **thành công** (Four Pillars: meaningful + no-lose).
2. **Gợi ý có giọng giải thích vì sao** (Cáo dạy): `host.speak(hintKey)` — câu dạy ngắn theo skill (§9.3), thay cho `feedback.tryagain` trống.
3. **Rút giàn giáo theo mastery:** số lựa chọn bị giảm **không cố định** — `hintFor(skillId,itemKey)` trả số option nên còn:
   - `box ≥ 2` (đang lên tay) → **không** giảm (giàn giáo đã rút) — chỉ gợi giọng.
   - `box ≤ 1` (hay sai) → giảm xuống 2.
   Khi mục lên hộp qua các phiên, scaffolding **tự mờ dần** (fade) — đúng "rút giàn giáo khi làm tốt".

### 9.2 Vì sao "làm mờ + disable" (không xoá tile)

- **Không vỡ hit-area/guard:** tile vẫn tồn tại, chỉ `setAlpha(0.25)` + gỡ `setInteractive()` (hoặc cờ `disabled` chặn trong `choose`). Bố cục/толạ độ **không đổi** → không tính lại layout, không rớt round, guard `roundResolved` nguyên.
- **Khôi phục** khi sang round mới (dựng lại layer như hiện tại) — tự nhiên, không cần undo.
- **Tối thiểu cho B (mặc định):** scaffolding **bật cho 8 trò rời rạc**; cơ chế "mờ distractor" là **một helper chung** `dimDistractors(tiles, keepCorrectIdx, keepN)` trong `src/art/sceneArt.ts` (đặt cạnh `shakeOption`) để mọi scene gọi đồng nhất 1 dòng. Trò skill-level-only **không** scaffold (mặc định).

### 9.3 Nội dung câu gợi ý (tiếng Việt, dịu, Cáo dạy) — thêm vào manifest

Thêm các key vào `AUDIO_MANIFEST.voices` (vi-VN) + sinh clip Piper. Tông: ấm, khích lệ, **giải thích vì sao**, không chê. 6 câu (đủ phủ các skill, dùng lại chung):

```ts
'hint.tryagain.warm':  { text: 'Gần đúng rồi, mình thử lại nhé!',          lang: 'vi-VN' }, // chung
'hint.fewer':          { text: 'Cáo bớt bớt đi cho dễ chọn nha!',          lang: 'vi-VN' }, // báo giảm lựa chọn
'hint.letter':         { text: 'Nghe kĩ chữ cái rồi tìm chữ giống nhé!',   lang: 'vi-VN' }, // letter-vi/en
'hint.number':         { text: 'Mình cùng đếm lại từ một xem nào!',        lang: 'vi-VN' }, // number-vi/en, counting
'hint.word':           { text: 'Nhìn hình rồi chọn từ đúng nha bé!',        lang: 'vi-VN' }, // word-en
'hint.colorshape':     { text: 'Nhìn kĩ màu và hình rồi chọn lại nhé!',     lang: 'vi-VN' }, // color/shape
```

- **Ánh xạ skill→hintKey** (trong scene hoặc `masteryMap.ts`): `letter-vi|letter-en → hint.letter`; `number-vi|number-en → hint.number`; `word-en → hint.word`; `color-en|color-vi|shape → hint.colorshape`. Khi **có giảm lựa chọn** thì nói `hint.fewer` trước câu skill (hai câu nối — `speak().then(speak)` như scene đã làm với `feedback.correct`).
- **Tái dùng `feedback.correct`/`reward.cheer` đã có** cho nhánh đúng — không thêm.

### 9.4 Pipeline clip cho câu mới (BẮT BUỘC qua đúng đường)

1. **`scripts/build-voice-clips.mjs` → `enumerateClips()`:** đã `for (const entry of Object.values(AUDIO_MANIFEST.voices)) add(entry.lang, entry.text)` → **chỉ cần thêm 6 key vào manifest là script tự gom** (DRY — không sửa script). Chạy `npx tsx scripts/build-voice-clips.mjs` (cần Piper+ffmpeg local) → sinh 6 mp3 mới + cập nhật `voiceClips.ts`, **commit cả hai**.
2. **Anti-drift:** `src/audio/voiceClips.test.ts` **đã** khẳng định mọi `{text,lang}` từ `AUDIO_MANIFEST.voices` có khoá trong `VOICE_CLIPS` → 6 câu mới **tự động** được test bao phủ (thiếu clip ⇒ đỏ). **Không cần** sửa test chống-drift; chỉ cần đã chạy script.
3. **Cổng giọng (như Phần A):** bước đầu B2 = thu thử 6 câu, nghe nhanh; tông không đạt → đổi chữ (chỉ sửa `text` + chạy lại script).

> **Lưu ý người chạy:** clip mới phải sinh **trước** khi merge (commit mp3 + index). Build/CI/Docker vẫn **không** cần Piper — clip đã commit. `MASTERED_BOX`/scaffolding không phụ thuộc clip để chạy (thiếu clip → engine fallback Web Speech, không treo).

## 10. Kế hoạch kiểm thử

**B1 — thuần, jsdom, tự động (mục tiêu ~30–40 test mới):**

- `src/data/leitner.test.ts`: `applyResult` đúng→box+1/dueAt theo bảng; sai→box0/due-ngay; cap MAX_BOX; `masteredAt` đặt một lần ở box 4, **không** xoá khi lùi; `freshRow` đúng.
- `src/data/srScheduler.test.ts` (rng giả xác định): ưu tiên T2 (đến hạn & yếu) trước T1/T3/T4; **chống lặp tức thì** (`lastPicked` bị loại khi ≥2 ứng viên); rng-trong-nhóm cho đa dạng (hai seed rng → hai mục khác nhau khi đồng hạng); pool 1-phần-tử không loại; không ném khi rows rỗng; mục mới (seen 0) được giới thiệu khi chưa có due.
- `src/data/itemMastery.test.ts` (mirror `progress.test.ts`, `fake-indexeddb`): upsert tạo hàng lần đầu / cập nhật lần sau theo `[profileId+skillId+itemKey]`; `getMasteryRows`/`getMasterySummary`/`getDueItems` đúng; **bảng cũ vẫn mở được sau bump v2** (đọc/ghi `progress` song song không lỗi — bảo chứng additive).
- `src/games/masterySession.test.ts`: `pick` gọi scheduler + cập nhật `lastPicked`; `record` áp `applyResult` vào cache **và** gọi `persist` (spy); `hintFor` trả số option theo box.
- `src/data/db.test.ts` (mới, nhẹ): mở DB version 2, khẳng định `itemMastery` tồn tại + index khai báo; ghi rồi đọc lại bền.

**B2 — logic thuần đổi + bảng tra (tự động):**

- Mỗi `*Logic.test.ts` của 8 trò rời rạc: thêm ca **`seedTarget` ⇒ `target` đúng**, **`seedTarget` undefined ⇒ hành vi cũ** (mọi test cũ giữ xanh), distractor vẫn đủ/không trùng/không match.
- `src/games/masteryMap.test.ts`: mọi gameId rời-rạc có `SKILLS_FOR_GAME` entry; skill→hintKey phủ đủ.
- `voiceClips.test.ts` **giữ nguyên** nhưng **đỏ→xanh sau khi chạy script** (6 câu mới phải có clip) — đây là cổng chống-drift cho gợi ý.

**Không tự động (kiểm thử tay — `npm run build` + preview, trình duyệt thật):**

- Sai lần 1 → **lựa chọn giảm còn 2** + nghe **gợi ý dạy** (không chỉ "thử lại"); chọn đúng → khôi phục, sang round.
- Chơi nhiều phiên một bé: mục hay sai **quay lại sớm**, mục đúng đều **thưa dần**; sau vài phiên scaffolding của mục đã lên tay **mờ dần** (không còn giảm lựa chọn).
- Reload giữa chừng: mastery **bền** (đếm seen/correct/box giữ).
- Tắt giọng: gợi ý **im** nhưng giảm-lựa-chọn vẫn hoạt động (no-lose độc lập âm thanh).

**Toàn bộ 223 test cũ giữ xanh**; tổng kỳ vọng ~223 + ~35 = **~258**.

## 11. Bàn giao & chia B1/B2

**Khuyến nghị: CHIA — B1 trước, B2 sau.** Lý do:

- **B1 = nền thuần, 100% test được** (data model + Leitner + scheduler + repo + session core). Không chạm scene, không cần Piper, review/merge nhanh, rủi ro thấp. Là **API ổn định** để C/D bám vào ngay (C chỉ cần read API §7; D cần `getDueItems`).
- **B2 = tích hợp + scaffolding + clip** — chạm 8 scene (kiểm thử tay), thêm câu manifest + chạy Piper. Tách ra để **rủi ro scene/giọng** không chặn việc C/D khởi động trên nền B1.
- **Cắt B1/B2:** B1 = §4,§5,§7 + `masterySession` core + test B1. B2 = §6 (ghi skill tổng), §8 (host/container/scene), §9 (scaffolding+clip) + test B2.

**Bàn giao chung (mỗi phần con):** review → fix → `test/build/lint/tsc` sạch → commit & push → cập nhật `ROADMAP.md` + sổ SDD `.superpowers/sdd/progress.md` + để lại **manual-test TODO** (§10 phần tay).

## 12. Rủi ro & quyết định

- **Đồng bộ vs async (rủi ro kiến trúc chính):** đã giải bằng `MasterySession` nạp-một-lần + flush fire-and-forget (§3, §8.2) → `generateRound` giữ thuần, guard nguyên, không await trong round. **Giảm thiểu:** nếu await-nạp-trước-boot làm trễ mở trò (Dexie nhanh, ~vài ms) → chấp nhận; có thể nạp song song với `loadScene()` và join.
- **Mất một lần ghi do reload giữa round:** chấp nhận (fire-and-forget; dữ liệu học, không phải tài chính). Phần lớn round chốt xong mới rời.
- **`box 0/1` ngắn (đến-hạn-ngay/20'):** cố ý cho "hay sai quay lại sớm" trong phiên; rủi ro lặp nhiều → đã chặn bằng luật chống-lặp-tức-thì + rng-trong-nhóm (§5.4). Cần xác nhận cảm giác bằng kiểm thử tay với trẻ.
- **Chất lượng 6 câu gợi ý Piper:** cổng giọng đầu B2 (§9.4) như Phần A — nghe trước khi nối dây.
- **Backward-compat chữ ký `generateRound`:** tham số seed **tuỳ chọn cuối** ⇒ mọi caller/test cũ không đổi; chỉ scene mới truyền seed. Đã liệt kê ánh xạ từng trò (§5.5).

### Quyết định mở (cần con người — chỉ những điều default không nên tự quyết)

- **[RESOLVED ✓] Bật scaffolding "giảm lựa chọn" cho CẢ 8 trò rời rạc ngay ở B2.** Chủ dự án chốt: bật đồng nhất cho cả 8 (đồng nhất, no-lose). Đã triển khai ở B2 — mỗi scene rời rạc gọi `dimDistractor` (mờ + vô hiệu, không xoá tile) xuống còn 2 lựa chọn khi sai-lần-đầu và mục còn yếu (box ≤ 1), tự rút giàn giáo khi `box ≥ 2`.
- **[RESOLVED ✓] Ngưỡng "đã thạo" = box 4 (≈1 tuần).** Chủ dự án chốt giữ `MASTERED_BOX = 4` (đã đặt trong `src/data/leitner.ts`). Đổi một hằng là đủ nếu sau này muốn "thạo" dễ/khó hơn.

> Hai mục trên là **quyết định cảm-giác/kỳ-vọng**; mọi thứ còn lại đã default hợp lý theo nghiên cứu & ràng buộc code. Roadmap §4 có **điều chỉnh nhỏ** đã ghi ở §4.1 (thêm `lastSeenAt`, tách `number-vi/number-en` & `color-vi/color-en`, `itemKey` luôn string, thêm nhóm skill-level-only) — cần orchestrator gật.
