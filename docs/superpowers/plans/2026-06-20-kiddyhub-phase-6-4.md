# Giai đoạn 6.4 — "Juice toàn bộ" — Kế hoạch triển khai

> **Dành cho worker tự động:** SUB-SKILL BẮT BUỘC: dùng superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để chạy kế hoạch này từng-task-một. Các bước dùng cú pháp checkbox (`- [x]`) để theo dõi.

**Mục tiêu:** Rải bộ công cụ juice (GĐ6.1: `squashStretchPop`, `sparkleBurst`, `tilePress`, `idleBreathe`, `bouncePop`, `celebrate` nâng cấp) vào MỌI hook sẵn có của 15 scene còn lại (ngoài `counting-fun`) để cả app "đã tay", KHÔNG đổi gameplay.

**Kiến trúc:** Mỗi scene đã có sẵn các "khoảnh khắc" (entrance qua `animateIn`/`bouncePop`, correct qua `popCorrect`, wrong qua `shakeOption`, tap qua `pointerdown`, finish qua `celebrate`). Ta CHỈ chèn thêm các lời gọi juice VISUAL-ONLY cạnh các khoảnh khắc đó, theo đúng mẫu của `CountingFunScene.ts`. Mọi hàm juice đã tự rẽ nhánh nội bộ theo `prefersReducedMotion()` (đã OR calmMode), tự dọn tween onComplete, và không bao giờ chạm `setInteractive`.

**Tech Stack:** React + TS + Vite + Phaser 3 + Dexie; 100% cục bộ; vitest. KHÔNG thêm phụ thuộc runtime.

## Ràng buộc toàn cục (verbatim từ spec §8, §10, §12)

- **Juice = VISUAL-ONLY + INTERRUPTION-SAFE.** Không chạm guard round/finish (`roundResolved`/`answeredThisRound`/`finished`/`busy`/`placed`), hit-area, drag-snap, scaffolding (`dimDistractor`), luồng âm thanh/mastery.
- **Mọi lời gọi juice phải tôn trọng `calmMode`/`prefersReducedMotion`** — dựa vào nhánh nội bộ của toolkit; nếu thêm motion inline mới thì phải tự guard.
- **Particle/tween tự dọn `onComplete`** và an toàn nếu round chuyển giữa chừng (theo mẫu `celebrate`/`animateIn`/`sparkleBurst`).
- **KHÔNG thêm dep runtime; 100% cục bộ.** Không đụng logic/data/router/khu phụ huynh. Không phá tiếp cận (an toàn mù màu pattern+nhãn GĐ5E).
- **`src/test/phaser-stub.ts`**: chỉ mở rộng nếu chạm API Phaser MỚI. Bộ juice dùng `add.image`/`tweens.add` (mẫu `sparkleBurst`) nên KHÔNG cần đổi stub. KHÔNG đổi stub trong kế hoạch này.
- **Mốc test ≥ 493.** Logic game test không đổi. Scene `index.test.ts` chỉ kiểm metadata + `loadScene` (không dựng scene, không đếm tween) → việc chèn juice KHÔNG phá chúng. Đếm tween chỉ bị test trong `sceneMotion.test.ts` (unit toolkit) — KHÔNG đổi file đó trừ khi thêm helper mới (kế hoạch này KHÔNG thêm helper mới).
- **Chuỗi người dùng giữ tiếng Việt.**
- **Không commit/push, không docker/deploy** (orchestrator làm). Để thay đổi chưa commit.

---

## Bối cảnh & quyết định thiết kế (đọc trước khi làm)

`CountingFunScene.ts` (tham chiếu, ĐÃ juice) dệt juice như sau:
- **Entrance vật thể đếm:** `bouncePop(this, sprite)` từng con — calm-safe (snap về base scale, không strand).
- **Entrance ô đáp án:** `animateIn(this, entrance)` (đã có sẵn) — KHÔNG `bouncePop` chồng lên (tránh double-animate). Quy tắc: **một-và-chỉ-một** entrance trên cùng một object.
- **Tap:** `tilePress(this, tile)` trong `pointerdown`, TRƯỚC khi gọi `choose(...)` — visual-only, không đổi hit-area/guard.
- **Correct:** `popCorrect(this, label)` (giữ) **+** `squashStretchPop(this, label)` **+** `sparkleBurst(this, label.x, label.y)` **+** `buddy.cheer()` (đã có).
- **Wrong:** `shakeOption(...)` (giữ) **+** `buddy.encourage()` (đã có).
- **Finish:** `celebrate(this)` (đã nâng cấp confetti+sao+Cáo, calm có bản nhẹ) — đã có ở mọi scene.

