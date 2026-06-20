# KiddyHub — Giai đoạn 5 · Phần C: Bảng phụ huynh 2.0 (Phase 5C Design)

> **Trạng thái:** Đặc tả (design SPEC) — chờ duyệt. Triển khai chia **C1 (read helpers + bảng nội dung, THUẦN + test đầy đủ)** rồi **C2 (React UI trong khu phụ huynh)** — xem §10, §13.
> **Bản đồ GĐ5:** [`2026-06-20-kiddyhub-phase-5-roadmap.md`](./2026-06-20-kiddyhub-phase-5-roadmap.md) (§2 Phần C — phạm vi; §3 nguyên tắc — *mastery > minutes*, tổng kết tuần, nối đời thực, privacy-as-feature, AAP ≤1h; §6 ranh giới) — đây là **hợp đồng** của Phần C.
> **Tiêu thụ Phần B:** [`2026-06-20-kiddyhub-phase-5b-learning-depth.md`](./2026-06-20-kiddyhub-phase-5b-learning-depth.md) §7 (read API). Phần C **đọc-only** bảng `itemMastery` qua `src/data/mastery.ts` (`getMasterySummary`, `getMasteryRows`, `bucketOf`) — **không** chạm WRITE path của B.
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md) — "Giai đoạn 5 / Phần C".

---

## 1. Mục tiêu Phần C

Phụ huynh là **người mua**; họ coi trọng *giá trị giáo dục*, nhưng "phút đã chơi" là **vanity metric**. Tín hiệu thật mà Phần C phải hiện, bằng **tiếng Việt đời thường (không mã kỹ năng, không con số trừu tượng khô khan)**:

1. **Bé đang giỏi gì** — mỗi kỹ năng một dòng: **"Đã thạo / Đang lên / Nên luyện tiếp"** (đọc `getMasterySummary` của B).
2. **Nên luyện tiếp cái gì** — với kỹ năng yếu, **gợi thẳng trò luyện** (deep-link vào game qua registry/`masteryMap`).
3. **Tuần này bé tiến bộ ra sao** — **thẻ tổng kết tuần trên-máy/mỗi-bé**: số mục **mới thạo tuần này** + **sao tuần này**, *không* "phút đã chơi".
4. **Mang việc học ra đời thực** — mỗi insight kèm **một** gợi ý hoạt động offline tiếng Việt ("Bé giỏi hình rồi — thử đi săn hình tròn quanh nhà nhé!").
5. **Quyền riêng tư là tính năng hiển thị** — khối tĩnh "offline 100% · không quảng cáo · không thu thập dữ liệu".
6. **Nhắc dùng lành mạnh dịu nhẹ** — theo AAP ≤1h/ngày: một dòng thông tin + nhắc "đến giờ ra chơi ngoài đời", **không ép, không đếm-tội, không dark-pattern**.

**DoD Phần C:** phụ huynh mở khu của mình → với **mỗi bé** thấy *giỏi gì / nên luyện gì + 1 gợi ý đời thực*; **thẻ tuần** sinh trên máy (mục mới thạo + sao); **không** metric "phút đã chơi"; khối **privacy** + **nudge** hiển thị; **mọi tính toán cục bộ**; read helpers mới **thuần + test (fake-indexeddb, jsdom-safe)**; **không phá** ParentArea CRUD/stars/audio-toggle hiện có + test của nó.

## 2. Ranh giới — KHÔNG đụng tới gì (theo roadmap §6 + B §2)

- **WRITE path của mastery (B):** **không** gọi/sửa `recordItemResult`, `upsertMastery`, `recordPlay`, `addStars`, `applyResult`, `MasterySession`, scheduler, scaffolding, scene/`*Logic.ts`, `AudioManager`, `audioManifest`. Phần C **chỉ đọc**. Không thêm method ghi nào vào `src/data/mastery.ts`.
- **Bảng Dexie:** **không** bump version, **không** thêm bảng/index, **không** đổi schema. Phần C chỉ **đọc** `itemMastery` + `starEvents` + `profiles` qua repo có sẵn. (Nếu một truy vấn cần index chưa có → **không** thêm index; quét trong-bộ-nhớ là chấp nhận được — pool mỗi bé ≤ vài trăm hàng, xem §11.)
- **ParentArea CRUD/stars/audio hiện có:** `addChild`/`removeChild`, mục "Sao tuần này" (`getWeeklyTally`), toggle `soundOn`/`voiceOn` (gọi `audio.setSoundOn`/`setVoiceOn`) — **giữ nguyên hành vi + selector test** (`ParentArea.test.tsx`: "adds a child profile", "toggling voice…"). Phần C **bổ sung** section/sub-component, **không** đụng các nhánh này.
- **`ParentGate` (cổng số học) + test:** không đụng — vẫn là lối vào khu phụ huynh.
- **Local-only tuyệt đối:** không mạng, không tài khoản, không xuất/in/gửi báo cáo ra ngoài (roadmap §2 "Ngoài phạm vi": *xuất/in báo cáo; biểu đồ phức tạp; bất kỳ thứ gì rời máy*).
- **Triết lý trẻ thơ:** nudge **không** dark-pattern — không hẹn-giờ-ép, không "đã quá giờ!", không màu đỏ cảnh báo, không guilt; mọi từ ngữ dịu, hướng-tới-cha-mẹ (không tới-trẻ).
- **Hạ tầng test:** `fake-indexeddb/auto` đã có trong `src/test/setup.ts` → read helpers test y như `mastery.test.ts`/`stars.test.ts`. UI test qua `@testing-library/react` + `userEvent` (đúng pattern `ParentArea.test.tsx`). Không làm đỏ **304** test hiện có.

