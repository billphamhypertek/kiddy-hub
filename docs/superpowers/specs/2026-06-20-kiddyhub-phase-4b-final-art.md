# KiddyHub — Giai đoạn 4 · Phần B: Đồ hoạ bản cuối (SVG vector + linh vật Cáo)

> **Trạng thái:** Đã duyệt thiết kế (2026-06-20). Spec triển khai: **Giai đoạn 4 — Phần B (Đồ hoạ bản cuối, 100% chạy cục bộ, vector SVG dựng trong mã).**
> **Bản thiết kế tổng:** [`2026-06-19-kiddyhub-design.md`](./2026-06-19-kiddyhub-design.md) — §10 (style bible), §6 (luồng màn).
> **Tiền lệ GĐ2 / GĐ3 / 4A:** [`2026-06-19-kiddyhub-phase-2-design.md`](./2026-06-19-kiddyhub-phase-2-design.md) · [`2026-06-20-kiddyhub-phase-3-design.md`](./2026-06-20-kiddyhub-phase-3-design.md) · [`2026-06-20-kiddyhub-phase-4a-audio-voice.md`](./2026-06-20-kiddyhub-phase-4a-audio-voice.md).
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md) — mục "Giai đoạn 4".

---

## 1. Mục tiêu Phần B

Tới hết GĐ3 + Phần A, app **chạy & nói** đầy đủ nhưng **mọi hình ảnh vẫn là emoji**: scene Phaser vẽ `this.add.text(x, y, '🦊', { fontSize })`; menu React render emoji từ `src/content/avatars.ts` (8 avatar), `src/content/categories.ts` (6 đảo có `icon`+`color`+`islandPos`), và chuỗi `iconKey` của từng trò trong `src/games/*/index.ts`.

Phần B thay lớp hình ảnh "khung" (frame) đó bằng **đồ hoạ vector SVG dựng 100% bằng mã** — không ảnh raster, không AI, không asset ngoài, không mạng — đúng triết lý local-only của KiddyHub. **Style bible sống dưới dạng code** (`src/art/tokens.ts`) nên mọi asset đồng bộ tuyệt đối. **Một nguồn SVG duy nhất** cấp cho **cả** React (menu) lẫn Phaser (scene).

### 1.1 Vì sao SVG-trong-mã (thay vì pipeline ảnh AI ở §10 bản thiết kế tổng)

Bản thiết kế tổng (§10) phác "pipeline ảnh AI + sprite atlas". Khi triển khai thực tế, **vector SVG dựng trong mã** thắng vì:

- **100% cục bộ & xác định:** không gọi AI, không tải ảnh, không seed lệch phong cách. Mỗi lần build ra hình y hệt.
- **Đồng bộ tuyệt đối:** mọi màu/nét/bo góc lấy từ một file token; sửa một hằng → đổi nhất quán toàn app.
- **Một nguồn, hai đích:** cùng chuỗi SVG → `<img>` cho React, `textures.addBase64` cho Phaser.
- **Nhẹ & sắc nét mọi kích thước:** vài KB/asset, scale vô cấp trên tablet độ phân giải cao, không cần atlas nhiều độ phân giải.
- **Không thêm asset cho Docker/nginx:** giữ image build gọn như Phần A.

> Rủi ro đã cân nhắc: SVG không hợp cho cảnh tả thực phức tạp. Nhưng style bible KiddyHub là **cartoon bo tròn, pastel, nét mềm** — đúng "đất diễn" của vector. Trò #10 "Tìm Điểm Khác" (cần khác biệt tinh tế giữa 2 tranh) tách sang **Phần C** sau khi có nền art này.

## 2. Phạm vi Phần B — vẽ "KHUNG", giữ emoji làm "NỘI DUNG"

Phần B vẽ một **khung minh hoạ gắn kết** (cohesive illustrated frame):

- **Linh vật Cáo** (dẫn đường, cổ vũ, đứng yên) — gương mặt của app.
- **UI chrome:** nút tròn (🔊 nghe lại, 🏠 về nhà), thẻ/ô đáp án, khung thẻ trò.
- **Bản đồ + 6 đảo:** hình đảo vẽ tay theo màu nhóm, có linh vật dẫn đường.
- **Avatar** (8 con vật) & **biểu tượng trò** (icon) & **nền pastel** cho map/scene.
- **Hình thưởng:** sao, hiệu ứng cổ vũ.

**Giữ emoji làm token nội dung trong trò.** Hàng chục biểu tượng nội dung (con vật để đếm 🦆🐸, đồ vật phân loại 🍎🚗, màu/hình cụ thể…) **không** vẽ lại — vẽ lại tất cả là YAGNI, tốn công vô ích và dễ lệch. Emoji nội dung đã rõ ràng, dễ thương, đa nền tảng. Ranh giới: **khung = vector; nội dung học = emoji.**

