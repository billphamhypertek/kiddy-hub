# KiddyHub — Giai đoạn 5 · Phần D: Mạch chơi liền lạc & gắn kết (Phase 5D Design)

> **Trạng thái:** Đặc tả (design SPEC) — chờ duyệt. Triển khai chia **D1 (mạch/flow: onboarding, không-ngõ-cụt, chuyển cảnh, deep-link, loading/empty — chủ yếu routing/`selectScreen`)** rồi **D2 (gắn kết: phiêu lưu hôm nay, Cáo bạn đồng hành, sưu tập, nối đời thực)** — xem §12.
> **Bản đồ GĐ5:** [`2026-06-20-kiddyhub-phase-5-roadmap.md`](./2026-06-20-kiddyhub-phase-5-roadmap.md) (§2 Phần D — phạm vi; §3 nguyên tắc — *gắn kết lành mạnh, Cáo ấm áp, nối đời thực, no dark-pattern*; §6 ranh giới) — đây là **hợp đồng** của Phần D.
> **Tiêu thụ Phần B:** [`2026-06-20-kiddyhub-phase-5b-learning-depth.md`](./2026-06-20-kiddyhub-phase-5b-learning-depth.md) §7 — `getDueItems(profileId, now, limit)`, `getMasterySummary(profileId)` (đã có trong `src/data/mastery.ts`). "Phiêu lưu hôm nay" curate từ mục đến-hạn/đang-yếu của B (đọc-only).
> **Tiêu thụ Phần C:** [`2026-06-20-kiddyhub-phase-5c-parent-dashboard.md`](./2026-06-20-kiddyhub-phase-5c-parent-dashboard.md) — deep-link "Luyện tiếp" (C để lại `practiceGameId` trong `ChildSkillView` nhưng **hoãn điều hướng** sang D — xác nhận ở §9). Nội dung `OFFLINE_TIP_BY_SKILL` (`src/content/parentTips.ts`) tái dùng cho cầu nối đời thực hướng-trẻ.
> **Tiền lệ giọng:** [`2026-06-20-kiddyhub-phase-5a-voice-neural.md`](./2026-06-20-kiddyhub-phase-5a-voice-neural.md) — câu Cáo MỚI phải đi qua **đúng pipeline** Piper (`scripts/build-voice-clips.mjs`) + có clip + test chống-drift bao phủ (như B làm với 6 câu hint).
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md) — "Giai đoạn 5 / Phần D".

---

## 1. Mục tiêu Phần D

Trục **chủ dự án nhấn mạnh nhất**: "mọi thứ mượt, không đứt gãy, cuốn hút, kích thích bé tham gia". Hai nửa:

- **Mạch (flow):** bé mở app lần đầu được dẫn dắt mượt mà tới lượt chơi đầu **không lạc**; **không màn nào là ngõ cụt**; loading/empty không cụt-lủn; chuyển cảnh liền mạch (mở rộng nền GĐ4D `ScreenTransition`); cha mẹ bấm "Luyện tiếp" ở khu của mình → **vào thẳng trò** (deep-link).
- **Gắn kết (engagement) — LÀNH MẠNH:** mỗi ngày Cáo gợi ý **2–3 trò** ("Cuộc phiêu lưu hôm nay") ưu tiên mục đến-hạn của B, **khung routine** (không streak, không đếm-tội, bỏ ngày không phạt); Cáo là **bạn đồng hành ấm áp** (chào, cổ vũ, làm mẫu — không bao giờ nài ép/hờn dỗi); **sưu tập hoàn-thành-được** gắn mốc mastery thật (không grind vô tận); cuối lượt **nối đời thực** dịu, tuỳ chọn, có giọng.

**DoD Phần D (từ roadmap §2):** bé mở app lần đầu được dẫn tới lượt chơi đầu không lạc; **không màn nào là ngõ cụt**; có "phiêu lưu hôm nay" + "chơi tiếp"; sưu tập gắn mastery; **không** dark-pattern; chuyển cảnh mượt; **reduced-motion** tôn trọng; mọi routing đổi đi qua **`selectScreen` thuần + test** (đóng — không nới — khe hở coverage của `App.tsx`); local-only.

> **Nguyên tắc đạo đức nền (roadmap §3 — đọc kỹ, là hợp đồng):** gắn kết **phục vụ mục tiêu của bé, không phải DAU**. **CẤM** (mọi mục dưới đây tự kiểm theo bảng §11): streak gây lo âu/loss-aversion · FOMO · autoplay · thông báo đẩy · lịch thưởng biến thiên kiểu máy đánh bạc · "quay lại không Cáo buồn"-type guilt. Thay bằng: **routine dịu** (không đếm), **Cáo cổ vũ & làm mẫu**, **sưu tập hoàn-thành-được gắn mastery**, **nối đời thực** (đẩy bé *rời* màn hình — phản-engagement có chủ đích, đúng triết lý "app là bổ trợ, không giữ trẻ").

## 2. Ranh giới — KHÔNG đụng tới gì (roadmap §6 + B §2 + C §2)

- **Routing đi qua `selectScreen` THUẦN (`src/state/selectScreen.ts`) + test (`selectScreen.test.ts`)** — **không** thêm nhánh điều hướng ad-hoc trong `App.tsx`. `App.tsx` coverage hạn chế (khe hở đã biết) → mọi quyết-định-màn mới phải là dữ liệu thuần trong `selectScreen`/helper thuần có test, `App.tsx` chỉ *render theo `kind`* + nối callback (mỏng). **Đóng khe hở, không nới.**
- **Logic & guard trò chơi:** `*Logic.ts`, `progression.ts`, `applyCompletion.ts`, `registry.ts`, `GameModule`/`GameHost`, guard `roundResolved`/`finished`/`answeredThisRound`, drag-snap/hit-area — **không phá**. D **không** sửa thân scene gameplay (chỉ thêm overlay nối-đời-thực **sau** khi round/level chốt — §8, không đụng vòng đời round).
- **`AudioManager` (`src/audio/AudioManager.ts`)** — **giữ nguyên** interface + nội tại. Cáo nói qua `audio.speak(key)` / `host.speak(key)` **đã có**. **Không** thêm method âm thanh mới.
- **`audioManifest.ts` / `prerecordedEngine.ts` / `voiceClips.ts` / pipeline Piper** — **chỉ THÊM** key Cáo mới (§7.3), không sửa 26 key cũ. Clip mới sinh qua `build-voice-clips.mjs` (script tự gom từ manifest), commit mp3 + index, test chống-drift `voiceClips.test.ts` tự bao phủ (thiếu clip ⇒ đỏ).
- **WRITE path mastery của B** (`recordItemResult`, `upsertMastery`, `MasterySession`, scheduler, scaffolding) — D **chỉ ĐỌC** (`getDueItems`, `getMasterySummary`). **Không** ghi `itemMastery`.
- **Bảng Dexie:** D thêm **một** bảng nhỏ `collection` (per-bé sưu tập sticker) + bump version **additive** (như B làm — §6.4). **Không** đụng schema `profiles`/`progress`/`starEvents`/`garden`/`settings`/`itemMastery`; **không** đổi `garden` singleton (chỉ ĐỌC để hiển thị, §6.2). Truy vấn "ngày phiêu lưu cuối" **không** cần bảng mới (suy từ `lastSeenAt` của `itemMastery` / `lastPlayedAt` của `progress` — §5.3).
- **ParentArea CRUD/stars/audio + dashboard C** (`ChildProgressList`, `ChildMasteryCard`, `WeeklyRecapCard`, `PrivacyNote`, `HealthyUseNote`) + test của chúng — **giữ nguyên hành vi + selector test**. D **chỉ thêm prop `onPlayGame`** xuống (chuỗi props mỏng) + đổi text-tĩnh "Luyện tiếp với trò: …" thành **nút** (§9). Không đụng nhánh CRUD/stars/audio/privacy.
- **`ParentGate` (cổng số học) + test** — không đụng; vẫn là lối vào khu phụ huynh.
- **Triết lý trẻ thơ (no-lose, no-dark-pattern):** §1 nguyên tắc nền. Mọi text Cáo dịu, **không guilt, không ép**. Vùng chạm lớn. Reduced-motion tôn trọng (React `usePrefersReducedMotion`, Phaser `prefersReducedMotion`).
- **Hạ tầng test:** alias `phaser → src/test/phaser-stub.ts`; `fake-indexeddb/auto` + `matchMedia` stub đã có trong `src/test/setup.ts`. Hàm thuần (curation, onboarding-step, collectibles unlock) test trong jsdom; scene/overlay Phaser chỉ kiểm thử **tay**. **Không** làm đỏ **343** test hiện có.
- **Local-only tuyệt đối:** không mạng, không tài khoản, không đẩy/xuất dữ liệu. Mọi curation/sưu tập tính cục bộ.

