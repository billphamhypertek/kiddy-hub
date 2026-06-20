# KiddyHub — Giai đoạn 6 · Phần 6.1 Implementation Plan (Nền tảng Storybook + pilot `counting-fun`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Spec (source of truth):** [`../specs/2026-06-20-kiddyhub-phase-6-storybook-art.md`](../specs/2026-06-20-kiddyhub-phase-6-storybook-art.md) — đây là plan CHỈ cho **6.1** (spec §10).
> **Tiền lệ art:** [`2026-06-20-kiddyhub-phase-4b-final-art.md`](../specs/2026-06-20-kiddyhub-phase-4b-final-art.md) · **Tiếp cận:** [`2026-06-20-kiddyhub-phase-5e-accessibility.md`](../specs/2026-06-20-kiddyhub-phase-5e-accessibility.md).
> **Style reference (giọng plan):** [`2026-06-20-kiddyhub-phase-5a.md`](./2026-06-20-kiddyhub-phase-5a.md).

**Goal:** Đặt **nền tảng phong cách "Truyện tranh giấy · Tươi" (Storybook Vivid)** cho KiddyHub — token bóng/mực/giấy/sơn, factory `<defs>` tái dùng (`paint.ts`), font **Baloo 2** bundle cục bộ, Cáo repaint + Cáo đồng hành trong cảnh, dàn cảnh nhiều lớp + grain nền, bộ juice mở rộng tôn trọng calmMode — rồi **chuyển trọn `counting-fun`** (emoji → sinh vật SVG vẽ tay) làm **bản tham chiếu** cho 6.2–6.5.

**Architecture:** Giữ NGUYÊN kiến trúc SVG-trong-mã + token. Thêm một lớp "nền tảng sơn" thuần (`paint.ts`) trả mảnh `<defs>` id-namespaced để `fox.ts`/`creatures-counting`/`chrome` compose vào texture base64. Dàn cảnh & grain ở **tầng nền cảnh** (1 lớp, không per-sprite). Juice mới sống cạnh juice cũ trong `sceneMotion.ts`, mọi hàm có nhánh giảm nhẹ qua `prefersReducedMotion()`. Pilot `counting-fun` thay `add.text(emoji)` bằng `addArt(scene, key, creature(id), …)` — **logic, hit-area, guard round/finish KHÔNG đổi**.

**Tech Stack:** TypeScript 5 (strict), Vitest 2, Vite + vite-plugin-pwa (workbox), Phaser 3 (stub khi test). Style board chạy bằng `tsx` (như `build-style-sample.mjs` hiện có). Font Baloo 2 = 1 file `.woff2` subset Việt+Latin bundle qua `@font-face` cục bộ.

## Global Constraints

- **100% cục bộ, KHÔNG thêm phụ thuộc runtime** (spec §12): không gọi Google Fonts CDN lúc chạy; không ảnh raster/AI/atlas; chỉ **1 file woff2 bundle sẵn**. `package.json` dependencies giữ nguyên 4 dòng (`dexie`, `phaser`, `react`, `react-dom`).
- **KHÔNG đụng** (spec §12): mọi `*Logic.ts` (gồm `countingLogic.ts`), `progression.ts`/`applyCompletion.ts`/`registry.ts`/`scaffold.ts`/`masterySession.ts`, lớp dữ liệu Dexie (`src/data/*`), router màn, khu phụ huynh, hệ âm thanh/giọng, mastery/SR. Guard `roundResolved`/`finished`/`answeredThisRound`, hit-area, double-advance trong `CountingFunScene.ts` GIỮ NGUYÊN ngữ nghĩa.
- **Token cũ bất khả xâm phạm:** mở rộng `tokens.ts` chỉ THÊM key (`shadow`, `outline`, `paper`, `paint`); KHÔNG đổi/xoá `palette`/`fox`/`stroke`/`radius`/`proportion`/`ART_VIEWBOX` (asset hiện có import chúng — `svg.test.ts` khẳng định).
- **API Cáo ổn định:** `foxGuide`/`foxCheer`/`foxIdle` GIỮ chữ ký + export (`foxPoses` vẫn `['guide','cheer','idle']` — `svg.test.ts` khẳng định). Biểu cảm mới THÊM, không thay.
- **VISUAL-ONLY discipline** (đã ghi trong `sceneArt.ts`): `addBuddy`, dàn cảnh, grain, mọi hàm juice KHÔNG `setInteractive` lên vật chơi, KHÔNG chạm guard/hit-area/awardStars/complete.
- **Tiếp cận (GĐ5E) bất khả xâm phạm:** MỌI hàm juice có nhánh giảm nhẹ/no-op khi `prefersReducedMotion()` true (OR calmMode) — kiểm trong test. An toàn mù màu (pattern+nhãn) không đổi.
- **Stub Phaser:** nếu chạm API Phaser mới (particle emitter, graphics gradient…) → MỞ RỘNG `src/test/phaser-stub.ts` để mọi test xanh. Pilot `counting-fun` ưu tiên dùng API đã có trong stub (graphics, image, tweens) để khỏi phải mở rộng.
- **Mốc test:** 452 test hiện XANH; thêm test mới (paint + sceneMotion mở rộng). Cuối: `npm test`, `npm run build` (gồm `tsc -b`), `npm run lint`, `npx tsc -b` đều sạch.
- **KHÔNG commit/push/docker** — orchestrator lo deploy + commit/push sau. Để thay đổi uncommitted.
- **Commits:** plan này VIẾT lệnh commit ở mỗi task cho khớp khuôn mẫu repo, NHƯNG người chạy 6.1 BỎ QUA mọi bước commit (orchestrator commit gộp). Coi mỗi "Commit" là điểm checkpoint logic.

---

## File Structure

```
kiddy-hub/
  src/
    art/
      tokens.ts            # MODIFY (Task 1): + shadow / outline / paper / paint (giữ mọi key cũ)
      paint.ts             # CREATE (Task 2): factory <defs> id-namespaced (softShadow/paintedFill/inkStroke/paperGrain/withDefs)
      paint.test.ts        # CREATE (Task 2): test factory (spec §11)
      fox.ts               # MODIFY (Task 4): repaint storybook (paintedFill lông + softShadow); + foxThink/foxPoint/foxNod
      sceneArt.ts          # MODIFY (Task 5 buddy, Task 6 staging): + addBuddy + nâng addSceneBackground (ground/sun/grain)
      sceneMotion.ts       # MODIFY (Task 7): + squashStretchPop/sparkleBurst/tilePress/idleBreathe/bouncePop + nâng… (celebrate ở sceneArt)
      sceneMotion.test.ts  # MODIFY (Task 7): test calmMode/reduced-motion cho juice mới
      creaturesCounting.ts # CREATE (Task 8): kit sinh vật TỐI THIỂU cho counting-fun (duck/rabbit/frog/bee/fish/butterfly)
      creaturesCounting.test.ts # CREATE (Task 8): test creature(id) ra <svg> hợp lệ + fallback
    fonts/
      baloo2.css           # CREATE (Task 3): @font-face cục bộ + fallback bo tròn (Comic Sans/system rounded)
      Baloo2-subset.woff2  # CREATE (Task 3) nếu fetch được; nếu KHÔNG → scaffold @font-face + TODO + fallback
    games/counting-fun/
      CountingFunScene.ts  # MODIFY (Task 9): emoji → creature SVG + staging + buddy + juice (LOGIC KHÔNG ĐỔI)
    test/phaser-stub.ts    # MODIFY (chỉ khi cần API mới) — pilot tránh chạm
  scripts/
    build-style-sample.mjs # MODIFY (Task 10): thêm hàng "Storybook 6.1" (Cáo repaint + creature + nền) để eyeball
  src/main.tsx hoặc App.tsx # MODIFY (Task 3): import 1 dòng `./fonts/baloo2.css` (bundle font vào app)
  ROADMAP.md               # MODIFY (Task 11): mục "Giai đoạn 6 / 6.1"
```

**Thứ tự & phụ thuộc:** Task 1 (token) → Task 2 (`paint.ts`, cần token) → Task 3 (font, độc lập) → Task 4 (Cáo repaint, cần paint) → Task 5 (`addBuddy`, cần Cáo) → Task 6 (staging, cần paint) → Task 7 (juice, độc lập sau Task 1) → Task 8 (kit sinh vật, cần paint) → Task 9 (pilot, cần 5/6/7/8) → Task 10 (style board) → Task 11 (handoff). Task 3 và Task 7 có thể chen song song sớm.

---

### Task 1: Token mở rộng — `shadow` / `outline` / `paper` / `paint`

**Files:**
- Modify: `src/art/tokens.ts` (THÊM 4 export, giữ mọi export cũ)
- Test: `src/art/paint.test.ts` (Task 2 sẽ khẳng định token đủ key — chính xác là cùng file; ở Task 1 chỉ cần token tồn tại; test `svg.test.ts` cũ vẫn phải xanh không đổi)

**Interfaces:**
- Produces: `export const shadow = { color: string; dx: number; dy: number; blur: number; opacity: number }`; `export const outline = { ink: string; width: number; widthThin: number }`; `export const paper = { baseFrequency: number; opacity: number }`; `export const paint = { lighten: number; darken: number }`. Tất cả `as const`.

- [ ] **Step 1: Thêm 4 token vào `tokens.ts`** (cuối file, trước các `export type`). Dùng giá trị spec §4.1 (bóng mềm ấm nâu, mực `#6b4a2a` mảnh, vân giấy ~5%, gradient sơn nhẹ):

```ts
/**
 * Storybook (GĐ6) surface tokens — soft warm shadow, brown "ink" outline, faint
 * paper grain, and the paint gradient coefficients. ADDITIVE: every key above
 * (palette/fox/stroke/radius/proportion) is untouched so existing assets that
 * import them are unaffected. These drive `src/art/paint.ts`.
 */

/** Soft warm drop-shadow under painted shapes (feDropShadow). offset low, blur soft. */
export const shadow = {
  color: '#5b4636', // warm dark brown (matches palette.ink), never pure black
  dx: 0,
  dy: 1.6, // low offset — light from above
  blur: 2.4,
  opacity: 0.25, // spec §4.1: ~0.22–0.28
} as const;

/** Storybook "ink" outline — soft brown, THIN. Kept separate from fox.ink /
 *  palette.ink so the storybook line weight can be tuned independently. */
export const outline = {
  ink: '#6b4a2a', // soft brown "mực" (spec §4.1)
  width: 2.2,
  widthThin: 1.4,
} as const;

/** Faint paper grain for ONE scene-level overlay (feTurbulence + desaturate). */
export const paper = {
  baseFrequency: 0.9, // fine grain
  opacity: 0.05, // ~5% (spec §4.2)
} as const;

/** Painted-fill gradient coefficients: peak lighten at top, depth darken at foot. */
export const paint = {
  lighten: 0.22, // how much lighter the top of a painted shape is
  darken: 0.16, // how much darker the foot is
} as const;
```

