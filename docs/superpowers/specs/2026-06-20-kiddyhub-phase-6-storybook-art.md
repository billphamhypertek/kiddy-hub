# KiddyHub — Giai đoạn 6: "Khoác áo mới" (Storybook Art Direction)

> **Trạng thái:** Bản thiết kế chờ duyệt (2026-06-20). Spec triển khai: **GĐ6 — Đại tu hướng nghệ thuật sang phong cách "Truyện tranh giấy · Tươi" (Storybook Vivid), 100% cục bộ, SVG dựng trong mã + lớp juice tự viết.**
> **Tiền lệ art:** [`2026-06-20-kiddyhub-phase-4b-final-art.md`](./2026-06-20-kiddyhub-phase-4b-final-art.md) (nền SVG + Cáo) · [`2026-06-19-kiddyhub-design.md`](./2026-06-19-kiddyhub-design.md) (§10 style bible).
> **Tiền lệ chuyển động/tiếp cận:** GĐ4-D (motion tokens) · [`2026-06-20-kiddyhub-phase-5e-accessibility.md`](./2026-06-20-kiddyhub-phase-5e-accessibility.md) (calmMode + prefersReducedMotion — **juice GĐ6 bắt buộc tôn trọng**).
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md) — thêm mục "Giai đoạn 6".

---

## 1. Mục tiêu GĐ6

Hết GĐ5, app **chạy / nói / dạy / gắn kết** đầy đủ và đạt MVP→full-fledged. Nhưng phản hồi người dùng thẳng thắn: **nhìn chưa đủ cuốn hút — trẻ nhìn vào dễ bỏ qua.** Chẩn đoán (xem §2) cho thấy vấn đề **không** ở kiến trúc (kiến trúc SVG-trong-mã + token rất tốt) mà ở **hướng nghệ thuật**: vật thể game là emoji, đồ hoạ phẳng-hình-học thiếu chiều sâu, juice thưa, linh vật vắng mặt lúc chơi.

GĐ6 **giữ nguyên kiến trúc**, thay "khí chất" thẩm mỹ: chuyển toàn app sang phong cách **"Truyện tranh giấy · Tươi"** (đã chốt với người dùng qua visual companion, biến thể **V1**), **vẽ lại vật thể game thay emoji**, **đưa Cáo vào cảnh**, **dàn cảnh có chiều sâu**, và **phủ lớp juice đầy đủ** — tất cả vẫn **100% cục bộ, không thêm phụ thuộc**.

### 1.1 Phong cách đã chốt — "Storybook Tươi (V1)"

Người dùng đã duyệt LOOK qua 2 vòng visual companion:
- **Vòng 1 (3 hướng):** chọn **B · Truyện tranh giấy (Storybook)** thay vì *Kẹo dẻo (gummy/glossy)* hay *Đậm nét hiện đại (Duolingo-ish)*. → khí chất **ấm, mộc, cổ tích**.
- **Vòng 2 (3 mức ấm):** chọn **V1 · Tươi (Vivid)** thay vì *V2 Dịu (muted)* hay *V3 Đậm nét mực (inked)*. → giữ **màu thương hiệu tươi**, vân giấy **rất nhẹ**, viền nâu **mảnh**, bóng mềm.

**Định nghĩa phong cách chốt:**
- **Màu:** giữ nguyên bảng `palette` hiện có (6 hue chủ đề + cam Cáo + kem). KHÔNG hạ tông sang muted.
- **Bề mặt:** mỗi mảng màu có **gradient sơn nhẹ** (sáng→đậm) tạo chiều sâu "vẽ tay"; **bóng mềm** ấm nâu (blur, offset thấp, opacity ~0.22–0.28); **vân giấy** mờ (~5%) đặt ở **tầng nền cảnh**, không per-sprite.
- **Viền:** "mực" nâu mềm `#6b4a2a`, **mảnh** (không phải nét đen dày của hướng C).
- **Chữ:** **Baloo 2** (tròn, ấm, **đủ dấu tiếng Việt**) cho tiêu đề/UI — bundle font cục bộ.

### 1.2 Công cụ ngoài đã cân nhắc & loại

Đã nghiên cứu hệ sinh thái plugin/MCP game-dev (game-creator, phaser4-gamedev, Ludo.ai/game-asset-mcp sinh sprite, PhaserFX/phaser3-juice-plugin cho juice). **Loại tất cả** cho lõi GĐ6 vì: không cái nào chuyên trẻ mầm non/đồ hoạ "fancy", hầu hết là pixel-art (lệch phong cách SVG mượt), Ludo.ai là cloud trả phí (trái local-only), PhaserFX là dep thương mại. **Quyết định: tự làm bằng SVG-trong-mã + juice tự viết** — đúng triết lý local-only & đồng bộ tuyệt đối của KiddyHub. (Người dùng đã chốt 2 lựa chọn này: kit SVG tham số + util juice tự viết.)

