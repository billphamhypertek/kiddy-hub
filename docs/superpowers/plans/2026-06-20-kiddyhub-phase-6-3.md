# KiddyHub — Giai đoạn 6 · Phần 6.3 Implementation Plan (Cáo đồng hành + dàn cảnh mọi scene)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development hoặc superpowers:executing-plans để triển khai task-by-task. Steps dùng checkbox (`- [ ]`).
> **Spec (nguồn chân lý):** [`../specs/2026-06-20-kiddyhub-phase-6-storybook-art.md`](../specs/2026-06-20-kiddyhub-phase-6-storybook-art.md) — plan này CHỈ cho **6.3** (spec §6 Cáo đồng hành + §7 dàn cảnh, §10).
> **Tiền lệ 6.1:** [`2026-06-20-kiddyhub-phase-6-1.md`](./2026-06-20-kiddyhub-phase-6-1.md) — `addBuddy` + nâng `addSceneBackground` (ground/sun/grain) ĐÃ có; `counting-fun` là bản tham chiếu tích hợp Cáo. **6.2:** [`2026-06-20-kiddyhub-phase-6-2.md`](./2026-06-20-kiddyhub-phase-6-2.md) — kit sinh vật thay emoji ở các scene.

**Goal:** Đưa **Cáo đồng hành** (`addBuddy(this)`) vào **15 scene còn lại** (mọi scene trừ `counting-fun` vốn đã có), để "hết cảnh Cáo vắng mặt khi chơi" (spec §2.5/§6). Mỗi scene đặt Cáo ở **một góc KHÔNG đè nội dung tương tác hay chrome** (nút home/loa). Nơi scene có hook đúng/sai sạch, gọi `buddy.cheer()`/`buddy.encourage()` (visual-only) cạnh phản hồi sẵn có. Dàn cảnh storybook (ground/sun/grain) đã được kế thừa qua `addSceneBackground` ở 6.1 nên KHÔNG cần đụng — chỉ kiểm tra vật thể "đứng trên đất", nudge **rất nhẹ** nếu rõ ràng trôi nổi mà KHÔNG đổi toạ độ mà hit-area/drag-snap phụ thuộc.

**Architecture:** GIỮ NGUYÊN kiến trúc. `addBuddy(scene)` (đã có trong `sceneArt.ts`, VISUAL-ONLY, tôn trọng `prefersReducedMotion()`/calmMode) được gọi 1 lần trong `create()` mỗi scene, lưu handle `private buddy?: SceneBuddy`. Hook phản ứng:
- **Game chọn-1-đáp (choose):** `buddy.cheer()` trong nhánh đúng (cạnh `popCorrect`), `buddy.encourage()` trong nhánh sai (cạnh `shakeOption`).
- **Game kéo-thả (sorting/match-quantity/jigsaw) + lật thẻ (memory-match) + tìm-điểm-khác (spot-difference):** `cheer()`/`encourage()` trong `onDrop`/`flip`/`onHit`/`onMiss` cạnh `playSfx('correct'|'wrong')`.

Không tạo hook mới, không đổi guard `roundResolved`/`finished`/`answeredThisRound`/`busy`/`placed`/`matchedPairs`, không đổi hit-area/drag-snap/SNAP, không đụng audio/mastery/scaffolding flow.

**Tech Stack:** TypeScript 5 (strict), Vitest 2, Vite + vite-plugin-pwa, Phaser 3 (stub khi test — `src/test/phaser-stub.ts`). `addBuddy` dùng `add.image`/`tweens` đã có trong stub → KHÔNG cần mở rộng stub.

## Global Constraints

- **VISUAL-ONLY tuyệt đối** (kỷ luật ghi trong `sceneArt.ts`): `addBuddy`/nudge KHÔNG `setInteractive` lên vật chơi, KHÔNG chạm guard round/finish, hit-area, drag-snap, awardStars/complete, hệ âm thanh/giọng, mastery/SR, scaffolding. Cáo chỉ là `Image` trang trí + tween yoyo (kết thúc an toàn về gốc).
- **Tiếp cận (GĐ5E) bất khả xâm phạm:** Cáo idle/cheer/encourage đã no-op khi `prefersReducedMotion()` (ORed calmMode) → không thêm chuyển động khi êm. An toàn mù màu (pattern+nhãn) KHÔNG đụng.
- **Đặt Cáo KHÔNG đè:** góc dưới-trái mặc định của `addBuddy` (x=72, y=height−72, size 110 → vùng ~x∈[17,127]). Đã rà từng layout: mọi scene đều có nội dung canh giữa / lệch phải, nên góc dưới-trái trống. Nếu một scene chật góc → đặt tối thiểu / nhỏ hơn (spec §6) — nhưng ưu tiên hiện diện đủ 15 scene.
- **100% cục bộ, KHÔNG thêm phụ thuộc runtime:** `package.json` deps giữ 4 dòng. Không ảnh raster/AI/atlas, không mạng lúc chạy.
- **KHÔNG đụng** (spec §12): mọi `*Logic.ts`, `progression.ts`/`applyCompletion.ts`/`registry.ts`/`scaffold.ts`/`masterySession.ts`, lớp Dexie, router, khu phụ huynh, hệ âm thanh/giọng (GĐ4A/5A), mastery/SR (GĐ5B). KHÔNG làm 6.4 (juice toàn bộ) hay 6.5 (React/menu).
- **Mốc test:** **493 test hiện XANH** (baseline sau 6.2). Không test nào khởi tạo scene/`create()` (đã rà: `index.test.ts` chỉ kiểm metadata + lazy factory) → thêm Cáo KHÔNG đổi đếm đối tượng nào trong test. Cuối: `npm test` (≥493), `npm run build`, `npm run lint`, `npx tsc -b` đều sạch.
- **KHÔNG commit/push/docker** — orchestrator lo. Để thay đổi uncommitted.