## 3. Kiến trúc đồ hoạ

```
src/art/
  tokens.ts     — style bible as code (palette, fox colors, stroke, radius, proportion)
  svg.ts        — builder SVG-string + svgToDataUri + adapter Phaser (loadSvgTexture/addArt)
  Art.tsx       — adapter React (<SvgArt svg alt size/>)
  fox.ts        — linh vật Cáo: foxGuide / foxCheer / foxIdle (+ foxPoses)
  (B2) avatars.ts, icons.ts, islands.ts, map.ts …
  (B3) chrome.ts, backgrounds.ts, reward.ts …
```

- **Mọi asset** authored trên lưới vuông `0 0 100 100` (`ART_VIEWBOX`), scale lúc render → một nguồn, sắc nét mọi cỡ.
- **Không hard-code** màu/nét/bo trong file art — import từ `tokens.ts`.
- **React:** `<SvgArt svg={foxGuide()} alt="…" size={120}/>` render `<img src={dataUri}>` (truy cập được, cacheable, alt đúng ngữ nghĩa; `alt=''` → ảnh trang trí `aria-hidden`).
- **Phaser:** `loadSvgTexture(scene, key, svg)` (idempotent, dùng `textures.addBase64`) + `addArt(scene, key, svg, x, y, size)` đặt sprite. Thiết kế kỹ từ B1 vì B3 sẽ dùng nhiều.

## 4. Style bible as code — `src/art/tokens.ts`

- **`palette`** — pastel tươi sáng. Sáu hue `island.*` **giữ y hệt** màu nhóm hiện có (`src/content/categories.ts`: `#ff8fab #7cc6fe #ffb703 #b388ff #06d6a0 #ff7043`) để đảo on-brand khi B2 vẽ lại. Thêm vai trò app-wide: `primary` (cam Cáo `#ff8c42`), `accent` (xanh trời), `background` (kem ấm), `ink` (nâu sẫm ấm — chữ & viền, **không** đen tuyền), `star`/`success`/`error` (vàng/mint/hồng dịu — **không** đỏ gắt).
- **`fox`** — màu linh vật: `body` cam, `cream` kem (bụng/má/đầu đuôi/tai trong), `ink` nâu (viền+mũi+mắt), `blush` hồng má, `eyeShine` trắng.
- **`stroke`** (`width`/`thin`/`bold` + `linecap/linejoin: 'round'` → nét mềm), **`radius`** (sm/md/lg/pill), **`proportion`** (đầu to, mắt to: `headRatio`/`eyeRatio`/`pupilRatio`/`bodyRatio`).
- **`ART_VIEWBOX = 100`** — cạnh lưới thiết kế chuẩn.

## 5. Linh vật Cáo — `src/art/fox.ts`

Ba tư thế, mỗi hàm trả chuỗi `<svg>` qua `svgDoc()`, tham số hoá hoàn toàn bằng token:

- **`foxGuide()`** — vẫy/chỉ tay, chào đón → dùng "Cáo dẫn đường" trên bản đồ.
- **`foxCheer()`** — hai tay giơ cao + lấp lánh → màn thưởng / đáp đúng.
- **`foxIdle()`** — đứng yên, cười hiền → hiện diện trung tính.

Thiết kế: thân bo tròn + bụng kem; đầu rộng hơn cao, **mắt to** (tròng trắng + con ngươi nâu + đốm sáng), má ửng hồng, mũi & miệng cười nhỏ, tai nhọn-mềm có lòng kem, đuôi xù đầu kem; tay là nét dày bo tròn có viền + bàn tay kem. Cute, bo tròn, nét mềm — **gương mặt của app**, phải thật duyên.

## 6. Hạ tầng SVG — `src/art/svg.ts`

- **`svgDoc(inner, title?)`** — bọc markup vào `<svg>` đủ trên viewBox chuẩn; `title` → `<title>` truy cập được; mặc định `stroke-linecap/linejoin = round`.
- **`escapeXml(s)`** — thoát 5 ký tự XML đặc biệt.
- **`svgToDataUri(svg)`** — base64 data-URI (`data:image/svg+xml;base64,…`). Encode UTF-8 trước `btoa` để tiêu đề tiếng Việt sống sót.
- **`loadSvgTexture(scene, key, svg)`** — đăng ký texture Phaser (idempotent).
- **`addArt(scene, key, svg, x, y, size)`** — đảm bảo texture rồi đặt sprite giữa `(x,y)` cỡ `size`.
- **`ArtScene`/`ArtImage`** — interface tối thiểu (chỉ phần adapter chạm) để import được dưới stub test mà **không** kéo type Phaser thật → tránh churn stub ở B1.

## 7. Tích hợp mẫu (React, rủi ro thấp) — AdventureMap