## 2. Chẩn đoán "vì sao chưa cuốn hút" (6 thủ phạm)

1. **Vật thể game = emoji.** Scene vẽ `this.add.text(x, y, this.current.animal, { fontSize: '60px' })` — con vịt để đếm thực ra là emoji 🦆. Lệch tông, phẳng, mỗi HĐH render một kiểu, **không được thiết kế**. → thủ phạm số 1.
2. **Chữ generic** — câu hỏi màu `#22335a` + font hệ thống, không dùng font display.
3. **SVG phẳng hình học** — không gradient/bóng/chiều sâu; Cáo dễ thương nhưng tối giản.
4. **Juice thưa** — chỉ có `shakeOption`/`popCorrect`/`celebrate` (8 sao bay); thiếu squash&stretch, sparkle mỗi tương tác, nảy theo âm thanh, "sự sống" lúc idle.
5. **Cáo vắng mặt khi chơi** — chỉ hiện lúc `celebrate()`.
6. **Không dàn cảnh** — vật thể trôi trên gradient + mây, thiếu mặt đất/môi trường.

## 3. Quyết định ngược với Phần 4b — VẼ LẠI emoji (có chủ đích)

Phần 4b cố tình **giữ emoji làm "nội dung"** (4b §2, §11, §12), coi việc vẽ lại hàng chục emoji là **YAGNI**. Lý do khi đó hợp lý: 4b chỉ dựng "khung", emoji nội dung "đã rõ ràng, dễ thương, đa nền tảng".

**GĐ6 đảo quyết định này — có cân nhắc:** mục tiêu giờ khác hẳn (đẩy độ **cuốn hút thẩm mỹ**), và chẩn đoán §2 cho thấy **chính emoji là thủ phạm số 1**. Khi khung đã đẹp (storybook) mà nội dung vẫn là emoji hệ thống thì sự lệch tông càng lộ. Vì vậy vẽ lại vật thể game **không còn là YAGNI** mà là **trọng tâm**. Để tránh bẫy "vẽ tay hàng chục hình tốn công, dễ lệch" mà 4b lo, ta dùng **bộ kit tham số** (§5) — sinh nhiều sinh vật/vật thể từ ít template, đồng bộ tuyệt đối, rẻ.

## 4. Nền tảng phong cách — `src/art/paint.ts` (mới) + mở rộng `tokens.ts`

### 4.1 Token mở rộng (`src/art/tokens.ts`)
Thêm (giữ nguyên mọi key cũ — không phá vỡ asset hiện có):
- **`shadow`** — `{ color: '#5b4636', dx, dy, blur, opacity }` cho bóng mềm ấm.
- **`outline`** — `{ ink: '#6b4a2a', width, widthThin }` cho "mực" storybook (tách khỏi `fox.ink`/`palette.ink` để chỉnh độc lập).
- **`paper`** — `{ baseFrequency, opacity }` cho vân giấy.
- **`paint`** — hệ số gradient sơn: `{ lighten, darken }` (độ sáng đỉnh / độ đậm đáy của mỗi mảng).

### 4.2 `src/art/paint.ts` — factory `<defs>` tái dùng
Hàm thuần, trả mảnh SVG string, **id có namespace** (tránh đụng id khi nhiều asset trên cùng trang/texture):
- **`softShadow(id)`** → `<filter>` feDropShadow theo token `shadow`.
- **`paintedFill(id, hue)`** → `<linearGradient>` từ `lighten(hue)` → `hue` → `darken(hue)` (chiều sâu sơn).
- **`inkStroke()`** → thuộc tính stroke chuẩn (màu `outline.ink`, width, round cap/join).
- **`paperGrain(id)`** → `<filter>` feTurbulence + desaturate, dùng cho **một** overlay nền (KHÔNG per-sprite).
- **`withDefs(defs, body)`** → bọc `<defs>…</defs>` vào trước body (tiện compose).

> **Kỹ thuật Phaser:** filter (feDropShadow/feTurbulence) **bake vào base64 texture** bình thường. Nhưng grain per-sprite tốn (mỗi texture chạy turbulence) → đặt **1 lớp grain ở nền cảnh** (Phaser: 1 `Image`/`Graphics` phủ toàn scene ở depth thấp) + 1 overlay CSS cho React. Bóng mềm & gradient sơn thì per-asset OK (rẻ, cache idempotent sẵn).

## 5. Khai tử emoji — `src/art/creatures.ts` (mới, kit tham số)

