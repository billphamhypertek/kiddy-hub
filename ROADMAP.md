# KiddyHub — Bảng theo dõi tiến độ (ROADMAP)

> Đây là **nguồn sự thật về tiến độ**. Liếc vào đây để biết đang ở đâu & việc kế tiếp.
> Thiết kế đầy đủ: [`docs/superpowers/specs/2026-06-19-kiddyhub-design.md`](docs/superpowers/specs/2026-06-19-kiddyhub-design.md).
> **Quy ước:** ☐ chưa làm · 🔨 đang làm · ✅ xong. Cập nhật file này ở cuối mỗi phiên làm việc.

## 👉 Tiếp theo cần làm gì

**Hiện tại:** Đã chốt thiết kế tổng (2026-06-19). Bước kế: viết **implementation plan cho Giai đoạn 1** (qua skill writing-plans), rồi bắt đầu code.

---

## Giai đoạn 1 — Nền tảng + trò "Đếm Vui"  🔨

Mục tiêu: khung chạy đầu-cuối + 1 trò hoàn chỉnh. DoD chi tiết ở §12 của bản thiết kế.

- ☐ Scaffold dự án (Vite + React + TS + Phaser + Dexie + Howler + Vitest)
- ☐ Lớp dữ liệu (Dexie schema + repository + test)
- ☐ Hệ âm thanh (Howler wrapper + VoiceManager, giọng tạm)
- ☐ GameHost + registry + interface GameModule
- ☐ Màn "Ai đang chơi?" (chọn avatar)
- ☐ Khu phụ huynh (cổng chặn + CRUD hồ sơ + xem sao + cài đặt)
- ☐ Bản đồ phiêu lưu (6 đảo, hình tạm) + màn nhóm
- ☐ Vườn sao + bảng sao tuần (bản cơ bản)
- ☐ Trò "Đếm Vui" (cảnh Phaser, 3 mức, giọng đọc, thưởng sao)
- ☐ Lưu & khôi phục qua reload
- ☐ Test (data layer, logic sao/độ khó, luồng chọn avatar) + kịch bản test thủ công

## Giai đoạn 2 — Phủ kín 6 đảo  ☐

Thêm 1 trò mỗi nhóm còn lại để mỗi đảo có nội dung.

- ☐ #4 Bé Nhận Mặt Chữ (Chữ cái)
- ☐ #6 Tìm Quy Luật (Logic)
- ☐ #9 Lật Hình Tìm Cặp (Trí nhớ)
- ☐ #11 Ghép Hình (Hình khối)
- ☐ #13 First Words (Tiếng Anh)

## Giai đoạn 3 — Đủ 16 trò  ☐

- ☐ #2 Nhiều hơn – Ít hơn
- ☐ #3 Ghép Số với Lượng
- ☐ #5 Chữ Cái Đầu Tiên
- ☐ #7 Vật Lạ Trong Nhóm
- ☐ #8 Phân Loại
- ☐ #10 Tìm Điểm Khác
- ☐ #12 Nhận Diện Màu & Hình
- ☐ #14 ABC
- ☐ #15 Numbers 1–10
- ☐ #16 Colors

## Giai đoạn 4 — Đánh bóng  ☐

- ☐ Thay toàn bộ đồ hoạ AI bản cuối (theo style bible + linh vật Cáo)
- ☐ Thay giọng đọc Việt/Anh bản cuối (TTS cao cấp hoặc thu thật)
- ☐ Hoạt ảnh, hiệu ứng, chuyển cảnh mượt
- ☐ Kiểm thử trải nghiệm với trẻ thật
- ☐ (Tuỳ chọn) Bật PWA offline

---

## Nhật ký tiến độ

- **2026-06-19** — Brainstorm xong; chốt thiết kế tổng & lộ trình 4 giai đoạn. Viết bản thiết kế + ROADMAP. Kế tiếp: implementation plan GĐ 1.