**Quy tắc áp cho 15 scene (khớp phong cách tương tác từng scene):**

| Kiểu scene | Scene | Correct juice | Tap/Select juice | Entrance bổ sung | Idle (tuỳ chọn) |
|---|---|---|---|---|---|
| Tap-chữ/số (label Text) | abc-english, first-letter, letter-spotting, numbers-english | `squashStretchPop(label)` + `sparkleBurst(label.x,label.y)` cạnh `popCorrect(label)` | `tilePress(tile)` trong pointerdown | — (đã có `animateIn` cho tile+label) | `idleBreathe` trên targetText (chỉ abc/numbers có chữ đích to) |
| Tap-ảnh creature (label Image) | first-words, odd-one-out, pattern-finder | `squashStretchPop(label)` + `sparkleBurst(label.x,label.y)` cạnh `popCorrect(label)` | `tilePress(tile)` trong pointerdown | — (đã có `animateIn`) | — |
| Tap-swatch màu (giữ pattern+nhãn GĐ5E) | colors-english | `squashStretchPop(swatch)` + `sparkleBurst(swatch.x,swatch.y)` cạnh `popCorrect(swatch)` | `tilePress(tile)` trong pointerdown | — | — |
| Tap-shape Graphics (giữ pattern+nhãn GĐ5E) | shapes-colors | `squashStretchPop(shape)` + `sparkleBurst(shape.x,shape.y)` cạnh `popCorrect(shape)` | `tilePress(tile)` trong pointerdown | — | — |
| Tap-frame nhóm (more-less) | more-less | `squashStretchPop(frame)` + `sparkleBurst(frame.x,frame.y)` cạnh `popCorrect(frame)` | `tilePress(tile)` trong pointerdown | `bouncePop` từng creature trong `drawGroup` | — |
| Kéo-thả (juice SNAP/lock) | sorting, match-quantity, jigsaw | `squashStretchPop(obj/label)` + `sparkleBurst(x,y)` cạnh `popCorrect` (chỉ ở nhánh ĐÚNG/khoá) | KHÔNG `tilePress` (đang kéo) | `bouncePop` từng pile/creature creature TĨNH khi xuất hiện (chỉ match-quantity emoji group; sorting pile là draggable → KHÔNG đụng) | — |
| Lật thẻ (memory) | memory-match | `squashStretchPop(view.label)` + `sparkleBurst(label.x,label.y)` cạnh `popCorrect(view.label)` ở nhánh MATCH | `tilePress(view.rect)` trong `flip` (đầu hàm, sau guard, trước lật) — visual-only | — (đã có `animateIn` thẻ úp) | — |
| Tìm điểm khác (spot-difference) | spot-difference | `squashStretchPop(ring)` + `sparkleBurst(ring.x,ring.y)` cạnh `popCorrect(ring)` | KHÔNG `tilePress` (hotspot vô hình, không có tile) | — (đã có `animateIn` 2 tranh) | — |

**Lưu ý INTERRUPTION-SAFE quan trọng:**
- `sparkleBurst`/`squashStretchPop` đọc `x`/`y`/`scaleX`/`scaleY` của target **ngay tại thời điểm gọi** rồi tween bản sao sao (stars) / yoyo (pop) → an toàn nếu round chuyển sau đó. Với drag-lock (sorting/match-quantity/jigsaw) ta gọi SAU khi đã `obj.x=...; obj.y=...` (snap xong) nên toạ độ sparkle đúng chỗ khoá.
- `tilePress` chỉ yoyo `scaleX/scaleY` về base → không strand. Với drag scenes KHÔNG dùng (kéo viết `x/y` trực tiếp, pop scale có thể đánh nhau cảm giác kéo). memory-match KHÔNG kéo nên `tilePress` an toàn.
- `idleBreathe` lặp `repeat:-1`; round-advance huỷ tween → object về base. Chỉ áp lên **targetText** (chữ đích trung tâm, được `layer.destroy()` mỗi round — tween chết theo). KHÔNG áp lên prompt nhiều scene để tránh nhiễu.
- `bouncePop` calm-safe: snap về base scale khi reduced. Chỉ áp lên creature TĨNH (đếm/nhóm). KHÔNG áp lên object đã nằm trong mảng `animateIn` (tránh double-animate).

