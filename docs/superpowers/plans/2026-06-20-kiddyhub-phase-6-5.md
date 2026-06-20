# Giai đoạn 6.5 — React/menu + bản đồ "Khoác áo Storybook" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa lớp React/menu và bản đồ phiêu lưu lên đúng bề mặt "Truyện tranh giấy · Tươi" (storybook) để menu và cảnh chơi nhìn liền một khối — phase CUỐI của GĐ6.

**Architecture:** Hai mặt trận, KHÔNG đụng DOM/logic. (1) `src/App.css`: nút/thẻ "sơn" (bóng mềm ấm + viền mực mảnh + bo góc + gradient sơn nhẹ), một lớp vân giấy CSS rẻ ở nền (pseudo-element cố định, opacity thấp, sau nội dung, `pointer-events:none`), tiêu đề/nhãn Baloo 2 (font đã bundle), nền kem ấm đồng bộ cảnh; giữ tap target ≥56px và mọi rule `.calm-mode` nguyên vẹn. (2) SVG art NỘI BỘ: `islands.ts` (+ map backdrop), `avatars.ts`, `gameIcons.ts` chuyển sang bề mặt storybook (`paintedFill`/`softShadow`/`inkStroke` từ `paint.ts`/`tokens.ts`) đúng như `fox.ts`/`creatures.ts` đã làm — giữ id/key/title ổn định, giữ hue chủ đề và vị trí/vai trò mỗi đảo.

**Tech Stack:** React 18 + TypeScript + Vite; Phaser 3 (KHÔNG đụng); Dexie (KHÔNG đụng); Vitest + Testing Library; SVG-trong-mã 100% cục bộ; Baloo 2 woff2 đã bundle.

## Global Constraints

- **100% cục bộ, KHÔNG thêm phụ thuộc runtime mới.** Không CDN, không asset raster/AI/atlas, không mạng lúc chạy.
- **Mọi chuỗi hiển thị giữ tiếng Việt.** Không đổi text mà test query.
- **KHÔNG đổi cấu trúc DOM, role, accessible name (alt/aria-label), hay text hiển thị** của component React. Chỉ thêm/sửa CSS + sửa NỘI BỘ hàm SVG art.
- **KHÔNG đụng:** logic trò chơi (`*Logic.ts`), `progression.ts`/`applyCompletion.ts`/`registry.ts`/`scaffold.ts`/`masterySession.ts`, lớp dữ liệu Dexie (`src/data/*`), router màn (`App.tsx` luồng), hệ âm thanh/giọng, mastery/SR, scene files (`sceneArt.ts`/`sceneMotion.ts`/`fox.ts`/`creatures.ts`).
- **Tap target ≥56px** ở mọi nút trẻ chạm. Giữ MỌI rule `.calm-mode` và `@media (prefers-reduced-motion)` nguyên vẹn.
- **An toàn mù màu giữ nguyên:** badge bảng phụ huynh GĐ5E (`.status-mastered/emerging/.status-practice-next`) mã hoá trạng thái bằng icon + chữ + HÌNH-DẠNG (bo góc/kiểu viền khác nhau) — KHÔNG được phá. Pattern+nhãn swatch giữ nguyên.
- **Token là nguồn sự thật:** mọi màu/bóng/viền trong art lấy từ `tokens.ts` (`palette`, `shadow`, `outline`, `paint`); App.css dùng biến CSS đặt từ các token đó (qua giá trị hằng — không import TS vào CSS, nên hard-code GIÁ TRỊ token vào CSS với comment chỉ rõ token nguồn).
- **Mốc test baseline: 493 xanh / 89 file.** Mỗi task kết thúc test xanh, không giảm.
- **KHÔNG git commit/push, KHÔNG docker/deploy.** Orchestrator lo bước cuối. Để thay đổi chưa commit.

---

## File Structure

- **`src/App.css`** (Modify) — pass storybook: thêm biến `--sb-*` ở `:root`; nâng `button`, các thẻ (`.avatar-card`/`.game-card`/`.mastery-card`/`.ta-card`/`.sticker-slot`/`.bridge-card`/`.todays-adventure`), nền kem ấm cho `.screen`, lớp vân giấy `body::before`, đảm bảo Baloo 2 cho heading/label. Giữ mọi rule cũ về motion/calm/accessibility.
- **`src/art/islands.ts`** (Modify) — `base()`, props, `mapBackdrop()` chuyển sang painted gradient + soft shadow + ink stroke (`outline.ink`). Giữ `islandArt(id,title)`/`mapBackdrop()`/`islandIds` và hue mỗi đảo.
- **`src/art/avatars.ts`** (Modify) — mỗi avatar dùng painted fill thân + soft shadow group + ink stroke. Giữ `avatarArt(key,title)`/`avatarKeys`; `fox` vẫn reuse `foxIdle`.
- **`src/art/gameIcons.ts`** (Modify) — `badge()` painted + soft shadow + ink stroke; emblem giữ. Giữ `gameIcon(id,title)`/`gameIconIds` và category tint.
- **`src/art/islands.test.ts`** (Create) — khoá bề mặt storybook + ổn định API cho islands.
- **`src/art/avatars.test.ts`** (Create) — khoá bề mặt storybook + ổn định API cho avatars.
- **`src/art/gameIcons.test.ts`** (Create) — khoá bề mặt storybook + ổn định API cho gameIcons.
- **`src/App.storybook.test.tsx`** (Create) — khoá: lớp vân giấy nền tồn tại & decorative; tap target nút ≥56px (qua rule CSS hằng) — kiểm bằng cách kiểm tra chuỗi App.css chứa các bất biến (test đọc file CSS, không cần jsdom layout).
- **`scripts/build-style-sample.mjs`** (Modify, tuỳ chọn nhẹ) — thêm hàng "6.5 — menu/đảo storybook" để eyeball; KHÔNG block nếu headless không render filter.

