# KiddyHub — Bản thiết kế tổng (Master Design)

> **Trạng thái:** Đã duyệt thiết kế tổng thể (2026-06-19). Spec triển khai hiện tại: **Giai đoạn 1**.
> **Theo dõi tiến độ:** xem [`/ROADMAP.md`](../../../ROADMAP.md) ở gốc repo.
> Tài liệu này là "kim chỉ nam" — mọi phiên làm việc/agent đọc file này để hiểu toàn cảnh và biết giai đoạn kế tiếp cần gì.

---

## 1. Tổng quan & mục tiêu

**KiddyHub** là web game giáo dục cho **bé 3–5 tuổi**, chạy trên **trình duyệt tablet**, dùng **trong phạm vi gia đình**. Sản phẩm gồm **16 trò chơi trí tuệ** chia thành **6 nhóm**, giao diện tiếng Việt có **giọng đọc hướng dẫn**, đồ hoạ AI dễ thương, và mỗi trò là một **cảnh sống động** để bé chạm tương tác trực tiếp.

**Nguyên tắc cốt lõi:** đây là trò chơi *trí tuệ* (kích thích phát triển nhận thức), không phải giải trí thuần. Mỗi trò nhắm vào một kỹ năng phát triển cụ thể.

**Mục tiêu:**
- Bé chưa biết đọc vẫn tự chơi được nhờ hình ảnh + giọng nói.
- Trải nghiệm hình ảnh "xịn", dễ thương, lôi cuốn để bé muốn quay lại.
- Hoàn toàn cục bộ, riêng tư: không server, không tài khoản online, không thu thập dữ liệu trẻ em.

## 2. Người dùng & bối cảnh

| Vai | Mô tả | Nhu cầu |
|---|---|---|
| **Bé (3–5 tuổi)** | Chưa đọc được, dùng cảm ứng | Điều hướng bằng hình + giọng nói; chạm/kéo-thả; phản hồi tức thì, dịu dàng |
| **Phụ huynh** | Quản lý thiết bị | Tạo hồ sơ cho từng bé, xem tiến độ, điều chỉnh âm thanh/độ khó |

**Bối cảnh:** vài bé trong một gia đình dùng chung 1 tablet. Không có internet là chuyện bình thường → app phải chạy offline.

## 3. Nguyên tắc thiết kế cho lứa tuổi 3–5

- **Chữ tối thiểu** — mọi hướng dẫn quan trọng đều có giọng đọc; chữ chỉ là phụ.
- **Vùng chạm lớn** — ngón tay bé chưa khéo; nút/đối tượng to, cách nhau rộng.
- **Không trạng thái "thua"** — sai thì động viên + gợi ý, không trừ điểm, không hết giờ gây áp lực.
- **Phản hồi đa giác quan** — đúng/sai có hình + âm + chuyển động.
- **Phiên ngắn** — mỗi lượt chơi ~1–3 phút, hợp khả năng tập trung của bé.
- **Nhất quán** — cùng biểu tượng/cử chỉ ở mọi nơi (🔊 = nghe lại, 🏠 = về bản đồ).

## 4. Kiến trúc & công nghệ

- **Vỏ ứng dụng (App shell):** React + TypeScript + Vite — màn "Ai đang chơi?", bản đồ phiêu lưu, danh sách trò theo nhóm, vườn sao, khu phụ huynh, cài đặt.
- **Cảnh chơi (Game scenes):** Phaser 3 nhúng trong React. Mỗi trò là một (hoặc vài) `Phaser.Scene`: sprite, chạm, hoạt ảnh, vật lý nhẹ.
- **Âm thanh:** Howler.js — audio sprite cho giọng đọc (Việt/Anh) + hiệu ứng.
- **Lưu trữ:** IndexedDB qua **Dexie** — hồ sơ, sao, tiến độ, cài đặt. Cục bộ 100%.
- **Build/PWA:** Vite. (Có thể bật PWA offline ở giai đoạn sau — ngoài phạm vi GĐ 1.)

**Ranh giới module:** vỏ React và phần Phaser giao tiếp qua một lớp cầu nối mỏng (`GameHost`). Vỏ không biết nội tại từng trò; mỗi trò không biết về vỏ ngoài interface chung. → đổi nội tại một trò không ảnh hưởng phần khác.

