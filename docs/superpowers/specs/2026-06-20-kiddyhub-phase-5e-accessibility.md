# KiddyHub — Giai đoạn 5 · Phần E "Tiếp cận & hoà nhập" (Accessibility & inclusivity) — SPEC

> **Trạng thái:** Bản thiết kế (design-only) — 2026-06-20. Phần **cuối** của GĐ5.
> **Bản đồ tổng GĐ5:** [`2026-06-20-kiddyhub-phase-5-roadmap.md`](./2026-06-20-kiddyhub-phase-5-roadmap.md) — §2 Phần E, §3 nguyên tắc, §6 ranh giới.
> **Bản thiết kế tổng:** [`2026-06-19-kiddyhub-design.md`](./2026-06-19-kiddyhub-design.md).
> **Phạm vi:** chỉ THIẾT KẾ. Không sửa `src/`, không commit. Đây là tài liệu để lập plan + sub-agent implement sau.
> **Test baseline hiện tại:** **416 test / 82 file** xanh (xác minh bằng `npx vitest run` 2026-06-20).

---

## 1. Mục tiêu & DoD

GĐ5 Phần E là **quét polish cuối** về tiếp cận. Roadmap §2E nêu 4 trục + 1 lỗi tiếp cận **thật** trong code:

1. **An toàn mù màu (lỗi thật):** 2 trò mã hoá ý nghĩa **chỉ bằng màu** → thêm tín hiệu thứ hai (hoạ tiết/nhãn) + palette tương phản cao.
2. **Chế độ êm (calm mode):** một tuỳ chọn cài đặt rõ ràng (Dexie, additive) ép giảm hoạt ảnh toàn app, mở rộng nền `prefers-reduced-motion` hiện có.
3. **Đọc giọng mọi nút điều hướng:** không nút điều hướng nào "câm".
4. **Thuận tay trái / vùng chạm rộng & bao dung:** bố cục không cố định một bên; target lớn.

**DoD (theo roadmap §2E):**

- Trò màu/hình **phân biệt được khi mù màu** (không dựa vào màu đơn lẻ) — bằng hoạ tiết + nhãn + palette CB-safe.
- Có toggle **"Chế độ êm"** trong Khu phụ huynh; ép reduced-motion cho **cả React và Phaser**; bền qua reload.
- **Mọi nút điều hướng đọc được** khi chạm (tôn trọng voice toggle); 🔊 đọc lại.
- Bố cục **không cố định một bên**; vùng chạm lớn-bao-dung.
- **Có test** cho phần logic đổi (calm-mode đọc cờ, palette/pattern thuần, audit nav React). Scene Phaser → manual-test.
- **Không phá** logic/guard trò, mastery write-path, AudioManager, parent CRUD/dashboard, flow của D. Additive 100%.

---

## 2. Hiện trạng (audit cơ sở — đã đọc code)

### 2.1 Hai trò màu/hình — lỗi mù màu ở đâu

| Trò | File | Khi nào ý nghĩa = **chỉ màu** | Khi nào đã an toàn |
|---|---|---|---|
| **colors-english** | `colorsEnLogic.ts` + `ColorsEnglishScene.ts` | **Mọi vòng.** Lựa chọn là **ô màu thuần** (`add.rectangle(x,y,130,130,color.hex)`), phân biệt 100% bằng `hex`. Tên màu EN hiện chỉ ở **prompt mục tiêu** (1 chữ to giữa màn), KHÔNG ở từng ô. → mù màu = không phân biệt được các ô. | (không) |
| **shapes-colors** | `shapeColorLogic.ts` + `ShapesColorsScene.ts` | **Vòng `mode === 'color'`** (và phần MÀU của `mode === 'both'`): các lựa chọn cùng-hình khác-màu → phân biệt bằng màu. Ở `mode === 'color'`, distractor có thể **khác hình** nhưng người chơi được bảo "chạm màu X" → vẫn là quyết-định-theo-màu. | **Vòng `mode === 'shape'`**: HÌNH đã phân biệt (tròn/vuông/tam giác/sao) — an toàn sẵn. |

**Kết luận:** `colors-english` là lỗi nặng nhất (mọi ô là màu thuần). `shapes-colors` chỉ cần vá **trục màu**.

### 2.2 Cách scene dựng lựa chọn & hit-area (phải giữ nguyên kỷ luật)

- **colors-english:** mỗi option = `tile` (nền, không hit) + `swatch = rectangle(...).setStrokeStyle(6,0xffffff).setInteractive()`. **Hit area = chính swatch.** `swatch.on('pointerdown', () => this.choose(name, swatch))`. Shake = tween `swatch.x`.
- **shapes-colors:** mỗi option = `tile` (nền) + `hit = rectangle(...,0xffffff,0.001).setInteractive()` (rect trong suốt **là** hit-area) + `shape = drawShape(...)` (Graphics, không hit). `hit.on('pointerdown', () => this.choose(i, hit, tile, shape))`. Scaffold dim qua `dimDistractor`.
- Cả hai: `roundResolved` guard, `answeredThisRound`, `recordItemResult` (mastery write-path của B), `scaffold()` (dim distractor của B). **Không trò nào được đụng các đường này.**
- `animateIn`/`popCorrect`/`flyStars`/`celebrate` đã tôn trọng `prefersReducedMotion()` (no-op khi reduced).

### 2.3 Tầng motion (điểm móc calm-mode)