- [ ] **Step 2: Thêm `export type` cho tiện** (cuối file, cạnh `Palette`/`FoxColors`):

```ts
export type Shadow = typeof shadow;
export type Outline = typeof outline;
export type Paper = typeof paper;
export type Paint = typeof paint;
```

- [ ] **Step 3: Chạy test cũ — phải xanh không đổi**

Run: `npx vitest run src/art/svg.test.ts`
Expected: PASS (token cũ giữ nguyên; chỉ thêm key mới — `toHaveProperty` cũ vẫn đúng).

- [ ] **Step 4: tsc sạch**

Run: `npx tsc -b`
Expected: không lỗi.

- [ ] **Step 5: Commit** *(người chạy 6.1: BỎ QUA — orchestrator commit gộp)*

```bash
git add src/art/tokens.ts
git commit -m "feat(art): add storybook surface tokens (shadow/outline/paper/paint) (GĐ6.1)"
```

---

### Task 2: `paint.ts` — factory `<defs>` tái dùng (TDD)

**Files:**
- Create: `src/art/paint.ts`
- Create: `src/art/paint.test.ts`

**Interfaces:**
- Consumes: `shadow`, `outline`, `paper`, `paint`, `palette` từ `./tokens`.
- Produces:
  - `export function softShadow(id: string): string` → `<filter id="${id}">…feDropShadow…</filter>`.
  - `export function paintedFill(id: string, hue: string): string` → `<linearGradient id="${id}">` 3 stop: lighten(hue) → hue → darken(hue), dọc (x1=0 y1=0 x2=0 y2=1).
  - `export function inkStroke(): string` → chuỗi thuộc tính `stroke="…" stroke-width="…" stroke-linecap="round" stroke-linejoin="round"` (KHÔNG bọc thẻ — để nhúng vào `<path …>`).
  - `export function paperGrain(id: string): string` → `<filter id="${id}">feTurbulence + feColorMatrix desaturate…</filter>`.
  - `export function withDefs(defs: string, body: string): string` → `<defs>${defs}</defs>${body}`.
  - (helper nội bộ) `lighten(hex, amt)` / `darken(hex, amt)` — clamp 0..255, trả `#rrggbb`.

- [ ] **Step 1: Viết test thất bại** `src/art/paint.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { softShadow, paintedFill, inkStroke, paperGrain, withDefs } from './paint';
import { shadow, outline, paper, paint } from './tokens';

/**
 * GĐ6.1 — pure paint factory. Like every src/art/* string factory, the DRAWING
 * is manual-tested in the browser; here we only lock the pure contracts:
 *   - each factory returns valid, well-formed SVG <defs> fragments;
 *   - ids are NAMESPACED (the caller's id appears, so two assets on one page
 *     don't collide);
 *   - the storybook tokens are present with the expected keys.
 */
describe('storybook tokens', () => {
  it('exposes shadow/outline/paper/paint with the expected keys', () => {
    for (const k of ['color', 'dx', 'dy', 'blur', 'opacity']) expect(shadow).toHaveProperty(k);
    for (const k of ['ink', 'width', 'widthThin']) expect(outline).toHaveProperty(k);
    for (const k of ['baseFrequency', 'opacity']) expect(paper).toHaveProperty(k);
    for (const k of ['lighten', 'darken']) expect(paint).toHaveProperty(k);
  });
});

describe('softShadow', () => {
  it('returns a <filter> carrying the namespaced id and a feDropShadow', () => {
    const f = softShadow('fox-shadow');
    expect(f).toContain('<filter id="fox-shadow"');
    expect(f).toContain('feDropShadow');
    expect(f).toContain('</filter>');
  });
  it('namespaces the id so two filters never collide', () => {
    expect(softShadow('a')).toContain('id="a"');
    expect(softShadow('b')).toContain('id="b"');
    expect(softShadow('a')).not.toContain('id="b"');
  });
});

describe('paintedFill', () => {
  it('returns a vertical linearGradient with three stops, carrying the id', () => {
    const g = paintedFill('duck-fur', '#ff8c42');
    expect(g).toContain('<linearGradient id="duck-fur"');
    expect(g).toContain('</linearGradient>');
    expect((g.match(/<stop/g) ?? []).length).toBe(3);
    // The middle stop is the exact hue passed in.
    expect(g).toContain('#ff8c42');
    // Vertical (top→foot) gradient.
    expect(g).toContain('x1="0"');
    expect(g).toContain('y2="1"');
  });
  it('lightens the top stop and darkens the foot stop (depth)', () => {
    const g = paintedFill('x', '#808080');
    // top stop is lighter than #808080, foot is darker — both differ from mid.
    const stops = g.match(/stop-color="(#[0-9a-fA-F]{6})"/g) ?? [];
    expect(stops.length).toBe(3);
    expect(stops[0]).not.toBe('stop-color="#808080"');
    expect(stops[2]).not.toBe('stop-color="#808080"');
  });
});

describe('inkStroke', () => {
  it('returns stroke attributes using the storybook ink + round caps', () => {
    const s = inkStroke();
    expect(s).toContain(`stroke="${outline.ink}"`);
    expect(s).toContain('stroke-linecap="round"');
    expect(s).toContain('stroke-linejoin="round"');
  });
});

describe('paperGrain', () => {
  it('returns a <filter> with feTurbulence carrying the namespaced id', () => {
    const f = paperGrain('scene-grain');
    expect(f).toContain('<filter id="scene-grain"');
    expect(f).toContain('feTurbulence');
    expect(f).toContain('</filter>');
  });
});

describe('withDefs', () => {
  it('wraps the defs in a <defs> block before the body', () => {
    const out = withDefs('<filter/>', '<rect/>');
    expect(out).toBe('<defs><filter/></defs><rect/>');
  });
});
```

- [ ] **Step 2: Chạy → FAIL**

Run: `npx vitest run src/art/paint.test.ts`
Expected: FAIL ("Cannot find module './paint'").

- [ ] **Step 3: Viết `src/art/paint.ts`**

```ts
/**
 * KiddyHub — Storybook paint factory (Giai đoạn 6 · Phần 6.1).
 *
 * Pure functions returning reusable SVG <defs> fragments for the "Truyện tranh
 * giấy · Tươi" look: a soft warm drop-shadow, a painted (lighten→hue→darken)
 * gradient fill, a brown "ink" stroke, and a faint paper-grain filter. Every id
 * is NAMESPACED by the caller so multiple assets can share one document/texture
 * without their filter/gradient ids colliding.
 *
 * Phaser note (spec §4.2): feDropShadow / feTurbulence bake into the base64
 * texture fine. paintedFill + softShadow are cheap PER-ASSET; paperGrain is used
 * for ONE scene-level overlay, never per-sprite.
 *
 * Every colour/dimension comes from `tokens.ts` — nothing here hard-codes a hue.
 */
import { shadow, outline, paper } from './tokens';
import { paint } from './tokens';

/** Clamp to a 2-hex byte. */
function byte(n: number): string {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, '0');
}

/** Mix a `#rrggbb` toward white by `amt` (0..1). */
export function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `#${byte(r + (255 - r) * amt)}${byte(g + (255 - g) * amt)}${byte(b + (255 - b) * amt)}`;
}

/** Mix a `#rrggbb` toward black by `amt` (0..1). */
export function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `#${byte(r * (1 - amt))}${byte(g * (1 - amt))}${byte(b * (1 - amt))}`;
}

/**
 * A soft warm drop-shadow filter. Reference it with `filter="url(#id)"` on the
 * shape you want to lift off the page. Padded region so the blur isn't clipped.
 */
export function softShadow(id: string): string {
  return (
    `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%">` +
    `<feDropShadow dx="${shadow.dx}" dy="${shadow.dy}" stdDeviation="${shadow.blur}" ` +
    `flood-color="${shadow.color}" flood-opacity="${shadow.opacity}"/>` +
    `</filter>`
  );
}

/**
 * A vertical painted-fill gradient (lighter at top → hue → darker at foot) giving
 * each colour block hand-painted depth. Reference with `fill="url(#id)"`.
 */
export function paintedFill(id: string, hue: string): string {
  const top = lighten(hue, paint.lighten);
  const foot = darken(hue, paint.darken);
  return (
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${top}"/>` +
    `<stop offset="55%" stop-color="${hue}"/>` +
    `<stop offset="100%" stop-color="${foot}"/>` +
    `</linearGradient>`
  );
}

/**
 * Standard storybook stroke attributes (brown ink, thin, round caps/joins).
 * Returns an ATTRIBUTE string to interpolate into a `<path …>`/`<circle …>`.
 */
export function inkStroke(): string {
  return `stroke="${outline.ink}" stroke-width="${outline.width}" stroke-linecap="round" stroke-linejoin="round"`;
}

/**
 * A faint paper-grain filter for ONE scene-level overlay (not per-sprite). Apply
 * to a full-bleed rect with low opacity to dust the whole scene with texture.
 */
export function paperGrain(id: string): string {
  return (
    `<filter id="${id}" x="0%" y="0%" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${paper.baseFrequency}" numOctaves="2" stitchTiles="stitch" result="n"/>` +
    `<feColorMatrix in="n" type="saturate" values="0"/>` +
    `</filter>`
  );
}

