# KiddyHub — Giai đoạn 4 · Phần C: Trò #10 "Tìm Điểm Khác" (spot-the-difference)

> **Trạng thái:** Đã duyệt thiết kế (2026-06-20). Spec triển khai: **Giai đoạn 4 — Phần C (trò chơi thứ 16 — trò cuối cùng).**
> **Bản thiết kế tổng:** [`2026-06-19-kiddyhub-design.md`](./2026-06-19-kiddyhub-design.md) — §9 (danh sách 16 trò: #10 thuộc nhóm 🧠 Trí nhớ & Quan sát), §10 (style bible), §6 (luồng màn).
> **Tiền lệ GĐ4 A / B:** [`2026-06-20-kiddyhub-phase-4a-audio-voice.md`](./2026-06-20-kiddyhub-phase-4a-audio-voice.md) · [`2026-06-20-kiddyhub-phase-4b-final-art.md`](./2026-06-20-kiddyhub-phase-4b-final-art.md).
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md) — mục "Giai đoạn 4".

---

## 1. Mục tiêu Phần C

Hoàn thành **trò chơi thứ 16 / cũng là trò cuối** của KiddyHub: **#10 "Tìm Điểm Khác"** (nhóm 🧠 **Trí nhớ & Quan sát**, kỹ năng **Quan sát chi tiết**, categoryId `memory`).

Trò này từng bị **hoãn** ở các giai đoạn trước vì cần **đồ hoạ thật** (không phải emoji): cơ chế "tìm chỗ khác giữa 2 bức tranh" đòi hỏi một cảnh giàu chi tiết mà bản gốc / bản đổi chỉ khác nhau ở vài điểm tinh tế — emoji rời rạc không làm được. Phần B (GĐ4) đã dựng **hệ đồ hoạ vector SVG trong mã** → giờ có thể **vẽ một cảnh SVG duy nhất hai lần**, bật/tắt vài chi tiết ở bản bên phải để tạo khác biệt. Vì vậy #10 mới khả thi và được tách riêng thành **Phần C**.

Đúng triết lý KiddyHub: **100% cục bộ, không ảnh raster, không AI, không mạng** — cảnh được dựng hoàn toàn bằng chuỗi SVG qua hạ tầng Phần B (`loadSvgTexture` / `addArt`).

## 2. Ranh giới — KHÔNG đụng tới gì

Chỉ **THÊM** trò mới. Không sửa: vỏ app, bản đồ, vườn sao, bảng tuần, `progression.ts`, `applyCompletion.ts`, `registry.ts`, các engine âm thanh, hay bất kỳ trò nào khác. Mỗi thay đổi ngoài thư mục trò mới chỉ là **một dòng đăng ký**:

- `src/games/spot-difference/` — 3 file trò (logic + scene + index) + test.
- `src/games/index.ts` — thêm `import` + `registerGame(spotDifference)`.
- `src/art/gameIcons.ts` — thêm 1 emblem cho id `spot-difference` (nếu thiếu, icon rơi về '?').
- `src/audio/audioManifest.ts` — thêm 1 voice key `spotdiff.prompt`.

Mã / comment / định danh bằng **tiếng Anh**; chỉ chuỗi cho người dùng (tiêu đề, lời thoại) bằng **tiếng Việt**.

## 3. Cơ chế chơi

Hai bản sao của **một cảnh SVG** hiển thị cạnh nhau (trái = bản gốc, phải = bản đã đổi). Bản phải có **N chi tiết bị thay đổi**. Bé chạm vào từng chỗ khác **trên bản phải**:

- **Chạm đúng** một điểm khác → đánh dấu đã tìm thấy (vòng tròn highlight quanh điểm + SFX `tap` + lời khen ngắn `feedback.correct`), tăng tiến độ.
- **Chạm sai** (không trúng điểm khác nào, hoặc trúng điểm đã tìm) → phản hồi "thử lại" (SFX `wrong` + `speak('feedback.tryagain')`), **không phạt** gì thêm.
- Tìm đủ **N** điểm khác → qua lượt.

Tôn trọng toggle âm thanh/giọng của app (qua `host.speak` / `host.playSfx`, không gọi engine trực tiếp).

## 4. Cấp độ & lượt chơi

- **3 cấp độ:** số điểm khác `N = 2 + level` → **L1 = 3, L2 = 4, L3 = 5**.
- **3 lượt / một phiên chơi.** Dùng **một cảnh nền duy nhất**; mỗi lượt **bốc ngẫu nhiên N điểm khác phân biệt** từ một **danh mục ~8 ứng viên** (seed bằng `Rng` để xác định & test được).
- Sau **3 lượt** → `complete(...)` + hiệu ứng thưởng Phần B `celebrate(scene)` (Cáo cổ vũ + sao bay).
- **Sao thưởng:** 3 sao nếu tất cả các lượt đều hoàn tất sạch (mặc định trò tự-sửa nên thường 3 sao); helper `starsForRounds` để mở rộng sau.