- React/CSS: `usePrefersReducedMotion()` (hook, đọc `matchMedia`), dùng ở `ScreenTransition.tsx`; CSS `@media (prefers-reduced-motion: reduce)` ở `App.css:713` tắt `.screen-enter/.stagger-item/.sticker-new/.bridge-card`.
- Phaser: `prefersReducedMotion()` (hàm thuần, đọc `matchMedia` on-demand), dùng trong `sceneMotion.ts` (3 call-site: `animateIn`, `popCorrect`, `flyStars`).
- **Cả hai chỉ đọc OS `prefers-reduced-motion`.** Chưa có lớp override từ settings → đây là điểm chèn calm-mode.

### 2.4 Settings singleton (điểm thêm cờ)

- `Settings = { id:'app'; soundOn; voiceOn; language }` (`types.ts`). `getSettings`/`updateSettings` + `DEFAULT_SETTINGS` (`settings.ts`).
- Toggle UI ở `ParentArea.tsx` §"Âm thanh": checkbox `soundOn`, `voiceOn` qua `toggle(key)` → `updateSettings` + `audio.setSoundOn/VoiceOn`.
- `App.tsx Root` load settings lúc mount, gọi `audio.setSoundOn/VoiceOn`. → Đây là nơi đọc cờ calm-mode lúc khởi động.

### 2.5 Audit nav-voice (xem §5 cho bảng đầy đủ + clip mới)

- Menu screens nhận `audio?: MenuAudio` (`Pick<'speak'|'speakText'>`); một số nút **đã** đọc, một số **câm**.
- Pipeline giọng: `AUDIO_MANIFEST` (41 key) → `build-voice-clips.mjs` (venv Piper) tự enumerate từ manifest + content modules → `voiceClips.ts`; `voiceClips.test.ts` re-derive & fail-red nếu thiếu clip (**anti-drift**: thêm key manifest = tự có clip ở build kế).

---

## 3. Trục 1 — An toàn mù màu (THE REAL FIX)

> **Nguyên tắc (roadmap §3):** *không mã hoá ý nghĩa chỉ bằng màu.* Mỗi màu phải mang **tín hiệu thứ hai** không phụ thuộc thị giác màu: **(a) hoạ tiết/texture** trong ô + **(b) nhãn chữ** + **(c) palette CB-safe tương phản cao**. Hai trò áp **cùng một** "color chip" để nhất quán và DRY.

### 3.1 Quyết định cốt lõi — "Color chip có nhãn + hoạ tiết"

Thay **ô màu thuần** bằng một **color chip** gồm 3 lớp xếp chồng (vẽ trong scene, không đụng hit-area):

1. **Nền màu** (như cũ) — `hex`.
2. **Hoạ tiết (pattern) phủ lên nền** — mỗi màu có **một hoạ tiết riêng, đơn sắc đậm/nhạt** (vd chấm bi, sọc dọc, sọc chéo, lưới ca-rô, lượn sóng…) vẽ bằng Graphics. → ngay cả mù màu hoàn toàn (achromatopsia) vẫn phân biệt **6–8 hoạ tiết khác nhau**.
3. **Nhãn chữ** — tên màu (VN cho shapes-colors, EN cho colors-english) **in dưới/đè chip**, chữ đậm có viền tương phản. → ai biết đọc/đang học chữ vẫn đọc được; với bé chưa đọc thì hoạ tiết + giọng (đã có) gánh.

> **Vì sao 3 lớp, không chỉ 1:** WCAG khuyến nghị **đừng dựa vào màu đơn**, và **đừng dựa vào một-tín-hiệu-thay-thế duy nhất** cho trẻ chưa đọc. Hoạ tiết phục vụ bé chưa đọc; nhãn phục vụ bé đang học chữ + phụ huynh; giọng (sẵn có) phục vụ mọi bé. Cả ba **bổ trợ**, không trùng lặp.

### 3.2 Palette CB-safe (tương phản cao)

Palette hiện tại (cả hai trò trùng nhau ở 6 màu đầu) có vài cặp dễ nhầm với mù màu phổ biến (deuteranopia/protanopia): **đỏ↔xanh-lá** (`0xe53935`↔`0x43a047`), **cam↔vàng** (`0xfb8c00`↔`0xfdd835`). Hoạ tiết + nhãn đã đủ để **phân biệt**, nhưng để **tăng tương phản nền** ta nâng độ tách biệt độ-sáng (luminance) giữa các màu kề nhau.