## 3. Bức tranh kiến trúc (một hình)

```
            ┌─────────────────── D1 — MẠCH / FLOW (routing thuần + test) ───────────────────────┐
src/state/  │  screens.ts:  + {name:'onboarding'} + game.from?:'adventure'|'parent'|'category'   │
  selectScreen.ts│  selectScreen(screen, hasProfile, hasAnyProfile?) → kind  (THUẦN, test)       │
  onboarding.ts  │   firstRunStep(profileCount, screen) → OnboardingStep  (THUẦN, test)          │
src/components/   │  GameContainer: loading có Cáo + lỗi-tải có nút "Thử lại" (không treo)        │
  Onboarding*.tsx │  Empty states: who/category/garden → "next" rõ (nút, không chỉ hint)         │
            └──────────────────────────────────────────────────────────────────────────────────────┘
                              ▲ App.tsx: render theo kind + nối callback (mỏng, không nhánh ad-hoc)
                              │
            ┌─────────────────── D2 — GẮN KẾT (engagement — lành mạnh) ─────────────────────────┐
src/data/   │  todaysAdventure.ts:  pickTodaysAdventure(args) → AdventurePick[]  (THUẦN, test)   │
  todaysAdventure.ts │   inputs: dueItems(B) · recentPlay · allGames · profileId · rng           │
  collection.ts      │  collectibles: STICKER_MILESTONES (THUẦN) + repo (Dexie bảng `collection`)│
                     │   unlockedStickers(masterySummary, gardenStars) → StickerId[] (THUẦN)     │
src/content/ │  foxLines.ts: greeting/cheer/model lines (key→{text,lang}) → manifest + Piper     │
  realWorldBridge.ts │  childBridgeLine(skillId) → {text,key?}  (THUẦN, reuse parentTips ý)      │
src/components/      │  TodaysAdventure (trên map) · StickerBook (trong/canh garden) ·           │
                     │  RealWorldBridge overlay (cuối lượt, sau celebrate — tuỳ chọn, có giọng)  │
            └──────────────────────────────────────────────────────────────────────────────────────┘
                              │ read-only:  getDueItems / getMasterySummary / getGarden (B,C đã có)
```

**Bất biến cốt lõi (giải "đồng bộ vs async" — theo tiền lệ B/C):** các hàm *quyết định* (`firstRunStep`, `pickTodaysAdventure`, `unlockedStickers`, `childBridgeLine`) **THUẦN & đồng bộ** (tiêm `now`/`rng`, không I/O) → test đầy đủ trong jsdom. Phần "đọc DB" (`getDueItems`, `getMasterySummary`, `getGarden`, repo `collection`) gói trong repo async, **await trong `useEffect`** rồi truyền dữ liệu xuống component thuần (đúng pattern `ChildProgressList`). **Không** await trong render, **không** await trong vòng đời round (overlay nối-đời-thực chạy *sau* khi round chốt).

---

## 4. Onboarding lần đầu (first-run) — dịu, Cáo dẫn, không ma sát

### 4.1 Vấn đề hiện tại (ngõ cụt mềm đã audit)

`WhoIsPlaying` khi **zero hồ sơ** hiện `<p className="hint">Chưa có bé nào. Bố mẹ hãy tạo hồ sơ nhé!</p>` — **một dòng chữ, KHÔNG có nút dẫn tới đâu**. Bé/cha mẹ phải tự phát hiện nút "👨‍👩‍👧 Bố mẹ" ở góc, qua **cổng số học** (`ParentGate`), tạo hồ sơ trong `ParentArea`, **thoát về `who`**, rồi mới chọn hồ sơ. Đây là **đứt gãy lần-đầu** đúng thứ roadmap muốn xoá. (Lưu ý: cổng số học **đúng** cho việc *quản trị* — không bỏ; nhưng *lần chạy đầu tiên* nên có một lối dắt dịu hơn.)

### 4.2 Trigger & luồng (thuần ở `firstRunStep`, render ở `App.tsx` theo `kind`)

**Trigger:** `profileCount === 0` (chưa có hồ sơ nào) **và** chưa ở giữa onboarding. Quyết định là **thuần**:

```ts
// src/state/onboarding.ts — THUẦN, test đầy đủ
export type OnboardingStep =
  | 'welcome'      // Cáo chào + nút "Bắt đầu" (cha mẹ chạm — gate nhẹ, KHÔNG số học)
  | 'create'       // nhập tên bé + chọn avatar (tái dùng AVATARS + add-child form)
  | 'done';        // có hồ sơ → thoát onboarding, vào map với trò gợi ý đầu

/** Lần chạy đầu cần dẫn dắt? Thuần: chỉ phụ thuộc số hồ sơ + màn hiện tại. */
export function needsOnboarding(profileCount: number, screen: Screen): boolean;

/** Bước onboarding kế tiếp từ trạng thái hiện có. Thuần, test xác định. */
export function firstRunStep(profileCount: number, current: OnboardingStep): OnboardingStep;
```

**Luồng (3 bước, tối thiểu ma sát):**