## Phân tích đặt Cáo (góc dưới-trái mặc định, 1024×768 thiết kế)

| Scene | Bố cục nội dung | Góc dưới-trái trống? |
|-------|------------------|----------------------|
| first-words | option canh giữa y=h/2+40 | ✓ |
| first-letter | option canh giữa y=h−120 | ✓ |
| letter-spotting | option canh giữa y=h/2+40 | ✓ |
| sorting | pile canh giữa trayY=h−110 (leftmost ≈x287) | ✓ (Cáo x≤127 trống) |
| match-quantity | nhóm x≈328 · tray số canh giữa h−90 | ✓ |
| odd-one-out | item canh giữa y=h/2+30 | ✓ |
| memory-match | bảng canh giữa (leftmost ≈x312, đáy ≈y684) | ✓ |
| more-less | khung trái tâm x≈307 (mép trái ≈x133) | ✓ (sát nhưng tách) |
| pattern-finder | seq y=h/2−40 · option y=h−130 canh giữa | ✓ |
| abc-english | option canh giữa y=h−120 | ✓ |
| numbers-english | option canh giữa y=h−120 | ✓ |
| colors-english | swatch canh giữa y=h/2+60 | ✓ |
| shapes-colors | option canh giữa y=h/2+30 | ✓ |
| jigsaw | board x∈[272,752] · tray canh giữa h−... | ✓ |
| spot-difference | 2 tranh canh giữa (leftX≈132, đáy ≈584) | ✓ (Cáo x≤127, dưới tranh) |

→ Góc dưới-trái mặc định an toàn cho cả 15 scene. (more-less & spot-difference sát mép trái nội dung nhưng KHÔNG đè ở độ phân giải thiết kế — ghi chú để con người kiểm mắt.)

---

## File Structure

```
kiddy-hub/
  src/games/
    first-words/FirstWordsScene.ts        # MODIFY: + buddy + cheer/encourage
    first-letter/FirstLetterScene.ts      # MODIFY: + buddy + cheer/encourage
    letter-spotting/LetterSpottingScene.ts# MODIFY: + buddy + cheer/encourage
    sorting/SortingScene.ts               # MODIFY: + buddy + cheer/encourage (onDrop)
    match-quantity/MatchQuantityScene.ts  # MODIFY: + buddy + cheer/encourage (onDrop)
    odd-one-out/OddOneOutScene.ts         # MODIFY: + buddy + cheer/encourage
    memory-match/MemoryMatchScene.ts      # MODIFY: + buddy + cheer/encourage (flip)
    more-less/MoreLessScene.ts            # MODIFY: + buddy + cheer/encourage
    pattern-finder/PatternFinderScene.ts  # MODIFY: + buddy + cheer/encourage
    abc-english/AbcEnglishScene.ts        # MODIFY: + buddy + cheer/encourage
    numbers-english/NumbersEnglishScene.ts# MODIFY: + buddy + cheer/encourage
    colors-english/ColorsEnglishScene.ts  # MODIFY: + buddy + cheer/encourage
    shapes-colors/ShapesColorsScene.ts    # MODIFY: + buddy + cheer/encourage
    jigsaw/JigsawScene.ts                 # MODIFY: + buddy + cheer/encourage (onDrop)
    spot-difference/SpotDifferenceScene.ts# MODIFY: + buddy + cheer/encourage (onHit/onMiss)
  docs/superpowers/plans/2026-06-20-kiddyhub-phase-6-3.md  # plan này
```

**Thứ tự & phụ thuộc:** Mỗi scene độc lập. Khuôn tích hợp giống hệt `counting-fun` (6.1). Làm theo nhóm:
- **Nhóm A (choose chuẩn):** first-words, first-letter, letter-spotting, odd-one-out, pattern-finder, abc-english, numbers-english, colors-english, shapes-colors, more-less.
- **Nhóm B (kéo-thả/lật/tìm):** sorting, match-quantity, jigsaw, memory-match, spot-difference.

---

### Task 1: Nhóm A — game "choose" (10 scene)

**Khuôn chung (mỗi scene):**
1. Import: thêm `addBuddy, type SceneBuddy` vào dòng import từ `'../../art/sceneArt'`.
2. Field: thêm `private buddy?: SceneBuddy;`.
3. Trong `create()`, sau `addChrome(...)`, thêm:
   ```ts
   // GĐ6.3 — Cáo đồng hành (visual-only): hiện DIỆN khi chơi, phản ứng đúng/sai.
   this.buddy = addBuddy(this);
   ```
