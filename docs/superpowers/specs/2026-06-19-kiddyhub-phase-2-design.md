# KiddyHub — Giai đoạn 2 Bản thiết kế (Phase 2 Design)

> **Trạng thái:** Đã duyệt thiết kế (2026-06-19). Spec triển khai: **Giai đoạn 2 — Phủ kín 6 đảo**.
> **Bản thiết kế tổng:** [`2026-06-19-kiddyhub-design.md`](./2026-06-19-kiddyhub-design.md) (§9 danh sách trò, §10 đồ hoạ emoji tạm tới GĐ4).
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md).
> **Plan triển khai checkbox:** [`../plans/2026-06-19-kiddyhub-phase-2.md`](../plans/2026-06-19-kiddyhub-phase-2.md).

---

## 1. Mục tiêu Giai đoạn 2

GĐ1 đã dựng xong toàn bộ hạ tầng chạy đầu-cuối (app shell, bản đồ 6 đảo, vườn sao, khu phụ huynh, lưu trữ Dexie, hệ âm thanh, GameHost/registry) và **một** trò mẫu hoàn chỉnh là "Đếm Vui" (`counting-fun`). Năm đảo còn lại (Chữ cái, Logic, Trí nhớ, Hình khối, Tiếng Anh) hiện rỗng — màn nhóm chỉ hiện "Sắp có trò chơi mới…".

**Mục tiêu GĐ2:** thêm **đúng 1 trò cho mỗi nhóm còn lại (5 trò)** để **mỗi đảo đều có nội dung chơi được**. Mỗi trò lặp lại khuôn `counting-fun`: logic thuần (có test) + `Phaser.Scene` + `GameModule` + đăng ký trong `registerAllGames`. Thêm key giọng đọc placeholder `''` vào `audioManifest`. Trả thêm **một khoản nợ kỹ thuật** (tách + test `applyCompletion`).

**Định nghĩa "xong" toàn cục:** sau GĐ2, từ màn nhóm của **cả 6 đảo** đều có ≥1 trò bấm vào chơi được qua 3 mức, ăn sao, sao đổ vào vườn + bảng tuần, tiến độ lưu qua reload.

## 2. Ranh giới — KHÔNG đụng tới gì

GĐ2 **chỉ thêm trò + một refactor nội bộ `GameContainer`**. Tuyệt đối **không** thay đổi:

- App shell / router (`src/App.tsx`), điều hướng màn (`src/state/`).
- Bản đồ phiêu lưu (`AdventureMap.tsx`), màn nhóm (`CategoryScreen.tsx`), vườn sao (`StarGarden.tsx`), khu phụ huynh.
- Logic tự nâng mức (`src/games/progression.ts` — `nextLevel`); contract `GameModule`/`GameHost`/`GameResult` (`src/games/GameModule.ts`); registry (`src/games/registry.ts`); lớp dữ liệu (`src/data/*`); hệ âm thanh core (`src/audio/AudioManager.ts`).
- Danh mục 6 nhóm (`src/content/categories.ts` — đã có đủ `numbers/letters/logic/memory/shapes/english`).

`CategoryScreen` đọc registry động nên **chỉ cần đăng ký trò là đảo tự có nội dung** — không phải sửa UI nào.

## 3. Đồ hoạ & âm thanh trong GĐ2

Theo §10 bản thiết kế tổng: **dùng emoji/hình khối tạm + giọng đọc placeholder** cho tới GĐ4. Cụ thể ở GĐ2:

- **Hình ảnh:** dùng emoji (chữ cái in hoa cho trò chữ; emoji cho con vật/đồ vật/đồ ăn; hình khối Phaser `rectangle`/`RenderTexture` cho ghép hình). Không sinh/ghép asset AI.
- **Giọng đọc:** mỗi trò thêm các key giọng vào `AUDIO_MANIFEST` với source `''`. `AudioManager` coi `''` là no-op im lặng → app chạy không cần file âm thanh; `speak()` resolve ngay. Giọng EN ở "First Words" cũng là `''` placeholder tới GĐ4 (UI vẫn tiếng Việt).
- **Hệ quả test:** vì giọng là no-op nên không cần mock âm thanh trong test logic; scene Phaser kiểm thử thủ công qua `npm run dev`.