## Cấu trúc file

- **Sửa (15 file scene):** mỗi file thêm import juice cần dùng + chèn lời gọi cạnh hook sẵn có. KHÔNG đổi chữ ký method, KHÔNG đổi guard/logic.
  - `src/games/abc-english/AbcEnglishScene.ts`
  - `src/games/colors-english/ColorsEnglishScene.ts`
  - `src/games/first-letter/FirstLetterScene.ts`
  - `src/games/first-words/FirstWordsScene.ts`
  - `src/games/letter-spotting/LetterSpottingScene.ts`
  - `src/games/numbers-english/NumbersEnglishScene.ts`
  - `src/games/odd-one-out/OddOneOutScene.ts`
  - `src/games/pattern-finder/PatternFinderScene.ts`
  - `src/games/shapes-colors/ShapesColorsScene.ts`
  - `src/games/more-less/MoreLessScene.ts`
  - `src/games/memory-match/MemoryMatchScene.ts`
  - `src/games/sorting/SortingScene.ts`
  - `src/games/match-quantity/MatchQuantityScene.ts`
  - `src/games/jigsaw/JigsawScene.ts`
  - `src/games/spot-difference/SpotDifferenceScene.ts`
- **KHÔNG tạo file mới.** Toolkit + unit test toolkit đã đủ (đã phủ calm/reduced no-op cho mọi hàm juice trong `sceneMotion.test.ts`). KHÔNG cần test scene-level mới: scene tests chỉ kiểm metadata; hành vi juice đã được lock ở unit toolkit.
- **KHÔNG sửa** `sceneMotion.ts`, `sceneArt.ts`, `phaser-stub.ts`, bất kỳ `*Logic.ts`, `index.ts`, data/router/parent.

## Interfaces (đã có, chỉ tiêu thụ — verbatim từ `src/art/sceneMotion.ts`)

```ts
squashStretchPop(scene: Phaser.Scene, target?: MotionObject): void
sparkleBurst(scene: Phaser.Scene, x: number, y: number): void
tilePress(scene: Phaser.Scene, target?: MotionObject): void
idleBreathe(scene: Phaser.Scene, target?: MotionObject): void
bouncePop(scene: Phaser.Scene, target?: MotionObject): void
// type MotionObject = Phaser.GameObjects.GameObject | null | undefined
```

Mẫu cast chuẩn trong scene (khi target là Image/Text/Rectangle/Graphics): truyền thẳng — chữ ký nhận `MotionObject` (GameObject | null | undefined), mọi display object hợp lệ. Với object đã là `Phaser.GameObjects.Image`/`Text`/`Rectangle`/`Graphics`/`Arc` truyền trực tiếp; nếu TS than (object lấy từ `addArt` ép `as unknown as Image`) thì cast `as unknown as MotionObject` như counting-fun đã làm.

---

## Task 1: Tap-chữ/số scenes (abc-english, first-letter, letter-spotting, numbers-english)

**Files:**
- Modify: `src/games/abc-english/AbcEnglishScene.ts`
- Modify: `src/games/first-letter/FirstLetterScene.ts`
- Modify: `src/games/letter-spotting/LetterSpottingScene.ts`
- Modify: `src/games/numbers-english/NumbersEnglishScene.ts`
- Test: `src/art/sceneMotion.test.ts` (đã có; chạy lại để xác nhận xanh), `src/games/*/index.test.ts` (đã có)

**Interfaces:**
- Consumes: `squashStretchPop`, `sparkleBurst`, `tilePress`, (abc/numbers cũng) `idleBreathe`, `type MotionObject` từ `../../art/sceneMotion`.
- Produces: không có API mới (chỉ thay đổi nội bộ scene).