## 3. Bức tranh kiến trúc (một hình)

```
              ┌──────────────────── C1 (thuần / repo đọc-only, test đầy đủ) ─────────────────────┐
src/data/     │  parentInsights.ts                                                                │
  parentInsights.ts │  ├─ skillLabel(skillId) → 'Đếm số' …            (THUẦN, bảng tra)          │
              │      ├─ getChildMastery(profileId) → ChildSkillView[]  (repo: gọi getMasterySummary)│
              │      └─ getWeeklyMasteryRecap(profileId, weekKey) → WeeklyRecap  (repo)           │
src/content/  │  parentTips.ts: OFFLINE_TIP_BY_SKILL  (THUẦN, bảng nội dung tiếng Việt)           │
  parentTips.ts │  PRIVACY_NOTE / HEALTHY_USE_NOTE   (hằng chuỗi tĩnh)                            │
              └────────────────────────────────────────────────────────────────────────────────────┘
                                  ▲ đọc-only (await trước render)
                                  │
┌─────────────── C2 (React UI — render thuần, kiểm thử RTL) ────────────────────────────────────┐
│ ParentArea.tsx  (mở rộng — thêm 1 section "Tiến bộ của bé" + PrivacyNote + HealthyUseNote)     │
│   └─ ChildProgressList   (lặp các bé → ChildMasteryCard)                                       │
│        ├─ ChildMasteryCard   (per bé: tên + dòng kỹ năng + nút "luyện tiếp" + tip đời thực)    │
│        └─ WeeklyRecapCard    (per bé: "tuần này thạo thêm N mục · M ⭐")                        │
│   └─ PrivacyNote  (tĩnh)   └─ HealthyUseNote (tĩnh, dịu)                                        │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Bất biến cốt lõi:** giống ParentArea hiện tại — component **đọc bất đồng bộ trong `useEffect`** (await repo), set state, render đồng bộ. Không có vòng đời round, không await trong render. Read helpers nạp **một lần khi mở khu phụ huynh**.

---

## 4. Read helpers mới (C1 — THUẦN / repo đọc-only, test đầy đủ)

Tất cả ở **`src/data/parentInsights.ts`** (file mới — không sửa `mastery.ts`/`stars.ts`). Đọc-only; **không** ghi DB.

### 4.1 `skillLabel` — SkillId → tên tiếng Việt đời thường (THUẦN, bảng tra)

Phần B sinh tên-người là việc của **C** (B §7: "B không format chuỗi tiếng người"). Đây là **bảng tra cứng, thuần, test exhaustive**:

```ts
import type { SkillId } from './types';

/** SkillId → tên kỹ năng tiếng Việt đời thường (KHÔNG mã, KHÔNG tiếng Anh kỹ thuật). */
export const SKILL_LABEL: Record<SkillId, string> = {
  // --- per-item SR (mục rời rạc) ---
  'letter-vi': 'Nhận mặt chữ',
  'letter-en': 'Chữ cái tiếng Anh',
  'number-vi': 'Đếm số',
  'number-en': 'Số tiếng Anh',
  'word-en':   'Từ vựng tiếng Anh',
  'color-en':  'Màu tiếng Anh',
  'shape':     'Hình khối',
  'color-vi':  'Màu sắc',
  // --- skill-level only ---
  'pattern':   'Tìm quy luật',
  'compare':   'So sánh nhiều ít',
  'classify':  'Phân loại',
  'memory':    'Trí nhớ',
  'assemble':  'Ghép hình',
  'observe':   'Quan sát tinh',
  'quantity':  'Ghép số và lượng',
};

export function skillLabel(skillId: SkillId): string {
  return SKILL_LABEL[skillId] ?? skillId;
}
```

> **Toàn bộ bảng SkillId→tên (chốt cho orchestrator):** xem khối trên. 15 skill — phủ **đủ** union `SkillId` ở `src/data/types.ts`. Test exhaustive (§10) khẳng định mọi `SkillId` có nhãn không-rỗng và **không** lẫn mã/tiếng-Anh-kỹ-thuật trong nhãn per-item chính.

### 4.2 `getChildMastery` — tổng hợp đọc-only cho dashboard mỗi bé

```ts
export type SkillStatus = 'mastered' | 'emerging' | 'practice-next';

