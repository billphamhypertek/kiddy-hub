# KiddyHub — Giai đoạn 3 Bản thiết kế (Phase 3 Design)

> **Trạng thái:** Đã duyệt thiết kế (2026-06-20). Spec triển khai: **Giai đoạn 3 — Đủ 16 trò (làm 9, dời #10)**.
> **Bản thiết kế tổng:** [`2026-06-19-kiddyhub-design.md`](./2026-06-19-kiddyhub-design.md) (§9 danh sách trò, §10 đồ hoạ emoji tạm tới GĐ4).
> **Tiền lệ GĐ2:** [`2026-06-19-kiddyhub-phase-2-design.md`](./2026-06-19-kiddyhub-phase-2-design.md).
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md).
> **Plan triển khai checkbox:** [`../plans/2026-06-20-kiddyhub-phase-3.md`](../plans/2026-06-20-kiddyhub-phase-3.md) (viết sau khi duyệt spec này).

---

## 1. Mục tiêu Giai đoạn 3

Sau GĐ2, cả 6 đảo đều có ≥1 trò chơi được (6 trò: `counting-fun`, `letter-spotting`, `pattern-finder`, `first-words`, `memory-match`, `jigsaw`). §9 bản thiết kế tổng đặt mục tiêu **16 trò**; còn lại 10 trò (#2,#3,#5,#7,#8,#10,#12,#14,#15,#16).

**Mục tiêu GĐ3:** thêm **9 trò** — #2, #3, #5, #7, #8, #12, #14, #15, #16. **Trò #10 "Tìm Điểm Khác" dời sang GĐ4** vì cơ chế "điểm khác" chỉ có ý nghĩa với ảnh thật (emoji tạm không tạo được khác biệt tinh tế); GĐ4 sẽ làm cùng lúc với asset AI thật.

Mỗi trò lặp lại khuôn `counting-fun`: logic thuần (có test) + `Phaser.Scene` + `GameModule` + đăng ký trong `registerAllGames`, thêm key giọng đọc placeholder `''` vào `audioManifest`.

**Định nghĩa "xong" toàn cục:** sau GĐ3, mỗi đảo có số trò: Toán 3 (#1,#2,#3) · Chữ cái 2 (#4,#5) · Logic 3 (#6,#7,#8) · Trí nhớ 1 (#9; #10 chờ GĐ4) · Hình & Màu 2 (#11,#12) · Tiếng Anh 4 (#13,#14,#15,#16). Mọi trò bấm vào chơi được qua 3 mức, ăn sao, sao đổ vào vườn + bảng tuần, tiến độ lưu qua reload. Build xanh, test pristine.

## 2. Ranh giới — KHÔNG đụng tới gì

GĐ3 **chỉ thêm trò**. Tuyệt đối **không** thay đổi:

- App shell / router (`src/App.tsx`), điều hướng màn (`src/state/`).
- Bản đồ phiêu lưu (`AdventureMap.tsx`), màn nhóm (`CategoryScreen.tsx`), vườn sao (`StarGarden.tsx`), khu phụ huynh.
- Logic tự nâng mức (`src/games/progression.ts` — `nextLevel`); chuỗi ghi tiến độ (`src/games/applyCompletion.ts`); contract `GameModule`/`GameHost`/`GameResult`; registry (`src/games/registry.ts`); lớp dữ liệu (`src/data/*`); hệ âm thanh core (`src/audio/AudioManager.ts`).
- Danh mục 6 nhóm (`src/content/categories.ts` — đã đủ `numbers/letters/logic/memory/shapes/english`).

`CategoryScreen` đọc registry động → **chỉ cần đăng ký trò là đảo tự có nội dung**, không sửa UI.

**Được phép sửa (ngoài thư mục trò mới):**
- `src/games/index.ts` — thêm 9 lời gọi `registerGame(...)`.
- `src/audio/audioManifest.ts` — thêm 9 voice key `''` (xem §6).

> **Lưu ý test hiện trạng:** `registry.test.ts` dùng game **giả** + `_clearRegistry()` nên không khẳng định tổng số trò; `CategoryScreen.test.tsx` gọi `registerAllGames()` rồi đọc registry **động** (không chốt số lượng). → Đăng ký thêm 9 trò **không làm vỡ** test nào; **không cần** sửa "6 → 15" ở đâu cả.

## 3. Đồ hoạ & âm thanh trong GĐ3

Theo §10 bản thiết kế tổng: **dùng emoji / hình vẽ tạm + giọng đọc placeholder** tới GĐ4.

- **Hình ảnh:** emoji cho con vật / đồ vật / đồ ăn; **chữ in hoa** cho trò chữ cái; **Phaser Graphics** vẽ hình khối (tròn/vuông/tam giác/sao) và ô màu cho #12, #16 — đây đã là "hình thật", không phải placeholder, nên giữ nguyên qua GĐ4.
- **Giọng đọc:** mỗi trò thêm key vào `AUDIO_MANIFEST` với source `''`. `AudioManager` coi `''` là no-op im lặng → `speak()` resolve ngay, app chạy không cần file. Giọng EN ở #14/#15/#16 cũng `''` placeholder tới GĐ4 (UI vẫn tiếng Việt; chỉ nhóm Tiếng Anh đọc bản ngữ).
- **Hệ quả test:** giọng là no-op nên test logic không cần mock âm thanh; scene Phaser kiểm thử thủ công `npm run dev`.

## 4. Khuôn mẫu một trò (bám sát `counting-fun`)

Mỗi trò sống trong `src/games/<game-id>/` và gồm:

1. **`<id>Logic.ts` — logic thuần, có test.** Hằng `QUESTIONS_PER_GAME` (hoặc tương đương cho trò kéo-thả), bảng dữ liệu (emoji/chữ/màu), `type Rng = () => number`, hàm độ-khó-theo-mức (`...ForLevel(level)`), helper `pick<T>(arr, rng)`, `generateRound(level, rng)` trả về cấu trúc một lượt **đã đảm bảo đủ/không trùng lựa chọn kể cả khi rng suy biến** (giống `countingLogic`), và `starsFor(correct, total)` (3 sao nếu đúng hết, 2 sao nếu ≥60%, ngược lại 1).
2. **`<Name>Scene.ts` — `Phaser.Scene` dựng từ `(host, level)`.** Dùng `host.speak/playSfx/awardStars/complete/goHome`. Có guard `roundResolved` (chống chạm đôi trong một lượt) và `finished` (chống `complete` đôi). Có nút Về nhà (`goHome`) và nút loa đọc lại đề (`speak(...prompt)`) như các scene hiện có. Trò kéo-thả tái dùng mẫu `jigsaw` (`setInteractive({draggable:true})` + `input.on('drag'|'dragend')` + snap về ô đúng, khoá `setDraggable(obj,false)` khi đã đặt đúng).
3. **`index.ts` — khai báo `GameModule`** (`id`, `categoryId`, `title`, `iconKey` emoji, `skill`, `levels: 3`, `createScene`). Đăng ký trong `src/games/index.ts`.

**Số sao:** chấm theo `starsFor`. Trò chạm-chọn: ~5 lượt/màn, đếm số lượt đúng. Trò kéo-thả: 1 màn đặt-hết, `correct` = số vật đặt đúng ngay lần đầu, `total` = tổng vật.

## 5. Cơ chế 9 trò

> Mỗi trò `levels: 3`. "Mức" mô tả độ khó tăng dần (tự nâng qua `progression.nextLevel`).

### Nhóm Toán (numbers)

- **#2 `more-less` — Nhiều hơn – Ít hơn** · skill "So sánh số lượng" · icon ⚖️
  - Hai khung, mỗi khung một nhóm emoji giống nhau (số lượng khác nhau). Đề: "Chạm nhóm **NHIỀU hơn**" hoặc "**ÍT hơn**" (random). Chạm đúng khung → đúng.
  - Logic `moreLessLogic.ts`: `generateRound(level, rng)` → `{ leftCount, rightCount, want: 'more'|'less', emoji }` với `leftCount !== rightCount`. Mức: L1 1–5 chênh ≥2; L2 1–8; L3 1–10 chênh có thể =1.
- **#3 `match-quantity` — Ghép Số với Lượng** · skill "Liên hệ số ↔ lượng" · icon 🔢 · **kéo-thả**
  - Trên: các nhóm emoji (số lượng khác nhau, có ô đích trống cạnh mỗi nhóm). Dưới: các thẻ số xáo trộn. Kéo mỗi thẻ số vào nhóm có đúng số lượng đó.
  - Logic `matchQuantityLogic.ts`: `generateRound(level, rng)` → `{ pairs: {value, emoji}[], tileOrder: number[] }` (tileOrder = hoán vị chỉ số thẻ). Mức: L1 2 cặp (giá trị 1–3); L2 3 cặp (1–5); L3 4 cặp (lấy từ 1–10).

### Nhóm Chữ cái (letters)

- **#5 `first-letter` — Chữ Cái Đầu Tiên** · skill "Âm đầu của từ" · icon 🅰️
  - Hiện 1 tranh (emoji) + từ tiếng Việt (chữ in hoa). Chạm **chữ cái đầu** của từ trong các lựa chọn.
  - Logic `firstLetterLogic.ts`: ngân hàng từ `{ emoji, word, letter }` (letter = chữ đầu in hoa, dùng chữ cái không dấu cơ bản để bé dễ nhận: B/C/G/M/N/T…). `generateRound` → target + danh sách chữ lựa chọn (có chữ đúng + nhiễu, không trùng). Mức: L1 3 lựa chọn; L2 4; L3 4 (thêm chữ gần giống).

### Nhóm Logic (logic)

- **#7 `odd-one-out` — Vật Lạ Trong Nhóm** · skill "Phân loại, loại trừ" · icon 🔍
  - N vật: N−1 cùng một nhóm + 1 vật khác nhóm (xáo trộn vị trí). Chạm **vật lạ**.
  - Logic `oddOneOutLogic.ts`: các bộ emoji theo nhóm (con vật / trái cây / xe cộ / đồ dùng…). `generateRound` → `{ items: string[], oddIndex }`. Mức: L1 3 vật (2+1); L2 4; L3 5.
- **#8 `sorting` — Phân Loại** · skill "Nhóm gộp theo thuộc tính" · icon 🧺 · **kéo-thả**
  - 2 (hoặc 3) giỏ có nhãn emoji đại diện nhóm; một đống vật xáo trộn. Kéo mỗi vật vào đúng giỏ.
  - Logic `sortingLogic.ts`: chọn 2–3 nhóm, mỗi nhóm K vật, trộn thành đống, mỗi vật gắn `categoryIndex`. `generateRound` → `{ baskets: {label, items?}[], pile: {emoji, basketIndex}[], pileOrder }`. Mức: L1 2 giỏ × 2 vật; L2 2 × 3; L3 3 × 2.

### Nhóm Hình & Màu (shapes)

- **#12 `shapes-colors` — Nhận Diện Màu & Hình** · skill "Màu sắc, hình khối" · icon 🔺 · **vẽ bằng Phaser Graphics**
  - Đề (loa + nhãn): "Chạm **hình tròn**" / "Chạm **màu đỏ**" / (L3) "Chạm **hình vuông màu xanh**". Các lựa chọn là hình khối tô màu vẽ bằng Graphics.
  - Logic `shapeColorLogic.ts`: tập hình `['circle','square','triangle','star']`, tập màu `{name, hex}`. `generateRound(level)` → `{ mode: 'shape'|'color'|'both', targetShape?, targetColor?, options: {shape,color}[], correctIndex }`. Mức: L1 chỉ hình HOẶC chỉ màu, 3 lựa chọn; L2 4 lựa chọn; L3 mode `'both'` (hình + màu kết hợp).

### Nhóm Tiếng Anh (english) — giọng đọc bản ngữ (placeholder `''` tới GĐ4)

- **#14 `abc-english` — ABC** · skill "Bảng chữ cái EN" · icon 🔤
  - Nghe đọc 1 chữ cái tiếng Anh → chạm đúng chữ trong các lựa chọn (chữ in hoa). Soi gương `letter-spotting`.
  - Logic `abcLogic.ts`: A–Z. `generateRound` → target + nhiễu (không trùng). Mức: L1 A–G; L2 A–N; L3 A–Z.
- **#15 `numbers-english` — Numbers 1–10** · skill "Số đếm EN" · icon 🔟
  - Nghe đọc số tiếng Anh ("seven") → chạm chữ số đúng. Mức: L1 1–5; L2 1–8; L3 1–10. 3 lựa chọn.
  - Logic `numbersEnLogic.ts`: `generateRound` → `{ target, options }` (số nguyên, không trùng).
- **#16 `colors-english` — Colors** · skill "Tên màu EN" · icon 🎨 · **vẽ bằng Phaser Graphics**
  - Nghe đọc tên màu tiếng Anh ("red") → chạm ô màu đúng (vẽ Graphics). Mức: L1 3 màu cơ bản; L2 6; L3 ~8.
  - Logic `colorsEnLogic.ts`: tập `{ name, hex }`. `generateRound` → `{ target, options }`.

## 6. Voice key thêm vào `audioManifest.ts`

Thêm 9 key, source `''` (im lặng). Dùng chung `feedback.correct`, `feedback.tryagain`, `reward.cheer` đã có.

```
'moreless.prompt', 'matchquantity.prompt', 'firstletter.prompt',
'oddoneout.prompt', 'sorting.prompt', 'shapecolor.prompt',
'abc.prompt', 'numbersen.prompt', 'colorsen.prompt'
```

## 7. Kiểm thử

- **9 file `*Logic.test.ts`** — kiểm thử logic thuần với `Rng` tất định (stub trả giá trị cố định/chuỗi): xác nhận đúng phạm vi theo mức, không trùng/đủ lựa chọn, đáp án đúng nằm trong lựa chọn, `starsFor` đúng ngưỡng — như `countingLogic.test.ts`.
- **Không cần sửa test registry/CategoryScreen** (không file nào chốt tổng số trò — xem §2); chỉ cần chúng còn xanh sau khi đăng ký 9 trò.
- **Scene Phaser** kiểm thử thủ công (`npm run dev`) — đặc biệt 2 trò **kéo-thả** (`match-quantity`, `sorting`): xác nhận offset hiển thị mảnh kéo & snap đúng (ghi vào TODO thủ công cùng món jigsaw GĐ2 còn nợ).
- Dự kiến test: 85 → ~110+. Build (`npm run build`) xanh, `npm run test` pristine.

## 8. Bàn giao cuối GĐ3

- Cập nhật `ROADMAP.md`: đánh ✅ 9 trò (#2,#3,#5,#7,#8,#12,#14,#15,#16); **chuyển #10 xuống mục Giai đoạn 4** kèm ghi chú "cần ảnh thật"; ghi Nhật ký tiến độ + số test.
- Cập nhật ledger SDD `.superpowers/sdd/progress.md`.
- Commit theo từng trò (giống GĐ2: `feat(<id>): ...`) + commit đăng ký gộp + commit docs. Đẩy GitHub khi người dùng yêu cầu.

## 9. Rủi ro & quyết định

- **Kéo-thả trên cảm ứng cho trẻ 3–5:** đã có tiền lệ chạy được ở `jigsaw`; tái dùng nguyên mẫu, snap rộng tay (vùng đích lớn) để bé dễ thả. Nếu kiểm thử thủ công thấy khó, có thể hạ xuống chạm-chọn ở bản sau (không nằm trong GĐ3).
- **#10 dời GĐ4:** đảo Trí nhớ tạm còn 1 trò — chấp nhận được, đã ghi rõ ở ROADMAP.
- **Phaser Graphics (#12, #16):** không phụ thuộc asset AI nên không cần làm lại ở GĐ4 (chỉ tinh chỉnh thẩm mỹ nếu muốn).