Bốn scene này cùng mẫu: `optionObjs` có `{tile, label(Text), btn}`; `choose()` đã gọi `popCorrect(this, label)`; `pointerdown` gọi `choose(...)`.

- [x] **Step 1: Chạy test nền để xác nhận xanh trước khi sửa**

Run: `npm test`
Expected: PASS, ≥ 493 test (ghi lại tổng).

- [x] **Step 2: abc-english — mở rộng import**

Trong `src/games/abc-english/AbcEnglishScene.ts`, đổi dòng import sceneMotion:

```ts
import {
  animateIn,
  popCorrect,
  flyStars,
  squashStretchPop,
  sparkleBurst,
  tilePress,
  idleBreathe,
  type MotionObject,
} from '../../art/sceneMotion';
```

- [x] **Step 3: abc-english — tilePress trong pointerdown**

Đổi:
```ts
      btn.on('pointerdown', () => this.choose(letter, btn, tile, label));
```
thành:
```ts
      btn.on('pointerdown', () => {
        // GĐ6.4 — phản hồi bấm xúc giác (visual-only); KHÔNG đổi luồng choose.
        tilePress(this, tile as unknown as MotionObject);
        this.choose(letter, btn, tile, label);
      });
```

- [x] **Step 4: abc-english — idleBreathe trên chữ đích to**

Sau dòng `this.layer.add(targetText);` (trước hoặc sau `this.sayTarget();`), thêm:
```ts
    // GĐ6.4 — chữ đích "thở" nhẹ lúc chờ (calm-safe; chết theo layer mỗi round).
    idleBreathe(this, targetText as unknown as MotionObject);
```

- [x] **Step 5: abc-english — squashStretchPop + sparkleBurst ở correct**

Trong `choose`, ngay sau `popCorrect(this, label);`, thêm:
```ts
      // GĐ6.4 — juice đúng (visual-only, calm-safe, không đổi flow).
      squashStretchPop(this, label);
      sparkleBurst(this, label.x, label.y);
```

- [x] **Step 6: numbers-english — lặp lại Step 2–5 cho `NumbersEnglishScene.ts`**

Import: thêm `squashStretchPop, sparkleBurst, tilePress, idleBreathe` (giữ `animateIn, popCorrect, flyStars, type MotionObject`).
`pointerdown`: bọc `tilePress(this, tile as unknown as MotionObject)` trước `this.choose(num, btn, tile, label)`.
`idleBreathe`: target là chữ tiếng Anh to. Object đó hiện được tạo inline trong `this.layer.add(this.add.text(...))`. Tách ra biến trước khi add:
```ts
    const wordText = this.add
      .text(width / 2, height / 2 - 70, this.current.word, { fontSize: '72px', color: '#ff7043', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.layer.add(wordText);
    idleBreathe(this, wordText as unknown as MotionObject);
```
`correct`: sau `popCorrect(this, label);` thêm `squashStretchPop(this, label); sparkleBurst(this, label.x, label.y);`.

- [x] **Step 7: first-letter — import + tilePress + correct (KHÔNG idleBreathe)**

Import: thêm `squashStretchPop, sparkleBurst, tilePress` (giữ `animateIn, popCorrect, flyStars, type MotionObject`).
`pointerdown`: đổi `btn.on('pointerdown', () => this.choose(letter, btn, tile, label));` → bọc tilePress trước choose như Step 3.
`correct`: sau `popCorrect(this, label);` thêm `squashStretchPop(this, label); sparkleBurst(this, label.x, label.y);`.
(first-letter có ảnh creature + chữ word ở giữa nhưng KHÔNG có "chữ đích to" như abc → bỏ qua idleBreathe để tránh nhiễu chữ word.)

- [x] **Step 8: letter-spotting — import + tilePress + correct (KHÔNG idleBreathe)**

Giống Step 7 cho `LetterSpottingScene.ts`. `choose` đã có `popCorrect(this, label)`; thêm `squashStretchPop(this, label); sparkleBurst(this, label.x, label.y);` ngay sau. `pointerdown` bọc tilePress.

- [x] **Step 9: Chạy lint + tsc + test**

Run: `npm run lint && npx tsc -b && npm test`
Expected: lint 0 lỗi; tsc exit 0; test PASS, tổng ≥ Step 1 (không giảm).