Đặt **linh vật Cáo `foxGuide()`** lên **bản đồ phiêu lưu** (`src/components/AdventureMap.tsx`) thay emoji `🦊` — đúng "linh vật Cáo dẫn đường" ở §6 bản thiết kế tổng. Thay `<span className="mascot">🦊` bằng `<SvgArt svg={foxGuide()} alt="Cáo dẫn đường" size={120} className="mascot"/>`; CSS `.mascot` đổi `font-size` → `width/height` + `drop-shadow`. Tinh tế, không phá test (`AdventureMap.test.tsx` vẫn lọc 6 nút `.island`; mascot là `<img>`, không phải button).

## 8. Tách phần — B1 / B2 / B3 (tuần tự, mỗi phần một sub-agent)

- **B1 — Nền tảng + Cáo (phần này):** spec; `tokens.ts`; hạ tầng SVG (`svg.ts`+`Art.tsx`); linh vật Cáo 3 tư thế; tích hợp mẫu Cáo lên AdventureMap; **style board** `docs/art/style-sample.svg` (+PNG) cho cổng duyệt; unit test cho `svgToDataUri`/tokens/adapter.
- **B2 — Bộ nhận diện vào menu React:** vẽ 8 avatar, icon từng trò, 6 đảo, nền bản đồ; thay emoji ở WhoIsPlaying / AdventureMap (đảo) / CategoryScreen / StarGarden. Vẫn React-side, rủi ro thấp.
- **B3 — Chrome/nền/thưởng vào 15 scene Phaser:** dùng `loadSvgTexture`/`addArt` rải nút 🔊/🏠, nền pastel, hình thưởng + Cáo cổ vũ qua 15 scene. Nếu chạm API Phaser mới mà test import → **mở rộng stub** (`src/test/phaser-stub.ts`) cho test xanh.

## 9. Cổng duyệt hình ảnh (visual checkpoint) — `docs/art/style-sample.svg`

Một SVG "style board" tự chứa cho **user duyệt LOOK trước khi B2/B3 triển khai:** 3 tư thế Cáo cạnh nhau, bảng màu (swatch có nhãn + hex), một nút tròn 🔊 mẫu, một thẻ/ô đáp án mẫu, một hình đảo mẫu. Sinh bằng `scripts/build-style-sample.mjs` (import **trực tiếp** module art thật → board không bao giờ lệch mã). Render PNG để xem nhanh (Chrome headless cho bản chính xác; `qlmanage`/`sips` là phương án dự phòng).

## 10. Kiểm thử

- **`src/art/svg.test.ts`:** `svgToDataUri` ra đúng `data:image/svg+xml;base64,…` và round-trip; encode tiếng Việt không lỗi; `svgDoc`/`escapeXml`; `tokens` có đủ key kỳ vọng + island hue khớp `categories.ts`; 3 tư thế Cáo ra `<svg>` hợp lệ; adapter Phaser (`loadSvgTexture` idempotent, `addArt` đăng ký + đặt image) qua scene giả.
- **`AdventureMap.test.tsx`:** giữ xanh (6 đảo; mascot là `<img>`).
- Giữ **toàn bộ test còn lại xanh** (B1: 144 → 153). Không bỏ setup phaser-stub.

## 11. Ranh giới — KHÔNG đụng tới gì

- **Logic trò chơi** (`*Logic.ts`), `progression.ts`/`applyCompletion.ts`/`registry.ts`, lớp dữ liệu (`src/data/*`), router màn, khu phụ huynh, hệ âm thanh (Phần A).
- **Emoji nội dung học** trong trò — giữ nguyên (xem §2).
- **Hạ tầng test:** giữ alias `phaser → src/test/phaser-stub.ts`. B1 ưu tiên tích hợp React-side để tránh churn stub; rollout Phaser rộng là B3.

## 12. Ngoài phạm vi Phần B (YAGNI)

- Vẽ lại hàng chục emoji **nội dung** trong trò (giữ emoji — §2).
- Trò #10 "Tìm Điểm Khác" → **Phần C** (cần nền art này trước).
- Hoạt ảnh/chuyển cảnh nâng cao → **Phần D**.
- Tách bundle Phaser → **Phần E**; PWA offline → **Phần F**.
- Ảnh raster/AI/atlas, asset ngoài, mạng — không dùng (vector trong mã, §1.1).

## 13. Rủi ro & quyết định

- **Render SVG khác nhau giữa engine:** `qlmanage` (WebKit cũ) hiểu sai `<svg>` lồng → dùng **Chrome headless** cho PNG style board chính xác; trình duyệt thật (đích chạy app) render đúng. Giữ viewBox + width/height nhất quán.
- **Phình phạm vi:** kỷ luật B1→B2→B3, mỗi phần một sub-agent + một cổng duyệt; emoji nội dung giữ nguyên.
- **Không file, không mạng:** giữ đúng local-only; Docker/nginx không thêm asset.