1. **`welcome`** — Cáo (`foxGuide()`) chào: "Chào bé! Mình là Cáo. Cùng tạo một bạn nhỏ để chơi nhé!" (voiced — `fox.welcome`, §7.3). Một nút lớn **"Bắt đầu"**. **Không cổng số học ở đây** (lần-đầu-mượt; cổng số học vẫn bảo vệ *khu phụ huynh* về sau, không bảo vệ việc tạo hồ sơ đầu tiên — đây là quyết định, §13 QĐ-mở 1).
2. **`create`** — **tái dùng** form add-child của `ParentArea` (input "Tên bé" + lưới `AVATARS`) trong một màn riêng, dịu, Cáo đứng cạnh làm mẫu. Lưu → `createProfile(...)`.
3. **`done`** — `setProfile(p)` (như `selectProfile`) → vào `map`. Map hiện **"Cuộc phiêu lưu hôm nay"** (D2) với 2–3 trò gợi ý — bé có lối-vào-trò-đầu **rõ ràng, không lạc** (đóng DoD "dẫn tới lượt chơi đầu không lạc").

> **Tích hợp với cổng-số-học hiện có:** onboarding **không thay** `ParentGate`. Sau lần đầu (đã có ≥1 hồ sơ), thêm hồ sơ tiếp theo vẫn qua `who → parentGate → parent` như cũ. Onboarding **chỉ** chen vào khi `profileCount === 0`. Khi cha mẹ vào khu phụ huynh xoá hết hồ sơ rồi thoát → lần mở `who` kế lại `profileCount === 0` → onboarding lại hiện (đúng & dịu, không phải lỗi).

### 4.3 Routing (qua `selectScreen` — KHÔNG nhánh ad-hoc)

- Thêm biến thể màn `{ name: 'onboarding'; step: OnboardingStep }` vào `Screen` (`src/state/screens.ts`).
- `selectScreen` nhận **thêm** đối số `hasAnyProfile: boolean` (App truyền `profileCount > 0`). Khi `screen.name === 'who'` **và** `!hasAnyProfile` **và** không phải đang ở parent flow → trả `kind: 'onboarding'` (key `onboarding:<step>`). Parent screens **vẫn** match trước (giữ guard D1 regression đã có).
- `App.tsx` render `case 'onboarding'` → `<OnboardingFlow .../>` (component mới, mỏng), callback `onCreated(p)` = `selectProfile(p)` (tái dùng), `onCancel` (nếu cha mẹ muốn vào khu phụ huynh thủ công) = `setScreen({name:'parentGate'})`. **Không** logic quyết-định trong App — chỉ render + nối.

> **Vì sao đặt quyết-định ở `selectScreen` + `onboarding.ts` thuần:** đóng khe hở coverage `App.tsx`. Mọi "khi nào hiện onboarding" test được không cần render React/DB. App chỉ là bộ chuyển `kind → view`.

## 5. "Cuộc phiêu lưu hôm nay" — curation dịu, routine (KHÔNG streak)

### 5.1 Hình thức & vị trí

Trên **`AdventureMap`** (đầu màn, trên lưới đảo), một dải **"Cuộc phiêu lưu hôm nay"** với **2–3 thẻ trò** Cáo gợi ý. Mỗi thẻ: icon trò + tên + chạm để chơi (qua `onPlay` đã có). Cáo (`foxGuide`) nói một lời mời ấm (`fox.adventure.invite`, §7.3) **một lần** khi map mở (không lặp ép).

**Khung "routine", KHÔNG "streak":**
- **Không đếm chuỗi ngày.** Không "Ngày thứ 5 liên tiếp!". Không huy hiệu streak.
- **Bỏ ngày = không phạt, không guilt.** Không "Bạn đã bỏ lỡ hôm qua". Không màu đỏ. Mở lại = lời chào ấm bình thường.
- **Tự làm mới mỗi ngày** (theo `weekKey`/ngày lịch cục bộ) — không hẹn giờ ép, không "nhanh lên kẻo hết".
- **Tuỳ chọn tuyệt đối:** bé có thể bỏ qua dải, chơi đảo bất kỳ. "Phiêu lưu hôm nay" là *gợi ý*, không *cổng*.

### 5.2 Hàm chọn THUẦN — `pickTodaysAdventure`

```ts
// src/data/todaysAdventure.ts — THUẦN, test đầy đủ (tiêm rng + dữ liệu, không DB)
export interface AdventureInput {
  dueItems: ItemMastery[];          // getDueItems(profileId, now) — B đã có (đọc-only)
  summary: SkillMastery[];          // getMasterySummary(profileId) — B đã có (đọc-only)
  recentGameIds: string[];          // gameId đã chơi gần đây nhất → gần xa (chống lặp)
  allGames: GameModule[];           // allGames() từ registry
  rng: Rng;                         // () => number, tiêm được (test xác định)
  count?: number;                   // mặc định 3 (kẹp 2..3)
}

export interface AdventurePick {
  gameId: string;
  title: string;
  reason: 'due' | 'fresh' | 'variety';   // vì sao gợi ý (cho test + có thể hiện icon nhỏ)
}

/** Chọn 2–3 trò gợi ý hôm nay. Xác định, thuần, test được. */
export function pickTodaysAdventure(input: AdventureInput): AdventurePick[];
```

**Thuật toán (xác định, thuần, **không-streak**, ưu-tiên-B nhưng đa-dạng):**

1. **Ánh xạ mục→trò:** với mỗi `dueItems` (đã sắp `dueAt` tăng), map `skillId → gameId` qua `PRACTICE_GAME_BY_SKILL` (đã có ở `parentInsights`). Gom theo `gameId`, đếm "số mục đến hạn" mỗi trò.
2. **Tầng A — "due" (ưu tiên B):** xếp các trò có mục đến-hạn theo (nhiều-mục-đến-hạn giảm, `dueAt` sớm nhất). Lấy tối đa `count` trò. `reason: 'due'`.
3. **Tầng B — "fresh" (đa dạng kỹ năng):** nếu còn slot, chọn trò thuộc **skill chưa xuất hiện** trong picks (kể cả trò non-SR — từ `allGames`), ưu tiên trò **chưa-trong** `recentGameIds` (chống lặp ngày). `reason: 'fresh'`.
4. **Tầng C — "variety" (lấp đầy):** nếu vẫn còn slot (bé mới, chưa có due), `rng` chọn trong `allGames` **trừ** đã-pick & ưu tiên non-recent. `reason: 'variety'`.
5. **Kẹp 2..3, khử trùng `gameId`.** Trong cùng hạng, `rng`-chọn-trong-nhóm-đồng-hạng → **không nhàm** (không luôn cùng 2 trò). **Không bao giờ ném**: thiếu dữ liệu → tầng C lấp từ `allGames`.

> **Vì sao không cần "streak infrastructure":** curation chỉ cần *ảnh chụp hôm nay* (due items + recent play) — **không** cần "số ngày liên tiếp", **không** cần cột mới. `recentGameIds` suy từ `progress.lastPlayedAt` (đã có) — §5.3. → **không bump schema cho adventure.** (Bảng `collection` ở §6 là cho *sưu tập*, độc lập.)