- [x] **Step 10: Commit — BỎ QUA (orchestrator commit). Chỉ để thay đổi chưa commit.**

---

## Task 2: Tap-ảnh creature scenes (first-words, odd-one-out, pattern-finder)

**Files:**
- Modify: `src/games/first-words/FirstWordsScene.ts`
- Modify: `src/games/odd-one-out/OddOneOutScene.ts`
- Modify: `src/games/pattern-finder/PatternFinderScene.ts`

**Interfaces:**
- Consumes: `squashStretchPop`, `sparkleBurst`, `tilePress`, `type MotionObject`.
- Produces: không có API mới.

Ba scene này: `label` là `Phaser.GameObjects.Image` (creature). `choose()` đã `popCorrect(this, label)`. `pointerdown` gọi `choose(...)`.

- [x] **Step 1: first-words — import**

Trong `src/games/first-words/FirstWordsScene.ts`, đổi import sceneMotion thành:
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, tilePress, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 2: first-words — tilePress trong pointerdown**

Đổi `btn.on('pointerdown', () => this.choose(item.word, btn, tile, label));` thành:
```ts
      btn.on('pointerdown', () => {
        tilePress(this, tile as unknown as MotionObject);
        this.choose(item.word, btn, tile, label);
      });
```

- [x] **Step 3: first-words — correct juice**

Sau `popCorrect(this, label);` trong `choose`, thêm:
```ts
      squashStretchPop(this, label as unknown as MotionObject);
      sparkleBurst(this, label.x, label.y);
```

- [x] **Step 4: odd-one-out — lặp Step 1–3**

Import như Step 1. `pointerdown`: `btn.on('pointerdown', () => this.choose(i, btn, tile, label));` → bọc tilePress trước. `correct`: sau `popCorrect(this, label);` thêm `squashStretchPop(this, label as unknown as MotionObject); sparkleBurst(this, label.x, label.y);`.

- [x] **Step 5: pattern-finder — lặp Step 1–3**

Import như Step 1. `pointerdown`: `btn.on('pointerdown', () => this.choose(tok, btn, tile, label));` → bọc tilePress trước. `correct`: sau `popCorrect(this, label);` thêm `squashStretchPop(this, label as unknown as MotionObject); sparkleBurst(this, label.x, label.y);`.

- [x] **Step 6: lint + tsc + test**

Run: `npm run lint && npx tsc -b && npm test`
Expected: tất cả xanh; test ≥ mốc.

---

## Task 3: Tap-swatch/shape scenes (colors-english, shapes-colors) — GIỮ pattern+nhãn GĐ5E

**Files:**
- Modify: `src/games/colors-english/ColorsEnglishScene.ts`
- Modify: `src/games/shapes-colors/ShapesColorsScene.ts`

**Interfaces:**
- Consumes: `squashStretchPop`, `sparkleBurst`, `tilePress`, `type MotionObject`.

QUAN TRỌNG: juice áp lên `swatch`/`shape` (object đáp đúng), KHÔNG đụng `pattern`/`label` (lớp tín hiệu mù màu GĐ5E). `dimDistractor` giữ nguyên.

- [x] **Step 1: colors-english — import**

Đổi import sceneMotion thành:
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, tilePress, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 2: colors-english — tilePress trong pointerdown của swatch**

Đổi `swatch.on('pointerdown', () => this.choose(color.name, swatch));` thành:
```ts
      swatch.on('pointerdown', () => {
        // GĐ6.4 — tile lún khi bấm (visual-only; hit-area vẫn là swatch 130×130).
        tilePress(this, tile as unknown as MotionObject);
        this.choose(color.name, swatch);
      });
```
(`tile` là backing image của option, nằm trong scope của forEach — pressing tile, KHÔNG pattern/label.)

- [x] **Step 3: colors-english — correct juice trên swatch**

Sau `popCorrect(this, swatch);` trong `choose`, thêm:
```ts
      squashStretchPop(this, swatch);
      sparkleBurst(this, swatch.x, swatch.y);
```

- [x] **Step 4: shapes-colors — import**

Đổi import sceneMotion thành (giữ `type MotionObject`):
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, tilePress, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 5: shapes-colors — tilePress trong pointerdown của hit**