### 4.1 Giao diện chung của một trò — `GameModule`

Mỗi trò là một module độc lập đăng ký vào một **registry** trung tâm. Vỏ app đọc registry để dựng bản đồ và danh sách trò.

```ts
interface GameModule {
  id: string;              // 'counting-fun'
  categoryId: CategoryId;  // 'numbers'
  title: string;           // 'Đếm Vui'
  iconKey: string;         // khoá asset/biểu tượng
  skill: string;           // kỹ năng phát triển (mô tả ngắn)
  levels: 3;               // số mức khó
  createScene(host: GameHost, level: number): Phaser.Scene;
}
```

`GameHost` cung cấp cho scene các dịch vụ dùng chung: `speak(key)`, `playSfx(key)`, `awardStars(n)`, `onComplete(result)`, `goHome()`. → logic chấm điểm/sao/giọng đọc viết một lần, mọi trò tái dùng.

## 5. Mô hình dữ liệu (IndexedDB / Dexie)

```ts
// profiles — hồ sơ từng bé
{ id, name, avatarKey, birthYear?, createdAt }

// progress — tiến độ từng trò của từng bé
{ id, profileId, gameId, level, bestScore, timesPlayed, lastPlayedAt }

// starEvents — mỗi lần kiếm sao (để tính bảng tuần & vườn)
{ id, profileId, amount, earnedAt, weekKey }   // weekKey: 'YYYY-Www'

// garden — trạng thái vườn sao chung (singleton)
{ id: 'family', totalStars, grownItems: string[] }

// settings — cài đặt chung (singleton)
{ id: 'app', soundOn, voiceOn, language: 'vi' | 'en' }
```

Truy cập qua một lớp **repository** (hàm thuần) để dễ test và tách biệt UI khỏi DB.

## 6. Giao diện & luồng chính

1. **"Ai đang chơi?"** — lưới avatar con vật to; bé chạm để vào. Nút nhỏ vào **Khu phụ huynh** ở góc.
2. **Bản đồ phiêu lưu** — 6 "hòn đảo" = 6 nhóm; linh vật **Cáo 🦊** dẫn đường. Trên cùng: avatar bé + bộ đếm sao.
3. **Đảo / nhóm** — các "chặng" là các trò trong nhóm.
4. **Cảnh chơi (Phaser)** — cảnh sống động; bé chạm trực tiếp; có 🔊 (nghe lại) và 🏠 (về bản đồ).
5. **Màn thưởng** — sao bay vào vườn, linh vật chúc mừng, gợi ý chơi tiếp.
6. **Khu phụ huynh** — cổng chặn bằng phép tính đơn giản; tạo/sửa/xoá hồ sơ, xem tiến độ & sao từng bé, bật/tắt âm thanh.

## 7. Hệ thống chung mọi trò

- **Giọng đọc hướng dẫn** đầu mỗi lượt + nút 🔊 nghe lại.
- **3 mức khó tự tăng dần** — mức khởi đầu suy ra từ tuổi (nếu có) + lịch sử; làm tốt → lên mức.
- **Phản hồi dịu dàng** — đúng: hoan hô + hiệu ứng; sai: âm nhẹ + gợi ý, cho thử lại, không phạt.
- **Thưởng sao** cuối lượt (1–3 sao theo kết quả) → cộng vào bảng tuần của bé + vườn chung.

## 8. Vườn sao của cả nhà

- Mọi sao mọi bé kiếm được đổ vào một **khu vườn chung** lớn dần (mọc thêm cây/hoa/con vật theo mốc tổng sao).
- **Bảng sao tuần** cho từng bé (theo `weekKey`, tự reset mỗi tuần) — "thi đua vui", **không** xếp hạng cạnh tranh gay gắt.
- Triết lý: hợp tác xây vườn chung > ganh đua thắng/thua (phù hợp tâm lý 3–5 tuổi).

## 9. Danh sách 16 trò chơi / 6 nhóm