/** Wrap reusable defs in a `<defs>` block before the body (compose helper). */
export function withDefs(defs: string, body: string): string {
  return `<defs>${defs}</defs>${body}`;
}
```

- [ ] **Step 4: Chạy → PASS**

Run: `npx vitest run src/art/paint.test.ts`
Expected: PASS.

- [ ] **Step 5: tsc + lint sạch**

Run: `npx tsc -b && npx eslint src/art/paint.ts src/art/paint.test.ts`
Expected: không lỗi.

- [ ] **Step 6: Commit** *(BỎ QUA khi chạy 6.1)*

```bash
git add src/art/paint.ts src/art/paint.test.ts
git commit -m "feat(art): paint.ts storybook defs factory + tests (GĐ6.1)"
```

---

### Task 3: Bundle font **Baloo 2** cục bộ (@font-face) + fallback

**Files:**
- Create: `src/fonts/baloo2.css`
- Create: `src/fonts/Baloo2-subset.woff2` *(nếu fetch được; nếu KHÔNG → bỏ file, để @font-face trỏ tới nó + TODO + fallback bo tròn — KHÔNG vỡ build)*
- Modify: `src/main.tsx` (thêm `import './fonts/baloo2.css';`)
- Modify: `src/App.css:1-2` (đổi `:root font-family` để Baloo 2 đứng đầu chuỗi, giữ fallback)

**Interfaces:**
- Produces: CSS `@font-face` family `'Baloo 2'`; toàn app/SVG đã tham chiếu `'Baloo 2','Comic Sans MS',system-ui,sans-serif` (xem `gameIcons.ts`) nay có font thật/hoặc fallback.

> **Quan trọng (local-only, spec §9/§12):** TUYỆT ĐỐI không `@import url('fonts.googleapis…')` và không `<link>` CDN. Chỉ `@font-face` trỏ file `.woff2` cục bộ (Vite copy vào `dist`).

- [ ] **Step 1: Cố gắng lấy font subset cục bộ.** Thử tải Baloo 2 (OFL, miễn phí) về `src/fonts/Baloo2-subset.woff2`, subset Việt+Latin. Lệnh thử (mạng có thể bị chặn trong môi trường này):

```bash
# Thử tải woff2 Baloo 2 regular (OFL). Nếu mạng bị chặn → bỏ qua, sang Step 2b.
mkdir -p src/fonts
curl -fsSL -o /tmp/baloo2.woff2 \
  "https://github.com/google/fonts/raw/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf" 2>/dev/null && echo "got ttf (cần convert)" || echo "NETWORK BLOCKED — dùng Step 2b scaffold"
```

  - Nếu lấy được `.ttf` → convert + subset bằng `fonttools`/`woff2` nếu có (`pip install fonttools brotli`; `fonttools subset … --flavor=woff2 --unicodes=U+0000-024F,U+1E00-1EFF,U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+1EA0-1EF9`). Lưu `src/fonts/Baloo2-subset.woff2`. Sang Step 2a.
  - Nếu KHÔNG (mạng chặn / không có tool) → **Step 2b** (scaffold). **Ghi rõ trong báo cáo cuối: "Baloo 2 = scaffolded-TODO".**

- [ ] **Step 2a (font CÓ): viết `src/fonts/baloo2.css` trỏ file thật**

```css
/* KiddyHub — Baloo 2 (GĐ6.1), bundled LOCALLY (OFL). No Google CDN at runtime;
   Vite fingerprints + copies the woff2 into dist for offline-first. The subset
   covers Latin + Vietnamese (precomposed + combining) so titles render with
   full dấu. Fallback is a rounded system face so layout never breaks. */
@font-face {
  font-family: 'Baloo 2';
  font-style: normal;
  font-weight: 400 800; /* variable-ish range; static subset still maps here */
  font-display: swap;
  src: url('./Baloo2-subset.woff2') format('woff2');
}
```

- [ ] **Step 2b (font KHÔNG fetch được): scaffold `src/fonts/baloo2.css`** — @font-face vẫn khai báo (để khi font drop vào sau là chạy), nhưng KHÔNG có file → **comment `src` lại** để build/CSS không cảnh báo asset thiếu, và dựa hoàn toàn vào fallback bo tròn:

```css
/* KiddyHub — Baloo 2 (GĐ6.1). LOCAL-ONLY: no Google CDN at runtime.
   TODO(human/font): drop a subset `Baloo2-subset.woff2` (Latin+Vietnamese, OFL)
   into this folder and UNCOMMENT the `src` line below. The network fetch was
   unavailable in the build environment, so we ship the @font-face DECLARATION
   with a graceful rounded-system fallback (Comic Sans MS / system-ui) — titles
   stay readable and layout never breaks until the woff2 is added. */
@font-face {
  font-family: 'Baloo 2';
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
  /* src: url('./Baloo2-subset.woff2') format('woff2'); */ /* UNCOMMENT when font present */
}
```

- [ ] **Step 3: Import font CSS một lần** trong `src/main.tsx` (cạnh `import './…'` nếu có, hoặc thêm trên cùng):

```ts
import './fonts/baloo2.css';
```

  (Nếu `main.tsx` chưa import css nào, vẫn an toàn — Vite gom css.)

- [ ] **Step 4: Cập nhật `src/App.css` để Baloo 2 đứng đầu chuỗi font (giữ fallback bo tròn)**

```css
:root {
  font-family: 'Baloo 2', 'Comic Sans MS', system-ui, 'Segoe UI', sans-serif;
  -webkit-text-size-adjust: 100%;
}
```

- [ ] **Step 5: Thêm `woff2` vào PWA precache nếu chưa** — kiểm `vite.config.ts` `workbox.globPatterns`: đã có `woff2` (dòng `['**/*.{js,css,html,svg,png,webmanifest,ico,woff2,mp3}']`). KHÔNG cần sửa. Xác nhận bằng mắt.

- [ ] **Step 6: build + test xanh**

Run: `npm run build && npx vitest run`
Expected: build OK (font hoặc bundle hoặc fallback); 452 test cũ + test mới xanh. (CSS-only thay đổi không có test riêng — chỉ đảm bảo không vỡ.)

- [ ] **Step 7: Commit** *(BỎ QUA khi chạy 6.1)*

```bash
git add src/fonts/ src/main.tsx src/App.css
git commit -m "feat(art): bundle Baloo 2 locally via @font-face + rounded fallback (GĐ6.1)"
```

---

### Task 4: Repaint Cáo storybook + biểu cảm mới (`foxThink`/`foxPoint`/`foxNod`)

**Files:**
- Modify: `src/art/fox.ts` (lông `paintedFill` + `softShadow`; THÊM 3 pose; GIỮ `foxGuide`/`foxCheer`/`foxIdle` chữ ký + `foxPoses` 3 key cũ)
- Test: dựa vào `src/art/svg.test.ts` (đã khẳng định 3 pose ra `<svg>` + `foxPoses` keys = `['guide','cheer','idle']`) — **PHẢI giữ xanh không đổi.**

**Interfaces:**
- Consumes: `paintedFill`, `softShadow`, `withDefs`, `inkStroke` từ `./paint`; `fox` từ `./tokens`; `svgDoc` từ `./svg`.
- Produces: GIỮ `foxGuide(title?)`, `foxCheer(title?)`, `foxIdle(title?)`, `foxPoses` (3 key cũ). THÊM `export function foxThink(title?)`, `foxPoint(dir?: -1|1, title?)`, `foxNod(title?)` — tất cả trả `<svg>` string.

> **Ràng buộc cứng:** `foxPoses` PHẢI vẫn là `{ guide, cheer, idle }` đúng thứ tự (svg.test.ts: `expect(Object.keys(foxPoses)).toEqual(['guide','cheer','idle'])`). Pose mới export RIÊNG, KHÔNG thêm vào `foxPoses`. Một map mới `foxExpressions` (tuỳ chọn) gom pose mới nếu style board cần — nhưng KHÔNG đổi `foxPoses`.

- [ ] **Step 1: Thêm import paint vào `fox.ts`**

```ts
import { paintedFill, softShadow, withDefs } from './paint';
```

- [ ] **Step 2: Repaint lông + bóng — bọc body/head/tail bằng defs.** Cách AN TOÀN nhất giữ test xanh: thêm một wrapper nội bộ `painted(inner, title)` thay cho `svgDoc(inner, title)` trong 3 pose, chèn `<defs>` (1 gradient lông cam + 1 softShadow) rồi cho `body()`/`head()`/`tail()` dùng `fill="url(#fur)"` + nhóm ngoài cùng `filter="url(#fox-shadow)"`. Sửa các path thân/đầu/tai/đuôi từ `fill="${fox.body}"` → `fill="url(#fur)"`; giữ cream/ink như cũ.

```ts
// Namespaced ids per fox document (one doc per texture → ids never collide).
const FUR_ID = 'fox-fur';
const SHADOW_ID = 'fox-shadow';

/** Wrap a pose body in storybook defs (painted fur gradient + soft shadow). */
function painted(inner: string, title?: string): string {
  const defs = paintedFill(FUR_ID, fox.body) + softShadow(SHADOW_ID);
  // The whole fox sits in a group carrying the soft shadow once (cheap, 1 filter).
  return svgDoc(withDefs(defs, `<g filter="url(#${SHADOW_ID})">${inner}</g>`), title);
}
```

  Rồi trong `body()`/`head()`/`tail()`/`arm()`/`ear`, đổi **chỉ** các `fill="${fox.body}"` thành `fill="url(#${FUR_ID})"` (lông chính). Giữ `fox.bodyDark`/`fox.cream`/`fox.ink` y nguyên (chúng tạo tương phản, không cần gradient).

- [ ] **Step 3: Đổi 3 pose dùng `painted(...)` thay `svgDoc(...)`**

```ts
export function foxGuide(title = 'Cáo dẫn đường'): string {
  return painted(tail(false) + body() + arm(-1, false) + arm(1, true, true) + head('side'), title);
}
export function foxCheer(title = 'Cáo cổ vũ'): string {
  return painted(
    tail(true) + body() + arm(-1, true) + arm(1, true) + head('center') +
      `<g fill="${fox.cream}" stroke="${fox.ink}" stroke-width="1">` +
      sparkle(20, 22) + sparkle(80, 24) + sparkle(50, 6) + `</g>`,
    title,
  );
}
export function foxIdle(title = 'Cáo'): string {
  return painted(tail(false) + body() + arm(-1, false) + arm(1, false) + head('center'), title);
}
```

- [ ] **Step 4: Thêm 3 biểu cảm mới** (spec §6) — tái dùng `body()`/`tail()`/`arm()`, chỉ đổi đầu/cử chỉ:

```ts
/** THINK — head tilted, a little "?" — for scaffolding/idle curiosity. */
export function foxThink(title = 'Cáo suy nghĩ'): string {
  return painted(
    tail(false) + body() + arm(-1, false) + arm(1, false) +
      `<g transform="rotate(-8 50 40)">${head('side')}</g>` +
      // a soft "?" bubble near the right ear
      `<circle cx="80" cy="20" r="11" fill="${fox.cream}" stroke="${fox.ink}" stroke-width="${SW_THIN}"/>` +
      `<text x="80" y="25" text-anchor="middle" font-size="14" font-weight="800" fill="${fox.ink}" font-family="'Baloo 2','Comic Sans MS',system-ui,sans-serif">?</text>`,
    title,
  );
}