**Lưu ý kỹ thuật quan trọng:** `inkStroke()` trả CHUỖI THUỘC TÍNH (`stroke="#6b4a2a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`) — nội suy vào trong tag (`<path ... ${inkStroke()}>`), KHÔNG đặt sau dấu `/>`. `softShadow(id)`/`paintedFill(id,hue)` trả mảnh `<defs>` con; gói bằng `withDefs(defs, body)` rồi `svgDoc(...)`. Mỗi tài liệu SVG (1 texture) có namespace id riêng → an toàn. Pattern mẫu đã có trong `src/art/fox.ts` (`painted()`), `src/art/creatures.ts`.

---

## Task 1: Storybook tokens cầu nối cho CSS + lớp vân giấy nền

**Files:**
- Modify: `src/App.css` (`:root`, `body`, `.screen`)
- Create: `src/App.storybook.test.tsx`

**Interfaces:**
- Consumes: giá trị token từ `src/art/tokens.ts` — `shadow.color='#5b4636'`, `shadow.opacity=0.25`, `outline.ink='#6b4a2a'`, `outline.width=2.2`, `palette.background='#fef6ec'`, `radius.lg=22`, `paper.opacity=0.05`. (Hard-code vào CSS với comment "from tokens.X".)
- Produces: biến CSS `--sb-ink`, `--sb-ink-w`, `--sb-shadow`, `--sb-radius`, `--sb-paper` dùng lại ở Task 2; lớp `body::before` vân giấy.

- [ ] **Step 1: Viết test thất bại** — `src/App.storybook.test.tsx` đọc App.css và khoá các bất biến storybook + accessibility.

```tsx
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const cssPath = resolve(dirname(fileURLToPath(import.meta.url)), './App.css');
const css = readFileSync(cssPath, 'utf-8');

describe('App.css — storybook surface (GĐ6.5)', () => {
  it('defines reusable storybook custom properties on :root', () => {
    expect(css).toMatch(/--sb-ink:\s*#6b4a2a/i); // outline.ink
    expect(css).toMatch(/--sb-shadow:/);
    expect(css).toMatch(/--sb-radius:/);
  });

  it('adds a cheap, behind-content, non-interactive paper-grain overlay', () => {
    expect(css).toMatch(/body::before/);
    // overlay must be non-interactive and sit behind content
    const block = css.slice(css.indexOf('body::before'), css.indexOf('body::before') + 400);
    expect(block).toMatch(/pointer-events:\s*none/);
    expect(block).toMatch(/z-index:\s*-1|z-index:-1/);
    expect(block).toMatch(/opacity:\s*0?\.0[0-9]/); // ~5%, low opacity
  });

  it('keeps warm cream as the page background and Baloo 2 first in the stack', () => {
    expect(css).toMatch(/#fef6ec/); // palette.background warm cream
    expect(css).toMatch(/font-family:\s*'Baloo 2'/);
  });

  it('keeps every tap target generously sized (≥56px) for small fingers', () => {
    // base button min-height stays ≥56 and the child-facing switch button ≥56
    expect(css).toMatch(/button\s*\{[^}]*min-height:\s*(?:5[6-9]|[6-9]\d|\d{3})px/s);
    expect(css).toMatch(/\.switch-child-btn[^}]*min-height:\s*56px/s);
  });

  it('preserves calm-mode + reduced-motion animation kills', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/\.calm-mode \.screen-enter/);
  });

  it('preserves the colourblind-safe status badge shapes (icon+text+SHAPE, not colour)', () => {
    expect(css).toMatch(/\.status-mastered[^}]*border-radius:\s*999px/s); // pill
    expect(css).toMatch(/\.status-emerging[^}]*border:\s*2px dashed/s); // dashed
    expect(css).toMatch(/\.status-practice-next[^}]*border:\s*2px dotted/s); // dotted
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run src/App.storybook.test.tsx`
Expected: FAIL — chưa có `--sb-*` và `body::before` (các assertion mới đỏ); các assertion bảo tồn (calm/badge) hiện đã xanh.