## 5. Danh mục điểm khác (difference catalog)

Danh mục gồm **~8 ứng viên**, mỗi ứng viên = `id` + **vùng chạm** (x, y, bán kính trong toạ độ ảnh bản-đổi) + **kiểu khác biệt**. Trộn đủ 4 kiểu:

| Kiểu | Ý nghĩa | Ví dụ trong cảnh |
|---|---|---|
| `removed` | Bản phải **bỏ** phần tử | mất một bông hoa / con bướm |
| `recolored` | **Đổi màu** phần tử | quả táo đỏ → vàng |
| `moved` | **Dời chỗ** phần tử | đám mây dịch sang ngang |
| `resized` | **Đổi kích thước** | mặt trời to/nhỏ hơn |

Cảnh là **vườn / công viên của Cáo**: mặt trời, mây, cỏ, hoa, bướm, quả trên cây, chú chim — dễ thương, hợp bé 3–5 tuổi.

## 6. Hợp đồng logic thuần (`spotDifferenceLogic.ts`)

Thuần, không phụ thuộc Phaser; ngẫu nhiên tiêm qua `Rng = () => number`.

- `DIFFERENCE_CATALOG: DifferenceSpot[]` — danh mục ~8 điểm; mỗi điểm: `{ id, kind, x, y, radius }`.
- `ROUNDS_PER_GAME = 3`, `differenceCountForLevel(level)` → `2 + level` kẹp trong `[3, catalog.length]`.
- `chooseDifferences(level, rng): DifferenceSpot[]` — trả về **N điểm phân biệt** (Fisher–Yates seed bằng `rng`), N đúng theo cấp, **không trùng** trong một lượt, **xác định** với rng cố định, mọi `id` đều **thuộc danh mục**.
- `allFound(found, chosen)` / helper đếm — kiểm tra đã tìm đủ chưa.
- `starsForRounds(roundsCleared, total)` — quy đổi sao (mặc định 3 khi đủ).

**Test (`spotDifferenceLogic.test.ts`)** phủ: số lượng theo cấp (3/4/5); phân biệt (không trùng); xác định với rng cố định; mọi id chọn ra đều tồn tại trong danh mục; `allFound` đúng.

## 7. Cấu trúc scene (`SpotDifferenceScene.ts`)

- `buildScene(changedIds: string[]): string` — dựng cảnh SVG từ các phần **bật/tắt được**; với mỗi `id` đang active, render **biến thể "đã đổi"** của phần đó. Trái = `buildScene([])`, phải = `buildScene(chosenIds)`.
- Nạp cả hai làm texture qua `loadSvgTexture` / `addArt` (Phần B). Texture key kèm danh sách id để cache đúng theo biến thể.
- Đặt **hotspot trong suốt** (hình tròn) đè lên từng điểm khác đã chọn **trên ảnh bản-đổi**; chạm trúng → đánh dấu tìm thấy (vẽ vòng highlight). Chạm ra ngoài mọi hotspot → "thử lại".
- Chrome chuẩn Phần B: `addChrome(this, { onHome, onReplay })` + `addSceneBackground(this, 'memory')`.
- Hiện tiến độ "X / N". Đọc lời nhắc khi vào lượt và khi bấm nút loa.
- Chặn double-advance bằng `roundResolved` (mỗi lượt) + `finished` (cả phiên).
- Sau 3 lượt → `celebrate(this)` + `awardStars` + `complete(...)`.

## 8. Âm thanh

- Thêm voice key `spotdiff.prompt` vào `audioManifest.ts`: *"Tìm điểm khác nhau giữa hai bức tranh nhé!"* (`vi-VN`).
- Dùng lại `feedback.correct` / `feedback.tryagain` / `reward.cheer` và SFX `tap` / `wrong` / `star`.

## 9. Hạ tầng test

`phaser` vẫn alias sang `src/test/phaser-stub.ts`. Logic được unit-test; scene Phaser test thủ công. Nếu scene gọi API Phaser mà stub thiếu thì **mở rộng stub** (không fork). Giữ toàn bộ test xanh; thêm test cho logic mới.

## 10. Kiểm thử thủ công (`npm run dev`)

- Hai ảnh (trái gốc / phải đổi) đều render.
- Số điểm khác đúng theo cấp (L1=3, L2=4, L3=5).
- Chạm trúng một điểm khác → đánh dấu tìm thấy (vòng highlight + tiến độ tăng).
- Chạm sai → "thử lại" (SFX + giọng), không phạt.
- Tìm đủ N → qua lượt; sau 3 lượt → hiệu ứng cổ vũ + thưởng sao.
- Nút 🏠 về nhà & 🔊 nghe lại hoạt động.