/** POINT — one paw pointing toward an answer. `dir` = -1 left, +1 right. */
export function foxPoint(dir: -1 | 1 = 1, title = 'Cáo chỉ'): string {
  return painted(
    tail(false) + body() + arm(-dir as -1 | 1, false) + arm(dir, true) + head('side'),
    title,
  );
}

/** NOD — head dipped in a friendly "yes". Static SVG; the nod motion is a tween. */
export function foxNod(title = 'Cáo gật'): string {
  return painted(
    tail(false) + body() + arm(-1, false) + arm(1, false) +
      `<g transform="translate(0 3)">${head('center')}</g>`,
    title,
  );
}
```

  (Lưu ý: `head('side')` nhận `look`; `arm(dir, raised)` đã có. `SW_THIN` đã khai báo đầu file.)

- [ ] **Step 5: (tuỳ chọn) gom map biểu cảm mới — KHÔNG đổi `foxPoses`**

```ts
/** New storybook expressions (GĐ6.1) — kept SEPARATE from foxPoses (stable API). */
export const foxExpressions = {
  think: foxThink,
  point: () => foxPoint(1),
  nod: foxNod,
} as const;
```

- [ ] **Step 6: Chạy test Cáo cũ — phải xanh KHÔNG đổi**

Run: `npx vitest run src/art/svg.test.ts`
Expected: PASS — 3 pose vẫn `startsWith('<svg')` + chứa `</svg>`; `foxPoses` keys vẫn `['guide','cheer','idle']`.

- [ ] **Step 7: tsc + lint**

Run: `npx tsc -b && npx eslint src/art/fox.ts`
Expected: sạch.

- [ ] **Step 8: Commit** *(BỎ QUA khi chạy 6.1)*

```bash
git add src/art/fox.ts
git commit -m "feat(art): repaint Cáo on storybook surface + think/point/nod expressions (GĐ6.1)"
```

---

### Task 5: Cáo đồng hành trong cảnh — `addBuddy(scene)` (VISUAL-ONLY)

**Files:**
- Modify: `src/art/sceneArt.ts` (THÊM `addBuddy` + một depth `buddy`; import `foxIdle`/`foxCheer`)

**Interfaces:**
- Consumes: `foxIdle` (và `foxCheer` cho phản ứng đúng) từ `./fox`; `prefersReducedMotion` đã import; `addArt` nội bộ; `idleBreathe` từ `./sceneMotion` (Task 7 — nếu Task 7 chưa xong, dùng tween thở nội tuyến để khỏi phụ thuộc thứ tự — xem Step 2).
- Produces: `export interface SceneBuddy { img: Phaser.GameObjects.Image; cheer(): void; encourage(): void; }`; `export function addBuddy(scene: Phaser.Scene): SceneBuddy`.

> **VISUAL-ONLY:** `addBuddy` KHÔNG `setInteractive`, KHÔNG chạm guard/hit-area/awardStars. Cáo nhỏ ở **góc dưới-trái**, depth cao hơn tile nhưng dưới chrome/celebrate. `cheer()`/`encourage()` chỉ tween (an toàn interruption: yoyo/về scale gốc).

- [ ] **Step 1: Thêm depth `buddy` vào `DEPTH`** (giữ thang depth cũ — chèn giữa tile và chrome):

```ts
const DEPTH = {
  background: -1000,
  ground: -995, // NEW (Task 6) — between sky and clouds
  grain: -980, // NEW (Task 6) — scene-level paper grain, above ground/clouds, below gameplay
  cloud: -990,
  buddy: 50, // NEW — above tiles, below chrome (100) and celebrate (1000)
  tile: -1,
  chrome: 100,
  celebrate: 1000,
} as const;
```

  (Thứ tự khai báo không ảnh hưởng giá trị; cứ thêm `ground`/`grain`/`buddy`. Task 6 dùng `ground`/`grain`.)

- [ ] **Step 2: Thêm `addBuddy`** (dùng tween thở nội tuyến để không phụ thuộc Task 7; nếu Task 7 đã có `idleBreathe`, có thể gọi nó thay — nhưng nội tuyến an toàn):

```ts
import { foxIdle, foxCheer } from './fox';
// (foxCheer đã import sẵn ở đầu file cho celebrate — KHÔNG import trùng.)

/** A small in-scene Cáo companion that lives in the corner and reacts. */
export interface SceneBuddy {
  img: Phaser.GameObjects.Image;
  /** Happy bounce on a correct answer. */
  cheer(): void;
  /** Gentle encourage wiggle on a wrong answer. */
  encourage(): void;
}

/**
 * Place a small Cáo companion in the lower-left corner so the mascot is present
 * DURING play (spec §6, fixing "Cáo vắng mặt khi chơi"). VISUAL-ONLY: it never
 * becomes interactive, never touches a hit area or any round/finish guard. It
 * breathes while idle (a slow scale yoyo) and offers `cheer()` / `encourage()`
 * one-shot reactions the scene can fire next to its existing feedback. Under
 * reduced motion the buddy is placed statically with no looping tween.
 */