Đổi `hit.on('pointerdown', () => this.choose(i, hit, tile, shape));` thành:
```ts
      hit.on('pointerdown', () => {
        tilePress(this, tile as unknown as MotionObject);
        this.choose(i, hit, tile, shape);
      });
```

- [x] **Step 6: shapes-colors — correct juice trên shape (Graphics)**

Sau `popCorrect(this, shape);` trong `choose`, thêm:
```ts
      squashStretchPop(this, shape);
      sparkleBurst(this, shape.x, shape.y);
```
(`shape` là Graphics vẽ quanh local-origin (0,0) đặt qua `setPosition(x,y)` → `shape.x`/`shape.y` là tâm; `squashStretchPop`/`popCorrect` đã bounce quanh tâm. sparkle nổ tại tâm shape — đúng vị trí.)

- [x] **Step 7: lint + tsc + test**

Run: `npm run lint && npx tsc -b && npm test`
Expected: xanh; test ≥ mốc. (shapes-colors/colors-english logic test không đổi; tín hiệu mù màu giữ nguyên.)

---

## Task 4: more-less — tap-frame nhóm + bouncePop creature

**Files:**
- Modify: `src/games/more-less/MoreLessScene.ts`

**Interfaces:**
- Consumes: `squashStretchPop`, `sparkleBurst`, `tilePress`, `bouncePop`, `type MotionObject`.

more-less hiện CHỈ import `animateIn, popCorrect, flyStars` (không có `type MotionObject`). `drawGroup` vẽ creature TĨNH (không kéo) → `bouncePop` từng con an toàn. `choose` áp juice lên `frame`. Tap → `tilePress(tile)`.

- [x] **Step 1: import**

Đổi:
```ts
import { animateIn, popCorrect, flyStars } from '../../art/sceneMotion';
```
thành:
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, tilePress, bouncePop, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 2: bouncePop trong drawGroup**

Trong `drawGroup`, sau `this.layer!.add(t);`, thêm:
```ts
      // GĐ6.4 — mỗi vật nảy vào lúc xuất hiện (calm-safe; vật tĩnh, không kéo).
      bouncePop(this, t as unknown as MotionObject);
```

- [x] **Step 3: tilePress trong pointerdown**

`choose` đã nhận `tile`. Đổi 2 handler:
```ts
    leftFrame.on('pointerdown', () => this.choose('left', leftFrame, leftTile));
    rightFrame.on('pointerdown', () => this.choose('right', rightFrame, rightTile));
```
thành:
```ts
    leftFrame.on('pointerdown', () => {
      tilePress(this, leftTile as unknown as MotionObject);
      this.choose('left', leftFrame, leftTile);
    });
    rightFrame.on('pointerdown', () => {
      tilePress(this, rightTile as unknown as MotionObject);
      this.choose('right', rightFrame, rightTile);
    });
```

- [x] **Step 4: correct juice trên frame**

Sau `popCorrect(this, frame);` trong `choose`, thêm:
```ts
      squashStretchPop(this, frame);
      sparkleBurst(this, frame.x, frame.y);
```

- [x] **Step 5: lint + tsc + test**

Run: `npm run lint && npx tsc -b && npm test`
Expected: xanh; test ≥ mốc.

---

## Task 5: memory-match — lật thẻ (tilePress flip + match juice)

**Files:**
- Modify: `src/games/memory-match/MemoryMatchScene.ts`

**Interfaces:**
- Consumes: `squashStretchPop`, `sparkleBurst`, `tilePress`, `type MotionObject`.

memory-match KHÔNG kéo → `tilePress` an toàn. `flip(view)` có guard ở đầu; SAU guard (thẻ thật sự lật) gọi `tilePress(view.rect)`. Match → `popCorrect(this, view.label)` đã có; thêm juice. `label` là Image (creature).

- [x] **Step 1: import**

Đổi:
```ts
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
```
thành:
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, tilePress, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 2: tilePress khi lật (sau guard, trước reveal)**

Trong `flip(view)`, ngay sau dòng guard `if (this.busy || view.faceUp || view.matched || this.finished) return;` và TRƯỚC `view.faceUp = true;`, thêm:
```ts
    // GĐ6.4 — thẻ lún nhẹ khi chạm lật (visual-only; sau guard nên không đổi luồng).
    tilePress(this, view.rect as unknown as MotionObject);
```