### 5.3 Dữ liệu cần — "ngày mở cuối" có đủ không?

**Đủ — KHÔNG xây streak.** Cần hai thứ, **cả hai đã có**:

- **`dueItems` / `summary`** — `getDueItems`/`getMasterySummary` của B (đọc-only).
- **`recentGameIds`** — suy từ `progress` (đã có `lastPlayedAt`, `gameId`): thêm **một** repo đọc-only thuần `getRecentGameIds(profileId, limit)` trong `src/data/progress.ts` (hoặc `todaysAdventure.ts`) = `db.progress.where('profileId').equals(profileId).toArray()` → sắp `lastPlayedAt` giảm → lấy `gameId`. **Không thêm cột/index** (`profileId` đã index). "Hôm nay đã chơi chưa" / "ngày phiêu lưu cuối" **không cần lưu riêng** — nếu sau muốn refresh-theo-ngày hiển thị, đọc `getWeekKey`/ngày từ `lastPlayedAt`. → **không "last adventure day" field.** **[QUYẾT ĐỊNH MỞ]** (§13 QĐ-mở 3): có muốn dải tự "khoá lựa chọn hôm nay" (cùng 2–3 trò cả ngày, đổi sang ngày mai) hay "tươi mỗi lần mở map"? Mặc định: **tươi-mỗi-lần-mở** (đơn giản, không cần lưu ngày; vẫn ổn định-trong-phiên vì dữ liệu B ít đổi giữa các lần mở map).

## 6. Sưu tập gắn mastery — sticker-book hoàn-thành-được (finite, local-only)

### 6.1 Quyết định: `garden` (gia đình) **giữ nguyên** + thêm **sticker per-bé** gắn mastery

Hiện có **`garden` singleton gia đình** (`src/data/stars.ts`): mọc theo **tổng sao** (`GARDEN_MILESTONES`: flower/bush/tree/rabbit/pond/butterflies tại 5/15/30/50/80/120 sao). Đây là sưu tập **theo nỗ-lực (sao)**, **gia đình chung**, đã hoàn-thành-được (6 mốc hữu hạn) — **on-brand, GIỮ NGUYÊN** (chỉ ĐỌC để hiển thị; xem §6.2 có làm phong phú thêm không).

Roadmap muốn sưu tập **gắn mastery THẬT** (không chỉ sao). Sao ≠ mastery (sao thưởng mọi lượt; mastery là box≥4 của B). → thêm **sticker-book per-bé** mở khoá theo **mốc mastery**:

```ts
// src/data/collection.ts — STICKER_MILESTONES THUẦN + repo Dexie bảng `collection`
export interface StickerMilestone {
  id: string;                 // 'first-mastery' | 'numbers-5' | 'letters-10' | ...
  label: string;              // 'Ngôi sao đầu tiên' (tiếng Việt, dễ thương)
  art: string;                // key SVG (tái dùng gardenItemArt / starArt / fox poses)
  rule: StickerRule;          // điều kiện mở khoá (thuần, đánh giá từ masterySummary)
}
export type StickerRule =
  | { kind: 'totalMastered'; atLeast: number }        // tổng mục đã thạo (mọi skill)
  | { kind: 'skillMastered'; skillId: SkillId; atLeast: number } // thạo N mục một skill
  | { kind: 'skillsTouched'; atLeast: number };       // số skill đã "đang lên" trở lên

/** THUẦN: từ summary của B → danh sách sticker đã mở khoá. Hữu hạn, hoàn-thành-được. */
export function unlockedStickers(summary: SkillMastery[]): string[];
```

- **Hữu hạn & hoàn-thành-được:** `STICKER_MILESTONES` là **danh sách cố định** (đề xuất ~12 sticker: "mục thạo đầu tiên", "thạo 5/10/15 mục", "thạo 5 chữ", "thạo cả 10 số", "chạm 3 kỹ năng", "thạo một màu"…). Có **trần** → bé có thể *sưu tập đủ* → **không grind vô tận** (roadmap §8 cấm "grind vô tận").
- **Gắn mastery THẬT:** mọi `rule` đánh giá từ `getMasterySummary` (box≥4 = thạo) — **không** từ sao. → "sưu tập gắn mastery thật" đúng nghĩa.
- **`unlockedStickers` THUẦN** (tiêm `summary`) → test đầy đủ. Repo: `getCollection(profileId)` / `syncCollection(profileId, summary)` (đọc summary → tính unlocked → upsert những cái MỚI, ghi `unlockedAt` để hiện "mới mở"). Đồng-bộ gọi **khi mở StickerBook / sau khi chơi xong** (không trong vòng round).

### 6.2 `garden` gia đình — làm phong phú thêm? (tuỳ chọn)

**[QUYẾT ĐỊNH MỞ]** (§13 QĐ-mở 4): có **mở rộng `GARDEN_MILESTONES`** (thêm mốc cao hơn 120 sao + nhiều vật mọc dễ thương hơn) để vườn "mọc phong phú" như roadmap gợi ý không? **Mặc định:** **KHÔNG đụng `garden`** (giữ singleton + milestones nguyên — tránh rủi ro chạm `stars.ts` WRITE path) và dồn "phong phú" vào **sticker-book per-bé** (sạch hơn: garden = gia đình/sao, sticker = cá nhân/mastery). Nếu chủ dự án muốn vườn rậm hơn, chỉ cần **thêm phần tử vào `GARDEN_MILESTONES`** (additive, art mới) — rẻ, nhưng là quyết-định-cảm-giác.

### 6.3 Nơi xem sưu tập

- **Sticker-book per-bé:** một màn/section mới `StickerBook` — **đặt cạnh/trong `StarGarden`** (cùng "phần thưởng"). `StarGarden` hiện có nút back về map; thêm **tab/section "Bộ sưu tập của <tên bé>"** dưới vườn gia đình, lưới sticker (mở khoá = màu, chưa = bóng mờ + "?", **không** đếm-ngược/khoá-FOMO). Sticker mới mở → nhãn dịu "Mới!" (không animation ép, reduced-motion tôn trọng).
- **Vào từ map** qua nút "Vườn sao" đã có (StarGarden trở thành "Vườn & Bộ sưu tập"). Không thêm điểm điều hướng mới gây rối.

### 6.4 Dexie bump (ADDITIVE — `src/data/db.ts`, theo tiền lệ B §4.3)

Thêm `.version(3)` liệt-kê-lại mọi bảng cũ y nguyên + bảng `collection`:

```ts
collection: '++id, profileId, [profileId+stickerId]',   // mới
// (bảng cũ giữ NGUYÊN khai báo — không migrate, không mất dữ liệu)
```

- `[profileId+stickerId]` — upsert/đọc một sticker của bé. Bảng nhỏ (≤ ~12 hàng/bé).
- Bản hiện tại là `.version(2)` (B). D thêm `.version(3)`. **Additive, không phá** (test "bảng cũ mở được sau bump v3").

## 7. Cáo bạn đồng hành (deeper) — ấm áp, KHÔNG bao giờ ép/guilt