export function addBuddy(scene: Phaser.Scene): SceneBuddy {
  const { height } = scene.scale;
  const size = 110;
  const x = 72;
  const y = height - 72;
  const img = addArt(scene, 'art-fox-idle', foxIdle(), x, y, size);
  img.setDepth(DEPTH.buddy);

  const baseScale = img.scale;
  if (!prefersReducedMotion()) {
    // Slow "breathing" — a tiny scale yoyo that loops; safe end-state is baseScale.
    scene.tweens.add({
      targets: img,
      scaleX: baseScale * 1.05,
      scaleY: baseScale * 1.05,
      duration: 1400,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  return {
    img,
    cheer(): void {
      if (prefersReducedMotion()) return;
      scene.tweens.add({
        targets: img,
        y: y - 16,
        ease: 'Back.easeOut',
        duration: 200,
        yoyo: true,
      });
    },
    encourage(): void {
      if (prefersReducedMotion()) return;
      scene.tweens.add({ targets: img, angle: 6, duration: 90, yoyo: true, repeat: 2 });
    },
  };
}
```

  (`addArt` đã định nghĩa trong file; `prefersReducedMotion` đã import. `foxCheer` đã import ở đầu file — chỉ THÊM `foxIdle` vào dòng import `./fox`: đổi `import { foxCheer } from './fox';` → `import { foxCheer, foxIdle } from './fox';`.)

- [ ] **Step 3: tsc + lint**

Run: `npx tsc -b && npx eslint src/art/sceneArt.ts`
Expected: sạch.

- [ ] **Step 4: Test khói nhanh (tuỳ chọn, dùng stub):** `addBuddy(stubScene)` không ném; trả object có `cheer`/`encourage`. Có thể gộp vào test pilot Task 9 thay vì file riêng. Bỏ qua nếu muốn — `sceneMotion.test.ts`/celebrate đã chứng minh khuôn fake-scene.

- [ ] **Step 5: Commit** *(BỎ QUA khi chạy 6.1)*

```bash
git add src/art/sceneArt.ts
git commit -m "feat(art): in-scene Cáo buddy addBuddy (visual-only, reacts) (GĐ6.1)"
```

---

### Task 6: Dàn cảnh storybook — nâng `addSceneBackground` (ground + sun + grain)

**Files:**
- Modify: `src/art/sceneArt.ts` (`addSceneBackground`: thêm mặt đất + mặt trời mềm + 1 lớp paper-grain ở tầng nền; giữ depth-sort cũ, chèn `ground`/`grain`)

**Interfaces:**
- Consumes: `paperGrain` + `withDefs` từ `./paint`; `palette` đã import; `svgToDataUri`/`loadSvgTexture` qua `addArt`.
- Produces: `addSceneBackground` giữ chữ ký `(scene, categoryId)`; thêm hình nền — KHÔNG đổi API.

> **Spec §4.2/§7:** grain là **1 lớp scene-level** (không per-sprite). Vật thể "đứng trên đất". Giữ depth: sky(background) < ground < cloud < grain < gameplay.

- [ ] **Step 1: Thêm import paint** (đầu file):

```ts
import { paperGrain, withDefs } from './paint';
```

- [ ] **Step 2: Trong `addSceneBackground`, sau khi vẽ sky-gradient + trước/song song clouds, thêm mặt trời mềm + mặt đất + grain.** Vẽ ground bằng `graphics` (rẻ, 1 đối tượng) ở `DEPTH.ground`; mặt trời bằng `graphics` mềm ở `DEPTH.cloud-? ` (đặt cùng tầng cloud nhưng vẽ trước); grain bằng 1 `Image` SVG phủ toàn cảnh ở `DEPTH.grain`:

```ts
  // Soft sun (or moon) — a pale glowing disc top-left of the sky.
  const sun = scene.add.graphics();
  sun.fillStyle(tint(base, 0.93), 0.9);
  sun.fillCircle(width * 0.16, height * 0.18, Math.min(width, height) * 0.09);
  sun.setDepth(DEPTH.background + 1); // just above the sky gradient, behind clouds

  // Ground plane — a rounded horizon band of the category hue, a touch darker so
  // objects read as "standing on" it. One graphics object (cheap).
  const groundY = height * 0.78;
  const ground = scene.add.graphics();
  ground.fillStyle(tint(base, 0.34), 1);
  ground.fillRect(0, groundY, width, height - groundY);
  // a soft grass edge highlight
  ground.fillStyle(tint(base, 0.5), 1);
  ground.fillRect(0, groundY, width, 8);
  ground.setDepth(DEPTH.ground);

  // ONE scene-level paper-grain overlay (spec §4.2) — never per-sprite. A faint
  // desaturated turbulence baked into a full-bleed texture, low opacity.
  const grainSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" preserveAspectRatio="none">` +
    withDefs(paperGrain('scene-grain'), `<rect width="100" height="100" filter="url(#scene-grain)" opacity="${paper.opacity}"/>`) +
    `</svg>`;
  const grain = addArt(scene, 'art-scene-grain', grainSvg, width / 2, height / 2, Math.max(width, height));
  grain.setDisplaySize(width, height);
  grain.setDepth(DEPTH.grain);
```

  (`paper.opacity` cần import: thêm `paper` vào dòng `import { palette, type IslandKey } from './tokens';` → `import { palette, paper, type IslandKey } from './tokens';`.)

- [ ] **Step 3: Đảm bảo grain KHÔNG chặn tap.** `Image` Phaser mặc định không interactive → không chặn pointer. Không gọi `setInteractive`. (Ghi chú VISUAL-ONLY trong comment hàm.)

- [ ] **Step 4: tsc + lint + test cũ**

Run: `npx tsc -b && npx eslint src/art/sceneArt.ts && npx vitest run src/art/celebrate.test.ts`
Expected: sạch + celebrate test vẫn xanh (không đụng `celebrate`).

- [ ] **Step 5: Commit** *(BỎ QUA khi chạy 6.1)*

```bash
git add src/art/sceneArt.ts
git commit -m "feat(art): storybook staging (ground + sun + scene-level paper grain) (GĐ6.1)"
```

---

### Task 7: Bộ juice mở rộng + nâng `celebrate` — calmMode-safe (TDD)

**Files:**
- Modify: `src/art/sceneMotion.ts` (THÊM `squashStretchPop`, `sparkleBurst`, `tilePress`, `idleBreathe`, `bouncePop`; giữ `animateIn`/`popCorrect`/`flyStars`)
- Modify: `src/art/sceneArt.ts` (nâng `celebrate` — confetti mượt hơn; nhánh calmMode GIỮ như cũ — celebrate.test.ts PHẢI vẫn xanh)
- Modify: `src/art/sceneMotion.test.ts` (THÊM test calmMode/reduced cho juice mới)

**Interfaces:**
- Consumes: `prefersReducedMotion`, `durations`/`easings`, `addArt`, `starArt`.
- Produces (mỗi hàm có nhánh reduced no-op/giảm nhẹ):
  - `export function squashStretchPop(scene: Phaser.Scene, target?: MotionObject): void` — pop nén/giãn (scaleX↑/scaleY↓ → đảo → về gốc) + về base (an toàn). Reduced → no-op.
  - `export function sparkleBurst(scene: Phaser.Scene, x: number, y: number): void` — cụm sao lấp lánh tại (x,y), tween thuần, tự destroy. Reduced → no-op (không tạo image, không tween).
  - `export function tilePress(scene: Phaser.Scene, target?: MotionObject): void` — lún nhẹ khi bấm (scale*0.94 yoyo nhanh). Reduced → no-op.
  - `export function idleBreathe(scene: Phaser.Scene, target?: MotionObject): void` — thở lặp (scale yoyo repeat -1). Reduced → no-op.
  - `export function bouncePop(scene: Phaser.Scene, target?: MotionObject): void` — nảy vào khi xuất hiện (từ scale nhỏ → base, Back.easeOut), về base an toàn. Reduced → đặt ngay base, không tween.

> **Hợp đồng calmMode (spec §8, §11):** MỌI hàm gọi `prefersReducedMotion()` (đã OR calmMode) ở đầu. `sparkleBurst`/`squashStretchPop`/`tilePress`/`idleBreathe` reduced → `return` ngay (0 tween, 0 image). `bouncePop` reduced → snap base scale (không tween) để vật vẫn hiện đúng. Tween có `target` falsy → no-op. KHÔNG `setInteractive`.

- [ ] **Step 1: Viết test thất bại — THÊM vào `src/art/sceneMotion.test.ts`** (cuối file, dùng khuôn `makeScene`/`makeObj`/`setReducedMotion` đã có; THÊM import calmMode để test calm cũng chặn):

```ts
import { squashStretchPop, sparkleBurst, tilePress, idleBreathe, bouncePop } from './sceneMotion';
import { setCalmMode } from '../motion/calmMode';

// (thêm vào afterEach hiện có: setCalmMode(false);)

describe('squashStretchPop', () => {
  it('adds tweens on a target and never touches interactivity', () => {
    const { scene, tweens } = makeScene();
    const obj = makeObj();
    squashStretchPop(scene, asMotion(obj));
    expect(tweens.length).toBeGreaterThan(0);
    expect(obj.interactiveCalls).toBe(0);
  });
  it('is a no-op for a missing target', () => {
    const { scene, tweens } = makeScene();
    squashStretchPop(scene, null);
    expect(tweens).toHaveLength(0);
  });
  it('does nothing under reduced motion', () => {
    setReducedMotion(true);
    const { scene, tweens } = makeScene();
    squashStretchPop(scene, asMotion(makeObj()));
    expect(tweens).toHaveLength(0);
  });
  it('does nothing under calm mode (OS motion ON)', () => {
    setReducedMotion(false);
    setCalmMode(true);
    const { scene, tweens } = makeScene();
    squashStretchPop(scene, asMotion(makeObj()));
    expect(tweens).toHaveLength(0);
  });
});

describe('sparkleBurst', () => {
  it('spawns sparkle images + tweens at normal motion', () => {
    const { scene, tweens, images } = makeScene();
    sparkleBurst(scene, 100, 100);
    expect(images.length).toBeGreaterThan(0);
    expect(tweens.length).toBeGreaterThan(0);
  });
  it('does nothing under reduced motion (no images, no tweens)', () => {
    setReducedMotion(true);
    const { scene, tweens, images } = makeScene();
    sparkleBurst(scene, 100, 100);
    expect(tweens).toHaveLength(0);
    expect(images).toHaveLength(0);
  });
});

describe('tilePress', () => {
  it('adds a press tween normally and is no-op reduced / missing target', () => {
    const { scene, tweens } = makeScene();
    tilePress(scene, asMotion(makeObj()));
    expect(tweens.length).toBeGreaterThan(0);
    const r = makeScene();
    setReducedMotion(true);
    tilePress(r.scene, asMotion(makeObj()));
    expect(r.tweens).toHaveLength(0);
    setReducedMotion(false);
    const m = makeScene();
    tilePress(m.scene, null);
    expect(m.tweens).toHaveLength(0);
  });
});

describe('idleBreathe', () => {
  it('adds a looping tween normally and is no-op reduced / missing target', () => {
    const { scene, tweens } = makeScene();
    idleBreathe(scene, asMotion(makeObj()));
    expect(tweens.length).toBe(1);
    expect(tweens[0].repeat).toBe(-1);
    setReducedMotion(true);
    const r = makeScene();
    idleBreathe(r.scene, asMotion(makeObj()));
    expect(r.tweens).toHaveLength(0);
  });
});

describe('bouncePop', () => {
  it('adds an entrance tween normally', () => {
    const { scene, tweens } = makeScene();
    bouncePop(scene, asMotion(makeObj()));
    expect(tweens.length).toBe(1);
  });
  it('under reduced motion sets base scale with NO tween', () => {
    setReducedMotion(true);
    const { scene, tweens } = makeScene();
    const obj = makeObj(0, 0, 1, 0.5);
    bouncePop(scene, asMotion(obj));
    expect(tweens).toHaveLength(0);
    // object left visible at its base scale (not stranded tiny).
    expect(obj.scaleX).toBe(1);
    expect(obj.scaleY).toBe(0.5);
  });
});
```

- [ ] **Step 2: Chạy → FAIL**

Run: `npx vitest run src/art/sceneMotion.test.ts`
Expected: FAIL (các hàm chưa export).

- [ ] **Step 3: Thêm 5 hàm vào `src/art/sceneMotion.ts`** (cuối file, trước/ sau `flyStars`):

```ts
/**
 * Correct-answer POP with squash & stretch (a punchier `popCorrect`): the target
 * briefly stretches wide-and-flat, then tall-and-thin, then settles back to its
 * captured base scale (yoyo guarantees the end equals the start, so it can never
 * strand a wrong scale). No-op under reduced motion / missing target; never
 * touches interactivity.
 */
export function squashStretchPop(scene: Phaser.Scene, target?: MotionObject): void {
  if (!target) return;
  if (prefersReducedMotion()) return;
  const obj = asAnimatable(target);
  const sx = typeof obj.scaleX === 'number' && obj.scaleX > 0 ? obj.scaleX : 1;
  const sy = typeof obj.scaleY === 'number' && obj.scaleY > 0 ? obj.scaleY : 1;
  // squash (wide/flat) → stretch (narrow/tall) → settle, each yoyo back to base.
  scene.tweens.add({
    targets: obj,
    scaleX: sx * 1.22,
    scaleY: sy * 0.82,
    duration: durations.fast,
    ease: PHASER_EASE.pop,
    yoyo: true,
    onComplete: () => {
      scene.tweens.add({
        targets: obj,
        scaleX: sx * 0.9,
        scaleY: sy * 1.12,
        duration: durations.fast,
        ease: PHASER_EASE.pop,
        yoyo: true,
      });
    },
  });
}

/**
 * A small burst of sparkle stars at (x, y) — a per-interaction "lấp lánh" cue.
 * Pure tweens, self-destructing. No-op under reduced motion (no images, no
 * tweens). VISUAL-ONLY.
 */
export function sparkleBurst(scene: Phaser.Scene, x: number, y: number): void {
  if (prefersReducedMotion()) return;
  const N = 6;
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2;
    const dist = 38 + (i % 2) * 16;
    const star = addArt(scene, 'art-star', starArt(), x, y, 22);
    star.setDepth(FX_DEPTH);
    star.setAlpha(0);
    scene.tweens.add({
      targets: star,
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      alpha: { from: 1, to: 0 },
      scale: { from: 0.3, to: 1 },
      angle: 140,
      ease: 'Cubic.easeOut',
      duration: durations.slow + 120,
      delay: i * 18,
      onComplete: () => star.destroy(),
    });
  }
}

/**
 * A tactile "press" on a tile/button: a quick shrink-and-return (scale ≈0.94
 * yoyo). No-op under reduced motion / missing target. VISUAL-ONLY — fire it from
 * the scene's own pointerdown handler, never wires interactivity itself.
 */
export function tilePress(scene: Phaser.Scene, target?: MotionObject): void {
  if (!target) return;
  if (prefersReducedMotion()) return;
  const obj = asAnimatable(target);
  const sx = typeof obj.scaleX === 'number' && obj.scaleX > 0 ? obj.scaleX : 1;
  const sy = typeof obj.scaleY === 'number' && obj.scaleY > 0 ? obj.scaleY : 1;
  scene.tweens.add({
    targets: obj,
    scaleX: sx * 0.94,
    scaleY: sy * 0.94,
    duration: durations.fast,
    ease: PHASER_EASE.standard,
    yoyo: true,
  });
}

/**
 * A slow looping "breathing" for an idle object (the Cáo buddy, a waiting prop):
 * a gentle scale yoyo, repeat forever. The looping end equals the base scale, so
 * stopping it (round advance / scene restart) leaves the object at its base. No-op
 * under reduced motion / missing target.
 */
export function idleBreathe(scene: Phaser.Scene, target?: MotionObject): void {
  if (!target) return;
  if (prefersReducedMotion()) return;
  const obj = asAnimatable(target);
  const sx = typeof obj.scaleX === 'number' && obj.scaleX > 0 ? obj.scaleX : 1;
  const sy = typeof obj.scaleY === 'number' && obj.scaleY > 0 ? obj.scaleY : 1;
  scene.tweens.add({
    targets: obj,
    scaleX: sx * 1.05,
    scaleY: sy * 1.05,
    duration: 1400,
    ease: PHASER_EASE.standard,
    yoyo: true,
    repeat: -1,
  });
}

/**
 * A bouncy entrance for an object as it appears (sync with an SFX "pop"). The
 * object grows from a small scale to its captured base with a gentle overshoot.
 * Under reduced motion it is snapped to its base scale instantly (no tween) so it
 * still shows at the right size — never stranded tiny. Missing target → no-op.
 */
export function bouncePop(scene: Phaser.Scene, target?: MotionObject): void {
  if (!target) return;
  const obj = asAnimatable(target);
  const sx = typeof obj.scaleX === 'number' && obj.scaleX > 0 ? obj.scaleX : 1;
  const sy = typeof obj.scaleY === 'number' && obj.scaleY > 0 ? obj.scaleY : 1;
  if (prefersReducedMotion()) {
    // Ensure visible at base scale with no animation.
    obj.scaleX = sx;
    obj.scaleY = sy;
    return;
  }
  obj.scaleX = sx * 0.5;
  obj.scaleY = sy * 0.5;
  scene.tweens.add({
    targets: obj,
    scaleX: sx,
    scaleY: sy,
    ease: PHASER_EASE.pop,
    duration: durations.base,
  });
}
```

- [ ] **Step 4: Chạy test mới → PASS**

Run: `npx vitest run src/art/sceneMotion.test.ts`
Expected: PASS (cũ + mới).

- [ ] **Step 5: Nâng `celebrate` trong `sceneArt.ts` — KHÔNG đổi nhánh calmMode.** Trong nhánh **không** reduced, thêm vài confetti (rect nhỏ tween rơi) cạnh 8 sao hiện có. **QUAN TRỌNG:** `celebrate.test.ts` khẳng định normal = 9 image + 9 tween (1 fox + 8 star) và reduced/calm = 1 image + 1 tween. Thêm confetti sẽ làm normal-count đổi → **PHẢI cập nhật `celebrate.test.ts`** cho khớp số mới (đây là test do GĐ6 mở rộng — cho phép sửa, miễn vẫn khẳng định calm=1/1). Cập nhật test: thay `toHaveLength(9)` bằng số mới (vd 9 + CONFETTI) hoặc đổi assertion sang `toBeGreaterThanOrEqual(9)` cho normal; GIỮ nguyên 2 test calm/OS-reduced = 1 image + 1 tween.

```ts
// Bên trong celebrate(), SAU vòng 8 sao (chỉ ở nhánh KHÔNG reduced):
  const CONFETTI = 10;
  for (let i = 0; i < CONFETTI; i++) {
    const cxi = cx + (i - CONFETTI / 2) * 26;
    const piece = scene.add.rectangle(cxi, cy - 40, 10, 14, [0xff8fab, 0x7cc6fe, 0xffd166, 0x06d6a0][i % 4]);
    piece.setDepth(DEPTH.celebrate + 1);
    scene.tweens.add({
      targets: piece,
      y: cy + 220,
      angle: 180 + i * 24,
      alpha: { from: 1, to: 0 },
      ease: 'Cubic.easeIn',
      duration: 1100,
      delay: i * 30,
      onComplete: () => piece.destroy(),
    });
  }
```

  Cập nhật `celebrate.test.ts` (test "full burst"): normal giờ có 1 fox image + 8 star image (confetti là `rectangle`, fake-scene chỉ đếm `add.image` → **images vẫn 9**, nhưng **tweens tăng**: 9 + 10 confetti = 19). → Sửa assertion tween normal từ `toHaveLength(9)` → `toHaveLength(19)` HOẶC an toàn hơn: `toBeGreaterThanOrEqual(9)`. Để khuôn fake-scene khỏi vỡ vì `add.rectangle`, **THÊM `rectangle()` vào fake-scene trong celebrate.test.ts** (trả object có `setDepth`/`destroy`) — hoặc đơn giản hơn: confetti dùng `add.image` với 1 texture confetti SVG (giữ fake-scene nguyên, images normal tăng lên 19). **Quyết định (đơn giản, ít sửa test):** dùng `add.image` cho confetti với 1 texture SVG `confettiArt()` nhỏ → fake-scene `add.image` đã có; normal images = 1 fox + 8 star + 10 confetti = 19, tweens = 19. Sửa 2 số trong "full burst" test; calm/OS-reduced GIỮ 1/1.

  > **Quyết định triển khai chốt:** confetti = `add.image` (texture SVG nhỏ, tint qua màu trong SVG) để KHÔNG phải thêm `rectangle` vào mọi fake-scene. Cập nhật `celebrate.test.ts` "full burst": `images` `toHaveLength(19)`, `tweens` `toHaveLength(19)`. Hai test calm/OS-reduced KHÔNG đổi.

- [ ] **Step 6: Chạy celebrate test → PASS**

Run: `npx vitest run src/art/celebrate.test.ts`
Expected: PASS (full burst số mới; calm/OS-reduced vẫn 1/1).

- [ ] **Step 7: tsc + lint**

Run: `npx tsc -b && npx eslint src/art/sceneMotion.ts src/art/sceneArt.ts src/art/sceneMotion.test.ts src/art/celebrate.test.ts`
Expected: sạch.

- [ ] **Step 8: Commit** *(BỎ QUA khi chạy 6.1)*

```bash
git add src/art/sceneMotion.ts src/art/sceneMotion.test.ts src/art/sceneArt.ts src/art/celebrate.test.ts
git commit -m "feat(art): juice toolkit (squash/sparkle/press/breathe/bounce) + richer celebrate, all calm-safe (GĐ6.1)"
```

---

### Task 8: Kit sinh vật TỐI THIỂU cho counting-fun — `creaturesCounting.ts` (TDD)

**Files:**
- Create: `src/art/creaturesCounting.ts`
- Create: `src/art/creaturesCounting.test.ts`

**Bối cảnh:** `COUNTING_ANIMALS = ['🦆','🐰','🐸','🐝','🐟','🦋']` (duck/rabbit/frog/bee/fish/butterfly). Kit này thiết lập **mẫu** (template tham số + resolver `creature(id)`) cho `creatures.ts` đầy đủ ở 6.2 — ở 6.1 CHỈ phủ 6 con counting-fun dùng (spec §10 "MINIMAL creature subset"). Mỗi con compose `paintedFill` + `softShadow` + `inkStroke`.

**Interfaces:**
- Consumes: `svgDoc` từ `./svg`; `paintedFill`/`softShadow`/`inkStroke`/`withDefs` từ `./paint`; `palette` từ `./tokens`.
- Produces:
  - `export const COUNTING_CREATURE_IDS = ['duck','rabbit','frog','bee','fish','butterfly'] as const`.
  - `export function creature(id: string, title?: string): string` → `<svg>` cho id; id lạ → fallback an toàn (1 hình tròn dễ thương, không ném).
  - `export function emojiToCreatureId(emoji: string): string` → map `'🦆'→'duck'` … (DRY cho scene; emoji lạ → `'duck'` fallback hoặc id ổn định).

- [ ] **Step 1: Viết test thất bại** `src/art/creaturesCounting.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { creature, emojiToCreatureId, COUNTING_CREATURE_IDS } from './creaturesCounting';
import { COUNTING_ANIMALS } from '../games/counting-fun/countingLogic';

/**
 * GĐ6.1 — minimal creature kit for the counting-fun pilot (spec §10). The DRAWING
 * is browser-verified; here we lock the pure contracts: every id renders a valid
 * <svg>, an unknown id falls back safely (never blank / never throws), and the
 * emoji→id map covers exactly the counting animals.
 */
describe('creature kit (counting subset)', () => {
  it('renders a valid <svg> for every counting id', () => {
    for (const id of COUNTING_CREATURE_IDS) {
      const svg = creature(id);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('</svg>');
      // composes the storybook surface: a painted gradient + soft shadow.
      expect(svg).toContain('linearGradient');
      expect(svg).toContain('feDropShadow');
    }
  });

  it('falls back to a safe shape for an unknown id (never throws / never blank)', () => {
    const svg = creature('not-an-animal');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
  });

  it('maps every counting-fun emoji to a known creature id', () => {
    for (const emoji of COUNTING_ANIMALS) {
      const id = emojiToCreatureId(emoji);
      expect(COUNTING_CREATURE_IDS).toContain(id as (typeof COUNTING_CREATURE_IDS)[number]);
    }
  });

  it('gives an unknown emoji a stable fallback id', () => {
    const id = emojiToCreatureId('🐙');
    expect(COUNTING_CREATURE_IDS).toContain(id as (typeof COUNTING_CREATURE_IDS)[number]);
  });
});
```

- [ ] **Step 2: Chạy → FAIL**

Run: `npx vitest run src/art/creaturesCounting.test.ts`
Expected: FAIL ("Cannot find module './creaturesCounting'").

- [ ] **Step 3: Viết `src/art/creaturesCounting.ts`** — template tham số tối thiểu + 6 config. Mỗi con dùng `withDefs(paintedFill(...) + softShadow(...), body)` và `inkStroke()`:

```ts
/**
 * KiddyHub — Minimal creature kit for the counting-fun pilot (Giai đoạn 6 · 6.1).
 *
 * Establishes the PARAMETRIC pattern the full `creatures.ts` kit (6.2) will grow
 * from: a tiny set of body templates + a data-driven id→config map, resolved by
 * `creature(id)` into a complete storybook `<svg>` (painted gradient fur/skin +
 * soft shadow + brown ink stroke). 6.1 only covers the six animals counting-fun
 * uses (duck/rabbit/frog/bee/fish/butterfly); 6.2 audits + extends to every game.
 *
 * Every colour comes from tokens / the config; nothing hard-codes a stray hue.
 */
import { svgDoc } from './svg';
import { paintedFill, softShadow, inkStroke, withDefs } from './paint';
import { palette } from './tokens';

export const COUNTING_CREATURE_IDS = ['duck', 'rabbit', 'frog', 'bee', 'fish', 'butterfly'] as const;
export type CreatureId = (typeof COUNTING_CREATURE_IDS)[number];

interface CreatureConfig {
  /** Main body hue (gets a painted gradient). */
  body: string;
  /** Belly / cheek / wing accent. */
  accent: string;
  /** Which template to draw. */
  template: 'bird' | 'quadruped' | 'amphibian' | 'bug' | 'fish' | 'wing';
}

const CONFIG: Record<CreatureId, CreatureConfig> = {
  duck: { body: '#ffd166', accent: '#ff8c42', template: 'bird' },
  rabbit: { body: '#f4e3ef', accent: '#ffb3a7', template: 'quadruped' },
  frog: { body: '#06d6a0', accent: '#bdf5e6', template: 'amphibian' },
  bee: { body: '#ffd166', accent: '#5b4636', template: 'bug' },
  fish: { body: '#7cc6fe', accent: '#bfeaff', template: 'fish' },
  butterfly: { body: '#b388ff', accent: '#ff8fab', template: 'wing' },
};

const FILL_ID = 'cr-fill';
const SHADOW_ID = 'cr-shadow';

/** Two big friendly eyes centred around (cx). */
function eyes(cx: number, cy: number): string {
  const e = (x: number): string =>
    `<circle cx="${x}" cy="${cy}" r="5.4" fill="#fff" ${inkStroke()}/>` +
    `<circle cx="${x + 0.6}" cy="${cy + 0.6}" r="3" fill="${palette.ink}"/>` +
    `<circle cx="${x + 1.6}" cy="${cy - 1}" r="1.1" fill="#fff"/>`;
  return e(cx - 9) + e(cx + 9);
}

function bird(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="60" rx="26" ry="24" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // body
    `<circle cx="50" cy="36" r="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // head
    `<path d="M50 38 l16 6 l-16 6 Z" fill="${c.accent}" ${inkStroke()}/>` + // beak
    eyes(50, 34)
  );
}
function quadruped(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="62" rx="24" ry="20" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="50" cy="40" r="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M40 24 C36 6 46 8 46 26 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // ear L
    `<path d="M60 24 C64 6 54 8 54 26 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // ear R
    `<circle cx="50" cy="46" r="2.6" fill="${c.accent}"/>` + // nose
    eyes(50, 40)
  );
}
function amphibian(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="58" rx="28" ry="24" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="38" cy="34" r="9" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // eye bump L
    `<circle cx="62" cy="34" r="9" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // eye bump R
    `<circle cx="38" cy="34" r="4" fill="#fff" ${inkStroke()}/><circle cx="38" cy="35" r="2.2" fill="${palette.ink}"/>` +
    `<circle cx="62" cy="34" r="4" fill="#fff" ${inkStroke()}/><circle cx="62" cy="35" r="2.2" fill="${palette.ink}"/>` +
    `<path d="M40 62 q10 8 20 0" fill="none" ${inkStroke()}/>` // smile
  );
}
function bug(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="54" rx="22" ry="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M40 42 H60 M40 54 H60" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>` + // stripes
    `<ellipse cx="34" cy="40" rx="12" ry="8" fill="#fff" opacity="0.8" ${inkStroke()}/>` + // wing
    `<ellipse cx="66" cy="40" rx="12" ry="8" fill="#fff" opacity="0.8" ${inkStroke()}/>` +
    eyes(50, 50)
  );
}
function fish(c: CreatureConfig): string {
  return (
    `<path d="M70 50 l16 -12 v24 Z" fill="${c.accent}" ${inkStroke()}/>` + // tail
    `<ellipse cx="46" cy="50" rx="28" ry="20" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="36" cy="46" r="4.4" fill="#fff" ${inkStroke()}/><circle cx="35" cy="47" r="2.4" fill="${palette.ink}"/>`
  );
}
function wing(c: CreatureConfig): string {
  return (
    `<line x1="50" y1="30" x2="50" y2="74" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="36" cy="42" r="14" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="64" cy="42" r="14" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="36" cy="64" r="11" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="64" cy="64" r="11" fill="url(#${FILL_ID})" ${inkStroke()}/>`
  );
}