4. Trong `choose(...)` nhánh ĐÚNG, cạnh `popCorrect(...)`: thêm `this.buddy?.cheer();`.
5. Trong `choose(...)` nhánh SAI, cạnh `shakeOption(...)` (hoặc tween shake riêng): thêm `this.buddy?.encourage();`.

> Lưu ý colors-english: nhánh sai dùng tween shake nội tuyến (`this.tweens.add(... swatch ...)`); thêm `this.buddy?.encourage();` ngay sau. shapes-colors/odd-one-out/pattern-finder/more-less dùng `shakeOption` → thêm sau.

- [ ] **Step 1.1:** Áp khuôn cho 10 scene Nhóm A.
- [ ] **Step 1.2:** `npx vitest run src/games/first-words src/games/first-letter src/games/letter-spotting src/games/odd-one-out src/games/pattern-finder src/games/abc-english src/games/numbers-english src/games/colors-english src/games/shapes-colors src/games/more-less` → PASS.
- [ ] **Step 1.3:** `npx tsc -b` + `npx eslint <10 scene>` → sạch.

---

### Task 2: Nhóm B — game kéo-thả / lật / tìm (5 scene)

**sorting** (`onDrop`): nhánh đúng (`best.index === wantBasket`) cạnh `popCorrect(this, obj)` → `this.buddy?.cheer();`; nhánh sai-giỏ + nhánh bounce-home → `this.buddy?.encourage();`.

**match-quantity** (`onDrop`): nhánh đúng cạnh `popCorrect(this, label)` → `cheer()`; nhánh sai (bounce home) → `encourage()`.

**jigsaw** (`onDrop`): nhánh đúng cạnh `popCorrect(this, obj)` → `cheer()`; nhánh sai (miss) → `encourage()`.

**memory-match** (`flip`): nhánh khớp cặp cạnh `popCorrect(this, view.label)` → `cheer()`; nhánh không khớp (busy delay) → `encourage()`.

**spot-difference** (`onHit`/`onMiss`): trong `onHit` khi tìm thấy 1 điểm (sau `popCorrect(this, ring)`) → `cheer()`; trong `onMiss` → `encourage()`.

Khuôn import/field/`create()` y Task 1.

- [ ] **Step 2.1:** Áp khuôn cho 5 scene Nhóm B (chú ý đặt `cheer/encourage` cạnh điểm `playSfx` tương ứng, KHÔNG đổi guard/snap).
- [ ] **Step 2.2:** `npx vitest run src/games/sorting src/games/match-quantity src/games/jigsaw src/games/memory-match src/games/spot-difference` → PASS.
- [ ] **Step 2.3:** `npx tsc -b` + `npx eslint <5 scene>` → sạch.

---

### Task 3: Dàn cảnh — kiểm "đứng trên đất" (conservative)

Dàn cảnh storybook (sky gradient + sun + ground band groundY=h*0.78 + grain) đã do `addSceneBackground` cung cấp cho cả 16 scene từ 6.1. Cáo size 110 ở y=h−72 ngồi ngay trên dải đất → tự nhiên neo cảnh. KHÔNG đổi toạ độ nội dung mà hit-area/drag-snap phụ thuộc. Chỉ nudge nếu RÕ RÀNG trôi nổi và an toàn — mặc định KHÔNG nudge (mọi nội dung đã canh trên nền có chiều sâu; Cáo + ground làm việc neo cảnh).

- [ ] **Step 3.1:** Xác nhận bằng mắt (style board/manual) — ghi vào báo cáo phần "cần con người kiểm".

---

### Task 4: Verify tổng (verification-before-completion)

- [ ] **Step 4.1:** `npm test` → ≥493 xanh.
- [ ] **Step 4.2:** `npm run build` → exit 0.
- [ ] **Step 4.3:** `npm run lint` → exit 0.
- [ ] **Step 4.4:** `npx tsc -b` → exit 0.
- [ ] **Step 4.5:** Báo cáo: scene nào nhận Cáo + vị trí; nudge nào (nếu có); test/build/lint/tsc verbatim; assertion đổi (nếu có); việc con người kiểm mắt.

---

## Rủi ro & quyết định

- **Cáo đè nội dung:** đã rà layout từng scene; góc dưới-trái trống ở cả 15. more-less & spot-difference sát mép → ghi chú kiểm mắt; vẫn an toàn ở độ phân giải thiết kế.
- **Phá guard/snap:** chỉ THÊM lệnh `buddy?.cheer/encourage()` (no-op khi reduced) cạnh phản hồi sẵn có; KHÔNG đổi điều kiện/thứ tự guard. `?.` an toàn nếu `buddy` chưa gán.
- **Test đếm đối tượng:** không có test nào khởi tạo scene → 0 rủi ro. Nếu phát sinh → chỉ sửa assertion đếm-thuần-visual (giải trình từng cái).
- **calmMode/reduced:** `addBuddy` đã no-op idle/cheer/encourage khi êm — không thêm chuyển động trái GĐ5E.
</content>
</invoke>