### 7.1 Cáo xuất hiện ở đâu & nói gì (mở rộng hiện có, không lạm dụng)

Cáo (SVG, render được trong **React DOM** qua `SvgArt` — đã dùng ở `AdventureMap`/`WhoIsPlaying`/`StarGarden`; và trong **Phaser** qua `addArt` ở `celebrate`). Mở rộng **có chừng mực** (Cáo nhiều quá → nhiễu; ít quá → lạnh):

| Nơi | Pose | Khi nào nói | Câu (key) | Tông |
|---|---|---|---|---|
| Onboarding `welcome` | `foxGuide` | mở màn | `fox.welcome` | chào, mời tạo bạn nhỏ |
| AdventureMap | `foxGuide` (đã có) | mở map (một lần/lần-mở) | `fox.adventure.invite` | mời "phiêu lưu hôm nay" ấm |
| StickerBook | `foxCheer` | mở khoá sticker MỚI | `fox.sticker.new` | khen mốc mastery (không ép tiếp) |
| Cuối lượt (overlay đời thực) | `foxIdle`/`foxGuide` | sau `celebrate` (tuỳ chọn) | `fox.bridge.*` (§8) | mời thử-đời-thực, dịu |
| WhoIsPlaying | `foxIdle` (đã có) | greet `who.title` (đã có) | — | giữ nguyên |

- **Cổ vũ & làm mẫu, KHÔNG nài ép.** Mọi câu **không** có "quay lại nhé kẻo Cáo buồn", "đừng bỏ Cáo", "chỉ còn X phút". Cáo **khen điều bé đã làm** và **mời** (bé tự do từ chối).
- **Reduced-motion:** Cáo là SVG tĩnh (React) hoặc tween Phaser đã no-op dưới reduced-motion (`animateIn`/`celebrate` qua `prefersReducedMotion`) — không thêm animation Cáo ép buộc.
- **Tôn trọng toggle giọng:** mọi `fox.*` phát qua `audio.speak(key)` (đã gác `voiceOn` trong AudioManager) — tắt giọng thì Cáo **im** (vẫn hiện hình, vẫn dùng được — no-lose độc lập âm thanh).

### 7.2 KHÔNG làm (dark-pattern Cáo — cấm)

- Không Cáo "buồn"/"khóc" khi bé rời/không-chơi (guilt). Không thông báo đẩy "Cáo nhớ bé". Không Cáo chặn lối thoát ("chơi thêm một trò nữa nhé?" kiểu nag lặp). Không autoplay trò kế. Không đếm ngược "Cáo đợi bé 3..2..1".

### 7.3 Câu giọng Cáo mới — qua đúng pipeline Piper (BẮT BUỘC)

Thêm key vào `AUDIO_MANIFEST.voices` (vi-VN), sinh clip qua `scripts/build-voice-clips.mjs` (script tự gom từ manifest — chỉ thêm key), commit mp3 + `voiceClips.ts`, test chống-drift `voiceClips.test.ts` tự bao phủ. Đề xuất (tông ấm, không ép — chốt chữ ở cổng giọng đầu D2):

```ts
'fox.welcome':          { text: 'Chào bé! Mình là Cáo. Cùng tạo một bạn nhỏ để chơi nhé!', lang: 'vi-VN' },
'fox.adventure.invite': { text: 'Hôm nay Cáo chọn vài trò vui cho bé này!',                lang: 'vi-VN' },
'fox.sticker.new':      { text: 'Tuyệt quá, bé vừa mở được một hình mới!',                  lang: 'vi-VN' },
'fox.bridge.count':     { text: 'Bé thử đếm ba món đồ thật quanh nhà nhé!',                 lang: 'vi-VN' },
'fox.bridge.letter':    { text: 'Bé thử tìm một chữ cái trên hộp sữa nhé!',                 lang: 'vi-VN' },
'fox.bridge.color':     { text: 'Bé thử tìm một món đồ cùng màu quanh nhà nha!',            lang: 'vi-VN' },
'fox.bridge.generic':   { text: 'Bé thử chơi điều vừa học ngoài đời với bố mẹ nhé!',        lang: 'vi-VN' },
```

> **Cổng giọng (như A/B):** bước đầu D2 = thu thử các câu, nghe nhanh; tông không đạt → đổi `text` + chạy lại script. Build/CI/Docker **không** cần Piper (clip đã commit); thiếu clip → fallback Web Speech (không treo).

## 8. Nối đời thực cuối lượt — gentle, optional, voiced (giao với C)

### 8.1 Cơ chế (KHÔNG đụng vòng đời round)

Cuối **lượt** (khi `onComplete`/level chốt — *sau* `celebrate`), một **overlay React nhẹ** (trong `GameContainer`, **ngoài** canvas Phaser, sau khi scene báo xong) **hoặc** một câu Cáo + dòng chữ trên màn celebrate, mời thử-đời-thực:

- **Tuỳ chọn tuyệt đối:** một thẻ dịu "Thử ngoài đời nhé?" với **một** gợi ý hướng-trẻ + nút "Xong/Tiếp". Bé/cha mẹ bỏ qua = không phạt. **Không** chặn lối về map.
- **Có giọng:** Cáo nói `fox.bridge.*` (§7.3) theo skill chính của trò vừa chơi.
- **Sau celebrate, không xen vòng round:** overlay chỉ dựng **khi `onComplete` đã chạy** (round/level đã chốt, sao đã ghi) → **không** đụng guard/`generateRound`/`applyCompletion`. Đây là điểm an toàn nhất để chèn (đúng ranh giới §2).

### 8.2 Nội dung hướng-trẻ — `childBridgeLine` (thuần, tái dùng ý parentTips)

`parentTips.OFFLINE_TIP_BY_SKILL` là **hướng-cha-mẹ** ("Hỏi bé…", "Cùng bé…"). Trẻ cần câu **hướng-trẻ, ngắn, một-mệnh-lệnh-vui**:

```ts
// src/content/realWorldBridge.ts — THUẦN, test exhaustive
/** Câu hướng-TRẺ (ngắn, vui) + key giọng Cáo cho skill chính của trò. */
export function childBridgeLine(skillId: SkillId): { text: string; voiceKey: string };
// vd: number-vi/number-en → {'Thử đếm 3 món đồ thật quanh nhà nhé!', 'fox.bridge.count'}
//     letter-* → {'Tìm một chữ cái trên hộp sữa xem nào!', 'fox.bridge.letter'}
//     color-*/shape → {'Tìm một món đồ cùng màu trong phòng nhé!', 'fox.bridge.color'}
//     còn lại (skill-level) → {'Chơi điều vừa học ngoài đời với bố mẹ nha!', 'fox.bridge.generic'}
```

- **Skill chính của trò:** `SKILLS_FOR_GAME[gameId]?.[0]` (đã có); trò non-SR → `'generic'`. Map skill→câu là **bảng tra thuần**, test exhaustive (mọi SkillId có câu + voiceKey hợp lệ).
- **Tái dùng ý `parentTips` (DRY tinh thần):** cùng *hoạt động đời thực* (đếm đồ/tìm chữ/săn màu) nhưng **giọng văn hướng-trẻ** — giữ một nguồn *ý tưởng*, hai *cách nói* (cha-mẹ vs trẻ). Không sửa `parentTips.ts`.