const TEMPLATES: Record<CreatureConfig['template'], (c: CreatureConfig) => string> = {
  bird,
  quadruped,
  amphibian,
  bug,
  fish,
  wing,
};

/** Resolve a creature id → a complete storybook <svg>. Unknown id → safe blob. */
export function creature(id: string, title = ''): string {
  const cfg = (CONFIG as Record<string, CreatureConfig>)[id];
  if (!cfg) {
    // Safe fallback: a friendly painted blob (never blank, never throws).
    const defs = paintedFill(FILL_ID, palette.primary) + softShadow(SHADOW_ID);
    return svgDoc(
      withDefs(defs, `<g filter="url(#${SHADOW_ID})"><circle cx="50" cy="52" r="30" fill="url(#${FILL_ID})" ${inkStroke()}/>${eyes(50, 48)}</g>`),
      title,
    );
  }
  const defs = paintedFill(FILL_ID, cfg.body) + softShadow(SHADOW_ID);
  const body = TEMPLATES[cfg.template](cfg);
  return svgDoc(withDefs(defs, `<g filter="url(#${SHADOW_ID})">${body}</g>`), title);
}

/** Map a counting-fun emoji to a creature id (DRY for the scene). Unknown → 'duck'. */
const EMOJI_TO_ID: Record<string, CreatureId> = {
  '🦆': 'duck',
  '🐰': 'rabbit',
  '🐸': 'frog',
  '🐝': 'bee',
  '🐟': 'fish',
  '🦋': 'butterfly',
};
export function emojiToCreatureId(emoji: string): CreatureId {
  return EMOJI_TO_ID[emoji] ?? 'duck';
}
```

- [ ] **Step 4: Chạy → PASS**

Run: `npx vitest run src/art/creaturesCounting.test.ts`
Expected: PASS.

- [ ] **Step 5: tsc + lint**

Run: `npx tsc -b && npx eslint src/art/creaturesCounting.ts src/art/creaturesCounting.test.ts`
Expected: sạch.

- [ ] **Step 6: Commit** *(BỎ QUA khi chạy 6.1)*

```bash
git add src/art/creaturesCounting.ts src/art/creaturesCounting.test.ts
git commit -m "feat(art): minimal parametric creature kit for counting-fun pilot (GĐ6.1)"
```

---

### Task 9: PILOT — chuyển `counting-fun` sang storybook (LOGIC KHÔNG ĐỔI)

**Files:**
- Modify: `src/games/counting-fun/CountingFunScene.ts` (emoji sprite → creature SVG; + buddy; + juice; prompt dùng màu/ font storybook). **`countingLogic.ts` KHÔNG đổi. Guard/hit-area/double-advance KHÔNG đổi.**
- Test: `src/games/counting-fun/index.test.ts` + `countingLogic.test.ts` PHẢI xanh không đổi.

**Interfaces:**
- Consumes: `creature`, `emojiToCreatureId` từ `../../art/creaturesCounting`; `addBuddy` từ `../../art/sceneArt`; `squashStretchPop`/`sparkleBurst`/`bouncePop`/`tilePress` từ `../../art/sceneMotion`.

> **Ràng buộc cứng:** mọi thay đổi VISUAL. `choose()`/`scaffold()`/`finish()`/`nextRound()` giữ NGUYÊN luồng quyết định, `roundResolved`/`answeredThisRound` guards, `recordItemResult`/`awardStars`/`complete` y nguyên. Chỉ THAY phần VẼ + THÊM lệnh juice/buddy cạnh feedback có sẵn.

- [ ] **Step 1: Thêm import** (đầu file, cạnh import hiện có):

```ts
import { addSceneBackground, addChrome, addOptionTile, celebrate, shakeOption, dimDistractor, addBuddy, type SceneBuddy } from '../../art/sceneArt';
import { animateIn, popCorrect, flyStars, squashStretchPop, sparkleBurst, bouncePop, tilePress, type MotionObject } from '../../art/sceneMotion';
import { creature, emojiToCreatureId } from '../../art/creaturesCounting';
```

- [ ] **Step 2: Thêm field buddy** (cạnh `private layer?`):

```ts
  private buddy?: SceneBuddy;