export interface ChildSkillView {
  skillId: SkillId;
  label: string;            // skillLabel(skillId)
  status: SkillStatus;      // trạng thái TỔNG của skill (§4.4 — luật rút gọn)
  masteredCount: number;    // |mastered|  (box ≥ 4)
  emergingCount: number;    // |emerging|  (1 ≤ box < 4)
  practiceCount: number;    // |practiceNext| (box 0)
  total: number;            // số mục đã từng gặp trong skill
  accuracy: number;         // 0..1 (từ SkillMastery của B)
  practiceGameId?: string;  // nếu status='practice-next' → game để luyện (§4.5)
  tip: string;              // gợi ý đời thực (OFFLINE_TIP_BY_SKILL — §6)
}

/** Đọc-only: gói getMasterySummary(B) thành view tiếng người cho UI. */
export async function getChildMastery(profileId: number): Promise<ChildSkillView[]>;
```

- Gọi **`getMasterySummary(profileId)`** (B §7) → `SkillMastery[]`, rồi **map thuần** sang `ChildSkillView[]`. Phần "đọc DB" nằm trọn trong `getMasterySummary`; phần "map" là thuần (có thể tách hàm `toSkillView(SkillMastery): ChildSkillView` thuần để test không cần DB).
- **Sắp xếp:** ưu tiên hiển thị **`practice-next` trước**, rồi `emerging`, rồi `mastered` (cha mẹ thấy "cần làm gì" đầu tiên — actionable). Trong cùng nhóm, theo thứ tự skill ổn định (thứ tự khai báo `SKILL_LABEL`).
- **Bỏ qua skill chưa có dữ liệu:** chỉ hiện skill `total > 0` (bé đã chơi). Bé mới (chưa chơi) → mảng rỗng → UI hiện empty-state dịu (§5.4).

### 4.3 `getWeeklyMasteryRecap` — thẻ tổng kết tuần (repo đọc-only)

```ts
export interface WeeklyRecap {
  weekKey: string;
  newlyMastered: { skillId: SkillId; label: string; itemKey: string }[]; // masteredAt ∈ tuần này
  newlyMasteredCount: number;     // = newlyMastered.length
  stars: number;                  // getWeeklyStars(profileId, weekKey)
  topSkill?: { skillId: SkillId; label: string }; // skill có nhiều "mới thạo" nhất tuần (nếu có)
}

/** Đọc-only: những gì TÍNH ĐƯỢC HÔM NAY từ dữ liệu B + stars. KHÔNG có "phút đã chơi". */
export async function getWeeklyMasteryRecap(
  profileId: number,
  weekKey?: string,            // mặc định getWeekKey(new Date())
): Promise<WeeklyRecap>;
```

**Tính từ dữ liệu CÓ SẴN hôm nay (không thêm cột DB nào):**

| Trường | Nguồn | Cách tính |
|---|---|---|
| `newlyMastered` | `itemMastery` (đọc qua repo) | quét hàng của `profileId`, lọc `masteredAt != null` **và** `getWeekKey(new Date(masteredAt)) === weekKey` → `{skillId, label, itemKey}`. `masteredAt` là "mốc lần đầu đạt thạo" (B §5.2 — đặt một lần, không xoá khi lùi hộp) ⇒ đúng nghĩa "mới thạo tuần này". |
| `stars` | `getWeeklyStars(profileId, weekKey)` (`src/data/stars.ts`, **đã có**) | dùng nguyên — không viết lại. |
| `topSkill` | từ `newlyMastered` | skill xuất hiện nhiều nhất; tie → skill đầu theo thứ tự `SKILL_LABEL`. |

- **Đọc `itemMastery` của bé:** **tái dùng** đường đọc của B. `getMasterySummary` **không** trả `masteredAt`/`itemKey` kèm thời điểm, nên recap cần **các hàng thô**. Hai lựa chọn, **mặc định (a)**:
  - **(a)** thêm **một** repo đọc-only thuần trong `parentInsights.ts` gọi `db.itemMastery.where('profileId').equals(profileId).toArray()` rồi lọc trong-bộ-nhớ. Đây **không** phải đụng WRITE path của B — chỉ một câu `.where().toArray()` đọc-only như `getMasterySummary` đã làm. **An toàn, không thêm index** (`profileId` đã index).
  - (b) thêm `getMasteryRowsAll(profileId)` vào `mastery.ts`. **Không chọn** (mặc định) — tránh sửa file B; giữ mọi thứ-mới của C trong `parentInsights.ts`.
- **KHÔNG có "accuracy trend" trong recap mặc định.** Roadmap §2 nói "maybe accuracy trend". Tính xu hướng **theo tuần** cần snapshot lịch sử (DB hiện **không** lưu accuracy theo-thời-điểm — chỉ tổng tích luỹ `seenCount/correctCount`). Suy ra "xu hướng tuần này" trung thực là **không khả thi** nếu không thêm cột/bảng snapshot → **vượt ranh giới "không bump schema"**. → **mặc định bỏ** accuracy-trend khỏi recap; thay bằng `newlyMasteredCount` + `stars` (đều trung thực, on-device, no-vanity). **[QUYẾT ĐỊNH MỞ — nhỏ]** nếu sau muốn "xu hướng", cần spec snapshot tuần riêng (ngoài C). `accuracy` *tích luỹ* vẫn có ở dashboard (§4.2) như "độ chính xác chung", không gắn nhãn "tuần".

### 4.4 Luật trạng thái TỔNG của một skill (`status` ở §4.2)

`getMasterySummary` cho ba danh sách `mastered/emerging/practiceNext` theo từng-mục (đã đúng `bucketOf` của B). Dashboard cần **một** nhãn cho cả skill:

```
status =
  'practice-next'  nếu practiceCount > 0            // có mục đang sai → ưu tiên báo "nên luyện"
  else 'emerging'  nếu emergingCount > 0            // đang lên tay, chưa thạo hết
  else 'mastered'  (toàn bộ mục đã gặp đều box ≥ 4)  // thạo bền