- [x] **Step 3: match juice**

Trong nhánh match (`if (first.card.pairId === view.card.pairId)`), sau `popCorrect(this, view.label);`, thêm:
```ts
      squashStretchPop(this, view.label as unknown as MotionObject);
      sparkleBurst(this, view.label.x, view.label.y);
```

- [x] **Step 4: lint + tsc + test**

Run: `npm run lint && npx tsc -b && npm test`
Expected: xanh; test ≥ mốc.

---

## Task 6: Drag scenes — juice SNAP/lock (sorting, match-quantity, jigsaw)

**Files:**
- Modify: `src/games/sorting/SortingScene.ts`
- Modify: `src/games/match-quantity/MatchQuantityScene.ts`
- Modify: `src/games/jigsaw/JigsawScene.ts`

**Interfaces:**
- Consumes: `squashStretchPop`, `sparkleBurst`, `type MotionObject`; (match-quantity cũng) `bouncePop`.

QUY TẮC drag: KHÔNG `tilePress` (đang kéo). Chỉ juice khoảnh khắc ĐÚNG/khoá: sau khi đã snap `obj.x/obj.y` về slot và `disableInteractive()`. `sparkleBurst` tại toạ độ ĐÃ SNAP (đúng chỗ khoá, interruption-safe).

- [x] **Step 1: sorting — import**

Đổi:
```ts
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
```
thành:
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 2: sorting — juice ở nhánh ĐÚNG (đã snap+khoá)**

Trong `onDrop`, nhánh đầu (`best && bestDist <= SNAP && best.index === wantBasket`), sau `popCorrect(this, obj);`, thêm:
```ts
      squashStretchPop(this, obj as unknown as MotionObject);
      sparkleBurst(this, obj.x, obj.y);
```
(KHÔNG thêm vào nhánh "wrong basket" hay "bounce back" — chỉ thưởng khi đúng.)

- [x] **Step 3: match-quantity — import (thêm bouncePop)**

Đổi import sceneMotion thành:
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, bouncePop, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 4: match-quantity — bouncePop emoji group TĨNH**

Trong `buildGroupsAndTiles`, vòng `for (let k = 0; k < pair.value; k++)`, object creature được `furniture.push(addArt(...))`. CHÚ Ý: các creature này nằm trong `furniture` được `animateIn` → KHÔNG `bouncePop` chồng (tránh double-animate). Vậy **BỎ QUA bouncePop ở match-quantity** để tuân thủ quy tắc một-entrance. Xoá `bouncePop` khỏi import nếu không dùng.

  → Thực thi: KHÔNG thêm `bouncePop` vào import match-quantity. Import chỉ:
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 5: match-quantity — juice ở nhánh ĐÚNG (đã snap+khoá)**

Trong `onDrop`, nhánh `if (best && bestDist <= SNAP && this.round.pairs[best.pairIndex].value === value)`, sau `popCorrect(this, label);`, thêm:
```ts
      squashStretchPop(this, label as unknown as MotionObject);
      sparkleBurst(this, label.x, label.y);
```

- [x] **Step 6: jigsaw — import**

Đổi:
```ts
import { animateIn, popCorrect, flyStars, type MotionObject } from '../../art/sceneMotion';
```
thành:
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 7: jigsaw — juice ở nhánh ĐÚNG (đã snap+khoá)**

Trong `onDrop`, nhánh đúng (sau `popCorrect(this, obj);`), thêm:
```ts
      squashStretchPop(this, obj as unknown as MotionObject);
      sparkleBurst(this, obj.x, obj.y);
```

- [x] **Step 8: lint + tsc + test**

Run: `npm run lint && npx tsc -b && npm test`
Expected: xanh; test ≥ mốc.

---

## Task 7: spot-difference — juice found-ring

**Files:**
- Modify: `src/games/spot-difference/SpotDifferenceScene.ts`

**Interfaces:**
- Consumes: `squashStretchPop`, `sparkleBurst`, `type MotionObject`.