## 4. Khuôn mẫu một trò (bám sát `counting-fun`)

Mỗi trò sống trong `src/games/<game-id>/` và gồm:

1. **Logic thuần** `<name>Logic.ts` — không phụ thuộc Phaser/DOM; **random luôn inject qua `type Rng = () => number`** để test xác định; export hàm sinh ván/lượt + hàm tính sao thuần. Có file test `.test.ts` (TDD: viết test đỏ trước).
2. **`<Name>Scene.ts`** — `extends Phaser.Scene`, dựng từ `constructor(host: GameHost, level: number)`, `super({ key: '<game-id>' })`. Dùng `host.speak/playSfx/awardStars/complete/goHome`. Có nút 🏠 (về bản đồ) + 🔊 (nghe lại) ở chrome. **Có guard `roundResolved` (hoặc `finished`) chống double-advance / double-complete.** Gọi `host.awardStars(stars)` rồi `host.complete({...})` ở cuối (giống `CountingFunScene.finish()`).
3. **`index.ts`** — export `const <camelId>: GameModule = { id, categoryId, title, iconKey, skill, levels: 3, createScene: (host, level) => new <Name>Scene(host, level) }`. Có `index.test.ts` kiểm metadata (id, categoryId, levels, createScene là hàm).
4. **Đăng ký** — thêm `import` + `registerGame(<camelId>)` vào `src/games/index.ts` (`registerAllGames`).
5. **Giọng** — thêm các key voice của trò vào `AUDIO_MANIFEST.voices` với `''`.

**Quan trọng về sao (giữ nguyên semantics GĐ1):** scene gọi `host.awardStars(n)` để ghi sao ngay; `host.complete(result)` ghi tiến độ + nâng mức nhưng **không** ghi lại sao (tránh đếm đôi). `result.stars` chỉ là thông tin.

## 5. Năm trò — đặc tả cơ chế (đã duyệt)

### 5.1 Hai khuôn chấm sao