- [ ] **Step 3: Thêm token cầu nối + vân giấy + nền kem vào App.css**

Trong `:root` (sau `font-family`), thêm:

```css
  /* GĐ6.5 — storybook surface bridge tokens (values mirror src/art/tokens.ts). */
  --sb-ink: #6b4a2a; /* outline.ink */
  --sb-ink-w: 2px; /* ~outline.width 2.2, snapped for crisp 1px-grid edges */
  --sb-radius: 18px; /* warm rounded card corner (≈ radius.lg) */
  --sb-shadow: 0 4px 10px rgba(91, 70, 54, 0.22); /* soft warm shadow (shadow.color/opacity) */
  --sb-shadow-press: 0 3px 0 rgba(91, 70, 54, 0.18); /* "lift" under tappable cards */
  --sb-paper: 0.05; /* paper.opacity ≈ 5% */
  --sb-cream: #fef6ec; /* palette.background warm cream */
```

Đổi nền `.screen` sang gradient kem ấm đồng bộ cảnh (giữ cảm giác trời→đất nhưng ấm hơn):

```css
.screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  gap: 16px;
  /* GĐ6.5 — warm storybook page: soft sky fading into the cream page colour. */
  background: linear-gradient(#e7f4ff 0%, #fff6e8 58%, var(--sb-cream) 100%);
}
```

Thêm lớp vân giấy nền (rẻ, sau nội dung, không chặn chạm). Đặt SAU rule `body`:

```css
/* GĐ6.5 — a single cheap paper-grain wash over the whole page (spec §9). A fixed,
 * behind-everything pseudo-element with very low opacity; a tiled SVG turbulence
 * data-URI keeps it local (no network) and lightweight. pointer-events:none so it
 * never intercepts a tap; z-index:-1 keeps it under all content. */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: var(--sb-paper);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
}
```

- [ ] **Step 4: Chạy test để xác nhận xanh**