**Cú hích lớn nhất.** Bộ SVG tham số sinh mọi vật thể game:
- **Template gốc** (ít, tái dùng): `quadruped` (thú 4 chân), `bird` (chim/vịt), `fish`, `bug`, `produce` (trái cây/rau), `vehicle`, `shape` (khối/bóng). Mỗi template nhận config: màu thân/bụng, tai/mỏ/vây, mắt, phụ kiện, biểu cảm.
- **Danh mục vật thể** = data-driven map `id → config` (vd `duck`, `cat`, `dog`, `fish`, `frog`, `bee`, `apple`, `car`, `ball`…). Resolver **`creature(id, opts?)`** → chuỗi `<svg>` (compose `paintedFill` + `softShadow` + `inkStroke`).
- **Thay thế:** mọi chỗ `scene.add.text(x, y, <emoji>, { fontSize })` → `addArt(scene, key, creature(id), x, y, size)`.

**Bước đầu 6.2 = audit:** liệt kê toàn bộ emoji nội dung đang dùng (`counting-fun`, `first-words`, `sorting`, `match-quantity`, `odd-one-out`, `memory-match`…) → ra danh sách `id` kit phải phủ. Kit cute, đồng nhất, **local 100%**, **tô lại màu** theo chủ đề vô tận, bundle siêu nhẹ.

## 6. Cáo nâng cấp + vào cảnh — `src/art/fox.ts` + helper scene

- **Repaint Cáo** theo storybook: lông `paintedFill` (cam gradient), bóng mềm, mặt tinh hơn; giữ API `foxGuide/foxCheer/foxIdle`.
- **Thêm biểu cảm:** `foxThink` (nghiêng đầu, "?"), `foxPoint` (chỉ vào đáp án), `foxNod` (gật) — phục vụ đồng hành & scaffolding.
- **Cáo đồng hành trong scene** (`addBuddy(scene)` trong `sceneArt.ts`): Cáo nhỏ ở góc, **phản ứng** — gật/nhảy nhẹ khi đúng, động viên khi sai, **thở/chớp mắt** lúc idle (tween). Hết cảnh "Cáo vắng mặt khi chơi" (§2.5). **Visual-only**, không chạm guard round/finish.

## 7. Dàn cảnh — nâng cấp `addSceneBackground` (`src/art/sceneArt.ts`)

Backdrop storybook nhiều lớp theo màu chủ đề: trời gradient + **mặt trời/mặt trăng mềm** + mây trôi (đã có) + **mặt đất** (đường chân trời + texture cỏ nhẹ) + vài prop (đồi/bụi). **Vật thể đứng trên đất**, không trôi lơ lửng. Thêm lớp **paper-grain** phủ toàn cảnh (§4.2). Giữ depth-sort cũ (background/cloud/tile/chrome/celebrate) — chèn `ground` & `grain` vào thang depth.

## 8. Lớp juice — mở rộng `src/art/sceneMotion.ts` (tự viết, 0 dep)

Bộ công cụ game-feel tái dùng, **mọi hàm tôn trọng `prefersReducedMotion()` + calmMode** (GĐ5E):
- **`squashStretchPop(obj)`** — pop đáp đúng có nén/giãn (thay/nâng `popCorrect`).
- **`sparkleBurst(scene, x, y)`** — cụm hạt lấp lánh khi đúng (Phaser particle/tween nhẹ).
- **`tilePress(tile)`** — ô lún khi bấm (phản hồi xúc giác).
- **`idleBreathe(obj)`** — "thở" lúc chờ (Cáo, vài vật thể).
- **`bouncePop(obj)`** — nảy vào lúc xuất hiện (đồng bộ SFX).
- **Nâng cấp `celebrate`** — confetti + sao + Cáo cheer mượt hơn; calmMode vẫn giữ bản tĩnh nhẹ (đã có).

> Hiệu năng: tái dùng emitter/texture, dọn tween onComplete (mẫu `celebrate` hiện tại đã làm đúng). Particle phải có đường tween thuần để **interruption-safe** như code cũ.

## 9. Chrome React / menu — `src/App.css` + components

Đồng bộ menu ↔ game: nền **paper-grain** (overlay CSS), nút/thẻ **sơn** (bóng mềm + viền mực + gradient), tiêu đề **Baloo 2**, repaint **bản đồ + 6 đảo** (`islands.ts`), avatar/icon restyle theo bề mặt mới. **Font local-only:** bundle **Baloo 2 woff2** (subset Việt+Latin để nhẹ) qua `@font-face` cục bộ — **không** gọi Google CDN lúc chạy (giữ offline tuyệt đối; Vite copy vào `dist`).

## 10. Lộ trình (chia phase — bắt buộc; mỗi phase 1 sub-agent + 1 cổng duyệt)