```

- Ưu tiên `practice-next` để cha mẹ thấy *điều cần làm*. Đây là **luật thuần, test được**.
- UI hiện **cả ba con số** ("Đã thạo 8 · Đang lên 3 · Nên luyện 2") để minh bạch, nhưng **badge màu/nhãn** theo `status`.

### 4.5 `practiceGameId` — skill yếu → trò luyện (đọc registry, thuần)

Ánh xạ **skill → một gameId luyện kỹ năng đó**, để nút "Luyện tiếp" deep-link. Dùng **`SKILLS_FOR_GAME`** (`src/games/masteryMap.ts`, đã có) **đảo ngược** thành `SKILL_TO_GAME`:

```ts
// THUẦN — bảng tra (suy ra từ SKILLS_FOR_GAME; có thể hard-code để tránh phụ thuộc thứ tự).
export const PRACTICE_GAME_BY_SKILL: Partial<Record<SkillId, string>> = {
  'number-vi': 'counting-fun',
  'letter-vi': 'letter-spotting',   // (first-letter cũng luyện letter-vi; chọn 1 đại diện)
  'letter-en': 'abc-english',
  'number-en': 'numbers-english',
  'word-en':   'first-words',
  'color-en':  'colors-english',
  'shape':     'shapes-colors',
  'color-vi':  'shapes-colors',
  // skill-level-only KHÔNG có per-item practice — bỏ qua nút "luyện tiếp" (vẫn có tip đời thực).
};
```

- **Vì sao hard-code (không tự đảo runtime):** `SKILLS_FOR_GAME` map *một game → nhiều skill*; đảo ngược có thể nhập nhằng (hai game cùng `letter-vi`). Một bảng tra hiển-nhiên, **test khẳng định mọi gameId ∈ registry** (`getGame(id) != null`) tránh deep-link chết.
- **Nút "Luyện tiếp" hiển thị** chỉ khi `status === 'practice-next'` **và** có `PRACTICE_GAME_BY_SKILL[skillId]`. Nhãn nút lấy `getGame(gameId)?.title` (vd "Đếm Vui"). Deep-link: gọi prop `onPlayGame(gameId)` (§7.4) — **không** tự điều hướng trong sub-component.

## 5. Dashboard mastery mỗi bé (UI — `ChildMasteryCard`)

### 5.1 Một thẻ cho mỗi bé, ngôn ngữ đời thường

Mỗi `ChildMasteryCard` (per bé):

```
┌─────────────────────────────────────────────┐
│  🦊[avatar]  Na                              │   ← tên + avatar (như child-row hiện có)
│  ── Tuần này ──────────────────────────────  │   ← WeeklyRecapCard (§ thẻ tuần, lồng trong)
│  🌟 Tuần này thạo thêm 3 điều mới · 12 ⭐     │
│  ── Bé đang giỏi gì ───────────────────────  │
│  • Đếm số        Nên luyện tiếp  [Đếm Vui ▷] │   ← practice-next + nút luyện
│      Bé sắp đếm giỏi rồi — thử đếm 3 món      │   ← tip đời thực
│      đồ thật quanh nhà nhé!                   │
│  • Nhận mặt chữ  Đang lên 👍                  │   ← emerging
│  • Màu sắc       Đã thạo ✅                   │   ← mastered + tip "khen"
│      Bé giỏi màu rồi — đi săn đồ màu đỏ nào!  │
└─────────────────────────────────────────────┘
```

- **Mỗi dòng kỹ năng:** `label` + **badge trạng thái** (`Đã thạo ✅` / `Đang lên 👍` / `Nên luyện tiếp`) + (nếu practice-next) **nút trò luyện** + **một** tip đời thực (§6). Không mã skill, không số Leitner.
- **Con số phụ (tuỳ chọn, nhỏ):** "8 mục đã thạo" cạnh badge để cha mẹ thấy độ phủ — **không** "phút".
- **Sắp xếp dòng:** practice-next trên cùng (§4.2).

### 5.2 Ngưỡng (đọc thẳng từ B — không định nghĩa lại)

- **"Đã thạo" = `box ≥ 4`** (B `MASTERED_BOX = 4` — *RESOLVED ✓* ở B §12). Phần C **không** tự đặt ngưỡng; mọi phân loại đến từ `bucketOf`/`getMasterySummary` của B. Spec C chỉ **đặt tên người** cho ba bucket:
  - `mastered` → **"Đã thạo"**
  - `emerging` → **"Đang lên"**
  - `practice-next` (box 0) → **"Nên luyện tiếp"**

### 5.3 Tip đời thực gắn từng dòng (§6) — mỗi skill **một** tip

Hiện tip cho dòng **practice-next** (khích lệ + việc cần làm) và dòng **mastered** (khen + chuyển-giao đời thực). Dòng `emerging` để gọn (không tip, tránh quá tải) — **[QUYẾT ĐỊNH MỞ — nhỏ]** có thể bật tip cho cả `emerging` nếu muốn dày hơn; mặc định **chỉ** practice-next + mastered (mỗi thẻ tối đa ~2–3 tip, không ngợp).

### 5.4 Empty / nhiều bé / không bé

- **Chưa có bé:** section "Tiến bộ của bé" ẩn (hoặc dòng "Thêm bé để xem tiến bộ nhé"). Mục "Các bé"/"Sao tuần này" hiện có **giữ nguyên**.
- **Bé chưa chơi gì** (`getChildMastery` rỗng): thẻ hiện tên + dòng dịu "Bé chưa chơi trò nào — cùng bắt đầu nhé!" (không số liệu trống trải).
- **Nhiều bé:** một `ChildMasteryCard` mỗi bé, xếp dọc (như `child-list`).

## 6. Gợi ý chơi ngoài đời (bridge-to-real-world) — bảng nội dung

**Vị trí:** **`src/content/parentTips.ts`** (file mới — *content*, không *logic*; đặt cạnh `categories.ts`/`avatars.ts`). Thuần dữ liệu, test phủ.

```ts
import type { SkillId } from '../data/types';

