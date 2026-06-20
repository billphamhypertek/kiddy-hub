# KiddyHub — Bảng theo dõi tiến độ (ROADMAP)

> Đây là **nguồn sự thật về tiến độ**. Liếc vào đây để biết đang ở đâu & việc kế tiếp.
> Thiết kế đầy đủ: [`docs/superpowers/specs/2026-06-19-kiddyhub-design.md`](docs/superpowers/specs/2026-06-19-kiddyhub-design.md).
> **Quy ước:** ☐ chưa làm · 🔨 đang làm · ✅ xong. Cập nhật file này ở cuối mỗi phiên làm việc.

## 👉 Tiếp theo cần làm gì

**Giai đoạn 1 ✅, Giai đoạn 2 ✅ & Giai đoạn 3 ✅ hoàn thành.** Đã có Docker chạy local: `docker compose up -d --build` → http://localhost:8088.

**Đủ 16/16 trò chơi** (#10 Tìm Điểm Khác hoàn thành ở GĐ4 Phần C).

**Giai đoạn 4 — phần code A→F đã XONG (chia thành các phần độc lập, mỗi phần spec + sub-agent riêng). Chỉ còn "kiểm thử với trẻ thật" (việc con người):**
- ✅ **Phần A — Giọng đọc + âm thanh** (Web Speech API live, local; trả 2 nợ kỹ thuật audio) — xong 2026-06-20.
- ✅ **Phần B — Đồ hoạ bản cuối** (SVG vector trong code thay emoji: linh vật Cáo + style bible as code + bộ nhận diện + đồ hoạ 15 scene) — xong 2026-06-20. **Lưu ý:** chọn **SVG vector** thay "ảnh AI" vì môi trường không có text-to-image trực tiếp + SVG nhất quán/local/làm #10 dễ (user đã duyệt look).
- ✅ **Phần C — #10 Tìm Điểm Khác** (đủ **16/16 trò**) — xong 2026-06-20. Cảnh vườn SVG render 2 bản, random N điểm khác/vòng (logic thuần seeded), 3 mức (3/4/5 điểm) × 3 vòng. Nhóm `memory` (Trí nhớ & Quan sát). Spec: `docs/superpowers/specs/2026-06-20-kiddyhub-phase-4c-spot-difference.md`
- ✅ **Phần D — Hoạt ảnh / hiệu ứng / chuyển cảnh** — xong 2026-06-20. D1: chuyển cảnh React (fade+slide) + entrance so-le + nền tảng `src/motion/` (reduced-motion, jsdom-safe). D2: entrance + feedback juicy trong Phaser (pop-in, đúng nảy+lấp lánh, sao bay) cho 16 scene. Tôn trọng `prefers-reduced-motion`; tương tác tức thời, không chặn.
- ✅ **Phần E — Tách bundle Phaser** — xong 2026-06-20. Nạp scene động (`loadScene()` thay `createScene`) + `React.lazy(GameContainer)` → Phaser thành chunk async tải-khi-mở-trò. **Bundle khởi động 1.824kB → 288kB (−84%)**. Kèm tách `selectScreen` thuần + test (bịt lỗ routing đã làm lọt bug D1).
- ✅ **Phần F — PWA offline** — xong 2026-06-20. `vite-plugin-pwa` (manifest + service worker precache 33 mục/1929KiB gồm cả Phaser → chạy offline, cài được); icon cài đặt từ linh vật Cáo; nginx chỉnh để phục vụ `sw.js`/manifest không bị cache cũ.
- ☐ **Kiểm thử với trẻ thật** (việc của con người — không tự động hoá được). **→ Toàn bộ mục code của GĐ4 đã xong.**

**Giai đoạn 5 — "Full-fledged" 🔨 (MVP → bản đầy đủ). Bản đồ tổng: [`docs/superpowers/specs/2026-06-20-kiddyhub-phase-5-roadmap.md`](docs/superpowers/specs/2026-06-20-kiddyhub-phase-5-roadmap.md).** Phân rã 5 phần độc lập, làm tuần tự **A → B → C → D → E** (mỗi phần spec + plan + sub-agent riêng, như GĐ4):
- ✅ **Phần A — Giọng đọc neural bản cuối** (nền tảng) — xong 2026-06-20. Nguồn TTS: **Piper (local, miễn phí)** — `vi_VN-vais1000-medium` + `en_US-amy-medium`, thu lúc build (chủ dự án đã nghe duyệt mẫu). `scripts/build-voice-clips.mjs` (DRY, gom clip từ chính module nội dung; remap 29 chữ Việt cho Piper, khoá tra vẫn là chữ gốc; idempotent) → **143 clip MP3 mono / 912 KB** trong `public/voice/` + index `src/audio/voiceClips.ts`. Engine mới `prerecordedEngine.ts` (clip thu sẵn + **fallback Web Speech** cho nội dung vô hạn như tên bé) tuân thủ y nguyên interface `SpeechEngine` → `App.tsx` chỉ đổi 1 dòng, `AudioManager` không đụng. Precache PWA thêm `mp3` → **offline + chạy ĐÚNG giọng mọi trình duyệt** (sửa lỗi Chromium-macOS đọc tiếng Việt bằng giọng Anh). Test chống-drift bắt buộc mọi dòng app đọc (gồm 22 tiêu đề nhóm/trò) phải có clip. 213→**223 test** xanh, build+lint+tsc sạch. Spec: `docs/superpowers/specs/2026-06-20-kiddyhub-phase-5a-voice-neural.md` · Plan: `docs/superpowers/plans/2026-06-20-kiddyhub-phase-5a.md`. **Manual-test (npm run build + preview, Chrome/Cốc Cốc macOS):** câu dẫn đọc giọng Việt đúng (không còn giọng Anh), nhóm English đọc en-US, số/chữ/từ/màu/tiêu đề đọc từ clip, tên bé (không clip) rớt Web Speech, tắt mạng vẫn đọc.
- ✅ **Phần B — Chiều sâu học tập** — xong 2026-06-20. **B1** (data thuần): bảng Dexie `itemMastery` (v2 additive, không mất data) + `leitner.ts` (6 hộp, "Đã thạo"=hộp 4 ~1 tuần) + `srScheduler.ts` (`pickNextItem` thuần, ưu tiên mới→đến-hạn-yếu→đến-hạn→lấp, chống lặp, inject now/rng) + repo `mastery.ts` + `masterySession.ts` (core sync). **B2** (nối): `GameHost` thêm method *optional* (pickItem/recordItemResult/hint), `generateRound` thêm `seedTarget?` *tuỳ chọn* (undefined = byte-identical → test cũ nguyên), `GameContainer` nạp mastery 1 lần trước boot, **8 trò "có mục học"** nối SR + **scaffolding cả 8** (sai lần đầu → `dimDistractor` làm mờ+khoá bớt nhiễu còn 2, KHÔNG xoá object → guard/hit-area nguyên; nhạt dần khi box≥2) + 6 câu gợi ý vi-VN → thu thêm clip Piper (143→**149**). Review đối kháng: **0 CRITICAL/MUST-FIX** (xác minh khoá item nhất quán chọn=hiển thị=ghi cho cả 8 trò, ghi đúng 1 lần/vòng), vá 1 MINOR (`.catch` cho persist fire-and-forget). 223→**304 test** xanh, build+lint+tsc sạch. Spec: `docs/superpowers/specs/2026-06-20-kiddyhub-phase-5b-learning-depth.md`. **Manual-test (browser):** mục hay sai quay lại sớm/mục thạo thưa dần; sai lần đầu → mờ bớt ô + gọi ý có giọng, ô đúng vẫn chạm được; mastery bền qua reload.
- ✅ **Phần C — Bảng phụ huynh 2.0** — xong 2026-06-20. Thuần React, **tiêu thụ read-API của B** (không đụng write-path). **C1** (data thuần): `src/data/parentInsights.ts` (`getChildMastery` → mỗi kỹ năng: nhãn Việt + status Đã thạo/Đang lên/Nên luyện + trò luyện + tip; `getWeeklyMasteryRecap` → số mục mới thạo tuần này + sao tuần; `skillLabel`) + `src/content/parentTips.ts` (gợi ý chơi ngoài đời + trò luyện + privacy + nhắc lành mạnh, **exhaustive theo `SkillId`** — khoá chặt 2 lớp type+test). **C2** (UI): `ChildMasteryCard`/`WeeklyRecapCard`/`PrivacyNote`/`HealthyUseNote`/`ChildProgressList` (async có cleanup guard) ghép **additive** vào `ParentArea` (CRUD/sao/audio cũ nguyên byte-for-byte). **Không vanity "phút đã chơi"**; status **không-chỉ-bằng-màu** (icon+chữ+hình badge); tên trò dạng text (deep-link để Phần D). Review đối kháng **SHIP, 0 lỗi**. 304→**343 test** xanh, build+lint+tsc sạch. Spec: `docs/superpowers/specs/2026-06-20-kiddyhub-phase-5c-parent-dashboard.md`. **Manual-test (browser):** vào khu phụ huynh → thấy mỗi bé "Đã thạo/Đang lên/Nên luyện" + thẻ tuần + gợi ý đời thực + mục privacy/nhắc lành mạnh; CRUD/sao/audio vẫn chạy.
- ☐ **Phần D — Mạch chơi liền lạc & gắn kết**: onboarding + điều hướng không đứt gãy + "Cuộc phiêu lưu hôm nay" + Cáo bạn đồng hành + sưu tập gắn mastery + nối đời thực. (có thể tách D1 flow / D2 gắn kết)
- ☐ **Phần E — Tiếp cận & hoà nhập**: an toàn mù màu (trò màu/hình) + chế độ êm + đọc giọng mọi nút điều hướng + thuận tay trái.

> **Đang ở:** GĐ5 — **A ✅** (giọng Piper) · **B ✅** (mastery/SR/scaffolding) · **C ✅** (bảng phụ huynh 2.0, 343 test). Kế tiếp: **Phần D (Mạch chơi liền lạc & gắn kết)** — onboarding + điều hướng không-đứt-gãy + "Cuộc phiêu lưu hôm nay" + Cáo bạn đồng hành + sưu tập gắn mastery + nối đời thực (gồm deep-link "Luyện tiếp" từ khu phụ huynh hoãn từ C).

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

## Giai đoạn 4 — Đánh bóng  ✅ (phần code A–F xong; còn kiểm thử với trẻ thật)

- ✅ **(Phần C)** #10 Tìm Điểm Khác — đủ **16/16 trò**. Cảnh vườn SVG render 2 bản; mỗi vòng random N điểm khác (xoá/đổi màu/dời/co) từ catalog 8, logic thuần seeded có test; chạm đúng → đánh dấu, đủ N → qua vòng, 3 vòng → màn thưởng. Nhóm `memory`.
- ✅ **(Phần B)** Thay toàn bộ đồ hoạ bản cuối — **SVG vector trong code** (không emoji ở khung/UI; giữ emoji nội dung trong trò). Style bible as code (`src/art/tokens.ts`) + linh vật **Cáo** 3 dáng + 8 avatar + 15 game icon + 6 đảo + nền map + UI chrome + nền pastel theo nhóm cho 15 scene + màn thưởng (Cáo cổ vũ + sao). Spec: `docs/superpowers/specs/2026-06-20-kiddyhub-phase-4b-final-art.md`
- ✅ **(Phần A)** Thay giọng đọc Việt/Anh bản cuối — **Web Speech API live, 100% local** (vi-VN + en-US, đọc cả nội dung động số/chữ/từ); SFX bằng Web Audio API (không cần file). Spec: `docs/superpowers/specs/2026-06-20-kiddyhub-phase-4a-audio-voice.md`
- ✅ **(Phần D)** Hoạt ảnh, hiệu ứng, chuyển cảnh mượt — chuyển cảnh React (fade+slide) + entrance so-le; trong Phaser: pop-in prompt/ô/Cáo, đúng = nảy + lấp lánh, sao bay lên HUD. Nền tảng `src/motion/` (tokens + `prefers-reduced-motion` cho cả React hook & helper thuần). Visual-only, giữ logic/guard/hit-area.
- ☐ Kiểm thử trải nghiệm với trẻ thật
- ✅ **(Phần F)** Bật PWA offline — `vite-plugin-pwa`: web manifest (tên KiddyHub, icon Cáo, standalone, màu thương hiệu) + service worker precache app shell + 16 scene + Phaser → **cài được & chạy offline**; nginx phục vụ `sw.js`/manifest no-cache.

---

## 🧰 Nợ kỹ thuật & việc để dành (từ review Giai đoạn 1)

- ✅ **Đã trả ở GĐ2:** tách `GameContainer.onComplete` thành hàm thuần `src/games/applyCompletion.ts` (chuỗi ghi tiến độ + tự nâng mức, không đếm đôi sao) + test tích hợp `applyCompletion.test.ts`. Quyết định nâng mức vẫn ở hàm thuần có test `src/games/progression.ts` (`nextLevel`).
- ✅ **Đã trả ở GĐ4 Phần A:** `speak()` nay **resolve ở mọi nhánh** (đọc xong / bị chen giọng / lỗi / voice-off / thiếu key) — hết treo promise; engine đổi từ Howler sang Web Speech (`src/audio/speechEngine.ts`, đã xoá `howlerPlayer.ts`). Đã **gắn `speak()` cho các màn menu** (Ai đang chơi / bản đồ đảo / màn nhóm).
- ✅ **Đã trả ở GĐ4 Phần E:** tách bundle Phaser — nạp scene động + `React.lazy(GameContainer)` → Phaser (~1.5MB) ra chunk async tải-khi-mở-trò; **bundle khởi động 1.824kB → 288kB (−84%, gzip 447→94kB)**. (PWA offline còn lại ở Phần F, tuỳ chọn.)
- **Nhỏ, chưa chặn:** `getWeeklyTally` gồm cả bé 0 sao & lọc tuần bằng JS sau index `profileId` (ổn ở quy mô gia đình); vài màn dùng `listProfiles().then(setState)` trong `useEffect` chưa có cleanup khi unmount.

## Nhật ký tiến độ

- **2026-06-19** — Brainstorm xong; chốt thiết kế tổng & lộ trình 4 giai đoạn. Viết bản thiết kế + ROADMAP. Kế tiếp: implementation plan GĐ 1.
- **2026-06-19** — Giai đoạn 1 hoàn thành: scaffold, lớp dữ liệu (Dexie), hệ âm thanh (Howler), game registry, màn "Ai đang chơi?", khu phụ huynh (cổng toán + CRUD + sao), bản đồ 6 đảo, vườn sao, trò "Đếm Vui" (Phaser, 3 mức độ, tự nâng cấp), toàn bộ App shell kết nối đầu-cuối. 48→51 test pass; build thành công.
- **2026-06-19** — Merge vào `main` + đẩy lên GitHub (https://github.com/billphamhypertek/kiddy-hub). Thêm README. Thêm Docker (multi-stage Vite→nginx) + docker-compose, deploy local chạy ở http://localhost:8088. Sẵn sàng cho Giai đoạn 2.
- **2026-06-19** — Giai đoạn 2 hoàn thành: thêm 5 trò (Bé Nhận Mặt Chữ, Tìm Quy Luật, Lật Hình Tìm Cặp, Ghép Hình, First Words) — mỗi đảo nay có nội dung; tách + test `applyCompletion`. 51→85 test pass; build thành công. Kế tiếp: Giai đoạn 3 (10 trò còn lại).
- **2026-06-20** — Giai đoạn 3 hoàn thành: thêm 9 trò (Nhiều hơn – Ít hơn, Ghép Số với Lượng, Chữ Cái Đầu Tiên, Vật Lạ Trong Nhóm, Phân Loại, Nhận Diện Màu & Hình, ABC, Numbers 1–10, Colors) — 15/16 trò; #10 Tìm Điểm Khác dời sang GĐ4 (cần ảnh thật). 85→138 test pass; build thành công. Kế tiếp: Giai đoạn 4.
- **2026-06-20** — **Code-review toàn GĐ4 (A→F, dải `a0f3493..HEAD`) + fix mọi finding.** 4 sub-agent review song song theo mảng. Phát hiện **1 lỗi NGHIÊM TRỌNG**: trò #10 Tìm Điểm Khác **không thể thắng** — miss-rect thêm vào Container *sau* hotspot, mà trong Phaser `input.topOnly` giữ child thêm-SAU (renderList index cao nhất) → mọi lần chạm rơi vào `onMiss`, `onHit` không bao giờ chạy. **Đã phân xử bằng Phaser 3.90.0 headless thật** (không đoán) rồi fix: thêm miss-rect TRƯỚC hotspot. Cùng đợt fix 10 finding nữa: lắc-sai vô hình ở `more-less` (dùng `shakeOption`), `popCorrect` méo mảnh không-vuông ở `jigsaw` (bounce scaleX/Y độc lập), gỡ dependency chết `howler`, đồng nhất `alt` sao thưởng, gỡ `avatarEmoji` thừa, memo hoá `<SvgArt>`, đổi tên `gardenScene.ts`→`gardenArt.ts`, entrance chữ ở `abc-english`, nudge hotspot `cloud/bird`, `setVoiceOn(false)` cắt giọng ngay. 213 test giữ nguyên; build + lint sạch. **Bài học:** scene Phaser chỉ kiểm thủ công → lỗi tap-routing lọt cả review lẻ; phải thực nghiệm khi 2 phân tích mâu thuẫn.
- **2026-06-20** — **Giai đoạn 4 Phần F (PWA offline) hoàn thành — TRỌN BỘ MỤC CODE GĐ4 XONG.** Thêm `vite-plugin-pwa` (`registerType:autoUpdate`, `injectRegister:auto` → không đụng app code, không ảnh hưởng test): web manifest (KiddyHub, mô tả Việt, standalone, landscape, màu Cáo `#ff8c42`/kem `#fef6ec`, `categories` education/kids/games) + service worker precache **33 mục/1929KiB** (app shell + 16 scene + Phaser → chạy offline). Icon cài đặt sinh từ linh vật Cáo (`scripts/build-pwa-icons.mjs`, headless Chrome): 192/512/maskable-512/apple-touch-180 vào `public/icons/`. Sửa `nginx.conf` để `sw.js`/`registerSW.js`/`manifest.webmanifest` phục vụ no-cache (tránh kẹt SW cũ), `/assets/*` vẫn immutable. 213 test giữ nguyên; build emit `sw.js`+manifest+icons; lint sạch. Còn lại GĐ4: chỉ "kiểm thử với trẻ thật" (việc con người).
- **2026-06-20** — **Giai đoạn 4 Phần E (Tách bundle Phaser) hoàn thành.** Đổi contract `GameModule`: `createScene` → `loadScene(): Promise<SceneFactory>` (mỗi trò `import()` Scene động, module không còn import Phaser tĩnh) + `React.lazy(GameContainer)` + Suspense ("Đang tải trò chơi…"). Phaser thành chunk async, **bundle khởi động 1.824kB → 288kB (−84%; gzip 447→94kB)**; menu không tải Phaser. Kèm tách `src/state/selectScreen.ts` (hàm thuần chọn màn) + test phủ ca regression D1 (parentGate khi chưa có profile). Review 0 lỗi; xác nhận StrictMode boot đúng 1 Phaser instance. 188→213 test pass; build + lint sạch. Kế tiếp: **Phần F (tuỳ chọn) — PWA offline**.
- **2026-06-20** — **Giai đoạn 4 Phần D (Hoạt ảnh / hiệu ứng / chuyển cảnh) hoàn thành.** D1 (sub-agent): nền tảng `src/motion/` (tokens thời lượng/easing + `usePrefersReducedMotion` hook + `prefersReducedMotion` thuần, đều jsdom-safe) + `<ScreenTransition>` (fade+slide khi đổi màn) + entrance so-le cho lưới avatar/đảo/thẻ trò/vườn sao. D2 (sub-agent): `src/art/sceneMotion.ts` (`animateIn`/`popCorrect`/`flyStars`) áp 16 scene — entrance pop-in, đúng = nảy + lấp lánh, sao bay lên HUD. Tất cả tôn trọng reduced-motion, tương tác tức thời, end-state an toàn. Review tìm 1 MUST-FIX (refactor App.tsx ở D1 vô tình che Khu phụ huynh — sửa thứ tự nhánh) + 1 polish (shapes-colors scale quanh tâm). 174→188 test pass; build + lint sạch. Kế tiếp: **Phần E — tách bundle Phaser**.
- **2026-06-20** — **Giai đoạn 4 Phần C (#10 Tìm Điểm Khác) hoàn thành — đủ 16/16 trò.** Trò cuối từng bị hoãn vì cần ảnh thật; nay tận dụng hạ tầng SVG (B): một cảnh vườn-Cáo SVG render 2 bản, mỗi vòng random N điểm khác (logic thuần seeded, test riêng), 3 mức (3/4/5 điểm) × 3 vòng, chạm hotspot vô hình trên ảnh đổi → đánh dấu; nhóm `memory` (theo spec §9). Review 0 lỗi MUST-FIX; sửa 2 polish (comment định tuyến tap chính xác + `topOnly` tường minh; bush rõ hơn ở L3). 153→164 test pass; build + lint sạch. Kế tiếp: **Phần D — hoạt ảnh/hiệu ứng**.
- **2026-06-20** — **Giai đoạn 4 Phần B (Đồ hoạ bản cuối) hoàn thành.** Thay emoji khung/UI bằng **SVG vector trong code** (100% local, không ảnh raster/AI ngoài; user duyệt look qua bảng phong cách). Hạ tầng `src/art/` (tokens style-bible + adapter SVG→React `<SvgArt>` + SVG→Phaser texture + helper scene). 3 bước sub-agent: **B1** nền tảng + linh vật Cáo (3 dáng) → **B2** bộ nhận diện React (8 avatar, 15 game icon, 6 đảo phong phú, nền map, sao+vườn) → **B3** đồ hoạ 15 scene Phaser (UI chrome SVG, nền pastel theo nhóm, ô đáp án, màn thưởng Cáo cổ vũ + sao bay). Review 0 lỗi MUST-FIX; sửa 1 polish (lắc "thử lại" hiện rõ qua helper `shakeOption` ở 9 trò). Logic/guard/hit-area nguyên vẹn. 144→153 test pass; build + lint sạch. Kế tiếp: **Phần C — #10 Tìm Điểm Khác**.
- **2026-06-20** — **Giai đoạn 4 Phần A (Giọng đọc + âm thanh) hoàn thành.** Thay engine câm → **Web Speech API** (live TTS, 100% local, không file): câu mời/feedback/cheer tiếng Việt, nhóm trò tiếng Anh đọc `en-US`, đọc nội dung động (số/chữ/từ); SFX qua **Web Audio API** (oscillator). Trả 2 nợ kỹ thuật âm thanh: `speak()` resolve mọi nhánh + gắn `speak()` cho menu. Xoá `howlerPlayer.ts`. 138→144 test pass; build + lint sạch. Quy trình: brainstorm → spec → sub-agent implement → sub-agent review (0 lỗi MUST-FIX). Kế tiếp: **Phần B — Đồ hoạ bản cuối** (linh vật Cáo + style bible; #10 phụ thuộc phần này).
- **2026-06-20** — **GĐ5 khởi động + Phần A (Giọng đọc neural bản cuối) hoàn thành.** Brainstorm "MVP → full-fledged": research best-practice EdTech mầm non 2024–2026 (qua sub-agent) → chốt phân rã **GĐ5 = 5 phần A–E** (Giọng neural · Chiều sâu học tập · Bảng phụ huynh 2.0 · Mạch chơi liền lạc & gắn kết · Tiếp cận) — bản đồ tổng `specs/2026-06-20-kiddyhub-phase-5-roadmap.md`. **Phần A:** thay Web Speech live (sai giọng Việt trên Chromium-macOS) bằng **clip thu sẵn Piper (local, miễn phí)**; sub-agent #1 cài Piper + thu mẫu (user nghe duyệt giọng) + soạn plan → sub-agent #2 implement (generator DRY 143 clip/912KB + engine fallback + test) → sub-agent #3 review đối kháng (1 MUST-FIX: tiêu đề nhóm/trò CÓ đọc runtime nhưng test chống-drift loại trừ trên giả định sai → đã bắt buộc lại) → fix. Engine mới tuân thủ interface `SpeechEngine` nên `AudioManager` không đụng; runtime offline tuyệt đối; chạy đúng giọng MỌI trình duyệt. 213→**223 test** xanh, build+lint+tsc sạch. Điều phối qua sub-agent (không inline) theo yêu cầu user. Kế tiếp: **Phần B — Chiều sâu học tập**.
- **2026-06-20** — **GĐ5 Phần B (Chiều sâu học tập) hoàn thành.** Tách **B1** (data/scheduler thuần) → **B2** (nối scene + scaffolding + clip gợi ý), mỗi bước 1 sub-agent. B1: bảng `itemMastery` (Dexie v2 additive) + Leitner 6 hộp (`MASTERED_BOX=4`) + `pickNextItem` thuần (inject now/rng) + repo + session core (223→270 test). B2: `GameHost` method optional + `generateRound(seedTarget?)` (undefined byte-identical) + `GameContainer` nạp mastery trước boot + 8 trò "có mục học" nối SR + **scaffolding cả 8** (làm mờ+khoá bớt nhiễu còn 2, không xoá object) + 6 câu gợi ý → clip Piper (143→149); 270→304 test. **Review đối kháng SHIP** (0 CRITICAL/MUST-FIX; xác minh khoá item nhất quán chọn=hiển thị=ghi cho cả 8 trò + ghi 1 lần/vòng + nhánh undefined không xê dịch rng) → vá 1 MINOR (`.catch` persist). 2 quyết định user chốt: scaffolding cả 8 trò + "Đã thạo"=hộp 4. build+lint+tsc sạch. Kế tiếp: **Phần C — Bảng phụ huynh 2.0**.
- **2026-06-20** — **GĐ5 Phần C (Bảng phụ huynh 2.0) hoàn thành.** Thuần React, tiêu thụ read-API mastery của B (read-only). Tách **C1** (read-helper `parentInsights.ts` + bảng nội dung `parentTips.ts`, exhaustive theo `SkillId`) → **C2** (UI: `ChildMasteryCard`/`WeeklyRecapCard`/`PrivacyNote`/`HealthyUseNote`/`ChildProgressList` ghép additive vào `ParentArea`). Dashboard "Đã thạo/Đang lên/Nên luyện" theo kỹ năng (nhãn Việt) + thẻ tuần (mục mới thạo + sao, **không "phút đã chơi"**) + gợi ý chơi ngoài đời + privacy-là-tính-năng + nhắc lành mạnh (tĩnh, không theo dõi screen-time). Status không-chỉ-màu (icon+chữ+hình). 2 quyết định chốt: hiện tên trò (deep-link hoãn sang D) + tip chỉ ở Nên-luyện/Đã-thạo. Điều phối: design sub-agent → C1 → C2 → review đối kháng **SHIP 0 lỗi** (CRUD/sao/audio cũ nguyên byte-for-byte; read-only xác minh; weekly-recap đúng tuần). 304→**343 test** xanh, build+lint+tsc sạch. Kế tiếp: **Phần D — Mạch chơi liền lạc & gắn kết**.