- **6.1 — Nền tảng + game mẫu (pilot):** spec (này) → `paint.ts` + token mở rộng → bundle Baloo 2 → grain nền + repaint Cáo storybook + `addBuddy` → **chuyển trọn `counting-fun`** (kit `duck`… + dàn cảnh + juice + Cáo đồng hành) làm **bản tham chiếu**. Cổng duyệt: cập nhật style board + screenshot scene. Tests xanh.
- **6.2 — Kit sinh vật + thay emoji:** audit emoji → `creatures.ts` → định nghĩa mọi vật thể → thay sprite các game số/chữ/logic/trí nhớ.
- **6.3 — Cáo + dàn cảnh mọi scene:** rải `addBuddy` + dàn cảnh nâng cấp qua 16 scene.
- **6.4 — Juice toàn bộ:** áp bộ juice khắp scene; xác nhận calmMode/reduced-motion ở từng nơi.
- **6.5 — React/menu + bản đồ:** `App.css` + components + đảo + avatar/icon.

Mỗi phase: **giữ 452 test xanh**, build/lint/tsc sạch, **Docker :8088 HTTP 200**, commit + push — đúng quy trình GĐ5. **writing-plans** sẽ tạo plan chi tiết cho **6.1 trước**; các phase sau mỗi phase một plan riêng khi tới.

## 11. Kiểm thử

- **`src/art/paint.test.ts`** (mới): `softShadow/paintedFill/inkStroke/paperGrain` ra `<defs>`/thuộc tính hợp lệ; id có namespace (không trùng); token mới đủ key.
- **`src/art/creatures.test.ts`** (mới, từ 6.2): `creature(id)` ra `<svg>` hợp lệ cho mọi id trong danh mục; màu lấy từ token; id không xác định → fallback an toàn.
- **`src/art/sceneMotion.test.ts`** (mở rộng): mỗi hàm juice **no-op/giảm nhẹ** khi `prefersReducedMotion()` true; không ném khi thiếu tween.
- **Stub Phaser** (`src/test/phaser-stub.ts`): mở rộng nếu chạm API mới (particle emitter, graphics gradient) — giữ test xanh.
- Giữ **toàn bộ test còn lại xanh** (mốc hiện tại **452**). Logic game test không đổi.

## 12. Ranh giới — KHÔNG đụng tới

- **Logic trò chơi** (`*Logic.ts`), `progression.ts`/`applyCompletion.ts`/`registry.ts`/`scaffold.ts`/`masterySession.ts`, lớp dữ liệu Dexie (`src/data/*`), router màn, khu phụ huynh, hệ âm thanh/giọng (GĐ4A/5A), mastery/SR (GĐ5B).
- **Ngữ nghĩa tiếp cận** (GĐ5E): juice **tích hợp** calmMode + prefersReducedMotion, **không** phá. An toàn mù màu (pattern+nhãn) giữ nguyên.
- **Tính cục bộ:** không ảnh raster/AI/atlas, không mạng lúc chạy, không asset ngoài (trừ **1 font woff2 bundle sẵn**). Docker/nginx không thêm asset động.

## 13. Ngoài phạm vi GĐ6 (YAGNI)

- Vẽ tả thực phức tạp / 3D / cảnh có chiều sâu phối cảnh.
- Hoạt ảnh khung hình (sprite sheet) cho nhân vật — dùng tween SVG, không frame-by-frame.
- Trình tạo nhân vật cho trẻ / tuỳ biến avatar nâng cao.
- Thay đổi luồng học, nội dung câu hỏi, hay thêm trò mới.

## 14. Rủi ro & quyết định

- **Đảo quyết định emoji (4b):** đã biện minh §3 — mục tiêu đổi, emoji là thủ phạm, kit tham số khử rủi ro "tốn công/lệch".
- **Render filter khác giữa trình duyệt:** grain/bóng có thể lệch nhẹ trên Cốc Cốc/Chrome macOS → đặt grain ở **scene-level** (ít texture), test trên trình duyệt thật (đã có sẵn việc-người manual-browser-test). Style board PNG dùng Chrome headless.
- **Hiệu năng nhiều texture gradient:** cache idempotent (đã có), tái dùng key theo (id+màu), grain chỉ 1 lớp.
- **Phình phạm vi:** kỷ luật 6.1→6.5, mỗi phase 1 sub-agent + cổng duyệt; pilot `counting-fun` chốt LOOK trước khi rải rộng.
- **Bundle font:** subset Baloo 2 (Việt+Latin) để nhẹ; chỉ 1 file woff2.
- **calmMode/reduced-motion:** mọi hàm juice phải có nhánh giảm nhẹ — kiểm trong test (§11).