/** Một hoạt động OFFLINE tiếng Việt cho mỗi skill — nối việc học ra đời thực. */
export const OFFLINE_TIP_BY_SKILL: Record<SkillId, string> = {
  'number-vi': 'Cùng đếm 3 món đồ thật quanh nhà — thìa, dép, hay quả cam nhé!',
  'number-en': 'Vừa xếp đồ vừa đếm “one, two, three” cùng bé thử xem!',
  'letter-vi': 'Đi tìm chữ cái trên hộp sữa, bìa sách quanh nhà với bé nào.',
  'letter-en': 'Chỉ vào chữ trên đồ chơi và đọc tên chữ tiếng Anh cùng bé nhé.',
  'word-en':   'Gọi tên vài đồ vật bằng tiếng Anh khi chơi cùng bé: cat, dog, ball…',
  'color-en':  'Hỏi bé “what color?” khi mặc áo, ăn trái cây — vui mà nhớ lâu!',
  'color-vi':  'Đi “săn” đồ vật cùng màu quanh nhà: tìm hết đồ màu đỏ xem nào!',
  'shape':     'Cùng tìm hình tròn, hình vuông trên đồ vật thật trong bếp nhé.',
  'pattern':   'Xếp xen kẽ hai loại đồ (thìa–nĩa–thìa–nĩa) và hỏi bé tiếp theo là gì.',
  'compare':   'Bày hai nhóm đồ và hỏi bé bên nào nhiều hơn — đếm để kiểm tra nhé.',
  'classify':  'Cùng bé phân loại đồ chơi theo nhóm: thú, xe, khối… vừa dọn vừa học!',
  'memory':    'Chơi “úp cốc giấu đồ” — rèn trí nhớ mà cười suốt buổi.',
  'assemble':  'Cho bé ghép lại hộp đồ chơi hoặc xếp khối thành nhà nhỏ nhé.',
  'observe':   'Chơi “tìm điểm khác” với hai bức tranh hoặc hai góc phòng nha.',
  'quantity':  'Đặt số que tính đúng bằng số ngón tay bé giơ lên — vui lắm đó!',
};