Run: `npx vitest run src/App.storybook.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: tsc + lint nhanh**

Run: `npx tsc -b && npx eslint src/App.storybook.test.tsx`
Expected: exit 0.

---

## Task 2: "Sơn" cho nút & thẻ trong App.css (giữ DOM, giữ tap target, giữ calm/badge)

**Files:**
- Modify: `src/App.css` (`button`, `.avatar-card`, `.game-card`, `.island-title`, các thẻ engagement & parent)
- Test: `src/App.storybook.test.tsx` (mở rộng)

**Interfaces:**
- Consumes: biến `--sb-*` từ Task 1.
- Produces: bề mặt sơn cho nút/thẻ; KHÔNG đổi class/DOM.

- [ ] **Step 1: Thêm assertion "painted button" vào test**

Thêm vào `src/App.storybook.test.tsx`:

```tsx
describe('App.css — painted buttons & cards (GĐ6.5)', () => {
  it('paints the base button with a soft warm shadow, thin ink outline, rounded radius', () => {
    const block = css.slice(css.indexOf('\nbutton {'), css.indexOf('\nbutton {') + 500);
    expect(block).toMatch(/box-shadow:\s*var\(--sb-shadow/);
    expect(block).toMatch(/border:\s*var\(--sb-ink-w\)\s+solid\s+var\(--sb-ink\)/);
    expect(block).toMatch(/border-radius:/);
  });

  it('gives the avatar & game cards the painted card surface', () => {
    expect(css).toMatch(/\.avatar-card[^}]*var\(--sb-shadow/s);
    expect(css).toMatch(/\.game-card[^}]*var\(--sb-shadow/s);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run src/App.storybook.test.tsx`
Expected: FAIL trên 2 test mới.

- [ ] **Step 3: Sơn nút nền + thẻ**

Đổi rule `button` (giữ `font-size`, `min-height`, `padding`, `cursor`):

```css
/* Large touch targets everywhere */
button {
  font-size: 22px;
  min-height: 72px;
  border: var(--sb-ink-w) solid var(--sb-ink); /* GĐ6.5 — thin storybook ink outline */
  border-radius: 16px;
  padding: 12px 20px;
  cursor: pointer;
  /* GĐ6.5 — gentle painted gradient (light top → cream foot) on a warm white. */
  background: linear-gradient(#ffffff 0%, #fff7ec 100%);
  box-shadow: var(--sb-shadow); /* soft warm storybook shadow (was a hard 0 4px 0) */
  color: #4a3526;
}
```

Sơn thẻ avatar + game (chúng là `button`, nên đã thừa hưởng; thêm bo góc thẻ + bề mặt rõ hơn để đọc như "thẻ truyện"):

```css
.avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 140px;
  height: 140px;
  /* GĐ6.5 — painted storybook card. */
  border-radius: var(--sb-radius);
  box-shadow: var(--sb-shadow);
  background: linear-gradient(#fffdf8 0%, #fff3e0 100%);
  gap: 6px;
  padding: 10px;
}
.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 160px;
  height: 160px;
  /* GĐ6.5 — painted storybook card. */
  border-radius: var(--sb-radius);
  box-shadow: var(--sb-shadow);
  background: linear-gradient(#fffdf8 0%, #fff3e0 100%);
  gap: 6px;
  padding: 10px;
}
```

> Lưu ý: `.island` đặt `background:transparent;border:none;` SAU phần này trong file — không bị nút nền đè (CSS theo thứ tự nguồn, `.island` rule nằm sau và cùng độ đặc hiệu cho các thuộc tính đó). Giữ nguyên `.island`, `.island-title`. Không đổi `.parent-link`/`.garden-btn` màu nền (giữ accent vàng kem).

- [ ] **Step 4: Chạy test để xác nhận xanh + toàn bộ component test còn xanh**

Run: `npx vitest run src/App.storybook.test.tsx src/components`
Expected: PASS; AdventureMap/CategoryScreen/WhoIsPlaying/StarGarden… vẫn xanh (DOM/class không đổi).

- [ ] **Step 5: Kiểm bảo toàn calm/badge/tap-target**

Run: `npx vitest run src/App.storybook.test.tsx`
Expected: tất cả assertion bảo tồn (calm-mode, badge shapes, min-height ≥56) vẫn PASS.

---

## Task 3: Repaint 6 đảo + map backdrop sang bề mặt storybook

**Files:**
- Modify: `src/art/islands.ts`
- Create: `src/art/islands.test.ts`

**Interfaces:**
- Consumes: `paintedFill`, `softShadow`, `inkStroke`, `withDefs` từ `./paint`; `outline`, `palette`, `paper` từ `./tokens`.
- Produces: `islandArt(id, title)`, `mapBackdrop()`, `islandIds` — chữ ký KHÔNG đổi. Mỗi `islandArt` output chứa: `<linearGradient` (painted grass), `<filter` softShadow, stroke `#6b4a2a` (ink), giữ `<title>` khi có, giữ hue `palette.island[id]`.

- [ ] **Step 1: Viết test thất bại** — `src/art/islands.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { islandArt, mapBackdrop, islandIds } from './islands';
import { palette, outline } from './tokens';
import type { IslandKey } from './tokens';

describe('islands — storybook surface (GĐ6.5)', () => {
  it('keeps the six island ids stable', () => {
    expect(islandIds.sort()).toEqual(
      ['english', 'letters', 'logic', 'memory', 'numbers', 'shapes'].sort(),
    );
  });

  it.each(islandIds)('island %s wears the painted + soft-shadow + ink surface', (id) => {
    const svg = islandArt(id as IslandKey, 'Đảo');
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(svg).toContain('<linearGradient'); // painted grass dome
    expect(svg).toContain('<filter'); // soft shadow
    expect(svg).toContain(`stroke="${outline.ink}"`); // storybook ink, not old palette.ink
    expect(svg).toContain('<title>Đảo</title>');
  });

  it.each(islandIds)('island %s keeps its category hue', (id) => {
    const svg = islandArt(id as IslandKey, '');
    expect(svg).toContain(palette.island[id as IslandKey]);
  });

  it('the map backdrop is decorative and wears the storybook ink/shadow', () => {
    const svg = mapBackdrop();
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(svg).not.toContain('<title>'); // decorative — no accessible name
    expect(svg).toContain('<filter'); // soft shadow somewhere (sun/clouds)
  });

  it('namespaces every gradient/filter id per island document (no bare reuse across docs)', () => {
    const a = islandArt('numbers', '');
    // every url(#id) reference resolves to an id defined in the same doc
    const refs = [...a.matchAll(/url\(#([a-z0-9-]+)\)/gi)].map((m) => m[1]);
    for (const id of refs) expect(a).toContain(`id="${id}"`);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run src/art/islands.test.ts`
Expected: FAIL — output hiện dùng `palette.ink` (`#5b4636`), không có `<linearGradient`/`<filter`.

- [ ] **Step 3: Repaint `islands.ts` NỘI BỘ**

Thay phần import + hằng + `base()` + `mapBackdrop()`; giữ nguyên các hàm scene per-category và `tree/palm/cloud/waves` (chúng tự đẹp; chỉ đổi mực sang ink storybook + dùng painted grass ở `base`).

Cụ thể:

1. Cập nhật import:
```ts
import { svgDoc } from './svg';
import { paintedFill, softShadow, inkStroke, withDefs } from './paint';
import { palette, stroke, outline, type IslandKey } from './tokens';
```

2. Đổi hằng INK sang ink storybook và thêm helper:
```ts
const SW = stroke.width;
const SW_THIN = stroke.thin;
const INK = outline.ink; // GĐ6.5 — storybook brown ink (was palette.ink)
const SAND = '#ffe6b3';
const SHADOW_ID = 'isl-shadow';
const GRASS_ID = 'isl-grass';
```

3. Đổi `base(color)` để dùng painted gradient cho mái cỏ và ink storybook (giữ hình):
```ts
/** The shared island base: soft shadow, sand ring, painted grassy top. */
function base(color: string): string {
  const grassDark = shade(color);
  return (
    `<ellipse cx="50" cy="84" rx="40" ry="9" fill="${INK}" opacity="0.10"/>` +
    `<ellipse cx="50" cy="74" rx="42" ry="18" fill="${SAND}" stroke="${INK}" stroke-width="${SW}"/>` +
    // painted grass dome (lighten→hue→darken via the shared gradient)
    `<path d="M14 70 C14 48 30 36 50 36 C70 36 86 48 86 70 C72 78 60 80 50 80 C40 80 28 78 14 70 Z" ` +
    `fill="url(#${GRASS_ID})" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M16 68 C30 76 70 76 84 68 C72 74 60 76 50 76 C40 76 28 74 16 68 Z" fill="${grassDark}" opacity="0.5"/>`
  );
}
```

4. Bọc mỗi đảo trong defs (painted grass theo hue + soft shadow) ở `islandArt`:
```ts
export function islandArt(id: IslandKey, title = ''): string {
  const color = palette.island[id];
  const defs = paintedFill(GRASS_ID, color) + softShadow(SHADOW_ID);
  const body = `<g filter="url(#${SHADOW_ID})">${scenes[id](color)}</g>`;
  return svgDoc(withDefs(defs, body), title);
}
```

5. Cho map backdrop một bóng mềm trên mặt trời/mây (đổi INK refs sang storybook ink — chúng nằm trong `cloud()` đã dùng `INK` toàn cục nên tự đổi). Bọc các đám mây + mặt trời trong soft shadow:
```ts
export function mapBackdrop(): string {
  const defs = softShadow(SHADOW_ID);
  return svgDoc(
    withDefs(
      defs,
      // sky
      `<rect x="0" y="0" width="100" height="58" fill="${palette.backgroundSky}"/>` +
      // soft sun with a lifted shadow
      `<g filter="url(#${SHADOW_ID})">` +
      `<circle cx="82" cy="16" r="12" fill="${palette.star}" opacity="0.55"/>` +
      `<circle cx="82" cy="16" r="7" fill="${palette.star}"/></g>` +
      // sea bands
      `<rect x="0" y="50" width="100" height="50" fill="#bfeaff"/>` +
      `<rect x="0" y="64" width="100" height="36" fill="#a6dcf7"/>` +
      `<rect x="0" y="80" width="100" height="20" fill="#8fcff0"/>` +
      // drifting clouds (lifted)
      `<g filter="url(#${SHADOW_ID})">` +
      cloud(20, 14, 1.1) +
      cloud(54, 10, 0.9) +
      cloud(38, 30, 0.7) +
      `</g>` +
      // sparkles on the water
      `<g fill="${palette.white}" opacity="0.55">` +
      `<path d="M16 72 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z"/>` +
      `<path d="M70 84 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z"/>` +
      `<path d="M44 90 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z"/></g>`,
    ),
  );
}
```

> Giữ `inkStroke` import dù chưa dùng? KHÔNG — chỉ import cái dùng để tránh lint no-unused. Nếu không dùng `inkStroke`, bỏ khỏi import. (Đảo dùng `stroke="${INK}"` trực tiếp, đủ; `inkStroke()` là tiện ích, không bắt buộc.) ĐIỀU CHỈNH import ở Step 3.1: chỉ `paintedFill, softShadow, withDefs`.

- [ ] **Step 4: Chạy test để xác nhận xanh**

Run: `npx vitest run src/art/islands.test.ts`
Expected: PASS.

- [ ] **Step 5: tsc + lint**

Run: `npx tsc -b && npx eslint src/art/islands.ts src/art/islands.test.ts`
Expected: exit 0 (không có import thừa).

---

## Task 4: Repaint 8 avatar sang bề mặt storybook

**Files:**
- Modify: `src/art/avatars.ts`
- Create: `src/art/avatars.test.ts`

**Interfaces:**
- Consumes: `paintedFill`, `softShadow`, `withDefs` từ `./paint`; `outline` từ `./tokens`; `foxIdle` từ `./fox` (giữ).
- Produces: `avatarArt(key, title)`, `avatarKeys` — chữ ký KHÔNG đổi. Output mỗi avatar (trừ `fox`, vốn đã storybook qua `foxIdle`) chứa `<linearGradient` (painted thân), `<filter` softShadow, stroke ink `#6b4a2a`, giữ `<title>`.

- [ ] **Step 1: Viết test thất bại** — `src/art/avatars.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { avatarArt, avatarKeys } from './avatars';
import { outline } from './tokens';

describe('avatars — storybook surface (GĐ6.5)', () => {
  it('keeps the eight avatar keys stable', () => {
    expect(avatarKeys.sort()).toEqual(
      ['bear', 'cat', 'dog', 'fox', 'frog', 'lion', 'panda', 'rabbit'].sort(),
    );
  });

  it.each(avatarKeys.filter((k) => k !== 'fox'))(
    'avatar %s wears painted + soft-shadow + storybook ink',
    (key) => {
      const svg = avatarArt(key, 'Bạn');
      expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
      expect(svg).toContain('<linearGradient'); // painted body
      expect(svg).toContain('<filter'); // soft shadow
      expect(svg).toContain(`stroke="${outline.ink}"`); // storybook ink
      expect(svg).toContain('<title>Bạn</title>');
    },
  );

  it('fox avatar still reuses the storybook mascot idle pose', () => {
    const svg = avatarArt('fox', 'Cáo');
    expect(svg).toContain('<linearGradient'); // foxIdle is already painted
    expect(svg).toContain('<title>Cáo</title>');
  });

  it('unknown key falls back to a drawn avatar (cat), not a blank', () => {
    const svg = avatarArt('unknown-xyz', 'X');
    expect(svg).toContain('<linearGradient');
    expect(svg).toContain('<title>X</title>');
  });

  it('every url(#id) reference resolves within the same document', () => {
    for (const key of avatarKeys) {
      const svg = avatarArt(key, '');
      for (const m of svg.matchAll(/url\(#([a-z0-9-]+)\)/gi)) {
        expect(svg).toContain(`id="${m[1]}"`);
      }
    }
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run src/art/avatars.test.ts`
Expected: FAIL — avatar (trừ fox) hiện flat, ink cũ `#5b4636`, không `<linearGradient`/`<filter`.

- [ ] **Step 3: Repaint `avatars.ts` NỘI BỘ**

Chiến lược tối-thiểu-rủi-ro: giữ MỌI hình hiện có; chỉ (a) đổi `INK` sang ink storybook, (b) thay fill thân `c.body` bằng painted gradient theo `c.body`, (c) bọc toàn avatar trong soft-shadow group. Mỗi `svgDoc` là 1 tài liệu → 1 cặp id `av-fill`/`av-shadow` dùng chung an toàn.

1. Import:
```ts
import { svgDoc } from './svg';
import { foxIdle } from './fox';
import { paintedFill, softShadow, withDefs } from './paint';
import { palette, stroke, outline } from './tokens';
```

2. Hằng:
```ts
const SW = stroke.width;
const SW_THIN = stroke.thin;
const INK = outline.ink; // GĐ6.5 — storybook brown ink (was palette.ink)
const FILL_ID = 'av-fill';
const SHADOW_ID = 'av-shadow';
const BODY_FILL = `url(#${FILL_ID})`;
```

3. Thêm wrapper `painted()` dùng cho mọi builder (trừ fox):
```ts
/** Wrap an avatar body in storybook defs: a painted gradient keyed to the
 *  species body hue + one soft warm shadow carried by the whole group. */
function painted(bodyHue: string, inner: string, title: string): string {
  const defs = paintedFill(FILL_ID, bodyHue) + softShadow(SHADOW_ID);
  return svgDoc(withDefs(defs, `<g filter="url(#${SHADOW_ID})">${inner}</g>`), title);
}
```

4. Trong MỖI builder, đổi `svgDoc(<inner>, title)` thành `painted(c.body, <inner>, title)` và đổi mọi `fill="${c.body}"` của MẢNG THÂN CHÍNH (head/ears chính) sang `fill="${BODY_FILL}"`. Giữ `c.light`/`c.dark`/cheek/eye nguyên. Ví dụ `avatarCat`:
```ts
function avatarCat(title: string): string {
  const c = fur.cat;
  return painted(
    c.body,
    `<path d="M28 30 L24 12 L42 24 Z" fill="${BODY_FILL}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M72 30 L76 12 L58 24 Z" fill="${BODY_FILL}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<path d="M30 26 L28 17 L37 23 Z" fill="#ff9eb5"/>` +
    `<path d="M70 26 L72 17 L63 23 Z" fill="#ff9eb5"/>` +
    `<circle cx="50" cy="52" r="32" fill="${BODY_FILL}" stroke="${INK}" stroke-width="${SW}"/>` +
    `<ellipse cx="50" cy="60" rx="20" ry="16" fill="${c.light}"/>` +
    eye(39, 48) + eye(61, 48) +
    blush(33, 58) + blush(67, 58) +
    noseSmile(50, 56, '#e8757f') +
    `<g stroke="${INK}" stroke-width="${SW_THIN}" fill="none">` +
    `<path d="M30 56 H16"/><path d="M31 62 H18"/>` +
    `<path d="M70 56 H84"/><path d="M69 62 H82"/></g>`,
    title,
  );
}
```
Áp y hệt cho `avatarDog/Bear/Rabbit/Panda/Lion/Frog`: bọc `painted(c.body, …, title)` (panda dùng `painted(palette.white, …)`), đổi fill thân chính (vòng đầu/đầu) sang `${BODY_FILL}`. Giữ tai phụ/đốm/`c.dark`/`c.light` theo màu phẳng cũ (chúng là chi tiết, không cần gradient). `avatarFox` GIỮ NGUYÊN (`return foxIdle(title)`).

> `eye()`/`blush()`/`noseSmile()` dùng `INK` toàn cục → tự nhận ink storybook. Tốt.

- [ ] **Step 4: Chạy test để xác nhận xanh**

Run: `npx vitest run src/art/avatars.test.ts`
Expected: PASS.

- [ ] **Step 5: tsc + lint**

Run: `npx tsc -b && npx eslint src/art/avatars.ts src/art/avatars.test.ts`
Expected: exit 0.

---

## Task 5: Repaint game icon badge sang bề mặt storybook

**Files:**
- Modify: `src/art/gameIcons.ts`
- Create: `src/art/gameIcons.test.ts`

**Interfaces:**
- Consumes: `paintedFill`, `softShadow`, `withDefs` từ `./paint`; `outline` từ `./tokens`.
- Produces: `gameIcon(id, title)`, `gameIconIds` — chữ ký KHÔNG đổi; category tint giữ. Output chứa `<linearGradient` (painted badge), `<filter` softShadow, ink `#6b4a2a`, giữ `<title>`; emblem giữ nguyên.

- [ ] **Step 1: Viết test thất bại** — `src/art/gameIcons.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { gameIcon, gameIconIds } from './gameIcons';
import { palette, outline } from './tokens';

describe('gameIcons — storybook surface (GĐ6.5)', () => {
  it('keeps all 16 game-icon ids stable', () => {
    expect(gameIconIds).toHaveLength(16);
  });

  it.each(gameIconIds)('icon %s wears painted badge + soft shadow + storybook ink', (id) => {
    const svg = gameIcon(id, 'Trò');
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
    expect(svg).toContain('<linearGradient'); // painted badge
    expect(svg).toContain('<filter'); // soft shadow
    expect(svg).toContain(`stroke="${outline.ink}"`);
    expect(svg).toContain('<title>Trò</title>');
  });

  it('counting-fun keeps the numbers (pink) category tint', () => {
    expect(gameIcon('counting-fun', '')).toContain(palette.island.numbers);
  });

  it('unknown id falls back to a painted accent badge (not blank)', () => {
    const svg = gameIcon('not-a-game', 'X');
    expect(svg).toContain('<linearGradient');
    expect(svg).toContain(palette.accent);
  });

  it('every url(#id) reference resolves within the same document', () => {
    for (const id of gameIconIds) {
      const svg = gameIcon(id, '');
      for (const m of svg.matchAll(/url\(#([a-z0-9-]+)\)/gi)) {
        expect(svg).toContain(`id="${m[1]}"`);
      }
    }
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run src/art/gameIcons.test.ts`
Expected: FAIL — badge hiện flat, ink cũ.

- [ ] **Step 3: Repaint `gameIcons.ts` NỘI BỘ**

Chỉ đổi `badge()` + `INK` + bọc soft shadow ở `gameIcon()`. Emblem giữ y nguyên (chúng vẽ trắng-trên-tint, đọc tốt trên gradient).

1. Import:
```ts
import { svgDoc } from './svg';
import { paintedFill, softShadow, withDefs } from './paint';
import { palette, stroke, radius, outline, type IslandKey } from './tokens';
```

2. Hằng:
```ts
const SW = stroke.width;
const SW_THIN = stroke.thin;
const INK = outline.ink; // GĐ6.5 — storybook brown ink (was palette.ink)
const BADGE_ID = 'gi-badge';
const SHADOW_ID = 'gi-shadow';
```

3. `badge()` dùng painted gradient:
```ts
/** A soft rounded badge that every icon sits on, painted with the category hue. */
function badge(): string {
  return (
    `<rect x="10" y="10" width="80" height="80" rx="${radius.lg}" fill="url(#${BADGE_ID})" stroke="${INK}" stroke-width="${stroke.bold}"/>` +
    `<rect x="18" y="16" width="64" height="20" rx="${radius.md}" fill="${palette.white}" opacity="0.22"/>`
  );
}
```

4. `gameIcon()` cấp defs + bóng:
```ts
export function gameIcon(id: string, title = ''): string {
  const cat = GAME_CATEGORY[id];
  const color = cat ? palette.island[cat] : palette.accent;
  const emblem = emblems[id];
  const defs = paintedFill(BADGE_ID, color) + softShadow(SHADOW_ID);
  const inner = `<g filter="url(#${SHADOW_ID})">${badge()}${emblem ? emblem() : glyphText('?')}</g>`;
  return svgDoc(withDefs(defs, inner), title);
}
```

> `badge()` không còn nhận tham số `color` (gradient mang màu). `glyphText`/`emblems` dùng `INK` toàn cục → tự nhận ink storybook. Đảm bảo không còn caller nào truyền `color` vào `badge(...)`.

- [ ] **Step 4: Chạy test để xác nhận xanh**

Run: `npx vitest run src/art/gameIcons.test.ts`
Expected: PASS (gồm `toHaveLength(16)` — gameIconIds có 16 phần tử).

- [ ] **Step 5: tsc + lint**

Run: `npx tsc -b && npx eslint src/art/gameIcons.ts src/art/gameIcons.test.ts`
Expected: exit 0.

---

## Task 6: Bảng phong cách 6.5 (eyeball) + xác minh toàn cục

**Files:**
- Modify (tuỳ chọn nhẹ): `scripts/build-style-sample.mjs` (thêm hàng menu/đảo storybook)
- Verify: toàn repo.

**Interfaces:**
- Consumes: `islandArt`, `mapBackdrop`, `avatarArt`, `gameIcon` (đã repaint).
- Produces: `docs/art/style-sample.svg` cập nhật cho duyệt mắt.

- [ ] **Step 1: (Tuỳ chọn) Thêm hàng "6.5 menu/đảo" vào style board**

Trong `scripts/build-style-sample.mjs`, thêm import:
```js
import { islandArt, islandIds } from '../src/art/islands.ts';
import { avatarArt, avatarKeys } from '../src/art/avatars.ts';
import { gameIcon, gameIconIds } from '../src/art/gameIcons.ts';
```
và một dải `cell(...)` cuối board cho vài `islandArt(id,'')`, vài `avatarArt(key,'')`, vài `gameIcon(id,'')`. (Giữ kích thước board hợp lệ; KHÔNG block nếu headless không render filter — đây chỉ để eyeball.)

- [ ] **Step 2: Tạo lại bảng style + identity (không block headless)**

Run: `npx tsx scripts/build-style-sample.mjs && npx tsx scripts/build-identity-sample.mjs`
Expected: ghi `docs/art/style-sample.svg` (+ identity nếu có). Nếu identity script lỗi không liên quan, ghi nhận, không sửa ngoài phạm vi.

- [ ] **Step 3: Chạy TOÀN BỘ test**

Run: `npm test`
Expected: ≥493 xanh (baseline 493 + các test mới islands/avatars/gameIcons/App.storybook). Báo cáo tổng số VERBATIM.

- [ ] **Step 4: Build + lint + typecheck**

Run: `npm run build` rồi `npm run lint` rồi `npx tsc -b`
Expected: cả ba exit 0. Báo cáo VERBATIM đuôi output.

- [ ] **Step 5: verification-before-completion**

Dùng skill `superpowers:verification-before-completion`: dán output thật của `npm test`/`npm run build`/`npm run lint`/`npx tsc -b`. KHÔNG tuyên bố hoàn tất trước khi thấy exit 0/green của cả bốn. KHÔNG commit/push/deploy.

---

## Self-Review

**1. Spec coverage (§9, §10 phần 6.5):**
- "nút/thẻ sơn (bóng mềm + viền mực + gradient)" → Task 2. ✔
- "nền paper-grain (overlay CSS)" → Task 1 (`body::before`). ✔
- "tiêu đề Baloo 2" → đã bundle + App.css chuỗi font; Task 1 khoá bất biến font. ✔
- "nền kem ấm đồng bộ cảnh" → Task 1 (`.screen` gradient ấm + `--sb-cream`). ✔
- "repaint bản đồ + 6 đảo (islands.ts)" → Task 3. ✔
- "avatar/icon restyle theo bề mặt mới" → Task 4 (avatars), Task 5 (gameIcons). ✔
- "menu↔game nhất quán (palette/ink/shadow/font)" → cùng token `outline.ink`/`shadow`/`paintedFill` như scene; ink `#6b4a2a`, shadow brown 0.22–0.25, gradient lighten/darken giống `fox.ts`/`creatures.ts`. ✔
- Giữ tap ≥56px + `.calm-mode` → Task 1/Task 2 (assertion bảo tồn). ✔
- Bất biến mù màu badge GĐ5E → Task 1 (assertion bảo tồn shapes). ✔
- Regenerate style/identity board → Task 6. ✔

**2. Placeholder scan:** Không có TBD/TODO; mọi step có code/lệnh thật + kỳ vọng. ✔

**3. Type consistency:** `paintedFill(id,hue)`/`softShadow(id)`/`withDefs(defs,body)` đúng chữ ký `paint.ts`; `islandArt(id,title)`/`mapBackdrop()`/`avatarArt(key,title)`/`gameIcon(id,title)`/`*Ids` giữ nguyên export hiện có; `outline.ink='#6b4a2a'` đúng `tokens.ts`; `gameIconIds` length 16 đúng (`emblems` có 16 khoá). ✔

**Ranh giới đã giữ:** không đụng logic/data/audio/mastery/router/scene; chỉ CSS + nội bộ 3 file art + 4 file test mới + (tuỳ chọn) style-sample script. KHÔNG commit/deploy.