**[QUYẾT ĐỊNH MỞ #1 — xem §10.1]:** *Có đổi giá trị `hex` của palette màu hay giữ nguyên và chỉ thêm hoạ tiết+nhãn?* Mặc định đề xuất: **giữ `hex` (giữ bản sắc thương hiệu & SR-byte-identical), chỉ thêm hoạ tiết + nhãn**. Lý do: hoạ tiết+nhãn đã thoả DoD "phân biệt được khi mù màu" mà **không đụng logic** (palette `hex` còn được `build-voice-clips`/SR seed tham chiếu gián tiếp qua `name`; đổi `name` sẽ phá clip & mastery `itemKey`). Đổi `hex` là cải tiến thẩm mỹ tuỳ chọn, có thể làm sau.

### 3.3 Bộ hoạ tiết (pattern) — thêm vào `src/art/`

Tạo helper mới `src/art/swatchPattern.ts` (thuần, test được): cho `(scene, x, y, size, colorName) → vẽ Graphics hoạ tiết` **trên** nền màu. Map tên→hoạ tiết cố định, deterministic:

| Tên (VN / EN) | Hoạ tiết | Ghi chú |
|---|---|---|
| đỏ / red | chấm bi (dots) | |
| xanh dương / blue | sọc dọc (vertical stripes) | |
| vàng / yellow | sọc chéo (diagonal stripes) | tách khỏi cam |
| xanh lá / green | lưới ca-rô (grid) | tách khỏi đỏ |
| tím / purple | lượn sóng (waves) | |
| cam / orange | vòng tròn đồng tâm (rings) | tách khỏi vàng |
| pink (colors-en) | trái tim nhỏ lặp (hoặc chấm to) | chỉ EN |
| black (colors-en) | sọc trắng mảnh | nền tối → hoạ tiết sáng |

> Hoạ tiết vẽ **đơn sắc** (trắng hoặc đen tuỳ độ sáng nền, đủ tương phản) bằng Graphics primitives — **không** ảnh, **không** đụng cache texture nặng. Drawn **trên** chip, **dưới** hit-area (depth giữ nguyên thứ tự cũ: tile < pattern/swatch < hit).

### 3.4 Thay đổi per-game (bảng chi tiết)

> **Kỷ luật bắt buộc (cả hai):** hit-area **không đổi** (vẫn `swatch`/`hit` cũ với cùng kích thước & vị trí); `topOnly`/thứ tự tap không đổi; pattern + nhãn vẽ với depth **dưới** hit-area để không chắn tap; `roundResolved`/`recordItemResult`/`scaffold`/`dimDistractor` không đổi; **logic file (`*Logic.ts`) không đổi** (SR seed byte-identical). Mọi thay đổi là **visual-only trong scene `create/nextRound`**.

| Trò | Đổi gì trong scene | Hit-area | Nhãn | Hoạ tiết | Mastery/guard | Test |
|---|---|---|---|---|---|---|
| **colors-english** (`ColorsEnglishScene.ts`) | Mỗi option: giữ `tile` + `swatch` (vẫn là hit). **Thêm:** (1) vẽ hoạ tiết theo `color.name` đè lên swatch (depth dưới hit); (2) thêm `Text` tên màu EN **dưới** mỗi swatch (đậm, viền tương phản). `dimDistractor` cũng fade pattern+label (thêm vào danh sách dim). | **Không đổi** (swatch). | **Mỗi ô có nhãn EN** (mới — trước chỉ prompt có). | Mới. | Không đổi. | Manual (scene). |
| **shapes-colors** (`ShapesColorsScene.ts`) | Trục HÌNH đã an toàn → **không cần** đụng vòng `mode==='shape'`. Với **mọi** option: thêm hoạ tiết theo `opt.color.name` vẽ **trong** vùng shape (clip theo shape nếu khả thi; nếu khó clip-theo-shape thì vẽ chấm/sọc nhỏ phủ trên shape). **Thêm:** nhãn tên-màu VN nhỏ dưới mỗi option **chỉ khi** `mode !== 'shape'` (tránh nhiễu vòng thuần-hình). `dimDistractor` fade thêm pattern+label. | **Không đổi** (`hit` rect trong suốt). | Nhãn màu VN dưới option ở vòng `color`/`both`. | Mới (trong shape). | Không đổi. | Manual (scene). |

> **Lưu ý shapes-colors:** vì shape được vẽ bằng `fillStar`/`fillTriangle`/… (Graphics đa dạng), clip hoạ-tiết-theo-biên-shape phức tạp. **Mặc định đơn giản hoá:** vẽ hoạ tiết là **một cụm glyph nhỏ đè giữa shape** (vd 3 chấm / mấy sọc) đủ phân biệt, KHÔNG cố clip chính xác biên — rẻ, an toàn, vẫn đạt DoD. Đánh dấu **[QUYẾT ĐỊNH MỞ #2 — §10.2]** về mức độ tinh xảo của hoạ tiết trong shape.

### 3.5 Nhãn — đọc được & không vỡ layout

- Nhãn dùng `palette.ink` (nâu đậm) trên nền sáng / trắng trên nền tối, có `setStroke` mảnh để luôn tương phản ≥ WCAG AA với mọi nền chip.
- Đặt **dưới** chip (không đè lên giữa) để không che hoạ tiết; font ~22–26px. Với colors-english, giảm spacing ngang option nếu cần để nhãn EN dài ("yellow"/"orange"/"purple") không chồng — chỉnh `startX`/step trong scene (visual-only, không đụng hit kích thước).

---

## 4. Trục 2 — Chế độ êm (Calm mode)

> **Mục tiêu:** một **tuỳ chọn rõ ràng** trong Khu phụ huynh ép giảm hoạt ảnh + nhiễu thị giác toàn app cho bé nhạy cảm/ADHD/ASD, **mở rộng** (không thay) nền `prefers-reduced-motion`. Tương tác vẫn **tức thì** (calm chỉ giảm trang trí, không bao giờ gate tap sau animation).

### 4.1 Mô hình cài đặt (additive — mirror cờ hiện có)

Thêm **một** trường vào `Settings` (`types.ts`) + `DEFAULT_SETTINGS` (`settings.ts`), đúng kiểu các cờ cũ:

```ts
export interface Settings {
  id: 'app';
  soundOn: boolean;
  voiceOn: boolean;
  language: 'vi' | 'en';
  calmMode: boolean; // GĐ5E — ép giảm hoạt ảnh toàn app (chồng lên prefers-reduced-motion OS)
}
// DEFAULT_SETTINGS: { ..., calmMode: false }
```

**[QUYẾT ĐỊNH MỞ #3 — §10.3]:** *Mặc định calm-mode = `false` (off, theo-OS) hay một mô hình 3-trạng-thái `'system'|'on'|'off'`?* Mặc định đề xuất: **boolean `calmMode: false`**, ngữ nghĩa **OR với OS**: hiệu lực-reduced = `calmMode || OS-prefers-reduced`. Tức mặc định **vẫn tôn trọng OS** (bé có reduce-motion ở OS vẫn được giảm), và phụ huynh có thể **bật thêm** calm bất kể OS. Đơn giản, mirror đúng kiểu boolean của `soundOn/voiceOn`, không cần migration phức tạp. (3-trạng-thái mạnh hơn nhưng over-engineered cho nhu cầu hiện tại — YAGNI.)

> **Quan trọng — ngữ nghĩa OR, không override-tắt:** calmMode chỉ **thêm** lý do để giảm; nó **không** cho phép TẮT reduce khi OS đang bật (không ai muốn ép animation lên người đã chọn reduce ở OS). Vậy hiệu lực = `calmMode === true || prefersReducedMotion-OS === true`.

### 4.2 Lớp đọc cờ — cho CẢ React và Phaser (điểm tinh tế)

Hiện `prefersReducedMotion()` (Phaser) và `usePrefersReducedMotion()` (React) chỉ đọc `matchMedia`. Cần một **nguồn calm-mode** mà **hàm thuần Phaser** (ngoài React, không hook, không async trong hot path) đọc được **đồng bộ**. Dexie là async → không gọi trong `animateIn`. Giải pháp: **một biến module-level "live mirror" cập nhật khi settings đổi.**

Thiết kế (additive, jsdom-safe):

1. **`src/motion/calmMode.ts` (mới):**
   - `let calmModeOn = false;` (module state).
   - `setCalmMode(on: boolean): void { calmModeOn = on; }` — gọi từ App lúc load settings & từ ParentArea khi toggle.
   - `isCalmMode(): boolean { return calmModeOn; }`.
2. **`prefersReducedMotion()` (Phaser, sửa thành OR):**
   `return isCalmMode() || (matchMedia available && matchMedia(QUERY).matches);`
   → mọi call-site trong `sceneMotion.ts` tự động tôn trọng calm (không đổi call-site). jsdom-safe vì matchMedia vẫn guarded; `isCalmMode()` mặc định false.
3. **`usePrefersReducedMotion()` (React):** đọc `isCalmMode() || matchMedia`. Để **live-update** khi toggle, calmMode mirror phát một sự kiện đơn giản (vd `window` CustomEvent `'kiddyhub:calmmode'` hoặc một mini pub-sub trong `calmMode.ts`) mà hook subscribe — tránh phải truyền prop qua mọi component. Hook vẫn giữ subscribe `matchMedia change` như cũ.
4. **App khởi động (`App.tsx Root`):** chỗ đã `audio.setSoundOn(s.soundOn)` → thêm `setCalmMode(s.calmMode)`.
5. **ParentArea toggle:** thêm `calmMode` vào `toggle()` (hoặc một handler riêng) → `updateSettings({calmMode})` + `setCalmMode(next.calmMode)`.

> **Vì sao module-mirror, không Context:** Phaser scenes sống ngoài React tree — không nhận được Context. Một biến module + setter là cách **duy nhất** để hàm thuần `prefersReducedMotion()` đọc đồng bộ trong tween hot-path, **và** React đọc cùng nguồn → một sự-thật. Mirror được seed từ Dexie lúc mount (App) nên bền qua reload.

### 4.3 "Calm" giảm những gì (định nghĩa rõ)

Calm-mode **tái dùng** đúng đường reduced-motion đã có (vì `prefersReducedMotion` giờ OR cờ này) → **không cần viết lại** từng hiệu ứng:

- **React/CSS:** `.screen-enter`, `.stagger-item`, `.sticker-new`, `.bridge-card` → `animation:none` (đã có ở `App.css:713`; nhưng đó là `@media` query, KHÔNG bắt được calm-toggle). **Cần thêm:** một class trên `<html>`/`<body>` (vd `data-calm="true"` hoặc `.calm-mode`) set bởi App khi calm bật, và **nhân đôi** khối CSS reduced-motion dưới selector `.calm-mode` (hoặc dùng `:where(.calm-mode, ...)`). Tức CSS giảm animation khi **OS reduce HOẶC `.calm-mode`**.
- **Phaser:** `animateIn`/`popCorrect`/`flyStars`/`celebrate*` → tự no-op (qua `prefersReducedMotion()` OR). *(Lưu ý `celebrate()` trong `sceneArt.ts` hiện KHÔNG check reduced-motion — xem §4.4.)*
- **Nhiễu thị giác bổ sung (calm):** giảm **mây trôi**/decor nền. Mặc định nhẹ tay: calm **giữ** nền tĩnh nhưng có thể giảm số mây hoặc tắt drift nếu sau này thêm. (Hiện mây là tĩnh — không có tween — nên không phải lo; chỉ ghi chú nếu D/E sau thêm drift.)
- **KHÔNG giảm:** phản hồi chức năng (đổi viền đúng/sai, SFX, giọng), tính tức-thì của tap. Calm = "êm hơn", không phải "ít chức năng hơn".

### 4.4 Đồng bộ `celebrate()` với reduced-motion **[điều chỉnh roadmap nhỏ]**

`celebrate()` trong `sceneArt.ts` (Cáo nhảy + 8 sao bay) **không** kiểm `prefersReducedMotion()` — nó vẫn chạy đầy đủ kể cả khi reduce/calm. Để calm-mode nhất quán ("giảm hoạt ảnh toàn app"), **nên** thêm guard: dưới reduced/calm, `celebrate()` rút gọn thành một flash/nhãn tĩnh **nhẹ** (vẫn báo "xong" nhưng không burst). **[QUYẾT ĐỊNH MỞ #4 — §10.4]:** mức rút gọn của celebrate dưới calm. Đây là thay đổi **visual-only**, additive, manual-test.

---

## 5. Trục 3 — Đọc giọng mọi nút điều hướng

> **Mục tiêu:** mọi nút **điều hướng** đọc nhãn/mục đích khi chạm; 🔊 đọc lại; **tôn trọng voice toggle** (AudioManager đã tự gate khi `voiceOn=false`).

### 5.1 Audit nav-voice (đầy đủ)

| Màn / nút | File | Hành vi giọng hiện tại | Cần sửa? | Fix |
|---|---|---|---|---|
| WhoIsPlaying — title (mount) | `WhoIsPlaying.tsx` | `speak('who.title')` ✅ | — | — |
| WhoIsPlaying — avatar bé | ″ | `speakText(p.name)` ✅ | — | — |
| WhoIsPlaying — **"👨‍👩‍👧 Bố mẹ"** | ″ | **câm** | ✅ | `onClick` → `speak('nav.parents')` rồi `onParent()` |
| WhoIsPlaying — **"Bố mẹ tạo hồ sơ"** (empty) | ″ | **câm** | ✅ | `speak('nav.parents')` (tái dùng) |
| AdventureMap — đảo (category) | `AdventureMap.tsx` | `speakText(c.title)` ✅ | — | — |
| AdventureMap — **"Đổi bạn"** | ″ | **câm** | ✅ | `speak('nav.switchchild')` |
| AdventureMap — **"Vườn sao {n}"** | ″ | **câm** | ✅ | `speak('nav.garden')` |
| AdventureMap — Cáo invite (mount) | ″ | `speak('fox.adventure.invite')` ✅ | — | — |
| CategoryScreen — **"⬅️ Quay lại bản đồ"** | `CategoryScreen.tsx` | **câm** | ✅ | `speak('nav.back')` |
| CategoryScreen — thẻ trò | ″ | `speakText(g.title)` ✅ | — | — |
| StarGarden — **"⬅️ Quay lại bản đồ"** | `StarGarden.tsx` | **câm** | ✅ | `speak('nav.back')` |
| StarGarden — **"Đi chơi nào!"** (empty) | ″ | **câm** | ✅ | `speak('nav.back')` (cùng nghĩa quay lại) |
| TodaysAdventure — thẻ "Chơi {title}" | `TodaysAdventure.tsx` | **câm** (không nhận `audio`) | ✅ | Truyền `audio` xuống; `speakText(p.title)` trước `onPlayPick` |
| Onboarding — welcome (mount) | `Onboarding.tsx` | `speak('fox.welcome')` ✅ | — | — |
| Onboarding — **"Bố mẹ tạo hồ sơ cho bé"** | ″ | **câm** | ✅ | `speak('nav.parents')` |
| StickerBook — Cáo new (mount) | `StickerBook.tsx` | `speak('fox.sticker.new')` ✅ | — | — |
| ParentArea — toàn bộ | `ParentArea.tsx` | **câm** (khu người lớn) | ❌ **không** | Khu phụ huynh là UI người lớn biết đọc; thêm giọng ở đây gây ồn. **Giữ câm.** |
| Scene chrome 🏠 (home) | `sceneArt.ts addChrome` | **câm** (chỉ shrink) | ✅ (nhẹ) | `onHome` wrapper: `speak('nav.home')` rồi `goHome()` — sửa ở **call-site mỗi scene** hoặc thêm tuỳ chọn trong `addChrome` |
| Scene chrome 🔊 (speaker) | ″ | đọc lại prompt ✅ (mỗi scene tự nối `onReplay`) | — | — |

### 5.2 Clip Piper mới cần thêm vào `AUDIO_MANIFEST`

Thêm **4 key cố định** (anti-drift tự sinh clip ở build kế qua `build-voice-clips.mjs` venv):

| Key | Text (vi-VN) |
|---|---|
| `nav.parents` | "Khu của bố mẹ nhé!" |
| `nav.garden` | "Vào vườn sao nào!" |
| `nav.switchchild` | "Đổi bạn chơi nhé!" |
| `nav.back` | "Quay lại nào!" |
| `nav.home` | "Về nhà thôi!" *(cho chrome home — 5 key nếu làm cả chrome)* |

> **Quyết định mặc định (đủ rõ, KHÔNG để mở):** dùng **5 clip cố định** trên (gồm `nav.home`). Chúng ngắn, on-brand giọng Cáo, và pipeline tự cover (manifest là nguồn). Không cần clip động.
> **Lưu ý parent-area câm:** đúng triết lý — voiced-nav nhắm **bé** (chưa đọc), không phải người lớn. Roadmap "mọi nút điều hướng" diễn giải là **mọi nút điều hướng của bé**; parent CRUD/dashboard ngoài phạm vi (và §6 cấm đụng parent flow).

### 5.3 Chrome home — cách sửa tối thiểu

`addChrome` nhận `{onHome, onReplay}`. Mỗi scene gọi `onHome: () => this.host.goHome()`. **Hai lựa chọn:**
- **(A, mặc định)** sửa từng scene: `onHome: () => { void this.host.speak('nav.home'); this.host.goHome(); }` — nhưng có **16 scene** → nhiều chỗ sửa, mỗi chỗ manual-test.
- **(B, gọn hơn)** dạy `addChrome` tự đọc: thêm tham số tuỳ chọn `homeVoiceKey='nav.home'` và trong `makeButton(home)` gọi `scene`-level speak. Nhưng `addChrome` không có handle tới `host`/AudioManager.

→ **Mặc định: (A) nhưng phạm vi hẹp** — chrome home im không phải lỗi tiếp cận nặng (nút có vị trí & icon cố định, bé học nhanh; back ở menu mới là điều hướng chính). **Khuyến nghị:** ưu tiên các nút **menu** (bảng §5.1, chắc chắn câm & quan trọng); chrome-home để **tuỳ chọn/nice-to-have** — có thể gộp vào E2 hoặc bỏ qua nếu muốn giữ scene-change tối thiểu. Ghi rõ trong plan.

---

## 6. Trục 4 — Thuận tay trái & vùng chạm bao dung

> **Mục tiêu:** không bố cục **cố định một bên**; target lớn & dễ trúng. **Quyết định: ambidextrous-by-default, KHÔNG thêm setting "handedness".**

### 6.1 Audit bố cục một-bên & target

| Vị trí | Hiện trạng | Vấn đề thuận-tay? | Fix |
|---|---|---|---|
| Scene chrome: 🏠 trái-trên, 🔊 phải-trên | `addChrome` | Cân đối hai góc → **không** thiên tay. | Giữ. |
| Menu "Bố mẹ" (WhoIsPlaying) góc | `WhoIsPlaying` | Một nút phụ — không phải tác vụ chơi. | Giữ vị trí; chỉ tăng target nếu < 44px. |
| Back "⬅️" góc trái-trên (Category/Garden) | hai file | Cố định trái — nhưng là nút **phụ**, không phải hành động chơi chính. | Chấp nhận; đảm bảo target ≥ 56px, padding rộng. |
| Lựa chọn trò (tile/swatch/shape) | scenes | Dàn **ngang giữa màn**, đối xứng → **không** thiên tay sẵn. | Giữ; xác nhận khoảng cách đủ để không mis-tap. |
| Drag games (match-quantity, sorting, jigsaw) | scenes | Kéo-thả: nguồn↔đích. Cần kiểm nguồn/đích **không** ép một bên. | **Audit thủ công** (xem §6.3); snap target rộng. |

### 6.2 Quyết định: không cần "handedness" setting

- Hầu hết tương tác là **tap vào lựa chọn dàn ngang đối xứng** — đã ambidextrous.
- Các nút điều hướng phụ (back/parent) ở góc cố định là **chuẩn UX** và không cản trò chơi; thêm setting lật trái-phải là **over-engineering** (YAGNI, §6 roadmap) và tăng bề mặt test/Phaser.
- **Khuyến nghị:** **ambidextrous-by-default**. Chỉ đảm bảo (a) mọi target chơi ≥ ~64px với padding bao dung, (b) không hành động **chơi chính** nào khoá cứng một bên. → đạt DoD "bố cục không cố định một bên" mà không thêm cờ.

### 6.3 Forgiving targets — kiểm tra cụ thể (manual)

- **colors-english:** swatch 130px + tile 152px — đã lớn. Sau khi thêm nhãn EN, kiểm spacing 170px/option **không** thu nhỏ vùng chạm (hit = swatch giữ nguyên 130). ✅
- **shapes-colors:** hit rect 130×130, tile 140 — lớn. Nhãn VN thêm **dưới** option, không lấn hit. ✅
- **Drag games:** xác nhận snap-zone đủ rộng & bao dung (đã có từ GĐ4) — **chỉ audit, không sửa** trừ khi phát hiện target < ~56px. (Roadmap §2E "rà lại các trò kéo-thả" = audit, không refactor.)
- **CSS menu targets:** đảm bảo `.parent-link`, `.back`, `.garden-btn`, `.switch-child-btn` có `min-height/min-width` ≥ 44–56px + padding. (CSS-only, automated-testable qua snapshot/style nếu cần — phần lớn là chỉnh `App.css`.)

---

## 7. Ranh giới (KHÔNG phá — §6 roadmap)

- **Additive 100%:** chỉ THÊM trường `calmMode`, helpers mới (`calmMode.ts`, `swatchPattern.ts`), 5 key manifest, và visual + voice ở scene/menu. **Không** sửa `*Logic.ts`, `progression.ts`, `applyCompletion.ts`, `registry.ts`.
- **Guard trò:** `roundResolved`/`finished`/`answeredThisRound`, drag-snap/hit-area — **không đụng**. Mọi thay đổi scene là visual/voice quanh hit-area sẵn có.
- **Mastery write-path (B):** `recordItemResult`/`pickItem`/`hint`/`scaffold`/`dimDistractor` — **không đụng** (chỉ thêm pattern+label vào danh sách object được `dimDistractor` fade, đúng API hiện có).
- **AudioManager / pipeline A:** chỉ thêm key manifest (anti-drift tự cover); không sửa AudioManager/SpeechEngine/voiceClips logic.
- **Parent CRUD/dashboard (C) & flow (D):** chỉ **thêm** một toggle calm-mode vào ParentArea §Âm-thanh (mirror toggle cũ) + truyền `audio` xuống TodaysAdventure; không sửa CRUD/insight/flow.
- **Hạ tầng test:** giữ alias `phaser → phaser-stub`; jsdom-safe (matchMedia/calmMode guarded, default false); local-only, runtime offline.
- **Scene Phaser = manual-test** (`npm run dev`): mọi đổi trong 2 color scenes + chrome-home + drag-audit. Giữ tối thiểu & kỷ luật.

---

## 8. Kế hoạch test

### 8.1 Tự động (Vitest, jsdom-safe) — phần React/thuần

1. **`calmMode.ts`:** `setCalmMode/isCalmMode` round-trip; default false.
2. **`prefersReducedMotion` (Phaser, đã có test):** mở rộng — trả `true` khi `calmMode=true` dù matchMedia false; vẫn `true` khi OS reduce; `false` khi cả hai off; jsdom (no matchMedia) + calm off → false.
3. **`usePrefersReducedMotion`:** trả reduced khi calm bật; live-update khi `setCalmMode` đổi (qua sự kiện).
4. **`settings.ts`/types:** `DEFAULT_SETTINGS.calmMode === false`; `updateSettings({calmMode:true})` bền (mirror test cờ cũ).
5. **`swatchPattern.ts`:** map tên→hoạ tiết deterministic, đủ phủ mọi `COLORS.name` của **cả hai** trò (không màu nào thiếu hoạ tiết) — test thuần, không Phaser.
6. **Nav-voice (React):** mở rộng test component sẵn có (`WhoIsPlaying.test`, `CategoryScreen.test`, `AdventureMap.test`, `StarGarden.test`, `TodaysAdventure.test`) — bấm nút câm-cũ → `audio.speak`/`speakText` được gọi với key đúng; tôn trọng việc `audio` optional (không crash khi vắng).
7. **`audioManifest`:** test re-derive (voiceClips.test) tự fail nếu thiếu clip cho 5 key mới — chạy `build-voice-clips` (manual/local) sinh clip.
8. **ParentArea:** toggle calmMode → `updateSettings` + `setCalmMode` gọi (mirror test `soundOn`).

### 8.2 Thủ công (browser, `npm run dev`) — Phaser + cảm nhận

- **MT-E1 (colorblind):** mở `colors-english` & `shapes-colors`; xác nhận mỗi lựa chọn có **hoạ tiết + nhãn**; bật trình giả-lập mù màu (DevTools Rendering → Emulate vision deficiency: deuteranopia/protanopia/achromatopsia) → vẫn phân biệt & chọn đúng được; hit-area/tap không lệch; scaffold dim mờ cả pattern+label.
- **MT-E2 (calm):** bật "Chế độ êm" ở Khu phụ huynh → reload-persist; vào menu (không stagger) + scene (không entrance/pop/flyStars burst, celebrate rút gọn); tắt → animation trở lại; kiểm OS-reduce vẫn giảm khi calm off.
- **MT-E3 (voiced-nav):** bật giọng, chạm từng nút trong bảng §5.1 (Bố mẹ, Đổi bạn, Vườn sao, ⬅️ back ×2, "Đi chơi", thẻ phiêu-lưu, Onboarding tạo-hồ-sơ) → mỗi nút đọc đúng; tắt voice toggle → im hết; 🔊 vẫn đọc lại prompt.
- **MT-E4 (targets/drag):** thử chơi bằng **tay trái** (đặt máy/đổi tay) — không nút chơi chính nào khó với; drag games snap bao dung; target back/parent đủ lớn.

---

## 9. Đề xuất tách E1 / E2

> **Khuyến nghị: TÁCH thành E1 (React/thuần — automated) + E2 (2 Phaser color scenes + chrome — manual).** Theo đúng tiền lệ GĐ4E (tách bundle) & §2E "có test cho phần logic đổi; scene manual-test".

| Phần | Nội dung | Kiểm thử | Vì sao tách |
|---|---|---|---|
| **E1** | calmMode (`calmMode.ts` + sửa `prefersReducedMotion`/hook + CSS `.calm-mode` + Settings field + ParentArea toggle + App seed) · **voiced-nav React** (5 menu nút + TodaysAdventure audio) · 5 key manifest · forgiving-target CSS · drag audit (read-only) | **Tự động** (Vitest) — TDD được trọn vẹn | Toàn bộ là React/thuần/CSS, test-được, ít rủi ro; gồm thay đổi cốt cho calm-mode & nav-voice. |
| **E2** | 2 color scene: hoạ tiết + nhãn (colorblind-safe) · (tuỳ chọn) chrome-home voice | **Thủ công** (`npm run dev`, CB emulation) | Đụng Phaser scene (hit-area discipline, CB-emulation), không test tự động được; cô lập để review/manual riêng. |

**Lý do:** E1 mang phần lớn giá trị tiếp cận (calm + voiced-nav) một cách **an toàn, test-được, commit sớm**; E2 cô lập đúng-2-scene rủi ro-hơn (manual) để review tập trung. Giảm bề mặt mỗi commit, dễ rollback. Nếu chủ dự án ưu tiên một-commit-gọn thì làm liền E (một plan, hai mục) cũng được — nhưng **khuyến nghị tách** vì kỷ luật manual-test của Phaser khác hẳn automated.

---

## 10. Rủi ro & QUYẾT ĐỊNH MỞ (cho chủ dự án)

### 10.1 [QUYẾT ĐỊNH MỞ #1] — Đổi `hex` palette màu hay chỉ thêm hoạ tiết+nhãn?
- **Tuỳ chọn A (mặc định):** Giữ `hex` & `name` y nguyên; chỉ thêm hoạ tiết + nhãn. ✔ Không đụng SR/clip/mastery `itemKey`; byte-identical logic; đạt DoD CB-safe.
- **Tuỳ chọn B:** Đồng thời nâng palette lên bộ CB-safe tương phản-cao (đổi `hex`, GIỮ `name`). ✔ Tương phản nền tốt hơn; ✘ rủi ro thẩm mỹ thương hiệu, thêm manual-test, không bắt buộc cho DoD.
- **Khuyến nghị: A.** (B là cải tiến tuỳ chọn, có thể làm sau nếu thấy cần.)

### 10.2 [QUYẾT ĐỊNH MỞ #2] — Mức tinh xảo hoạ tiết trong **shape** (shapes-colors)?
- **Tuỳ chọn A (mặc định):** Hoạ tiết = **cụm glyph nhỏ đè giữa shape** (vài chấm/sọc), KHÔNG clip theo biên shape. ✔ Rẻ, an toàn, đủ phân biệt; ✘ kém "đẹp" hơn texture-phủ-kín.
- **Tuỳ chọn B:** Clip hoạ tiết theo đúng biên mỗi shape (mask). ✔ Đẹp hơn; ✘ phức tạp với star/triangle Graphics, dễ phát sinh lỗi, manual-test nặng.
- **Khuyến nghị: A.** (Đủ đạt DoD; ưu tiên kỷ luật scene tối thiểu.)

### 10.3 [QUYẾT ĐỊNH MỞ #3] — Mặc định & mô hình calm-mode?
- **Tuỳ chọn A (mặc định):** `calmMode: boolean = false`, hiệu lực = `calmMode || OS-reduce`. ✔ Đơn giản, mirror cờ cũ, vẫn tôn trọng OS; ✘ không cho phụ huynh "ép animation lên dù OS reduce" (nhưng không ai cần điều đó).
- **Tuỳ chọn B:** 3-trạng-thái `'system'|'on'|'off'`. ✔ Linh hoạt tối đa; ✘ over-engineered, thêm migration & UI, YAGNI.
- **Khuyến nghị: A.**

### 10.4 [QUYẾT ĐỊNH MỞ #4] — `celebrate()` dưới calm/reduced: rút gọn tới đâu?
- **Tuỳ chọn A (mặc định):** Dưới calm/reduced, `celebrate()` chạy **bản rút gọn**: Cáo hiện tĩnh + 1 nhịp nhẹ, **bỏ** burst 8 sao bay; SFX/giọng giữ. ✔ "Xong" vẫn rõ, êm hơn nhiều.
- **Tuỳ chọn B:** Giữ `celebrate()` nguyên (không guard) — chỉ entrance/pop bị calm. ✔ Ít sửa nhất; ✘ không nhất quán "giảm hoạt ảnh toàn app" (burst sao là hoạt ảnh lớn nhất).
- **Khuyến nghị: A** (thêm guard reduced/calm vào `celebrate` — visual-only, additive).

### 10.5 Rủi ro khác (đã có biện pháp)
- **Nhãn EN dài chồng nhau** (colors-english "yellow/orange/purple"): chỉnh spacing/font trong scene (visual-only). → MT-E1.
- **Pattern che/đổi cảm-nhận tap:** pattern vẽ **dưới** hit-area, depth giữ thứ tự cũ → tap không đổi. → MT-E1.
- **Calm live-update React:** cần pub-sub nhỏ trong `calmMode.ts` để hook re-render; test #3 phủ.
- **chrome-home voice ×16 scene:** phạm vi rộng → để **tuỳ chọn/nice-to-have** trong E2, ưu tiên nav menu trước (§5.3).

---

## 11. Handoff (cho plan + sub-agent)

**Thứ tự gợi ý:** E1 trước (automated, TDD), E2 sau (manual scene).

**Files sẽ ĐỘNG (additive):**
- `src/data/types.ts` — thêm `calmMode: boolean` vào `Settings`.
- `src/data/settings.ts` — `DEFAULT_SETTINGS.calmMode = false`.
- `src/motion/calmMode.ts` — **mới**: `setCalmMode/isCalmMode` + pub-sub nhỏ.
- `src/motion/prefersReducedMotion.ts` — OR thêm `isCalmMode()`.
- `src/motion/usePrefersReducedMotion.ts` — OR `isCalmMode()` + subscribe calm event.
- `src/motion/index.ts` — export `calmMode` API.
- `src/App.tsx` — `setCalmMode(s.calmMode)` lúc load settings; thêm `data-calm`/class `.calm-mode` trên root khi bật; truyền `audio` xuống TodaysAdventure (qua AdventureMap props).
- `src/App.css` — nhân khối reduced-motion dưới `.calm-mode`; min-size target cho `.back/.parent-link/.garden-btn/.switch-child-btn`.
- `src/components/parent/ParentArea.tsx` — thêm toggle "Chế độ êm" (mirror toggle âm thanh) → `updateSettings({calmMode})` + `setCalmMode`.
- `src/components/{WhoIsPlaying,AdventureMap,CategoryScreen,StarGarden,TodaysAdventure,Onboarding}.tsx` — thêm `audio?.speak('nav.*')` vào các nút câm (bảng §5.1); TodaysAdventure nhận & dùng `audio`.
- `src/audio/audioManifest.ts` — thêm 5 key `nav.*`.
- `src/art/swatchPattern.ts` — **mới**: map tên màu→hoạ tiết + vẽ Graphics.
- `src/games/colors-english/ColorsEnglishScene.ts` — chip = swatch + pattern + nhãn EN; `dimDistractor` fade thêm.
- `src/games/shapes-colors/ShapesColorsScene.ts` — pattern trong shape + nhãn VN ở vòng color/both; `dimDistractor` fade thêm.
- `src/art/sceneArt.ts` — (QĐ#4) guard reduced/calm trong `celebrate()`; (tuỳ chọn) chrome-home voice.

**Tests mới/mở rộng:** §8.1 (1–8). Sau khi thêm key manifest → chạy `npx tsx scripts/build-voice-clips.mjs` (local venv Piper) để sinh 5 mp3 + cập nhật `voiceClips.ts`; `voiceClips.test.ts` xác nhận đủ.

**Manual-test TODO để lại:** MT-E1..E4 (§8.2) — ghi vào `ROADMAP.md` + sổ SDD khi đóng phần, vì CB-emulation/giọng/scene/calm-feel chỉ verify được ở browser thật.

**Điều chỉnh roadmap:** (a) `celebrate()` thêm guard reduced/calm (QĐ#4) — ngoài 4 trục gốc nhưng cần để calm nhất quán; (b) parent-area cố ý **giữ câm** (voiced-nav nhắm bé, không phải người lớn); (c) chrome-home voice là **nice-to-have** (ưu tiên nav menu).