### 8.3 Tần suất (chống nhàm/ép)

- **Không mỗi-lượt.** Hiện bridge **thưa** (vd ~1/3 lượt, hoặc chỉ khi vừa-đạt-mốc-mastery) để không thành nghi-thức-bắt-buộc gây chán. **[QUYẾT ĐỊNH MỞ]** (§13 QĐ-mở 5): tần suất bridge — *mỗi lượt* (đậm, dễ thành nhàm) vs *thưa/ngẫu-nhiên-dịu* vs *chỉ khi vừa thạo mục mới*. Mặc định: **thưa, rng-dịu (~1/3)**, **không** mỗi lượt.

## 9. Deep-link "Luyện tiếp" (deferred từ C) — wire qua state, KHÔNG ad-hoc

### 9.1 Trạng thái hiện tại (xác nhận từ code)

`ChildMasteryCard` (Phần C) **đã có** `practiceGameId`/`practiceGameTitle` trong `ChildSkillView`, nhưng render **chữ tĩnh**:

```tsx
<p className="practice-game">Luyện tiếp với trò: {v.practiceGameTitle}</p>   // KHÔNG nút, điều hướng HOÃN sang D (ghi chú ngay trong code C)
```

→ Phần D **chính là** chỗ biến nó thành **nút deep-link**.

### 9.2 Thiết kế (state + transition + route, đi qua `selectScreen`)

1. **`Screen` game thêm gốc:** `{ name: 'game'; gameId; level; from?: 'category' | 'adventure' | 'parent' }`. `from` chỉ để **transition** & **đường-về** (xem §9.3) — `selectScreen` vẫn trả `kind:'game'`, key `game:<gameId>` (giữ test cũ xanh, không đổi chữ ký quyết-định cốt lõi).
2. **Chuỗi prop `onPlayGame(gameId)`** (đã đề xuất ở C §7.1, nay nối): `App.tsx` truyền `onPlayGame` → `ParentArea` → `ChildProgressList` → `ChildMasteryCard`. `App.onPlayGame(gameId)` = đọc `getProgress(profile?...)` — **nhưng khu phụ huynh không có `profile` đang chọn** → cần chọn-bé. Hai cách (§9.4).
3. **`App.tsx` map:** `onPlayGame(gameId, profileId)` → `setProfile(thatChild)` + `setScreen({ name:'game', gameId, level: prog?.level ?? 1, from:'parent' })`. Đây là **một dây nối mỏng** (không nhánh quyết-định — quyết-định "màn gì" vẫn ở `selectScreen`).

### 9.3 Đường-về sau khi chơi từ khu phụ huynh

- `onGameExit` hiện luôn về `map`. Với `from:'parent'`, **về đâu?** Trẻ đang chơi → về **`map`** (bé tiếp tục chơi) là tự nhiên & an toàn (không đẩy bé về *khu phụ huynh* sau cổng số học). `from` dùng để: nếu muốn, transition khác; và để **không** coi đây là ngõ cụt. Mặc định: **về `map`** (bé đã được `setProfile`). **[QUYẾT ĐỊNH MỞ — nhỏ]** có thể về lại khu phụ huynh, nhưng đẩy-bé-qua-cổng-số-học là lạ → khuyến nghị **về map**.

### 9.4 Chọn-bé khi deep-link từ khu phụ huynh

Khu phụ huynh hiển thị **nhiều bé**; nút "Luyện tiếp" nằm trong `ChildMasteryCard` của **một** bé cụ thể → `onPlayGame` mang theo **`profileId` của card đó**: `onPlayGame(gameId, profileId)`. `App` `setProfile(profiles.find(id))` rồi vào game. → **không mơ hồ** "bé nào". (`ChildProgressList` đã có `profile` mỗi card — truyền `profile.id` xuống.)

### 9.5 Test (đóng khe hở, không nới)

- `selectScreen.test.ts`: thêm ca `{name:'game', gameId, level, from:'parent'}` → `{key:'game:<id>', kind:'game'}` (giữ ổn định bất kể `from`).
- `onboarding.test.ts` (mới): `needsOnboarding`/`firstRunStep` xác định.
- `ChildMasteryCard.test.tsx` (mở rộng, **giữ test cũ**): practice-next có `practiceGameId` → render **nút** (`role=button`, nhãn "Luyện tiếp với <tên trò>"); click → gọi `onPlayGame(gameId, profileId)` (spy). Không có `onPlayGame` (cha mẹ ngữ-cảnh chỉ-xem) → giữ chữ tĩnh (backward-safe).

## 10. Điều hướng không-ngõ-cụt — audit & fix (D1 trọng tâm)

### 10.1 Bảng audit dead-end / loading / empty (hiện trạng → fix)

| # | Màn / trạng thái | Hiện trạng (đã audit, quote) | Vấn đề | Fix (Phần D) | Định tuyến qua |
|---|---|---|---|---|---|
| 1 | `WhoIsPlaying` — **zero hồ sơ** | `<p className="hint">Chưa có bé nào. Bố mẹ hãy tạo hồ sơ nhé!</p>` | **Ngõ cụt mềm**: chỉ chữ, không nút dẫn; phải tự tìm "Bố mẹ" → cổng số học → tạo → thoát | **Onboarding lần-đầu** (§4): `profileCount===0` → màn `welcome` Cáo dẫn + nút "Bắt đầu" → tạo bé → vào map | `selectScreen` (+`hasAnyProfile`) → `kind:'onboarding'` |
| 2 | `WhoIsPlaying` — đang tải | `<p>Đang tải…</p>` (chữ trần) | Cụt-lủn, không thương hiệu | Skeleton dịu + Cáo idle nhỏ (tái dùng `foxIdle`), giữ logic | component (không đổi route) |
| 3 | `GameContainer` — đang tải | `<div className="game-loading">Đang tải trò chơi…</div>` (chữ trần) | Không thương hiệu | Card loading có **Cáo + tên trò** ("Đang mở <tên trò>…") + spinner dịu | component |
| 4 | `GameContainer` — **lỗi tải scene** | **Không try/catch**: `Promise.all([loadScene…])` reject → loading **treo vĩnh viễn** | **Ngõ cụt cứng**: kẹt "Đang tải…" mãi | **`.catch`** set `error` state → card "Ôi, trò chơi chưa mở được" + nút **"Thử lại"** (chạy lại effect) + nút **"Về bản đồ"** (`onExit()`) | component + `onExit` (route đã có) |
| 5 | `CategoryScreen` — nhóm rỗng | `<p className="hint">Sắp có trò chơi mới ở đây!</p>` | Không có "next" (chỉ back ⬅️ có sẵn) | Giữ câu + đảm bảo **nút back rõ** (đã có) + Cáo idle dịu; (mọi nhóm hiện đều có trò → hiếm gặp) | — (back đã có) |
| 6 | `StarGarden` — chưa có sao | `{items.length === 0 && <p className="hint">Hãy chơi để vườn lớn lên nhé!</p>}` | Không lối "đi chơi ngay" | Thêm nút dịu **"Đi chơi nào!"** → `onBack()` (về map) (không ép) | `onBack` (route đã có) |
| 7 | `AdventureMap` — **không có "next"/đà chơi** | Không "phiêu lưu hôm nay", không "chơi tiếp", không greeting Cáo nói | Thiếu đà & gợi ý (DoD roadmap) | **"Cuộc phiêu lưu hôm nay"** (§5) + Cáo mời (`fox.adventure.invite`) | `onPlay` (đã có) |
| 8 | `AdventureMap` — không có back về `who` | Header chỉ avatar + "Vườn sao"; không nút "đổi bé" | Không thực-sự ngõ cụt (đóng app), nhưng thiếu "đổi bé" | **[QUYẾT ĐỊNH MỞ — nhỏ]** thêm nút nhỏ "Đổi bạn chơi" (avatar) → `setScreen({name:'who'})`? Mặc định: **thêm**, dịu, giảm cảm-giác-kẹt | `setScreen({name:'who'})` (route đã có) |
| 9 | `ParentArea` — "Luyện tiếp" | chữ tĩnh "Luyện tiếp với trò: …" (điều hướng hoãn) | Không deep-link (giá trị cha mẹ mất) | **Nút deep-link** (§9) | `onPlayGame` → `selectScreen` |
| 10 | Cuối lượt | `celebrate` Phaser; về `map`; **không** nối đời thực | Thiếu chuyển-giao đời thực (DoD) | **Overlay nối đời thực** dịu, tuỳ chọn, có giọng (§8) | sau `onComplete` (không route mới) |