export function offlineTip(skillId: SkillId): string {
  return OFFLINE_TIP_BY_SKILL[skillId] ?? 'Cùng chơi và học với bé ngoài đời nhé!';
}
```

- **Mỗi skill đúng MỘT tip**, tiếng Việt, hành-động-được, dịu, hướng cha-mẹ-cùng-chơi. Test exhaustive: mọi `SkillId` có tip không rỗng.
- **Tip "mastered" vs "practice-next" dùng chung** một câu hoạt động (tip là *hoạt động đời thực cho skill*, không phụ thuộc trạng thái) — UI bọc bằng câu dẫn khác nhau ("Bé sắp giỏi… — thử…" vs "Bé giỏi rồi — thử…"). Giữ **một** nguồn nội dung (DRY).

## 7. Quyền riêng tư là tính năng (privacy-as-feature)

**Vị trí:** sub-component **`PrivacyNote`** + hằng nội dung **`PRIVACY_NOTE`** trong `src/content/parentTips.ts`. Đặt **gần cuối** khu phụ huynh (trước nút "Xong"), như một "huy hiệu tin cậy".

**Nội dung (tĩnh, tiếng Việt):**

```
🔒 Quyền riêng tư của bé
• Hoạt động 100% trên máy này — không gửi dữ liệu đi đâu cả.
• Không quảng cáo. Không thu thập dữ liệu. Không tài khoản online.
• Mọi tiến bộ của bé chỉ bạn xem được, ngay trên thiết bị.
```

- **Tĩnh, không state, không async.** Một component thuần, dễ test (render → tìm các dòng text). On-brand (roadmap §1: "offline 100%, không quảng cáo, không thu thập dữ liệu" là lợi thế cạnh tranh — **hiện ra** cho người mua thấy).

## 8. Nhắc dùng lành mạnh (healthy-use nudge) — dịu, không dark-pattern

**Hình thức NHẸ NHẤT có ích (mặc định):** **một khối thông tin tĩnh**, hướng cha mẹ, theo AAP — **không** đo screen-time, **không** đếm phiên, **không** cảnh báo đỏ.

**Vị trí:** sub-component **`HealthyUseNote`** + hằng `HEALTHY_USE_NOTE` (cạnh `PRIVACY_NOTE`). Đặt ngay dưới `PrivacyNote`.

**Nội dung (tĩnh, dịu):**

```
🌳 Chơi vừa đủ, lớn khôn nhiều
KiddyHub là bạn học bổ trợ — không phải để giữ bé.
Khoảng 15–20 phút mỗi lần, rồi cùng bé ra ngoài chơi
và thực hành những điều vừa học nhé!
```

- **Vì sao tĩnh (không tracking):** roadmap cấm dark-pattern & "đếm-tội"; AAP guidance là *cho cha mẹ*, không phải "khoá máy". Một dòng khuyến nghị + lời mời "ra ngoài chơi" là **đủ và đúng triết lý**. Screen-time tracking thật (đếm phút/phiên) **không có dữ liệu sẵn** (DB không lưu timestamp phiên kiểu đó) và sẽ **mâu thuẫn no-vanity / no-guilt** → **mặc định KHÔNG xây.**
- **[QUYẾT ĐỊNH MỞ]** *Nâng cấp tuỳ chọn (KHÔNG mặc định):* một "lời nhắc ra chơi" **suy được rẻ** — ví dụ nếu muốn, có thể đọc `lastPlayedAt` (đã có trong `progress`) để hiện "Hôm nay các bé đã học rồi đó!" mang tính khích lệ. **Chỉ làm nếu chủ dự án muốn**; nó vẫn là *thông tin*, không *cản*. Mặc định spec **bỏ qua** để giữ C tối giản & tránh mọi thứ giống "đếm".

## 9. UI — cấu trúc component (giữ ParentArea KHÔNG phình to)

Codebase trọng **đơn vị nhỏ, tập trung**. ParentArea hiện ~146 dòng; nhồi C vào sẽ thành file khổng lồ. → **tách sub-component**, thư mục `src/components/parent/`:

| Component | File | Trách nhiệm | State/async? |
|---|---|---|---|
| `ParentArea` (sửa nhẹ) | `ParentArea.tsx` | điều phối; thêm **một** `<ChildProgressList>` + `<PrivacyNote>` + `<HealthyUseNote>` trước nút "Xong". Giữ nguyên CRUD/stars/audio. | có (đã có) |
| `ChildProgressList` | `ChildProgressList.tsx` | nhận `profiles` (đã có ở ParentArea) → render một `ChildMasteryCard` mỗi bé. Tự `useEffect` nạp insights/recap **hoặc** nhận xuống từ ParentArea. | có (nạp insights) |
| `ChildMasteryCard` | `ChildMasteryCard.tsx` | per bé: header + `WeeklyRecapCard` + danh sách dòng kỹ năng (badge + nút luyện + tip). **Nhận props thuần** (`childView: ChildSkillView[]`, `recap`, `name`, `avatarKey`, `onPlayGame`) → **render thuần, dễ test, không async**. | không |
| `WeeklyRecapCard` | `WeeklyRecapCard.tsx` | per bé: "tuần này thạo thêm N · M ⭐" từ `WeeklyRecap` (prop thuần). | không |
| `PrivacyNote` | `PrivacyNote.tsx` | render `PRIVACY_NOTE` tĩnh. | không |
| `HealthyUseNote` | `HealthyUseNote.tsx` | render `HEALTHY_USE_NOTE` tĩnh. | không |

### 7.1 Nơi nạp dữ liệu (chọn: tập trung ở `ChildProgressList`)

- **`ChildProgressList`** làm việc async: với mỗi bé, `await getChildMastery(p.id)` + `await getWeeklyMasteryRecap(p.id)` (song song `Promise.all`), set state, rồi render các `ChildMasteryCard` **thuần** (truyền view xuống). → giữ `ParentArea` mỏng; `ChildMasteryCard`/`WeeklyRecapCard` **không async ⇒ test render đơn giản** bằng props giả (không cần DB).
- **`onPlayGame(gameId)`** truyền từ ParentArea → App: deep-link vào trò luyện. **[QUYẾT ĐỊNH MỞ — nhỏ]** Phần C **có thể** chỉ hiện nút mà *điều hướng* để Phần D nối (D lo onboarding/flow). **Mặc định:** thêm prop `onPlayGame` lên `ParentArea` và để App map sang `setScreen({name:'game', gameId})` (một dây nối nhỏ ở `App.tsx`). Nếu muốn giữ C **thuần-trong-khu-phụ-huynh**, nút có thể **tạm chỉ hiện tên trò** (không điều hướng) và để D nối — nhưng deep-link là giá trị thật cho cha mẹ ⇒ khuyến nghị nối ngay.

### 7.2 CSS

- Thêm class mới (`child-progress`, `mastery-card`, `mastery-row`, `status-badge`, `privacy-note`, `healthy-note`…) vào `src/App.css` — **không** sửa class hiện có của ParentArea. Badge ba màu (xanh "đã thạo", vàng "đang lên", hồng nhạt "nên luyện") — **không** đỏ-cảnh-báo (triết lý dịu).

## 10. Kế hoạch kiểm thử

**C1 — thuần / repo đọc-only (fake-indexeddb, jsdom; mục tiêu ~18–24 test):**

- `src/data/parentInsights.test.ts`:
  - `skillLabel`/`SKILL_LABEL`: **exhaustive** — mọi `SkillId` (15) có nhãn không-rỗng; nhãn per-item chính không chứa mã (`-vi`/`-en`).
  - `getChildMastery`: bé không dữ liệu → `[]`; bé có mix bucket → `status` đúng theo §4.4 (practice-next > emerging > mastered); sắp xếp practice-next trước; `practiceGameId` gắn đúng & **chỉ** khi practice-next; `tip` gắn đúng skill.
  - `getWeeklyMasteryRecap`: chỉ đếm `masteredAt` **trong** `weekKey`; `masteredAt` tuần trước **không** tính; `stars` khớp `getWeeklyStars`; `topSkill` đúng; bé không gì → recap rỗng (0 mục, 0 sao) không ném.
  - **Bảo chứng đọc-only:** test ghi vài hàng `itemMastery` (qua repo của B `recordItemResult`) rồi gọi helper C — khẳng định **không** đổi DB (đọc trước/sau bằng nhau). *(Vì helper không có đường ghi, đây là test phòng-hồi-quy nhẹ.)*
- `src/games/masteryMap` đảo / `PRACTICE_GAME_BY_SKILL` test (đặt trong `parentInsights.test.ts` hoặc cạnh): mọi `gameId` trong bảng **tồn tại trong registry** (`registerAllGames()` rồi `getGame(id)` != undefined) → không deep-link chết.
- `src/content/parentTips.test.ts`: `OFFLINE_TIP_BY_SKILL` **exhaustive** (mọi `SkillId` có tip không rỗng, độ dài hợp lý); `PRIVACY_NOTE`/`HEALTHY_USE_NOTE` chứa các cụm khoá ("không quảng cáo", "không thu thập", "ra ngoài"…) — chống xoá nhầm nội dung cốt lõi.

**C2 — React UI (RTL + userEvent; mục tiêu ~10–14 test):**

- `ChildMasteryCard.test.tsx` (props giả, **không** DB): render dòng kỹ năng + badge tiếng Việt đúng; practice-next hiện nút trò + tip "thử…"; mastered hiện "Đã thạo" + tip khen; click nút → gọi `onPlayGame(gameId)`.
- `WeeklyRecapCard.test.tsx`: hiện "thạo thêm N" + "M ⭐"; recap rỗng → câu khích lệ, **không** crash; **không** hiện chữ "phút".
- `PrivacyNote.test.tsx` / `HealthyUseNote.test.tsx`: render các dòng khoá.
- `ParentArea.test.tsx` (**bổ sung, giữ 2 test cũ xanh**): mock helper C (hoặc seed DB) → khu phụ huynh hiện section "Tiến bộ của bé"; **không** đụng selector "Tên bé"/"Giọng đọc" cũ. Khẳng định **không** có chuỗi "phút đã chơi" trong DOM (chống vanity-metric hồi quy).

**Toàn bộ 304 test cũ giữ xanh**; tổng kỳ vọng ~304 + ~30 = **~334**.

## 11. Hiệu năng & cục bộ

- Mỗi bé: `getMasterySummary` (1 quét `itemMastery` theo `profileId`) + `getWeeklyMasteryRecap` (1 quét tương tự) + `getWeeklyStars` (1 quét `starEvents`). Pool mỗi bé nhỏ (≤ vài trăm hàng mastery — tổng atom mọi skill ~120). Quét trong-bộ-nhớ **rẻ**, **không cần index mới**. N bé → N×3 truy vấn nhẹ khi mở khu phụ huynh (một lần). Chấp nhận được; có thể `Promise.all` song song.
- **Tất cả on-device**, không mạng, không rời máy — đúng privacy-as-feature.

## 12. Rủi ro & quyết định

- **Accuracy-trend "tuần" không trung thực được** với schema hiện tại (chỉ có tổng tích luỹ, không snapshot tuần) → **bỏ** khỏi recap (§4.3); recap dùng `newlyMasteredCount` + `stars` (đều đúng & on-device). Đây là **điều chỉnh roadmap** ("maybe accuracy trend" → *không*, có lý do). Accuracy *tích luỹ* vẫn hiện ở dashboard (không nhãn "tuần").
- **Đảo `SKILLS_FOR_GAME` nhập nhằng** (2 game cùng skill) → dùng **bảng tra hard-code** `PRACTICE_GAME_BY_SKILL` + test "mọi gameId ∈ registry". Tránh deep-link chết.
- **Nudge dễ trượt thành dark-pattern** → giữ **tĩnh, hướng cha mẹ, không tracking** (§8). Screen-time đếm phút **không xây** (không dữ liệu + sai triết lý).
- **`onPlayGame` deep-link chạm `App.tsx`** (một dây nối) → tối thiểu; nếu lo Phần D, có thể hoãn điều hướng (nút chỉ hiện tên). Mặc định: nối ngay (giá trị cha mẹ).
- **`getMasterySummary` không trả `masteredAt`/thời điểm** → recap cần hàng thô; lấy bằng **một** repo đọc-only thuần trong `parentInsights.ts` (không sửa file B, không thêm index — `profileId` đã index).
- **Không phá ParentArea cũ:** C **thêm** section, **không** đổi nhánh CRUD/stars/audio + selector test (§2, §10).

### Quyết định mở (cần con người — chỉ điều default không nên tự quyết)

1. **[QUYẾT ĐỊNH MỞ] Nút "Luyện tiếp" có deep-link vào trò ngay (chạm 1 dây ở `App.tsx`) hay chỉ hiện tên trò để Phần D nối flow?** *Khuyến nghị mặc định:* **deep-link ngay** (giá trị thật cho cha mẹ, dây nối nhỏ). Đảo nếu muốn giữ C thuần-trong-khu-phụ-huynh.
2. **[QUYẾT ĐỊNH MỞ — nhỏ] Có hiện tip đời thực cho cả dòng `emerging` không, hay chỉ `practice-next` + `mastered`?** *Khuyến nghị:* chỉ hai trạng thái sau (gọn, không ngợp). Bật thêm nếu muốn dày.

> Mọi thứ còn lại đã default hợp lý theo nghiên cứu (mastery > minutes; AAP no-guilt; privacy-as-feature) & ràng buộc code (đọc-only, không bump schema, không phá ParentArea). Hai mục trên là **cảm-giác sản phẩm**, không phải kỹ thuật.

## 13. Bàn giao & chia C1/C2

**Khuyến nghị: CHIA — C1 trước, C2 sau.** Lý do (giống tinh thần B1/B2):

- **C1 = nền thuần, 100% test được** (`parentInsights.ts` read helpers + `skillLabel` + `PRACTICE_GAME_BY_SKILL` + `parentTips.ts` nội dung). Không chạm React, review/merge nhanh, rủi ro thấp. Là **API ổn định** để C2 (và Phần D, nếu cần tip/insight) bám vào.
- **C2 = React UI** trong khu phụ huynh — chạm `ParentArea.tsx` (cẩn trọng giữ test cũ) + sub-component mới + CSS. Tách ra để rủi ro UI/regression không chặn phần data.
- **Cắt C1/C2:** C1 = §4, §6, §7-nội-dung-tĩnh + test C1. C2 = §5, §9 (component) + dây `onPlayGame` + test C2.

**Bàn giao chung:** review → fix → `test/build/lint/tsc` sạch → commit & push → cập nhật `ROADMAP.md` + sổ SDD `.superpowers/sdd/progress.md` + để lại **manual-test TODO** (mở khu phụ huynh với bé thật có dữ liệu mastery: kiểm dòng kỹ năng/tip/recap/privacy hiển thị đúng & dịu; nút "Luyện tiếp" deep-link đúng trò).
