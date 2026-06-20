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

> **Trạng thái:** 🎉 **Hoàn thành 5 giai đoạn (phần code) — bản "full-fledged".** Đủ **16/16 trò chơi**; **giọng đọc Việt/Anh thu sẵn bằng neural TTS (Piper) — chạy đúng giọng trên MỌI trình duyệt, 100% offline**; bộ **đồ hoạ SVG vector** dễ thương với linh vật **Cáo 🦊**; **hoạt ảnh & hiệu ứng**; **PWA cài đặt được + chạy offline**. Giai đoạn 5 thêm chiều sâu: **lặp lại ngắt quãng + phản hồi gợi-ý-dạy** (mỗi bé học theo nhịp riêng), **bảng phụ huynh 2.0** (Đã thạo/Đang lên/Nên luyện + thẻ tuần + gợi ý chơi ngoài đời), **mạch chơi liền lạc & gắn kết** (onboarding, "Cuộc phiêu lưu hôm nay", Cáo bạn đồng hành, sưu tập sticker + vườn sao), và **tiếp cận** (an toàn mù màu, chế độ êm, đọc giọng mọi nút). **452 test** xanh. Việc còn lại: kiểm thử trải nghiệm với trẻ thật.

## 🎮 Trò chơi (16 trò / 6 nhóm)

| Nhóm | Trò chơi (đều ✅) |
|---|---|
| 🔢 Toán & Con số | Đếm Vui · Nhiều hơn–Ít hơn · Ghép Số với Lượng |
| 🔤 Chữ cái & Ngôn ngữ | Bé Nhận Mặt Chữ · Chữ Cái Đầu Tiên |
| 🧩 Logic & Giải đố | Tìm Quy Luật · Vật Lạ Trong Nhóm · Phân Loại |
| 🧠 Trí nhớ & Quan sát | Lật Hình Tìm Cặp · Tìm Điểm Khác |
| 🎨 Hình khối & Không gian | Ghép Hình · Nhận Diện Màu & Hình |
| 🌎 Tiếng Anh vui | First Words · ABC · Numbers 1–10 · Colors |

**Cả 16 trò đã hoàn thành** — mỗi trò có **3 mức độ khó tự tăng dần**, **giọng đọc hướng dẫn**, hoạt ảnh xuất hiện & phản hồi vui mắt, và thưởng **1–3 sao** mỗi lượt.

## 🛠️ Công nghệ

- **Vỏ ứng dụng:** React 18 + TypeScript (strict) + Vite
- **Cảnh chơi:** Phaser 3 (mỗi trò là một "cảnh sống động" nhúng trong React qua `GameContainer`/`GameHost`) — **nạp động** nên Phaser chỉ tải khi bé mở trò (bundle khởi động giảm ~84%)
- **Đồ hoạ:** hệ thống **SVG vector tự dựng trong code** (style bible + linh vật Cáo) — nhất quán, nhẹ, 100% cục bộ; một nguồn dùng chung cho cả React lẫn Phaser
- **Giọng đọc & âm thanh:** **Web Speech API** (đọc Việt/Anh trực tiếp, không cần file audio) + **Web Audio API** cho hiệu ứng — engine được inject để dễ test
- **Hoạt ảnh:** chuyển cảnh + entrance + phản hồi "juicy", tôn trọng `prefers-reduced-motion`
- **Lưu trữ:** IndexedDB qua Dexie — cục bộ, offline
- **PWA:** cài đặt được + chạy offline (service worker precache toàn bộ app, gồm cả Phaser)
- **Kiểm thử:** Vitest + Testing Library + fake-indexeddb (**213 test**)

Kiến trúc dùng **plugin game**: thêm một trò mới chỉ cần một module tuân theo interface `GameModule` (với `loadScene()` nạp động) và một dòng đăng ký trong registry.

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

> 📲 **Cài như ứng dụng:** mở bản build (Docker hoặc `npm run build && npm run preview`) trên trình duyệt → bấm nút **Cài đặt** ở thanh địa chỉ. App chạy toàn màn hình, **offline** và hiện icon linh vật Cáo. *(Service worker chỉ bật ở bản production, không bật khi `npm run dev`.)*

## 📁 Cấu trúc thư mục

```
src/
  App.tsx              # vỏ điều hướng (chọn màn qua selectScreen thuần, có test)
  data/                # lớp dữ liệu cục bộ (Dexie): hồ sơ, tiến độ, sao, cài đặt
  audio/               # AudioManager + engine Web Speech / Web Audio (inject để test)
  art/                 # hệ thống SVG: tokens (style bible), linh vật Cáo, avatar, icon,
                       #   đảo, UI chrome, nền + hiệu ứng cho scene
  motion/              # nền tảng chuyển động: tokens, prefers-reduced-motion, ScreenTransition
  games/               # GameModule/GameHost/registry + 16 trò (mỗi trò nạp scene động)
  content/             # 6 nhóm trò + danh sách avatar
  components/          # màn hình: avatar, bản đồ, nhóm, vườn sao, khu phụ huynh, GameContainer
  state/               # context phiên + điều hướng (selectScreen)
public/icons/          # icon PWA (sinh từ linh vật Cáo)
scripts/               # công cụ dựng ảnh (style board, icon PWA) bằng headless Chrome
docs/superpowers/specs # bản thiết kế tổng + spec từng giai đoạn
```

## 🗺️ Lộ trình

Dự án xây theo 4 giai đoạn — chi tiết & trạng thái xem [`ROADMAP.md`](ROADMAP.md):

1. **Giai đoạn 1 — Nền tảng + "Đếm Vui"** ✅
2. **Giai đoạn 2 — Phủ kín 6 đảo** (thêm 1 trò mỗi nhóm) ✅
3. **Giai đoạn 3 — Đủ 16 trò** ✅
4. **Giai đoạn 4 — Đánh bóng** ✅ — giọng đọc Việt/Anh, đồ hoạ **SVG vector + linh vật Cáo**, hoạt ảnh & hiệu ứng, tách bundle Phaser (−84% tải lần đầu), **PWA offline**.
5. **Giai đoạn 5 — Full-fledged** ✅ (phần code A–E) — **A** giọng neural thu sẵn (Piper, chạy mọi trình duyệt) · **B** chiều sâu học tập (lặp lại ngắt quãng + phản hồi gợi-ý-dạy) · **C** bảng phụ huynh 2.0 (mastery + thẻ tuần + gợi ý đời thực) · **D** mạch chơi liền lạc & gắn kết (onboarding, phiêu lưu hôm nay, Cáo đồng hành, sticker + vườn) · **E** tiếp cận (an toàn mù màu, chế độ êm, đọc giọng mọi nút). *(Còn lại: kiểm thử với trẻ thật.)*

Bản thiết kế đầy đủ: [`docs/superpowers/specs/2026-06-19-kiddyhub-design.md`](docs/superpowers/specs/2026-06-19-kiddyhub-design.md).

## 🔒 Quyền riêng tư

KiddyHub **không** có server, **không** tài khoản online, **không** quảng cáo, **không** mua hàng trong app và **không** gửi bất kỳ dữ liệu nào ra ngoài. Mọi hồ sơ và điểm số của bé chỉ nằm trong trình duyệt trên thiết bị của gia đình.