spot-difference: hotspot vô hình (không tile) → KHÔNG `tilePress`. Khoảnh khắc "tìm thấy" = `ring` (Arc). `onHit` đã `popCorrect(this, ring)`. Thêm juice tại ring.

- [x] **Step 1: import**

Đổi:
```ts
import { animateIn, popCorrect, flyStars } from '../../art/sceneMotion';
```
thành:
```ts
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, type MotionObject } from '../../art/sceneMotion';
```

- [x] **Step 2: juice found-ring**

Trong `onHit`, sau `popCorrect(this, ring);`, thêm:
```ts
    squashStretchPop(this, ring as unknown as MotionObject);
    sparkleBurst(this, ring.x, ring.y);
```

- [x] **Step 3: lint + tsc + test**

Run: `npm run lint && npx tsc -b && npm test`
Expected: xanh; test ≥ mốc.

---

## Task 8: Xác minh toàn diện (verification-before-completion)

**Files:** không sửa — chỉ chạy & ghi verbatim.

- [x] **Step 1: test**

Run: `npm test`
Expected: PASS, tổng ≥ 493 (ghi verbatim số files + tests).

- [x] **Step 2: build**

Run: `npm run build`
Expected: exit 0.

- [x] **Step 3: lint**

Run: `npm run lint`
Expected: exit 0, 0 lỗi.

- [x] **Step 4: tsc**

Run: `npx tsc -b`
Expected: exit 0.

- [x] **Step 5: rà xác nhận calm/reduced-motion**

Xác nhận MỌI lời gọi juice đã chèn (`squashStretchPop`/`sparkleBurst`/`tilePress`/`idleBreathe`/`bouncePop`) đều là hàm toolkit đã tự guard `prefersReducedMotion()` (đã OR `isCalmMode()`). KHÔNG có motion inline mới nào được thêm. Bằng chứng: `sceneMotion.test.ts` đã có test "does nothing under reduced motion" + "does nothing under calm mode" cho từng hàm. KHÔNG thêm tween inline thủ công trong scene nào.

- [x] **Step 6: rà ranh giới**

`git diff --stat` (hoặc xem các file đã sửa): chỉ 15 file scene thay đổi; KHÔNG file `*Logic.ts`/`index.ts`/`sceneMotion.ts`/`sceneArt.ts`/`phaser-stub.ts`/data/router/parent thay đổi. KHÔNG đổi chữ ký method, guard, hit-area.

- [x] **Step 7: KHÔNG commit/push, KHÔNG docker** — để orchestrator. Báo cáo cuối.

---

## Self-Review (đã chạy)

**1. Spec coverage (§8, §10 phase 6.4):**
- "Correct: squashStretchPop + sparkleBurst" → Task 1–7 mọi scene ✔
- "Tap/select: tilePress cho tap-based" → Task 1,2,3,4 (tap) + Task 5 (flip) ✔; drag scenes (Task 6) & spot-difference (Task 7) cố ý KHÔNG (đúng "match interaction style") ✔
- "Entrance bouncePop nơi chưa có animateIn tốt, không double-animate" → more-less drawGroup (Task 4) ✔; các scene khác đã có `animateIn`/`bouncePop` cho object → KHÔNG chồng ✔
- "Idle idleBreathe tuỳ chọn" → abc/numbers targetText (Task 1) ✔
- "Finish: celebrate nâng cấp, calm nhẹ giữ nguyên" → đã có ở mọi scene từ trước, không đụng ✔
- "drag juice SNAP/lock không fight drag" → Task 6 ✔; "memory flip/match" → Task 5 ✔; "spot found-ring" → Task 7 ✔; "shapes/colors swatch không phá pattern+nhãn" → Task 3 ✔

**2. Placeholder scan:** không có TODO/TBD; mọi step có code thật.

**3. Type consistency:** mọi target juice là object có sẵn trong scope hook (`label`/`swatch`/`shape`/`frame`/`obj`/`ring`/`view.label`/`view.rect`/`tile`); cast `as unknown as MotionObject` khi object là `as unknown as Image` (mẫu counting-fun). `squashStretchPop`/`tilePress`/`bouncePop` nhận `MotionObject`, `sparkleBurst` nhận `(x:number,y:number)`. Khớp chữ ký verbatim.