### 10.2 Chuyển cảnh mượt (mở rộng `ScreenTransition`, reduced-motion)

- `ScreenTransition` hiện **enter-only** (cross-fade + slide-up ~250ms), remount theo `screenKey`, no-op dưới `usePrefersReducedMotion`. **Giữ kiến trúc**, chỉ:
  - Đảm bảo **mọi `kind` mới** (`onboarding`) có `key` ổn định (đã lo trong `selectScreen`) → transition replay đúng.
  - **Không** thêm exit-choreography (giữ "đơn giản & robust" như chú thích hiện có). Onboarding step-to-step dùng cùng `screen-enter` qua key `onboarding:<step>`.
  - Overlay nối-đời-thực & sticker "Mới!" dùng **token motion sẵn** (`durations`/`easings` từ `src/motion/tokens.ts`), no-op dưới reduced-motion (kiểm bằng hook/`prefersReducedMotion`).

## 11. Tự-kiểm dark-pattern (bắt buộc — roadmap §3 cấm)

| Dark-pattern (cấm) | Phần D có dính? | Bằng chứng thiết kế |
|---|---|---|
| Streak phạt / loss-aversion | **Không** | §5.1: không đếm chuỗi, bỏ ngày không phạt, không "đã bỏ lỡ" |
| FOMO / đếm-ngược | **Không** | §5.1, §6.3: sticker chưa-mở = bóng mờ "?", không đồng hồ; "phiêu lưu" không hết-hạn |
| Autoplay | **Không** | §7.2: không tự mở trò kế; mọi lượt do bé chạm |
| Push-notify | **Không** | local-only, không service đẩy (§2) |
| Lịch thưởng biến thiên (gambling) | **Không** | §6: sticker mở theo **mastery xác định** (box≥4), không xác-suất; sao theo lượt (đã có) |
| Guilt / "Cáo buồn" | **Không** | §7.2: Cáo chỉ khen & mời, không hờn dỗi/nài |
| Nag lặp giữ-chân | **Không** | §7.1: Cáo nói **một lần/lần-mở**; nối-đời-thực **thưa**, tuỳ chọn |
| Giữ-trẻ (anti ra-ngoài) | **Không** (ngược lại) | §8: chủ động đẩy bé *rời* màn ra đời thực |

> Nếu một quyết-định-mở (§13) bị chọn theo hướng "đậm hơn", phải **tái kiểm bảng này** — đặc biệt tần suất bridge (QĐ-mở 5) và refresh-adventure (QĐ-mở 3).

## 12. Bàn giao & chia D1/D2

**Khuyến nghị: CHIA — D1 trước, D2 sau** (tinh thần B1/B2, C1/C2):

- **D1 = MẠCH / FLOW** (chủ yếu routing thuần + component, rủi ro thấp, đóng khe hở `App.tsx`):
  - §4 onboarding (`screens.ts` + `selectScreen` + `onboarding.ts` thuần + `OnboardingFlow` component)
  - §10 audit fixes #1–#6, #8 (loading/empty/dead-end: GameContainer lỗi-tải + Cáo loading; who/garden empty có "next"; "đổi bạn chơi")
  - §10.2 transitions (mở rộng key, reduced-motion)
  - §9 deep-link "Luyện tiếp" (state `from` + `onPlayGame` chain + nút trong `ChildMasteryCard`)
  - **Test:** `selectScreen.test.ts` (mở rộng), `onboarding.test.ts` (mới), `ChildMasteryCard.test.tsx` (nút). Đa số **thuần/RTL** → tự động.
- **D2 = GẮN KẾT** (engagement, chạm content/giọng/Phaser-overlay, kiểm thử tay nhiều hơn):
  - §5 "Cuộc phiêu lưu hôm nay" (`todaysAdventure.ts` thuần + `getRecentGameIds` repo + `TodaysAdventure` component trên map)
  - §6 sưu tập sticker (`collection.ts` thuần + Dexie v3 + `StickerBook` + repo)
  - §7 Cáo lines (manifest + Piper clip) + đặt Cáo các nơi
  - §8 nối đời thực (`realWorldBridge.ts` thuần + overlay cuối lượt + `fox.bridge.*` clip)
  - **Test:** `todaysAdventure.test.ts`, `collection.test.ts`, `realWorldBridge.test.ts` (thuần) + `voiceClips.test.ts` (đỏ→xanh sau Piper). Overlay/scene Cáo: **kiểm thử tay**.

**Vì sao chia:** D1 là *mạch* (xoá ngõ cụt — giá trị "không đứt gãy" thấy ngay, routing-test-được, rủi ro thấp, không cần Piper). D2 là *gắn kết* (cần clip Cáo + Phaser overlay + bảng mới — rủi ro giọng/scene không nên chặn D1). D1 cũng **mở khoá** trải nghiệm lần-đầu (quan trọng nhất cho "cuốn hút") sớm.

**Bàn giao chung (mỗi phần con):** review → fix → `test/build/lint/tsc` sạch → commit & push → cập nhật `ROADMAP.md` + sổ SDD `.superpowers/sdd/progress.md` + để lại **manual-test TODO** (§13.2).

## 13. Rủi ro, quyết định & manual-test

### 13.1 Rủi ro & giảm thiểu

