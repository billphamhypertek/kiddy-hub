<div align="center">

# 🦊 KiddyHub

**Nền tảng game trí tuệ cho bé mầm non (3–5 tuổi)**

Học mà chơi · chạy trên trình duyệt tablet · riêng tư 100% (không cần internet, không tài khoản online)

</div>

---

## 🌟 Giới thiệu

**KiddyHub** là một nền tảng web tập hợp nhiều trò chơi **kích thích phát triển trí tuệ** cho bé 3–5 tuổi, dùng **trong phạm vi gia đình**. Vì bé chưa biết đọc, mọi thứ dựa vào **hình ảnh, biểu tượng và giọng đọc hướng dẫn**; thao tác chỉ là **chạm và kéo-thả**.

Triết lý thiết kế:

- 🧠 **Trò chơi trí tuệ, không phải giải trí thuần** — mỗi trò nhắm vào một kỹ năng phát triển cụ thể.
- 💛 **Không có "thua"** — trả lời sai chỉ được động viên và cho thử lại, không phạt, không hết giờ.
- 🔒 **Riêng tư tuyệt đối** — toàn bộ hồ sơ & điểm số lưu ngay trên máy (IndexedDB), không gửi dữ liệu ra ngoài.
- 🌳 **Thi đua vui vẻ** — sao của các bé góp chung vào một "Vườn sao của cả nhà" lớn dần, kèm bảng sao tuần nhẹ nhàng.

> **Trạng thái:** Giai đoạn 1 (nền tảng + 1 trò mẫu) đã hoàn thành. Đồ hoạ hiện dùng **emoji tạm** và **chưa có giọng đọc thật** — bộ minh hoạ AI dễ thương + giọng đọc thật sẽ đến ở Giai đoạn 4.

## 🎮 Trò chơi (16 trò / 6 nhóm)

| Nhóm | Trò chơi | Trạng thái |
|---|---|---|
| 🔢 Toán & Con số | **Đếm Vui** · Nhiều hơn–Ít hơn · Ghép Số với Lượng | ✅ Đếm Vui |
| 🔤 Chữ cái & Ngôn ngữ | Bé Nhận Mặt Chữ · Chữ Cái Đầu Tiên | 🔜 Giai đoạn 2 |
| 🧩 Logic & Giải đố | Tìm Quy Luật · Vật Lạ Trong Nhóm · Phân Loại | 🔜 |
| 🧠 Trí nhớ & Quan sát | Lật Hình Tìm Cặp · Tìm Điểm Khác | 🔜 |
| 🎨 Hình khối & Không gian | Ghép Hình · Nhận Diện Màu & Hình | 🔜 |
| 🌎 Tiếng Anh vui | First Words · ABC · Numbers 1–10 · Colors | 🔜 |

Mỗi trò có **3 mức độ khó tự tăng dần** và thưởng **1–3 sao** mỗi lượt.

## 🛠️ Công nghệ

- **Vỏ ứng dụng:** React 18 + TypeScript (strict) + Vite
- **Cảnh chơi:** Phaser 3 (mỗi trò là một "cảnh sống động" nhúng trong React qua `GameContainer`/`GameHost`)
- **Âm thanh:** Howler.js (engine được inject để dễ test)
- **Lưu trữ:** IndexedDB qua Dexie — cục bộ, offline
- **Kiểm thử:** Vitest + Testing Library + fake-indexeddb (51 test)

Kiến trúc dùng **plugin game**: thêm một trò mới chỉ cần một module tuân theo interface `GameModule` và một dòng đăng ký trong registry.

## 🚀 Bắt đầu

Yêu cầu: **Node ≥ 18**.

```bash
# Cài đặt
npm install

# Chạy thử (mở trên tablet hoặc trình duyệt)
npm run dev

# Build production
npm run build

# Chạy test
npm test
```

Mở URL mà `npm run dev` in ra. Lần đầu: chạm nút **"Bố mẹ"** → giải phép tính đơn giản → tạo hồ sơ cho bé → chọn avatar để vào chơi.

## 🐳 Chạy bằng Docker

Image multi-stage: build Vite rồi serve tĩnh bằng nginx.

```bash
docker compose up -d --build   # build + chạy nền
# mở http://localhost:8088
docker compose down            # dừng & xoá container
```

Cổng host mặc định là **8088** (đổi trong [`docker-compose.yml`](docker-compose.yml) nếu bị trùng).

## 📁 Cấu trúc thư mục

```
src/
  App.tsx              # bộ điều hướng màn hình
  data/                # lớp dữ liệu cục bộ (Dexie): hồ sơ, tiến độ, sao, cài đặt
  audio/               # AudioManager (inject engine) + Howler player
  games/               # GameModule/GameHost/registry + trò "counting-fun"
  content/             # 6 nhóm trò + danh sách avatar
  components/          # màn hình: avatar, bản đồ, nhóm, vườn sao, khu phụ huynh
  state/               # context phiên + kiểu điều hướng
docs/superpowers/
  specs/               # bản thiết kế tổng
  plans/               # kế hoạch triển khai
```

## 🗺️ Lộ trình

Dự án xây theo 4 giai đoạn — chi tiết & trạng thái xem [`ROADMAP.md`](ROADMAP.md):

1. **Giai đoạn 1 — Nền tảng + "Đếm Vui"** ✅
2. **Giai đoạn 2 — Phủ kín 6 đảo** (thêm 1 trò mỗi nhóm)
3. **Giai đoạn 3 — Đủ 16 trò**
4. **Giai đoạn 4 — Đánh bóng** (đồ hoạ AI + giọng đọc thật, hoạt ảnh, PWA offline)

Bản thiết kế đầy đủ: [`docs/superpowers/specs/2026-06-19-kiddyhub-design.md`](docs/superpowers/specs/2026-06-19-kiddyhub-design.md).

## 🔒 Quyền riêng tư

KiddyHub **không** có server, **không** tài khoản online, **không** quảng cáo, **không** mua hàng trong app và **không** gửi bất kỳ dữ liệu nào ra ngoài. Mọi hồ sơ và điểm số của bé chỉ nằm trong trình duyệt trên thiết bị của gia đình.