| # | Nhóm | Trò | Kỹ năng nhắm tới | Cơ chế |
|---|---|---|---|---|
| 1 | 🔢 Toán & Con số | **Đếm Vui** | Đếm, nhận diện số | Chạm đếm con vật → chọn số đúng |
| 2 | 🔢 | **Nhiều hơn – Ít hơn** | So sánh số lượng | Chọn nhóm nhiều/ít hơn |
| 3 | 🔢 | **Ghép Số với Lượng** | Liên hệ số ↔ lượng | Kéo số nối với số lượng vật |
| 4 | 🔤 Chữ cái & Ngôn ngữ | **Bé Nhận Mặt Chữ** | Nhận diện chữ cái | Nghe đọc → chạm chữ đúng |
| 5 | 🔤 | **Chữ Cái Đầu Tiên** | Âm đầu của từ | Xem tranh → chọn chữ bắt đầu |
| 6 | 🧩 Logic & Giải đố | **Tìm Quy Luật** | Nhận quy luật chuỗi | Hoàn thành chuỗi màu/hình |
| 7 | 🧩 | **Vật Lạ Trong Nhóm** | Phân loại, loại trừ | Tìm món khác loại |
| 8 | 🧩 | **Phân Loại** | Nhóm gộp theo thuộc tính | Kéo vật vào đúng giỏ |
| 9 | 🧠 Trí nhớ & Quan sát | **Lật Hình Tìm Cặp** | Trí nhớ ngắn hạn | Lật thẻ tìm cặp giống |
| 10 | 🧠 | **Tìm Điểm Khác** | Quan sát chi tiết | Chạm chỗ khác giữa 2 tranh |
| 11 | 🎨 Hình khối & Không gian | **Ghép Hình** | Tư duy không gian | Xếp mảnh thành tranh |
| 12 | 🎨 | **Nhận Diện Màu & Hình** | Màu sắc, hình khối | Nghe → chạm hình/màu đúng |
| 13 | 🌎 Tiếng Anh vui | **First Words** | Từ vựng EN | Nghe từ EN → chạm tranh |
| 14 | 🌎 | **ABC** | Bảng chữ cái EN | Nghe chữ → chạm đúng |
| 15 | 🌎 | **Numbers 1–10** | Số đếm EN | Nghe số EN → chọn đúng |
| 16 | 🌎 | **Colors** | Tên màu EN | Nghe màu EN → chạm đúng |

> Lưu ý EN: giao diện chung vẫn tiếng Việt; nhóm Tiếng Anh dùng giọng đọc bản ngữ để bé làm quen từ vựng.

## 10. Đồ hoạ AI & âm thanh (yếu tố "xịn")

- **Style bible:** cartoon bo tròn, mắt to, màu pastel tươi sáng; nét viền mềm. **Linh vật Cáo 🦊** xuất hiện xuyên suốt (dẫn đường, cổ vũ).
- **Pipeline ảnh:** sinh ảnh bằng AI với prompt + seed cố định để đồng bộ phong cách → tách nền → tối ưu WebP → đóng gói **sprite atlas** cho Phaser.
- **Pipeline âm thanh:** giọng đọc Việt & Anh tạo sẵn bằng TTS chất lượng cao (hoặc thu giọng thật) → cắt thành **audio sprite** cho Howler. Hiệu ứng (đúng/sai/hoan hô) từ thư viện âm thanh trẻ em.
- **Chiến lược khi code:** dựng logic trước với **hình tạm** (emoji/khối hình, giọng TTS tạm); thay đồ hoạ/giọng đọc bản cuối ở **Giai đoạn 4**. → logic và mỹ thuật tách biệt, không chặn nhau.

## 11. Lộ trình 4 giai đoạn

Mỗi giai đoạn = một chu trình **spec → plan → code** riêng, có plan checkbox riêng. Trạng thái chi tiết ở [`/ROADMAP.md`](../../../ROADMAP.md).

- **GĐ 1 — Nền tảng + 1 trò mẫu** *(spec triển khai hiện tại — xem §12)*
  Vỏ app, bản đồ, avatar entry, khu phụ huynh, vườn sao + bảng tuần, lưu trữ, hệ âm thanh, khung Phaser/GameHost, registry, và trò **"Đếm Vui"** làm chuẩn cảnh sống động.
