# KiddyHub — Bảng theo dõi tiến độ (ROADMAP)

> Đây là **nguồn sự thật về tiến độ**. Liếc vào đây để biết đang ở đâu & việc kế tiếp.
> Thiết kế đầy đủ: [`docs/superpowers/specs/2026-06-19-kiddyhub-design.md`](docs/superpowers/specs/2026-06-19-kiddyhub-design.md).
> **Quy ước:** ☐ chưa làm · 🔨 đang làm · ✅ xong. Cập nhật file này ở cuối mỗi phiên làm việc.

## 👉 Tiếp theo cần làm gì

**Giai đoạn 1 ✅, Giai đoạn 2 ✅ & Giai đoạn 3 ✅ hoàn thành.** Đã có Docker chạy local: `docker compose up -d --build` → http://localhost:8088.

**Giai đoạn 3 đã xong: 15/16 trò chơi được** (#10 Tìm Điểm Khác dời sang Giai đoạn 4 vì cần ảnh thật để tạo khác biệt tinh tế).

**Giai đoạn 4 đang chạy — chia thành các phần độc lập A→F, mỗi phần có spec + sub-agent riêng:**
- ✅ **Phần A — Giọng đọc + âm thanh** (Web Speech API live, local; trả 2 nợ kỹ thuật audio) — xong 2026-06-20.
- 👉 **Phần B — Đồ hoạ bản cuối** (linh vật Cáo + style bible + art từng trò) — kế tiếp; **#10 Tìm Điểm Khác phụ thuộc phần này**.
- ☐ Phần C #10 Tìm Điểm Khác · ☐ Phần D hoạt ảnh/hiệu ứng · ☐ Phần E tách bundle Phaser · ☐ Phần F (tuỳ chọn) PWA offline · ☐ kiểm thử với trẻ thật.

### Cách bắt đầu Giai đoạn 3 (dành cho phiên/agent mới)

1. Đọc bản thiết kế tổng (`docs/superpowers/specs/2026-06-19-kiddyhub-design.md`): §9 danh sách trò + kỹ năng, §10 đồ hoạ (vẫn dùng **emoji tạm + chưa giọng đọc** cho tới Giai đoạn 4).
2. **Khuôn mẫu để nhân bản:** 6 trò hiện có trong `src/games/*` (chuẩn nhất là `counting-fun/`) cho MỘT trò:
   - `<id>Logic.ts` — logic thuần (random inject qua `Rng`), có test riêng;
   - `<Name>Scene.ts` — `Phaser.Scene` dựng từ `(host, level)`, dùng `host.speak/playSfx/awardStars/complete/goHome`, có guard `roundResolved`/`finished` chống double-advance;
   - `index.ts` — khai báo `GameModule`; rồi đăng ký trong `src/games/index.ts` (`registerAllGames`).
3. Mỗi trò mới = lặp lại khuôn đó + test cho phần logic thuần. **Không phải sửa** app shell, bản đồ, vườn sao, độ-khó-tự-tăng (`src/games/progression.ts`), hay `applyCompletion` — đã xong & có test.
4. Quy trình đề xuất (giống GĐ1/GĐ2): **brainstorming** (chốt cơ chế từng trò nếu cần) → **writing-plans** → **subagent-driven-development**. Tham khảo plan GĐ2: `docs/superpowers/plans/2026-06-19-kiddyhub-phase-2.md`.
5. Test infra: Phaser được alias sang stub khi chạy test (`vite.config.ts` → `src/test/phaser-stub.ts`) → **KHÔNG** cần `vi.mock('phaser')` per-file; test tập trung vào logic thuần, cảnh Phaser kiểm thử thủ công (`npm run dev`).
6. Cập nhật checklist + Nhật ký trong file này sau mỗi trò.

---

## Giai đoạn 1 — Nền tảng + trò "Đếm Vui"  ✅

Mục tiêu: khung chạy đầu-cuối + 1 trò hoàn chỉnh. DoD chi tiết ở §12 của bản thiết kế.

- [x] Scaffold dự án (Vite + React + TS + Phaser + Dexie + Howler + Vitest)
- [x] Lớp dữ liệu (Dexie schema + repository + test)
- [x] Hệ âm thanh (Howler wrapper + VoiceManager, giọng tạm)
- [x] GameHost + registry + interface GameModule
- [x] Màn "Ai đang chơi?" (chọn avatar)
- [x] Khu phụ huynh (cổng chặn + CRUD hồ sơ + xem sao + cài đặt)
- [x] Bản đồ phiêu lưu (6 đảo, hình tạm) + màn nhóm
- [x] Vườn sao + bảng sao tuần (bản cơ bản)
- [x] Trò "Đếm Vui" (cảnh Phaser, 3 mức, giọng đọc, thưởng sao)
- [x] Lưu & khôi phục qua reload
- [x] Test (data layer, logic sao/độ khó, luồng chọn avatar) + kịch bản test thủ công

## Giai đoạn 2 — Phủ kín 6 đảo  ✅

Thêm 1 trò mỗi nhóm còn lại để mỗi đảo có nội dung.

- ✅ #4 Bé Nhận Mặt Chữ (Chữ cái)
- ✅ #6 Tìm Quy Luật (Logic)
- ✅ #9 Lật Hình Tìm Cặp (Trí nhớ)
- ✅ #11 Ghép Hình (Hình khối)
- ✅ #13 First Words (Tiếng Anh)

## Giai đoạn 3 — Đủ 16 trò  ✅

- ✅ #2 Nhiều hơn – Ít hơn
- ✅ #3 Ghép Số với Lượng
- ✅ #5 Chữ Cái Đầu Tiên
- ✅ #7 Vật Lạ Trong Nhóm
- ✅ #8 Phân Loại
- ✅ #12 Nhận Diện Màu & Hình
- ✅ #14 ABC
- ✅ #15 Numbers 1–10
- ✅ #16 Colors

## Giai đoạn 4 — Đánh bóng  ☐

- ☐ #10 Tìm Điểm Khác (dời từ GĐ3 — cần ảnh thật để có khác biệt tinh tế)
- ☐ Thay toàn bộ đồ hoạ AI bản cuối (theo style bible + linh vật Cáo)
- ✅ **(Phần A)** Thay giọng đọc Việt/Anh bản cuối — **Web Speech API live, 100% local** (vi-VN + en-US, đọc cả nội dung động số/chữ/từ); SFX bằng Web Audio API (không cần file). Spec: `docs/superpowers/specs/2026-06-20-kiddyhub-phase-4a-audio-voice.md`
- ☐ Hoạt ảnh, hiệu ứng, chuyển cảnh mượt
- ☐ Kiểm thử trải nghiệm với trẻ thật
- ☐ (Tuỳ chọn) Bật PWA offline

---

## 🧰 Nợ kỹ thuật & việc để dành (từ review Giai đoạn 1)

- ✅ **Đã trả ở GĐ2:** tách `GameContainer.onComplete` thành hàm thuần `src/games/applyCompletion.ts` (chuỗi ghi tiến độ + tự nâng mức, không đếm đôi sao) + test tích hợp `applyCompletion.test.ts`. Quyết định nâng mức vẫn ở hàm thuần có test `src/games/progression.ts` (`nextLevel`).
- ✅ **Đã trả ở GĐ4 Phần A:** `speak()` nay **resolve ở mọi nhánh** (đọc xong / bị chen giọng / lỗi / voice-off / thiếu key) — hết treo promise; engine đổi từ Howler sang Web Speech (`src/audio/speechEngine.ts`, đã xoá `howlerPlayer.ts`). Đã **gắn `speak()` cho các màn menu** (Ai đang chơi / bản đồ đảo / màn nhóm).
- **GĐ4:** tách bundle Phaser (~1.7MB) để giảm tải lần đầu; cân nhắc bật PWA offline.
- **Nhỏ, chưa chặn:** `getWeeklyTally` gồm cả bé 0 sao & lọc tuần bằng JS sau index `profileId` (ổn ở quy mô gia đình); vài màn dùng `listProfiles().then(setState)` trong `useEffect` chưa có cleanup khi unmount.

## Nhật ký tiến độ

- **2026-06-19** — Brainstorm xong; chốt thiết kế tổng & lộ trình 4 giai đoạn. Viết bản thiết kế + ROADMAP. Kế tiếp: implementation plan GĐ 1.
- **2026-06-19** — Giai đoạn 1 hoàn thành: scaffold, lớp dữ liệu (Dexie), hệ âm thanh (Howler), game registry, màn "Ai đang chơi?", khu phụ huynh (cổng toán + CRUD + sao), bản đồ 6 đảo, vườn sao, trò "Đếm Vui" (Phaser, 3 mức độ, tự nâng cấp), toàn bộ App shell kết nối đầu-cuối. 48→51 test pass; build thành công.
- **2026-06-19** — Merge vào `main` + đẩy lên GitHub (https://github.com/billphamhypertek/kiddy-hub). Thêm README. Thêm Docker (multi-stage Vite→nginx) + docker-compose, deploy local chạy ở http://localhost:8088. Sẵn sàng cho Giai đoạn 2.
- **2026-06-19** — Giai đoạn 2 hoàn thành: thêm 5 trò (Bé Nhận Mặt Chữ, Tìm Quy Luật, Lật Hình Tìm Cặp, Ghép Hình, First Words) — mỗi đảo nay có nội dung; tách + test `applyCompletion`. 51→85 test pass; build thành công. Kế tiếp: Giai đoạn 3 (10 trò còn lại).
- **2026-06-20** — Giai đoạn 3 hoàn thành: thêm 9 trò (Nhiều hơn – Ít hơn, Ghép Số với Lượng, Chữ Cái Đầu Tiên, Vật Lạ Trong Nhóm, Phân Loại, Nhận Diện Màu & Hình, ABC, Numbers 1–10, Colors) — 15/16 trò; #10 Tìm Điểm Khác dời sang GĐ4 (cần ảnh thật). 85→138 test pass; build thành công. Kế tiếp: Giai đoạn 4.
- **2026-06-20** — **Giai đoạn 4 Phần A (Giọng đọc + âm thanh) hoàn thành.** Thay engine câm → **Web Speech API** (live TTS, 100% local, không file): câu mời/feedback/cheer tiếng Việt, nhóm trò tiếng Anh đọc `en-US`, đọc nội dung động (số/chữ/từ); SFX qua **Web Audio API** (oscillator). Trả 2 nợ kỹ thuật âm thanh: `speak()` resolve mọi nhánh + gắn `speak()` cho menu. Xoá `howlerPlayer.ts`. 138→144 test pass; build + lint sạch. Quy trình: brainstorm → spec → sub-agent implement → sub-agent review (0 lỗi MUST-FIX). Kế tiếp: **Phần B — Đồ hoạ bản cuối** (linh vật Cáo + style bible; #10 phụ thuộc phần này).