- **`App.tsx` coverage hạn chế (khe hở đã biết):** mọi quyết-định-màn mới (onboarding, deep-link) đặt ở `selectScreen`/`onboarding.ts`/`pickTodaysAdventure` **thuần + test**; `App.tsx` chỉ render theo `kind` + nối callback. **Đóng, không nới.**
- **GameContainer lỗi-tải treo (ngõ cụt cứng hiện có):** thêm `.catch` + state lỗi + "Thử lại"/"Về bản đồ" — đây là **sửa lỗi thật** đã audit, ưu tiên cao trong D1.
- **Phaser overlay nối-đời-thực phá vòng round:** đặt **sau `onComplete`** (round/level đã chốt) → không đụng guard/`generateRound`/`applyCompletion`. Overlay là React (ngoài canvas) hoặc câu Cáo sau `celebrate` — kiểm thử tay.
- **Cáo nói quá nhiều → nhiễu:** giới hạn **một lần/lần-mở** mỗi màn; bridge **thưa**; tôn trọng toggle giọng.
- **Chất lượng clip Cáo Piper:** cổng giọng đầu D2 (như A/B) — nghe trước khi nối dây; build/CI không cần Piper.
- **Dexie v3 bump:** additive (liệt-kê-lại bảng cũ), test "bảng cũ mở được sau v3".
- **`pickTodaysAdventure` "vắt"/nhàm:** phân-tầng + rng-trong-nhóm + `recentGameIds` chống lặp — cảm-giác xác nhận bằng kiểm thử tay với trẻ.

### 13.2 Manual-test TODO (để lại sau mỗi phần con)

- **D1:** mở app **lần đầu (DB sạch)** → onboarding Cáo dẫn → tạo bé → vào map có "phiêu lưu hôm nay" (không lạc); ép `loadScene` lỗi → thấy "Thử lại"/"Về bản đồ" (không treo); empty who/garden có nút "next"; "Luyện tiếp" trong khu phụ huynh → vào đúng trò đúng bé → thoát về map; transitions mượt + bật reduced-motion thấy tức-thì.
- **D2:** chơi nhiều phiên một bé → "phiêu lưu hôm nay" đổi hợp lý, ưu tiên mục đến-hạn; thạo mục → mở sticker mới (Cáo khen, không ép); cuối lượt thi thoảng thấy nối-đời-thực có giọng (bỏ qua được); tắt giọng → Cáo im nhưng mọi thứ vẫn dùng được; mở StickerBook thấy mở-khoá vs bóng-mờ "?" (không FOMO).

### 13.3 Quyết định mở (cần con người — chỉ điều default không nên tự quyết)

> Roadmap dặn: với Phần D **không over-default cảm-giác** — nên đây là 5 quyết-định *thật* về product-feel/scope, mỗi cái có options + khuyến nghị.

1. **[QUYẾT ĐỊNH MỞ] Onboarding lần-đầu có cần "gate người lớn" không, và mức nào?**
   - (a) **Không gate** (mặc định khuyến nghị) — lần đầu DB sạch, không gì để bảo vệ; ma sát = phản-onboarding. Cổng số học **vẫn** bảo vệ khu phụ huynh về sau.
   - (b) Gate nhẹ "chạm và giữ" / "bố mẹ chạm vào đây" (không số học) trước bước tạo bé.
   - (c) Gate số học đầy đủ ngay từ tạo-bé-đầu (an toàn nhất, ma sát cao nhất).
   - *Khuyến nghị:* **(a)** — mượt nhất, đúng "không ma sát"; rủi ro thấp (chưa có dữ liệu để lạm dụng).

2. **[QUYẾT ĐỊNH MỞ] Sưu tập gắn mastery: chỉ sticker-book per-bé, hay cả mở rộng vườn sao gia đình?**
   - (a) **Chỉ thêm sticker-book per-bé** (mặc định) — garden giữ nguyên (không chạm `stars.ts` WRITE); phân vai sạch (garden=gia đình/sao, sticker=cá nhân/mastery).
   - (b) Cả hai — thêm mốc/vật vào `GARDEN_MILESTONES` cho vườn "rậm" hơn (additive, rẻ, nhưng chạm `stars.ts`).
   - *Khuyến nghị:* **(a)** — gắn-mastery-thật nằm ở sticker; vườn rậm thêm là tô-điểm, làm sau nếu thích.

3. **[QUYẾT ĐỊNH MỞ] "Cuộc phiêu lưu hôm nay" — khoá lựa chọn theo ngày hay tươi-mỗi-lần-mở map?**
   - (a) **Tươi mỗi lần mở map** (mặc định) — không lưu "ngày phiêu lưu", đơn giản nhất, vẫn ổn-định-trong-phiên (dữ liệu B ít đổi).
   - (b) Khoá cùng 2–3 trò cả ngày (cần lưu `lastAdventureDay` + picks) — "nghi thức ngày" rõ hơn, nhưng thêm state & gần với "nhiệm-vụ-hằng-ngày" (cẩn trọng không trượt thành quest-streak).
   - *Khuyến nghị:* **(a)** — nhẹ, an toàn triết lý; tránh xây "ngày" không cần.

4. **[QUYẾT ĐỊNH MỞ] Số lượng & "trần" sticker — bao nhiêu là "đủ để sưu tập hết" mà vẫn có đà?**
   - (a) **~12 sticker** (mặc định) — đủ mốc ý nghĩa (mục đầu/5/10/15, một skill thạo, chạm-nhiều-skill), hoàn-thành-được trong vài tuần chơi đều.
   - (b) Ít hơn (~6, nhanh đủ — rủi ro "hết để sưu tập") / Nhiều hơn (~24, lâu — rủi ro giống grind).
   - *Khuyến nghị:* **(a)** — cân giữa "có đích" và "không grind". Danh sách cụ thể chốt khi triển khai (THUẦN, dễ đổi).

5. **[QUYẾT ĐỊNH MỞ] Tần suất "nối đời thực" cuối lượt.**
   - (a) **Thưa / rng-dịu (~1/3 lượt)** (mặc định) — có mặt nhưng không thành nghi-thức-bắt-buộc gây nhàm.
   - (b) Mỗi lượt (đậm — chuyển-giao đời thực tối đa, nhưng dễ nhàm/bị bỏ qua như spam).
   - (c) Chỉ khi vừa-thạo-mục-mới (ý nghĩa nhất, nhưng hiếm → ít chuyển-giao).
   - *Khuyến nghị:* **(a)**, với khả năng nâng lên (c)-kết-hợp nếu kiểm thử tay thấy bé hưởng ứng.

> Các điều chỉnh roadmap nhỏ (cần orchestrator gật): thêm bảng Dexie `collection` + `.version(3)` (additive); thêm trường `from?` vào `Screen.game` (không đổi `kind`); thêm đối số `hasAnyProfile` cho `selectScreen` + biến thể `{name:'onboarding'}`; thêm ~7 key giọng Cáo vào manifest (qua Piper). Không phần nào phá schema/guard/logic cũ.