- **GĐ 2 — Phủ kín 6 đảo**
  Thêm 1 trò cho mỗi nhóm còn lại (trò #4, #6, #9, #11, #13) để mỗi đảo có nội dung.
- **GĐ 3 — Đủ 16 trò**
  Hoàn thiện các trò còn lại.
- **GĐ 4 — Đánh bóng**
  Thay toàn bộ đồ hoạ AI + giọng đọc bản cuối, hoạt ảnh, hiệu ứng, kiểm thử trải nghiệm; (tuỳ chọn) bật PWA offline.

## 12. Phạm vi Giai đoạn 1 (SPEC TRIỂN KHAI NGAY)

**Mục tiêu GĐ 1:** một bộ khung chạy được đầu-cuối, chứng minh được vòng trải nghiệm cốt lõi với **một** trò hoàn chỉnh, và đặt nền cho mọi trò sau.

**Bao gồm:**
1. **Scaffold dự án** — Vite + React + TS + Phaser 3 + Dexie + Howler; cấu trúc thư mục; ESLint/Prettier; cấu hình test (Vitest).
2. **Lớp dữ liệu** — schema Dexie (§5) + repository functions + unit test.
3. **Hệ âm thanh** — wrapper Howler, loader audio sprite, `VoiceManager.speak(key)`; dùng giọng TTS tạm.
4. **GameHost + registry** — interface `GameModule` (§4.1), `GameHost` (speak/sfx/awardStars/onComplete/goHome), cơ chế đăng ký trò.
5. **Màn "Ai đang chơi?"** — lưới avatar; chọn để vào; lối vào khu phụ huynh.
6. **Khu phụ huynh** — cổng chặn (phép tính đơn giản); tạo/sửa/xoá hồ sơ bé (tên + avatar + tuổi tuỳ chọn); xem sao từng bé; bật/tắt âm thanh.
7. **Bản đồ phiêu lưu** — 6 đảo (hình tạm) + linh vật; chạm đảo → màn nhóm → chọn trò.
8. **Vườn sao + bảng tuần** — sao tích luỹ, vườn mọc theo mốc, bảng sao tuần từng bé (bản cơ bản).
9. **Trò "Đếm Vui"** — cảnh Phaser sống động (đồng cỏ/ao), bé chạm đếm con vật, 3 mức khó, giọng đọc, phản hồi dịu dàng, thưởng sao.
10. **Lưu & khôi phục** — mọi dữ liệu bền vững qua reload.

**Tiêu chí hoàn thành GĐ 1 (Definition of Done):**
- Phụ huynh tạo được ≥2 hồ sơ bé qua khu phụ huynh (có cổng chặn).
- Bé chọn avatar → vào bản đồ → vào đảo Toán → chơi "Đếm Vui" qua 3 mức → nhận sao.
- Sao cộng vào bảng tuần của bé và làm vườn chung lớn lên.
- Tắt/mở lại trình duyệt: hồ sơ, sao, tiến độ vẫn còn.
- Bật/tắt âm thanh hoạt động.
- Test: unit test cho lớp dữ liệu + logic sao/độ khó; test thành phần cho luồng chọn avatar; kịch bản test thủ công cho trò "Đếm Vui".

**Ngoài phạm vi GĐ 1:** 15 trò còn lại; đồ hoạ/giọng đọc AI bản cuối (dùng hình/giọng tạm); PWA offline; song ngữ giao diện.

## 13. Ngoài phạm vi toàn dự án (YAGNI)

Không server/tài khoản online · không leaderboard toàn cầu · không mua hàng trong app · không quảng cáo · không mạng xã hội/chat · không native app (chỉ web tablet) · không thu thập/đẩy dữ liệu ra ngoài.

## 14. Rủi ro & cách giảm thiểu

- **Đồ hoạ AI không đồng bộ** → khoá style bible + seed; duyệt thủ công; tách logic khỏi mỹ thuật để thay dễ.
- **Giọng TTS tiếng Việt nghe máy móc** → dùng dịch vụ TTS chất lượng cao ở GĐ 4, hoặc thu giọng thật.
- **Phaser + React phình phức tạp** → cô lập qua `GameHost`; vỏ React không chạm nội tại Phaser.
- **Phạm vi phình to** → kỷ luật theo giai đoạn; mỗi trò theo cùng interface; ROADMAP là nguồn sự thật.