- **Khuôn "5 lượt nghe→chạm"** (trò #4, #6, #13): dùng lại đúng hàm `starsFor(correct, total)` của GĐ1 với `total = 5`:
  - `correct === 5` → **3⭐**; `correct/5 >= 0.6` (tức ≥3) → **2⭐**; còn lại → **1⭐**.
  - Mỗi trò export hằng `QUESTIONS_PER_GAME = 5` riêng (giống `counting-fun`).
  - Một "lượt" = 1 câu hỏi nghe rồi chạm đáp án; trả lời sai lần đầu thì lượt đó **không** tính đúng (giống `answeredThisRound` của `counting-fun`), cho thử lại, không phạt.
- **Khuôn "1 ván, sao theo lỗi"** (trò #9, #11): chơi xong cả ván rồi mới chấm; **cần hàm sao thuần riêng cho từng trò + test** (vì không phải dạng "đúng/tổng").

Mọi trò: 3 mức (`levels: 3`), không có trạng thái "thua", sai → động viên + thử lại.

---

### 5.2 #4 — Bé Nhận Mặt Chữ  (`categoryId: 'letters'`, gợi ý id `letter-spotting`)

**Kỹ năng:** nhận diện mặt chữ cái tiếng Việt. **Cơ chế:** nghe đọc tên chữ → chạm chữ đúng trong các lựa chọn. **Khuôn "5 lượt nghe→chạm".**

- **Bộ chữ:** chữ **in hoa**, gồm cả **dấu phụ tiếng Việt: Ă Â Ê Ô Ơ Ư Đ** (ngoài A–Z thường dùng cho bé). Định nghĩa một mảng hằng `LETTERS` chứa các chữ này.
- **`generateRound(level, rng) → { target: string; options: string[] }`:**
  - `target` là chữ cần tìm; `options` luôn **chứa `target`**, các phần tử **không trùng nhau**.
  - **Số lựa chọn theo mức:** L1 = 3, L2 = 4, L3 = 5.
  - **Độ khó tăng dần bằng "chữ na ná":**
    - L1: chọn các chữ **dễ phân biệt** (khác hẳn nhau về hình dạng).
    - L2: bắt đầu chèn một vài chữ gần giống.
    - L3: cố tình trộn các **cặp/nhóm dễ nhầm**: Ô/Ơ, E/Ê, U/Ư, O/Q, A/Ă/Â, … (định nghĩa một bảng `CONFUSABLES` để bốc distractor khi có thể).
  - Nếu không đủ distractor "na ná" thì bù bằng chữ ngẫu nhiên khác (vẫn không trùng `target`, không trùng nhau).
- **Sao:** `starsFor(correct, 5)`.
- **Giọng (placeholder `''`):** ví dụ key `letter.prompt` ("Hãy tìm chữ …"), tái dùng `feedback.correct` / `feedback.tryagain` / `reward.cheer` đã có.
- **Hiển thị:** mỗi lựa chọn là một ô chữ to (Phaser `text` chữ in hoa cỡ lớn trên nền `rectangle`), vùng chạm rộng.

**Test logic (xác định, qua `rng`):** target luôn nằm trong options; options đúng số lượng theo mức; options không trùng; ở L3 có thể xuất hiện distractor từ nhóm confusable khi `rng` chọn như vậy.

---

### 5.3 #6 — Tìm Quy Luật  (`categoryId: 'logic'`, gợi ý id `pattern-finder`)

**Kỹ năng:** nhận ra quy luật của chuỗi. **Cơ chế:** xem một chuỗi màu/hình (emoji) bị **thiếu 1 ô** ở cuối (ô "?"), nghe gợi ý, rồi **chạm đáp án đúng** điền vào ô thiếu. **Khuôn "5 lượt nghe→chạm".**

- **Bảng "token":** một mảng emoji/màu cơ bản, ví dụ `🔴 🔵 🟡 🟢 🟣` (hoặc hình ⭐🔺⬛…). Định nghĩa hằng `TOKENS`.
- **`generateRound(level, rng) → { sequence: string[]; answer: string; options: string[] }`:**
  - `sequence` là chuỗi đã hiện (ô cuối là chỗ thiếu — scene vẽ "?" ở đó); `answer` là token đúng điền vào; `options` chứa `answer` + distractor, **không trùng**.
  - **Quy luật theo mức:**
    - L1: **AB** lặp (`🔴🔵🔴🔵 → ?` = `🔴`). Độ dài hiển thị ~4–5 ô.
    - L2: **ABC** lặp (`🔴🔵🟡🔴🔵 → ?` = `🟡`).
    - L3: **AABB** hoặc **ABB** (ví dụ `🔴🔴🔵🔵🔴 → ?` = `🔴`; chọn ngẫu nhiên một trong hai mẫu qua `rng`).
  - Số option: L1 = 3, L2 = 3, L3 = 4 (đủ để có distractor là token khác trong quy luật).
- **Sao:** `starsFor(correct, 5)`.
- **Giọng (placeholder):** key `pattern.prompt` ("Ô tiếp theo là gì?"), tái dùng feedback/cheer.
- **Hiển thị:** chuỗi token cỡ lớn theo hàng ngang, ô thiếu là khung "?" nổi bật; options là các nút token to phía dưới.

**Test logic:** `answer` đúng theo quy luật của mức (kiểm bằng cách dựng lại chuỗi đầy đủ và so ô thiếu); `options` chứa `answer`, không trùng, đúng số lượng; với mọi `rng` chuỗi luôn dựng được.

---

### 5.4 #13 — First Words  (`categoryId: 'english'`, gợi ý id `first-words`)

**Kỹ năng:** từ vựng tiếng Anh cơ bản. **Cơ chế:** nghe **từ tiếng Anh** → chạm **tranh (emoji) đúng**. **Khuôn "5 lượt nghe→chạm".** (UI hướng dẫn vẫn **tiếng Việt**; chỉ từ vựng là EN. Giọng EN là placeholder `''` tới GĐ4.)

- **Ngân hàng từ theo chủ đề/mức** (mỗi mục `{ word: string; emoji: string }`):
  - **L1 — Con vật:** cat 🐱, dog 🐶, fish 🐟, bird 🐦, bear 🐻, frog 🐸, …
  - **L2 — Đồ vật:** ball ⚽, car 🚗, book 📖, cup ☕, hat 🎩, key 🔑, …
  - **L3 — Đồ ăn:** apple 🍎, banana 🍌, cake 🍰, milk 🥛, egg 🥚, bread 🍞, …
  - Định nghĩa `WORD_BANK: Record<level, WordItem[]>` (hoặc theo chủ đề rồi map mức).
- **`generateRound(level, rng) → { target: WordItem; options: WordItem[] }`:**
  - `target` là từ cần tìm; `options` chứa `target` + distractor cùng chủ đề/mức, **không trùng emoji/word**.
  - **Số option theo mức:** L1 = 3, L2 = 3, L3 = 4 ("3 ở mức thấp, 4 ở mức cao").
- **Sao:** `starsFor(correct, 5)`.
- **Giọng (placeholder `''`):** key `firstwords.prompt` (hoặc per-word key như `en.cat`… — tối thiểu một key prompt chung là đủ cho GĐ2). Tái dùng feedback/cheer.
- **Hiển thị:** nghe → chạm 1 trong các thẻ tranh emoji to. Có thể hiện chữ từ EN nhỏ bên dưới (phụ trợ), nhưng dẫn dắt chính là nghe.

**Test logic:** target luôn ∈ options; số option đúng theo mức; options không trùng (theo `word`); mọi từ thuộc đúng ngân hàng của mức.

---

### 5.5 #9 — Lật Hình Tìm Cặp  (`categoryId: 'memory'`, gợi ý id `memory-match`)

**Kỹ năng:** trí nhớ ngắn hạn. **Cơ chế:** một lưới thẻ úp, mỗi hình có **đúng 2 thẻ**; bé lật 2 thẻ một lần — khớp thì để mở, không khớp thì úp lại — tới khi mở hết. **Khuôn "1 ván, sao theo số lần lật dư".**

- **Mức (lưới × số cặp):** L1 = **2×2** (2 cặp) · L2 = **3×2** (3 cặp) · L3 = **4×3** (6 cặp).
- **`buildBoard(level, rng) → Card[]`** (logic thuần):
  - `Card = { id: number; faceKey: string; pairId: number }` — mỗi `pairId` xuất hiện đúng 2 lần; `faceKey` là emoji (bốc từ một bộ emoji cố định, đủ phân biệt).
  - Trả về **mảng đã xáo** (xáo qua `rng`, ví dụ Fisher–Yates inject `rng`). Số ô = `rows*cols` (luôn chẵn).
- **Logic ván (thuần, test được):** một hàm/đối tượng nhỏ quản lý trạng thái lật:
  - Lật thẻ 1 → lật thẻ 2: nếu cùng `pairId` → đánh dấu khớp (matched); khác → cần úp lại.
  - Đếm **số lượt lật cặp** (mỗi lần lật-2-thẻ = 1 "lượt"). `isComplete` khi tất cả đã matched.
  - Bỏ qua thao tác lên thẻ đã matched / thẻ đang mở (không tính lượt thừa do double-tap).
- **Sao — hàm thuần riêng `starsForFlips(flips, pairs)` (+ test):**
  - Tối thiểu lý tưởng = `pairs` lượt (lật trúng cặp mỗi lần). Cho ngưỡng khoan dung:
    - lỗi ít (flips ≤ pairs + ~1 hoặc theo tỉ lệ) → **3⭐**;
    - lỗi vừa → **2⭐**; nhiều → **1⭐**.
  - Ngưỡng cụ thể do agent implement chốt **trong test trước** (TDD), miễn: hoàn hảo (`flips === pairs`) → 3⭐; và sao **không tăng** khi `flips` tăng (đơn điệu giảm). **Không** có 0⭐.
- **Giọng (placeholder):** key `memory.prompt` ("Lật tìm hai hình giống nhau nhé!"), tái dùng feedback/cheer; `playSfx('correct')` khi khớp, `playSfx('wrong')`/im khi trật.
- **Hiển thị:** lưới thẻ `rectangle` úp (mặt sau giống nhau); chạm để lật (hiện emoji); thẻ trật tự úp lại sau ~700ms (dùng `time.delayedCall`); guard chặn lật thẻ thứ 3 khi đang chờ úp.

**Phân chia test/thủ công:** `buildBoard` (số ô, mỗi pair đúng 2, đã xáo) + logic lật/khớp/đếm-lượt + `starsForFlips` → **test thuần**. Phần vẽ thẻ & animation lật → **kiểm thử thủ công** (`npm run dev`).

---

### 5.6 #11 — Ghép Hình  (`categoryId: 'shapes'`, gợi ý id `jigsaw`)

**Kỹ năng:** tư duy không gian. **Cơ chế:** một bức tranh bị cắt thành lưới ô chữ nhật, xáo trộn; bé **kéo từng mảnh về đúng ô** để dựng lại tranh. **Jigsaw thật về cơ chế** (kéo-thả + snap), chỉ **ảnh là placeholder** (bức tranh tạm vẽ bằng emoji lớn / hình Phaser tự vẽ lên `RenderTexture`, rồi cắt thành lưới). GĐ4 chỉ cần **thay bức tranh placeholder bằng ảnh AI** (tuỳ chọn thêm răng cưa). **Khuôn "1 ván, sao theo số lần thả sai".**

- **Mức (lưới):** L1 = **2×2** (4 mảnh) · L2 = **2×3** (6 mảnh) · L3 = **3×3** (9 mảnh).
- **`sliceGrid(level, rng)` (logic thuần) →** mô tả các ô + thứ tự xáo:
  - Mỗi mảnh `Piece = { id: number; row: number; col: number }` (ô đích của mảnh). Trả về **danh sách mảnh theo thứ tự đã xáo** (cho khay nguồn) + thông tin lưới (`rows`, `cols`). Xáo qua `rng`.
- **Logic snap/hoàn thành (thuần, test được):**
  - `isCorrectDrop(piece, targetRow, targetCol)` → đúng khi `piece.row === targetRow && piece.col === targetCol`.
  - Trạng thái ván theo dõi mảnh nào đã đặt đúng; `isComplete` khi **tất cả mảnh đặt đúng ô**.
  - Đếm **số lần thả sai** (thả mảnh vào ô không phải đích của nó).
- **Sao — hàm thuần riêng `starsForMisplacements(misses)` (+ test):**
  - 0 lần thả sai → **3⭐**; ít → **2⭐**; nhiều → **1⭐** (ngưỡng chốt trong test trước; đơn điệu giảm theo `misses`; không 0⭐).
- **Placeholder ảnh (phần Phaser, kiểm thử thủ công):**
  - Trong `create()`: vẽ một bức tranh tạm (ví dụ một emoji lớn 🦊/🌈 hoặc vài hình khối màu) lên một **`RenderTexture`** kích thước cố định; **cắt** thành lưới `rows×cols` ô chữ nhật (mỗi mảnh là một `Image`/`Sprite` lấy vùng crop tương ứng từ RenderTexture, hoặc dùng `texture.add(frame)` theo khung).
  - Hiển thị **khung đích** (ô lưới mờ) + **khay mảnh** xáo; bật kéo-thả (`setInteractive({ draggable: true })`, `this.input.setDraggable`, sự kiện `drag`/`dragend`); khi `dragend` kiểm tra ô gần nhất → nếu đúng đích thì **snap** vào ô và khoá; nếu sai thì trả về khay + `playSfx('wrong')` + đếm 1 lần thả sai.
  - Khi `isComplete`: `awardStars(starsForMisplacements(misses))` → `complete({...})`. Guard `finished` chống double-complete.
- **Giọng (placeholder):** key `jigsaw.prompt` ("Kéo các mảnh về đúng chỗ nhé!"), tái dùng feedback/cheer.

**Phân chia test/thủ công:** `sliceGrid` (đúng số mảnh = rows*cols, mỗi (row,col) xuất hiện đúng 1 lần, đã xáo) + `isCorrectDrop`/`isComplete`/đếm-thả-sai + `starsForMisplacements` → **test thuần**. Vẽ RenderTexture + cắt + kéo-thả/snap → **kiểm thử thủ công** (`npm run dev`).

## 6. Nợ kỹ thuật trả trong GĐ2 — tách + test `applyCompletion`

Hiện handler `onComplete` đang **inline** trong `src/components/GameContainer.tsx` (đọc lại §GameContainer): nó là chuỗi **ghi sao → ghi tiến độ → tự nâng mức**, và là **chỗ dễ vỡ nhất** khi thêm trò. GĐ2 tách thành **hàm thuần** + viết **test tích hợp**.

- **Tách `applyCompletion(deps, result)`** (đặt cạnh `GameContainer` hoặc trong `src/games/`):
  - Nhận `deps` gồm các hàm đã tiêm: `addStars(profileId, n)`, `recordPlay(profileId, gameId, level, score)`, `nextLevel(stars, level, max)` (tái dùng `src/games/progression.ts`), `profileId`, `maxLevels`.
  - Thực hiện: tính `newLevel = nextLevel(result.stars, result.level, maxLevels)` → `await recordPlay(profileId, result.gameId, newLevel, result.score)`.
  - **Lưu ý semantics:** sao đã được ghi tại `onAward` (khi scene gọi `awardStars`), nên `applyCompletion` **không** ghi lại sao (giữ nguyên hành vi GĐ1 — tránh đếm đôi). Nếu refactor gộp việc ghi sao vào đây thì phải **đồng thời bỏ ghi sao ở `onAward`** để vẫn không đếm đôi — quyết định cách gộp do agent implement chốt **trong test trước**, miễn kết quả cuối: tổng sao đúng, tiến độ đúng, mức nâng đúng.
  - `GameContainer.onComplete` chỉ còn gọi `applyCompletion(...)` rồi `onExit(result)`.
- **Test tích hợp** (`applyCompletion.test.ts`, dùng Dexie thật qua `fake-indexeddb` như các test data-layer GĐ1, hoặc inject mock `recordPlay`/`addStars`):
  - **Đường nâng mức:** 3⭐ ở mức < max → tiến độ lưu mức +1; ở mức = max → giữ nguyên.
  - **Đường không nâng:** 1–2⭐ → mức giữ nguyên.
  - **Đường sao/tiến độ:** sao tổng & `timesPlayed`/`bestScore` đúng sau một (vài) phiên; **không đếm đôi** sao.

## 7. Tính độc lập & song song hoá

**Năm trò hoàn toàn độc lập nhau:** không trò nào import trò khác; mỗi trò chỉ chạm thư mục `src/games/<id>/` của nó + thêm 1 dòng đăng ký vào `src/games/index.ts` + thêm key vào `src/audio/audioManifest.ts`. → có thể **làm song song bởi nhiều agent** miễn quản lý xung đột ở 2 file chung (`games/index.ts`, `audioManifest.ts`) — các thay đổi ở 2 file này là **chèn thêm dòng**, dễ merge.

`applyCompletion` (nợ kỹ thuật) **độc lập với cả 5 trò** và nên làm **trước** (hoặc song song) vì nó là đường đi chung khi mọi trò kết thúc — làm sớm để mọi trò mới được kiểm qua đường đã có test.

**Thứ tự đề xuất:** (0) `applyCompletion` → (1) 3 trò khuôn "5 lượt" (#4, #6, #13) → (2) 2 trò khác khuôn (#9, #11). Trong mỗi trò: TDD logic → scene → module+test → đăng ký → manifest.

## 8. Gotchas (bắt buộc lưu ý khi implement)

- **Random qua `Rng`:** mọi sinh ngẫu nhiên trong logic thuần phải nhận `rng: () => number` để test **xác định**; scene truyền `Math.random` khi chạy thật (như `counting-fun`).
- **Guard double-advance/double-complete:** scene phải có cờ (`roundResolved`/`finished`) để không nâng lượt hoặc `complete()` hai lần (double-tap, animation chồng). Bám `CountingFunScene`.
- **Emoji = asset:** không sinh/ghép ảnh AI ở GĐ2; chữ in hoa & emoji & hình khối Phaser là đủ. Ghép hình dùng `RenderTexture` placeholder.
- **Không sửa app shell / progression / contract / data layer / categories** (xem §2). `CategoryScreen` tự đọc registry.
- **Test infra phaser-stub:** vitest alias `phaser` → `src/test/phaser-stub.ts` (`vite.config.ts`); **không** cần `vi.mock('phaser')`. Test chỉ phủ **logic thuần** + metadata module; **scene Phaser kiểm thử thủ công** (`npm run dev`) vì jsdom không có WebGL.
- **Sao không đếm đôi:** giữ nguyên semantics `awardStars` (ghi ngay) vs `complete` (chỉ tiến độ). Khi refactor `applyCompletion` phải bảo toàn điều này.
- **Số lựa chọn không trùng:** mọi trò "nghe→chạm" phải đảm bảo options chứa đáp án, không phần tử trùng, đúng số lượng theo mức — kể cả khi `rng` "kẹt" (có vòng bù an toàn như `generateRound` của `counting-fun`).
- **Lưới chẵn cho memory:** mọi mức memory phải có số ô chẵn (đã chọn 2×2, 3×2, 4×3 → 4, 6, 12 ô).

## 9. Tiêu chí hoàn thành GĐ2 (Definition of Done)

- 5 trò (#4, #6, #9, #11, #13) đã viết: logic thuần (+test), scene, module (+test metadata), **đăng ký trong `registerAllGames`**, key giọng placeholder trong `AUDIO_MANIFEST`.
- `applyCompletion` đã tách thành hàm thuần **có test tích hợp** (sao/tiến độ/nâng mức, không đếm đôi); `GameContainer` dùng nó.
- **Toàn bộ test cũ + mới xanh** (`npm test`).
- **`npm run build` thành công** (type-check + build).
- Mỗi nhóm còn lại (Chữ cái, Logic, Trí nhớ, Hình khối, Tiếng Anh) có **≥1 trò chơi được** từ màn nhóm (kiểm thủ công qua `npm run dev`: vào từng đảo, chơi trò, ăn sao, sao vào vườn, lưu qua reload).
- **Cập nhật `ROADMAP.md`:** tick 5 mục checklist GĐ2 (`☐`→`✅`), đổi tiêu đề mục GĐ2 sang ✅ khi đủ, cập nhật mục "👉 Tiếp theo" trỏ sang Giai đoạn 3, và thêm dòng có ngày vào "Nhật ký tiến độ". *(Việc cập nhật ROADMAP do bước implement thực hiện ở task cuối — nêu rõ trong plan.)*

## 10. Ngoài phạm vi GĐ2

10 trò còn lại (GĐ3); đồ hoạ/giọng AI bản cuối (GĐ4); thay đổi app shell/bản đồ/vườn/progression; tách bundle Phaser; PWA offline; các nợ kỹ thuật khác để dành GĐ4 (resolve `speak()` khi `stop()`, gắn `speak()` cho menu).