```

- [ ] **Step 3: Tạo buddy trong `create()`** (sau `addChrome`, trước `nextRound()`):

```ts
    this.buddy = addBuddy(this);
```

- [ ] **Step 4: Thay emoji sprite bằng creature SVG trong `nextRound()`.** Thay khối:

```ts
    // CŨ:
    for (let i = 0; i < this.current.count; i++) {
      const sprite = this.add
        .text(startX + i * 72, height / 2 - 30, this.current.animal, { fontSize: '60px' })
        .setOrigin(0.5);
      this.layer.add(sprite);
    }
```

  bằng:

```ts
    // MỚI: drawn SVG creatures (storybook) thay emoji. Hit/logic không đổi —
    // đây chỉ là phần VẼ. Mỗi con bounce-pop vào (calm-safe) cho có sự sống.
    const creatureId = emojiToCreatureId(this.current.animal);
    const creatureSvg = creature(creatureId);
    for (let i = 0; i < this.current.count; i++) {
      const sprite = this.add.existing(
        // addArt-style: dùng image qua sceneArt? Ở scene ta dùng add.image trực tiếp
        // KHÔNG có — thay vào, dùng helper addArt từ sceneMotion? addArt là nội bộ.
        // → Đăng ký texture 1 lần + add.image (idempotent qua texture key theo id).
        this.add.image(startX + i * 72, height / 2 - 30, this.ensureCreatureTexture(creatureId, creatureSvg)),
      ) as Phaser.GameObjects.Image;
      sprite.setOrigin(0.5).setDisplaySize(64, 64);
      this.layer.add(sprite);
      bouncePop(this, sprite as unknown as MotionObject);
    }
```

  + thêm method helper (đăng ký texture idempotent — KHÔNG cần `addArt` nội bộ của sceneArt):

```ts
  /** Register a creature SVG as a texture once (idempotent), keyed by id. */
  private ensureCreatureTexture(id: string, svg: string): string {
    const key = `creature-${id}`;
    if (!this.textures.exists(key)) {
      this.textures.addBase64(key, this.svgToUri(svg));
    }
    return key;
  }
  private svgToUri(svg: string): string {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }
```

  > **Đơn giản hoá tốt hơn (chốt):** thay vì tự viết `ensureCreatureTexture`/`svgToUri`, EXPORT một helper `addCreature(scene, id, svg, x, y, size)` từ `creaturesCounting.ts`? Không — giữ ranh giới art/scene. **Cách sạch nhất:** dùng `loadSvgTexture`/`addArt` ĐÃ CÓ trong `src/art/svg.ts` (public). Import `addArt` từ `'../../art/svg'`:

```ts
import { addArt } from '../../art/svg';
// ...
    for (let i = 0; i < this.current.count; i++) {
      const sprite = addArt(this as unknown as import('../../art/svg').ArtScene, `creature-${creatureId}`, creatureSvg, startX + i * 72, height / 2 - 30, 64) as unknown as Phaser.GameObjects.Image;
      this.layer.add(sprite);
      bouncePop(this, sprite as unknown as MotionObject);
    }
```

  **→ Dùng cách `addArt` từ `../../art/svg` (bỏ `ensureCreatureTexture`/`svgToUri`).** `addArt` idempotent theo key `creature-${id}`. `ArtScene` được `Phaser.Scene` thoả cấu trúc (như `sceneArt.ts` cast).

- [ ] **Step 5: Prompt dùng màu/font storybook.** Đổi style prompt + label cho ấm hơn (giữ nội dung + vị trí + hit-area):

```ts
    // prompt: dùng ink nâu storybook + Baloo 2 (qua CSS family chuỗi)
    const prompt = this.add
      .text(width / 2, 90, `Có mấy chú ${this.current.animal}?`, {
        fontSize: '34px',
        color: '#5b4636', // palette.ink storybook (thay #22335a)
        fontStyle: 'bold',
        fontFamily: "'Baloo 2','Comic Sans MS',system-ui,sans-serif",
      })
      .setOrigin(0.5);
```

  (label đáp án giữ `#5b4636` như cũ — đã đúng; có thể thêm `fontFamily` tương tự.)

- [ ] **Step 6: Juice + buddy ở `choose()` (đúng).** TRONG nhánh đúng, cạnh `popCorrect(this, label)` hiện có, THÊM (không thay luồng):

```ts
      popCorrect(this, label);
      squashStretchPop(this, label);     // punchier pop
      sparkleBurst(this, label.x, label.y); // per-interaction sparkle
      this.buddy?.cheer();               // mascot reacts (visual-only)
```

  Và trong nhánh SAI, cạnh `shakeOption(...)`:

```ts
      shakeOption(this, tile, label, btn);
      this.buddy?.encourage();           // mascot encourages (visual-only)
```

  TRONG handler `btn.on('pointerdown', …)`: thêm `tilePress(this, tile)` ngay đầu callback (phản hồi xúc giác), KHÔNG đổi việc gọi `this.choose(...)`:

```ts
      btn.on('pointerdown', () => {
        tilePress(this, tile);
        this.choose(opt, btn, tile, label);
      });
```

- [ ] **Step 7: Chạy test counting-fun — phải xanh KHÔNG đổi**

Run: `npx vitest run src/games/counting-fun/`
Expected: PASS — `index.test.ts` (metadata + lazy scene) + `countingLogic.test.ts` không đổi. (Scene construct dưới stub không ném.)

- [ ] **Step 8: Toàn bộ test + tsc + lint**

Run: `npx vitest run && npx tsc -b && npx eslint src/games/counting-fun/CountingFunScene.ts`
Expected: 452 cũ + test mới (paint + creature + sceneMotion mở rộng) đều xanh; tsc/lint sạch.

- [ ] **Step 9: Commit** *(BỎ QUA khi chạy 6.1)*

```bash
git add src/games/counting-fun/CountingFunScene.ts
git commit -m "feat(counting-fun): storybook pilot — drawn creatures + buddy + juice (logic unchanged) (GĐ6.1)"
```

---

### Task 10: Style board — thêm hàng "Storybook 6.1" để eyeball

**Files:**
- Modify: `scripts/build-style-sample.mjs` (THÊM một hàng/khối Storybook: Cáo repaint + vài creature + mẫu nền sơn)

**Interfaces:**
- Consumes: `creature`, `COUNTING_CREATURE_IDS` từ `../src/art/creaturesCounting.ts`; `foxThink`/`foxPoint`/`foxNod` từ `../src/art/fox.ts`.

> **Mục tiêu:** regenerate `docs/art/style-sample.svg` để con người eyeball LOOK mới (cổng duyệt spec §10). KHÔNG chặn nếu render headless không có — chỉ ghi SVG (script hiện chỉ ghi `.svg`, PNG là bước tay riêng).

- [ ] **Step 1: Thêm import** (đầu script, cạnh `foxGuide` …):

```ts
import { foxThink, foxPoint, foxNod } from '../src/art/fox.ts';
import { creature, COUNTING_CREATURE_IDS } from '../src/art/creaturesCounting.ts';
```

- [ ] **Step 2: Thêm khối Storybook vào `board`** (trước `</svg>` cuối). Dùng helper `cell(...)` có sẵn để nhúng từng SVG. Ví dụ một hàng creature + một hàng biểu cảm Cáo mới:

```ts
  `<text x="40" y="800" font-size="24" font-weight="700" fill="${palette.ink}">Storybook 6.1 — sinh vật vẽ tay + Cáo biểu cảm</text>` +
  COUNTING_CREATURE_IDS.map((id, i) => cell(60 + i * 130, 824, 100, 100, () => creature(id), id)).join('') +
  cell(60, 980, 120, 120, foxThink, 'think') +
  cell(220, 980, 120, 120, () => foxPoint(1), 'point') +
  cell(380, 980, 120, 120, foxNod, 'nod') +
```

  (Tăng `H` của board nếu cần để chứa — đổi `const H = 840;` → `const H = 1140;`. `cell` chấp nhận `make` là hàm trả `<svg>` — `() => creature(id)` hợp lệ.)

- [ ] **Step 3: Chạy generator**

Run: `npx tsx scripts/build-style-sample.mjs`
Expected: log `wrote …/style-sample.svg`. Mở `docs/art/style-sample.svg` xem LOOK (không chặn nếu chỉ xem được SVG, PNG là bước tay).

- [ ] **Step 4: Commit** *(BỎ QUA khi chạy 6.1)*

```bash
git add scripts/build-style-sample.mjs docs/art/style-sample.svg
git commit -m "docs(art): style board adds storybook 6.1 row (creatures + fox expressions) (GĐ6.1)"
```

---

### Task 11: Verify trọn gói + bàn giao 6.1

**Files:**
- Modify: `ROADMAP.md` (mục Giai đoạn 6 / 6.1)

- [ ] **Step 1: Verify — chạy VÀ ghi output VERBATIM** (verification-before-completion):

```bash
npm test 2>&1 | tail -8        # kỳ vọng: > 452 (452 cũ + paint + creature + sceneMotion mở rộng); 0 fail
npm run build 2>&1 | tail -12  # kỳ vọng: tsc -b + vite build OK
npm run lint 2>&1 | tail -8    # kỳ vọng: 0 lỗi
npx tsc -b 2>&1 | tail -4      # kỳ vọng: sạch
```

  TẤT CẢ phải xanh. Nếu đỏ → sửa trước khi tuyên bố xong (đặc biệt: phaser-stub có thể cần mở rộng nếu pilot chạm API mới — nhưng pilot cố ý dùng `add.image`/`graphics`/`tweens`/`textures` đã có trong stub).

- [ ] **Step 2: Cập nhật `ROADMAP.md`** — thêm "Giai đoạn 6 / 6.1 ✅": nền tảng storybook (paint + token), font Baloo 2 (ghi rõ bundled vs scaffolded-TODO), Cáo repaint + addBuddy + dàn cảnh + grain, juice toolkit calm-safe, pilot counting-fun creatures. Ghi tổng test mới + việc-người còn lại (manual browser test LOOK trên Chrome/Cốc Cốc; nếu font scaffold → drop woff2).

- [ ] **Step 3: Commit** *(BỎ QUA khi chạy 6.1 — orchestrator commit gộp)*

```bash
git add ROADMAP.md
git commit -m "docs: mark GĐ6.1 (storybook foundation + counting-fun pilot) complete (GĐ6.1)"
```

---

## Self-Review (đã chạy)

**1. Spec coverage (6.1 = spec §10):**
- §4.1 token (shadow/outline/paper/paint) → Task 1. ✔
- §4.2/§6 `paint.ts` (softShadow/paintedFill/inkStroke/paperGrain/withDefs) + §11 paint.test → Task 2. ✔
- §9 font Baloo 2 bundle cục bộ + fallback → Task 3 (kèm nhánh scaffold-TODO khi mạng chặn). ✔
- §6 Cáo repaint (paintedFill+softShadow, API ổn định) + biểu cảm mới (think/point/nod) → Task 4. ✔
- §6 `addBuddy` visual-only → Task 5. ✔
- §7 `addSceneBackground` (ground+sun+1 grain scene-level, giữ depth-sort) → Task 6. ✔
- §8/§11 juice (squash/sparkle/press/breathe/bounce) + nâng celebrate, MỌI hàm calm-safe + test → Task 7. ✔
- §5/§10 kit sinh vật TỐI THIỂU (pilot subset) + test → Task 8. ✔
- §10 PILOT counting-fun (emoji→creature, staging, juice, buddy; logic/hit/guard giữ) → Task 9. ✔
- §10 cổng duyệt style board → Task 10. ✔
- §11/§12 verify xanh + ranh giới + handoff → Task 11. ✔
- §12 ranh giới (không đụng logic/data/audio/mastery/router/parent; calmMode giữ; 0 dep) → Global Constraints + nhắc trong Task 9. ✔

**2. Placeholder scan:** không "TBD/TODO mơ hồ" — TODO duy nhất là trong nhánh font-scaffold (có chủ đích, spec cho phép). Mọi step có code thật.

**3. Type consistency:** `creature(id)`/`emojiToCreatureId`/`COUNTING_CREATURE_IDS`, `addBuddy→SceneBuddy{cheer,encourage}`, juice signatures `(scene, target?)` / `sparkleBurst(scene,x,y)` khớp giữa Task 8/5/7 và call-site Task 9. `addArt` lấy từ `../../art/svg` (public, đã có chữ ký `(scene,key,svg,x,y,size)`). `foxPoses` GIỮ 3 key; pose mới export riêng + `foxExpressions`.

**Lưu ý người chạy:** BỎ QUA mọi bước `git commit` — orchestrator commit/push/deploy gộp sau 6.1.
