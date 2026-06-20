# KiddyHub — Giai đoạn 6 · Phần 6.2 Implementation Plan (Kit sinh vật đầy đủ + thay emoji)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Spec (source of truth):** [`../specs/2026-06-20-kiddyhub-phase-6-storybook-art.md`](../specs/2026-06-20-kiddyhub-phase-6-storybook-art.md) — plan này CHỈ cho **6.2** (spec §5, §10).
> **Tiền lệ 6.1:** [`2026-06-20-kiddyhub-phase-6-1.md`](./2026-06-20-kiddyhub-phase-6-1.md) — `paint.ts`, `creaturesCounting.ts` (kit TỐI THIỂU pilot), `CountingFunScene.ts` (bản tham chiếu chuyển emoji → SVG).

**Goal:** Khai tử emoji làm **nội dung trò chơi** — xây bộ **kit sinh vật/vật thể SVG tham số đầy đủ** (`src/art/creatures.ts`), gộp `creaturesCounting.ts` (6.1) vào nó (KHÔNG nhân đôi định nghĩa), rồi **thay mọi `add.text(emoji)` nội dung** ở 8 game còn lại bằng `addArt(scene, key, creature(id), …)` — **logic / hit-area / drag-snap / guard round-finish KHÔNG đổi**.

**Architecture:** Giữ NGUYÊN kiến trúc SVG-trong-mã + token + lớp "sơn" (`paint.ts`). `creatures.ts` là **kit canonical**: vài template thân (quadruped/bird/fish/bug/produce/vehicle/tool/shape) + một map `id → config` data-driven, resolver `creature(id, opts?)` compose `paintedFill` + `softShadow` + `inkStroke` thành `<svg>` hoàn chỉnh. `creaturesCounting.ts` được **viết lại để re-export từ `creatures.ts`** (giữ API `creature`/`emojiToCreatureId`/`COUNTING_CREATURE_IDS` mà counting-fun + test 6.1 đang dùng — test cũ phải xanh nguyên). Mỗi game lưu emoji trong `*Logic.ts` GIỮ NGUYÊN (byte-output không đổi); việc dịch **emoji-token → creature-id** xảy ra **chỉ ở tầng SCENE render** qua `emojiToCreatureId(emoji)`.

**Tech Stack:** TypeScript 5 (strict), Vitest 2, Vite + vite-plugin-pwa, Phaser 3 (stub khi test — `src/test/phaser-stub.ts`). Style board chạy bằng `npx tsx scripts/build-style-sample.mjs`.

## Global Constraints

- **100% cục bộ, KHÔNG thêm phụ thuộc runtime** (spec §12): không ảnh raster/AI/atlas; không gọi mạng lúc chạy; `package.json` dependencies giữ nguyên 4 dòng (`dexie`, `phaser`, `react`, `react-dom`). KHÔNG dùng API Phaser mới ngoài những gì `phaser-stub.ts` đã hỗ trợ (`add.image`/`add.graphics`/`textures.addBase64`+`exists`/`tweens`/`time`/`input`).
- **KHÔNG đụng ngữ nghĩa logic** (spec §12): mọi `*Logic.ts` (gồm `countingLogic.ts`, `wordLogic.ts`, `firstLetterLogic.ts`, `sortingLogic.ts`, `matchQuantityLogic.ts`, `oddOneOutLogic.ts`, `memoryLogic.ts`, `moreLessLogic.ts`, `patternLogic.ts`) **GIỮ NGUYÊN byte-output** — KHÔNG xoá/đổi mảng emoji, KHÔNG thêm field. Map `emoji→creature-id` sống ở `creatures.ts`/scene, KHÔNG ở logic. `progression.ts`/`applyCompletion.ts`/`registry.ts`/`scaffold.ts`/`masterySession.ts`, lớp Dexie (`src/data/*`), router, khu phụ huynh, hệ âm thanh/giọng (GĐ4A/5A), mastery/SR (GĐ5B) — bất khả xâm phạm.
- **Guard bất biến trong MỌI scene chạm vào:** `roundResolved` / `finished` / `answeredThisRound` / `busy` / `placed` / `matchedPairs`, double-advance, hit-area (`setInteractive`), drag-snap (`setDraggable` + `onDrop` + SNAP distance) GIỮ NGUYÊN. Thay sprite **chỉ đổi VIEW** (object hiển thị), KHÔNG đổi cách tính đúng/sai hay luồng vòng.
- **Token cũ bất khả xâm phạm:** KHÔNG đổi/xoá `palette`/`fox`/`stroke`/`radius`/`proportion`/`ART_VIEWBOX`/`shadow`/`outline`/`paper`/`paint` (asset hiện có + `svg.test.ts`/`paint.test.ts` khẳng định). Màu sinh vật mới lấy từ config trong `creatures.ts` (giá trị hex hằng) hoặc `palette` — KHÔNG hard-code hue rải rác ngoài CONFIG.
- **API 6.1 ổn định:** `creature(id, title?)`, `emojiToCreatureId(emoji)`, `COUNTING_CREATURE_IDS` GIỮ chữ ký + export (creaturesCounting.test.ts + CountingFunScene import chúng). counting-fun **KHÔNG đổi hành vi** — test của nó phải xanh nguyên.
- **VISUAL-ONLY discipline:** sprite SVG thay emoji KHÔNG `setInteractive` thêm — hit-area là `rectangle` trong suốt (chạm) HOẶC chính sprite (drag) y như emoji cũ. Khi emoji cũ vừa là hiển thị vừa là hit-area (drag games: sorting/jigsaw — emoji là Text draggable), sprite mới thay vào ĐÚNG vai trò đó (Image draggable) để drag-snap không đổi.
- **Tiếp cận (GĐ5E) bất khả xâm phạm:** không phá calmMode + prefersReducedMotion. An toàn mù màu (pattern+nhãn) ở 2 game màu (colors-english/shapes-colors) dùng Graphics swatch — KHÔNG đụng. `pattern-finder` token màu (🔴🔵🟡🟢🟣) khi vẽ lại thành chấm SVG phải GIỮ phân biệt được (màu + hình tròn) — không thêm rào cản tiếp cận.
- **Stub Phaser:** nếu chạm API Phaser mới → MỞ RỘNG `src/test/phaser-stub.ts`. Kế hoạch này tránh API mới (dùng `add.image` qua `addArt` — đã có trong stub, counting-fun đã chứng minh).
- **Mốc test:** **480 test hiện XANH** (baseline sau 6.1). Thêm test mới `creatures.test.ts`. Cuối: `npm test` (≥480), `npm run build`, `npm run lint`, `npx tsc -b` đều sạch.
- **KHÔNG commit/push/docker** — orchestrator lo. Để thay đổi uncommitted. Mỗi "Commit" trong plan là **checkpoint logic** — người chạy 6.2 BỎ QUA lệnh git.

---

## Audit emoji nội dung (kết quả §5 spec — input của plan)

Đã rà toàn bộ `src/games/**` (logic + scene). Phân loại: **CONTENT** (trẻ nhìn/đếm/ghép/sắp xếp — phải thay) vs **text glyph** (chữ cái A-Z, số 1-10 — GIỮ Baloo-2 text, KHÔNG đụng) vs **Graphics swatch** (màu/hình — KHÔNG đụng) vs **chrome/placeholder** (🏠🔊 đã xử 6.1; 🦊 jigsaw placeholder — xem deviation).

| Game | Emoji nội dung (semantic) | Nguồn lưu | Render hiện tại | Cần thay? |
|------|---------------------------|-----------|------------------|-----------|
| **counting-fun** | 🦆 duck · 🐰 rabbit · 🐸 frog · 🐝 bee · 🐟 fish · 🦋 butterfly | `countingLogic.COUNTING_ANIMALS` | **ĐÃ thay 6.1** (`creature` qua `emojiToCreatureId`) | ✅ xong |
| **first-words** | 🐱 cat · 🐶 dog · 🐟 fish · 🐦 bird · 🐻 bear · 🐸 frog · ⚽ ball · 🚗 car · 📖 book · ☕ cup · 🎩 hat · 🔑 key · 🍎 apple · 🍌 banana · 🍰 cake · 🥛 milk · 🥚 egg · 🍞 bread | `wordLogic.WORD_BANK` (`item.emoji`) | `add.text(x,y,item.emoji,{fontSize:'66px'})` (L89) | ✅ thay |
| **first-letter** | 🐱 cat · 🐶 dog · 🐟 fish · 🐝 bee · 🐘 elephant · 🐔 chicken · 🍌 banana · 🌳 tree · 🏠 house · ☀️ sun · 🐦 bird · 🐢 turtle · 🍎 apple · 🦆 duck | `firstLetterLogic.WORD_BANK` (`entry.emoji`) | `add.text(…entry.emoji,{fontSize:'120px'})` (L75) | ✅ thay (giữ chữ cái option = text) |
| **sorting** | items: 🐱🐶🐰🐯🐸🐮 / 🍎🍌🍇🍓🍑🍉 / 🚗🚌🚲✈️🚂🚀 · labels giỏ: 🐾 paw · 🍽️ plate · 🚦 traffic | `sortingLogic.GROUPS` (`item.emoji` + `basket.label`) | items: `add.text(…item.emoji,{56px})` **draggable** (L75); labels: `add.text(…basket.label,{72px})` (L62) | ✅ thay cả items (draggable) + labels giỏ |
| **match-quantity** | 🍎 apple · ⭐ star · 🐰 rabbit · 🌸 flower · 🚗 car · 🐟 fish · 🎈 balloon · 🍌 banana | `matchQuantityLogic.EMOJI` (`pair.emoji`) | `add.text(…pair.emoji,{36px})` (L67) — vẽ `pair.value` cái thành lưới | ✅ thay (số kéo = text, GIỮ) |
| **odd-one-out** | 🐱🐶🐰🐯🐸🐮 / 🍎🍌🍇🍓🍑🍉 / 🚗🚌🚲✈️🚂🚀 / 🔨✂️🔧📏🖌️🔑 | `oddOneOutLogic.GROUPS` | `add.text(…emoji,{64px})` (L65) | ✅ thay |
| **memory-match** | 🐶🐱🐰🦊🐻🐼🦁🐸🐯🐵 | `memoryLogic.FACES` (`card.faceKey`) | `add.text(…card.faceKey,{64px}).setVisible(false)` (L63) | ✅ thay (lật mặt = setVisible) |
| **more-less** | 🍎🍌⭐🐰🌸🚗🐟🎈 | `moreLessLogic.EMOJI` (`current.emoji`) | `add.text(…emoji,{44px})` lưới (L43) | ✅ thay |
| **pattern-finder** | 🔴🔵🟡🟢🟣 (chấm màu) + ô `?` | `patternLogic.TOKENS` | seq `add.text(…tok,{56px})` (L59) + option `add.text(…tok,{48px})` (L76); cell `?` cũng text | ✅ thay token màu (GIỮ `?` = text) |
| abc-english | A-Z | `abcLogic.ALPHABET` | text glyph | ❌ text — KHÔNG đụng |
| colors-english | swatch màu | Graphics `rectangle` | swatch | ❌ Graphics — KHÔNG đụng |
| numbers-english | 1-10 + word | text | text glyph | ❌ text — KHÔNG đụng |
| shapes-colors | shape + màu | Graphics | procedural shape | ❌ Graphics — KHÔNG đụng |
| letter-spotting | chữ Việt | `letterLogic.LETTERS` | text glyph | ❌ text — KHÔNG đụng |
| jigsaw | 🦊 placeholder | scene hard-code (L55) `rt.draw(emoji)` | placeholder ảnh ghép (Phase-4-only) | ⚠️ placeholder — xem deviation |
| spot-difference | — | SVG vườn (đã vẽ) | SVG | ❌ không emoji |

**Danh sách `id` kit PHẢI phủ (canonical catalog `creatures.ts`):**
- **Quadruped/thú:** `cat`, `dog`, `rabbit`, `tiger`, `cow`, `bear`, `elephant`, `fox`, `panda`, `lion`, `monkey`, `turtle`
- **Bird/chim:** `duck`, `bird`, `chicken`
- **Amphibian/lưỡng cư:** `frog`
- **Bug/côn trùng:** `bee`, `butterfly`
- **Fish/cá:** `fish`
- **Produce/đồ ăn-trái:** `apple`, `banana`, `grapes`, `strawberry`, `peach`, `watermelon`, `cake`, `milk`, `egg`, `bread`
- **Object/vật:** `ball`, `book`, `cup`, `hat`, `key`, `star`, `flower`, `balloon`, `tree`, `sun`
- **Vehicle/xe:** `car`, `bus`, `bicycle`, `airplane`, `train`, `rocket`
- **Tool/dụng cụ:** `hammer`, `scissors`, `wrench`, `ruler`, `paintbrush`
- **Shape/chấm (pattern):** `dot-red`, `dot-blue`, `dot-yellow`, `dot-green`, `dot-purple`
- **Basket label (sorting):** `label-animals` (🐾), `label-food` (🍽️), `label-vehicles` (🚦)

Tổng ~58 id. Nhiều id tái dùng cùng template (vd mọi thú 4 chân = `quadruped` chỉ đổi màu/tai/đuôi; mọi trái = `produce` đổi màu/cuống). `fox`/`rabbit` đã có art mượt sẵn (`fox.ts`/`stars.ts gRabbit`) — kit dùng template riêng để đồng nhất surface storybook; KHÔNG cần import lại.

---

## File Structure

```
kiddy-hub/
  src/
    art/
      creatures.ts            # CREATE (Task 1-3): kit canonical đầy đủ (templates + CONFIG map + creature() + emojiToCreatureId + COUNTING_CREATURE_IDS re-source)
      creatures.test.ts       # CREATE (Task 1): mọi id → <svg> hợp lệ; màu từ config; unknown → fallback; emoji map phủ mọi game
      creaturesCounting.ts    # MODIFY (Task 4): viết lại thành RE-EXPORT mỏng từ creatures.ts (0 định nghĩa trùng) — giữ API 6.1
    games/
      first-words/FirstWordsScene.ts        # MODIFY (Task 5): emoji option → creature SVG
      first-letter/FirstLetterScene.ts      # MODIFY (Task 6): emoji câu hỏi → creature SVG (option chữ = text, giữ)
      odd-one-out/OddOneOutScene.ts         # MODIFY (Task 7): emoji item → creature SVG
      memory-match/MemoryMatchScene.ts      # MODIFY (Task 8): faceKey emoji → creature SVG (toggle visible)
      pattern-finder/PatternFinderScene.ts  # MODIFY (Task 9): token màu → dot SVG (cell ? = text)
      match-quantity/MatchQuantityScene.ts  # MODIFY (Task 10): emoji nhóm → creature SVG (số kéo = text/rect, giữ)
      more-less/MoreLessScene.ts            # MODIFY (Task 11): emoji nhóm → creature SVG
      sorting/SortingScene.ts               # MODIFY (Task 12): item draggable Text→Image creature + label giỏ → creature SVG
  scripts/
    build-style-sample.mjs    # MODIFY (Task 13, tuỳ chọn): thêm hàng catalog creatures.ts để eyeball
  docs/superpowers/plans/2026-06-20-kiddyhub-phase-6-2.md  # plan này
```

**Thứ tự & phụ thuộc:** Task 1 (test creatures) → Task 2 (templates) → Task 3 (CONFIG + resolver + emoji map) — ba task này TDD chặt chẽ cho `creatures.ts`. Task 4 (gộp `creaturesCounting`, cần Task 3). Task 5-12 (mỗi scene độc lập, đều cần Task 4 ổn định API + `emojiToCreatureId` phủ emoji của game đó). Task 13 (style board, tuỳ chọn, cuối). Task 14 (verify tổng).

---

### Task 1: `creatures.test.ts` — khoá hợp đồng kit (viết test TRƯỚC)

**Files:**
- Create: `src/art/creatures.test.ts`

**Interfaces:**
- Consumes (sẽ tạo ở Task 2-3): từ `./creatures` — `creature(id: string, title?: string): string`, `emojiToCreatureId(emoji: string): string`, `CREATURE_IDS: readonly string[]` (mọi id trong catalog), `COUNTING_CREATURE_IDS: readonly string[]`.
- Consumes (đã có): emoji arrays từ các logic để khẳng định map phủ hết — `COUNTING_ANIMALS` (`../games/counting-fun/countingLogic`), `WORD_BANK` (`../games/first-words/wordLogic`), `WORD_BANK as FL_BANK` (`../games/first-letter/firstLetterLogic`), `GROUPS as SORT_GROUPS` (`../games/sorting/sortingLogic`), `EMOJI as MQ_EMOJI` (`../games/match-quantity/matchQuantityLogic`), `GROUPS as ODD_GROUPS` (`../games/odd-one-out/oddOneOutLogic`), `EMOJI as ML_EMOJI` (`../games/more-less/moreLessLogic`), `TOKENS as PAT_TOKENS` (`../games/pattern-finder/patternLogic`).
- `memory-match` FACES không export (const nội bộ) → test map cho từng emoji literal của nó.

- [ ] **Step 1: Viết test thất bại** `src/art/creatures.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { creature, emojiToCreatureId, CREATURE_IDS, COUNTING_CREATURE_IDS } from './creatures';
import { COUNTING_ANIMALS } from '../games/counting-fun/countingLogic';
import { WORD_BANK } from '../games/first-words/wordLogic';
import { WORD_BANK as FL_BANK } from '../games/first-letter/firstLetterLogic';
import { GROUPS as SORT_GROUPS } from '../games/sorting/sortingLogic';
import { EMOJI as MQ_EMOJI } from '../games/match-quantity/matchQuantityLogic';
import { GROUPS as ODD_GROUPS } from '../games/odd-one-out/oddOneOutLogic';
import { EMOJI as ML_EMOJI } from '../games/more-less/moreLessLogic';
import { TOKENS as PAT_TOKENS } from '../games/pattern-finder/patternLogic';

/**
 * GĐ6.2 — full parametric creature/object kit (spec §5). The DRAWING is browser-
 * verified; here we only lock the pure contracts:
 *   - every catalog id renders a valid storybook <svg> (painted gradient + soft
 *     shadow + ink stroke), never blank / never throws;
 *   - an unknown id falls back to a safe shape;
 *   - the emoji→id map covers EVERY game's content emoji with a known id, so no
 *     scene can ever fall through to a wrong / blank sprite.
 */
describe('creature kit — catalog', () => {
  it('renders a valid storybook <svg> for every catalog id', () => {
    expect(CREATURE_IDS.length).toBeGreaterThan(40);
    for (const id of CREATURE_IDS) {
      const svg = creature(id);
      expect(svg.startsWith('<svg'), `${id} should start <svg`).toBe(true);
      expect(svg, `${id} closes`).toContain('</svg>');
      // composes the storybook surface: painted gradient + soft shadow.
      expect(svg, `${id} painted`).toContain('linearGradient');
      expect(svg, `${id} shadow`).toContain('feDropShadow');
    }
  });

  it('falls back to a safe shape for an unknown id (never throws / never blank)', () => {
    const svg = creature('definitely-not-a-thing');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('feDropShadow');
  });

  it('still exposes the counting subset (6.1 API) inside the full catalog', () => {
    for (const id of COUNTING_CREATURE_IDS) {
      expect(CREATURE_IDS).toContain(id);
    }
  });
});

describe('creature kit — emoji coverage', () => {
  // Memory-match FACES are module-private; assert its literal set here.
  const MEMORY_FACES = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐸', '🐯', '🐵'];

  function expectMapped(emoji: string): void {
    const id = emojiToCreatureId(emoji);
    expect(CREATURE_IDS, `emoji ${emoji} → ${id} must be a known id`).toContain(id);
  }

  it('maps every counting-fun animal', () => {
    for (const e of COUNTING_ANIMALS) expectMapped(e);
  });
  it('maps every first-words item', () => {
    for (const lvl of [1, 2, 3] as const) for (const w of WORD_BANK[lvl]) expectMapped(w.emoji);
  });
  it('maps every first-letter item', () => {
    for (const e of FL_BANK) expectMapped(e.emoji);
  });
  it('maps every sorting item + basket label', () => {
    for (const g of SORT_GROUPS) {
      expectMapped(g.label);
      for (const e of g.items) expectMapped(e);
    }
  });
  it('maps every match-quantity emoji', () => {
    for (const e of MQ_EMOJI) expectMapped(e);
  });
  it('maps every odd-one-out emoji', () => {
    for (const g of ODD_GROUPS) for (const e of g) expectMapped(e);
  });
  it('maps every more-less emoji', () => {
    for (const e of ML_EMOJI) expectMapped(e);
  });
  it('maps every memory-match face', () => {
    for (const e of MEMORY_FACES) expectMapped(e);
  });
  it('maps every pattern-finder colour token', () => {
    for (const e of PAT_TOKENS) expectMapped(e);
  });

  it('gives an unknown emoji a stable known-id fallback (never blank)', () => {
    const id = emojiToCreatureId('🐙');
    expect(CREATURE_IDS).toContain(id);
  });
});
```

- [ ] **Step 2: Chạy → FAIL**

Run: `npx vitest run src/art/creatures.test.ts`
Expected: FAIL ("Cannot find module './creatures'").

- [ ] **Step 3: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/art/creatures.test.ts
git commit -m "test(art): lock creature kit contracts (catalog + emoji coverage) (GĐ6.2)"
```

---

### Task 2: `creatures.ts` — template thân tham số

**Files:**
- Create: `src/art/creatures.ts` (phần đầu: helper + templates; CONFIG/resolver ở Task 3)

**Interfaces:**
- Consumes: `svgDoc` (`./svg`), `paintedFill`/`softShadow`/`inkStroke`/`withDefs` (`./paint`), `palette` (`./tokens`).
- Produces (nội bộ, dùng ở Task 3): `interface CreatureConfig { template: TemplateName; body: string; accent: string; detail?: string }`; `type TemplateName`; `const TEMPLATES: Record<TemplateName, (c: CreatureConfig) => string>`; helper `eyes(cx,cy)`.

> **Surface storybook (spec §4-5):** mỗi mảng chính dùng `fill="url(#${FILL_ID})"` (painted gradient từ `c.body`); chi tiết/điểm nhấn dùng `c.accent`/`c.detail` hằng hoặc `palette.*`; viền `${inkStroke()}`; cả thân bọc `<g filter="url(#${SHADOW_ID})">`. Authored trên viewBox 0..100 (`svgDoc`). KHÔNG hard-code hue ngoài tham số config — template chỉ đọc `c.body/c.accent/c.detail` + `palette.ink`/`#fff`.

- [ ] **Step 1: Viết phần đầu `src/art/creatures.ts`** (header + ids + helper `eyes` + templates). Đây là MỞ RỘNG mẫu `creaturesCounting.ts` 6.1 lên đủ template:

```ts
/**
 * KiddyHub — Full parametric creature / object kit (Giai đoạn 6 · 6.2).
 *
 * The CANONICAL storybook kit that retires emoji as game CONTENT (spec §5). A
 * small set of body TEMPLATES (quadruped / bird / amphibian / bug / fish /
 * produce / vehicle / tool / dot / label) is reused across a data-driven
 * `id → config` CATALOG; the resolver `creature(id)` composes each into a
 * complete `<svg>` on the storybook surface (painted gradient + soft warm
 * shadow + brown ink stroke). Every colour comes from the config / tokens —
 * nothing hard-codes a stray hue. The 6.1 pilot kit (`creaturesCounting.ts`)
 * now re-exports from here, so the six counting animals live in ONE place.
 *
 * Authored on the canonical 0..100 viewBox via `svgDoc()`, like every art module.
 */
import { svgDoc } from './svg';
import { paintedFill, softShadow, inkStroke, withDefs } from './paint';
import { palette } from './tokens';

const FILL_ID = 'cr-fill';
const ACC_ID = 'cr-acc';
const SHADOW_ID = 'cr-shadow';

type TemplateName =
  | 'quadruped'
  | 'bird'
  | 'amphibian'
  | 'bug'
  | 'wing'
  | 'fish'
  | 'produce'
  | 'leafy'
  | 'vehicle'
  | 'wheeled'
  | 'air'
  | 'tool'
  | 'round'
  | 'dot'
  | 'label';

export interface CreatureConfig {
  /** Which body template to draw. */
  template: TemplateName;
  /** Main body hue (gets the painted gradient). */
  body: string;
  /** Belly / cheek / wing / beak / accent hue. */
  accent: string;
  /** Optional third detail hue (stripes, leaves, windows…). */
  detail?: string;
}

/** Two big friendly eyes centred around (cx, cy). */
function eyes(cx: number, cy: number, r = 5.4): string {
  const e = (x: number): string =>
    `<circle cx="${x}" cy="${cy}" r="${r}" fill="#fff" ${inkStroke()}/>` +
    `<circle cx="${x + 0.6}" cy="${cy + 0.6}" r="${r * 0.55}" fill="${palette.ink}"/>` +
    `<circle cx="${x + 1.6}" cy="${cy - 1}" r="${r * 0.2}" fill="#fff"/>`;
  return e(cx - 9) + e(cx + 9);
}

/** A small friendly smile arc centred at (cx, cy). */
function smile(cx: number, cy: number, w = 12): string {
  return `<path d="M${cx - w / 2} ${cy} q${w / 2} ${w * 0.55} ${w} 0" fill="none" ${inkStroke()}/>`;
}
```

- [ ] **Step 2: Thêm các template** (mỗi hàm trả body markup; dùng `url(#${FILL_ID})` cho thân, `c.accent`/`c.detail` cho chi tiết). Tiếp ngay sau `smile`:

```ts
// ── Animal templates ────────────────────────────────────────────────────────
function quadruped(c: CreatureConfig): string {
  // generic 4-leg-ish round animal: body + head + two ears + nose + eyes + smile.
  return (
    `<ellipse cx="50" cy="64" rx="25" ry="20" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // body
    `<circle cx="50" cy="40" r="19" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // head
    `<path d="M38 25 C33 7 45 8 46 27 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // ear L
    `<path d="M62 25 C67 7 55 8 54 27 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // ear R
    `<ellipse cx="44" cy="44" rx="6" ry="5" fill="${c.accent}"/>` + // cheek L
    `<ellipse cx="56" cy="44" rx="6" ry="5" fill="${c.accent}"/>` + // cheek R
    `<circle cx="50" cy="44" r="2.6" fill="${palette.ink}"/>` + // nose
    eyes(50, 38) +
    smile(50, 48, 10)
  );
}

function bird(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="60" rx="26" ry="24" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // body
    `<circle cx="50" cy="36" r="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // head
    `<path d="M50 38 l16 6 l-16 6 Z" fill="${c.accent}" ${inkStroke()}/>` + // beak
    `<path d="M22 60 q-10 4 -2 12 q8 -2 8 -8 Z" fill="${c.accent}" ${inkStroke()}/>` + // wing
    eyes(50, 34)
  );
}

function amphibian(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="58" rx="28" ry="24" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="38" cy="34" r="9" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // eye bump L
    `<circle cx="62" cy="34" r="9" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // eye bump R
    `<circle cx="38" cy="34" r="4" fill="#fff" ${inkStroke()}/><circle cx="38" cy="35" r="2.2" fill="${palette.ink}"/>` +
    `<circle cx="62" cy="34" r="4" fill="#fff" ${inkStroke()}/><circle cx="62" cy="35" r="2.2" fill="${palette.ink}"/>` +
    `<ellipse cx="42" cy="60" rx="5" ry="4" fill="${c.accent}"/>` +
    `<ellipse cx="58" cy="60" rx="5" ry="4" fill="${c.accent}"/>` +
    smile(50, 60, 20)
  );
}

function bug(c: CreatureConfig): string {
  return (
    `<ellipse cx="50" cy="54" rx="22" ry="18" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M40 42 H60 M40 54 H60" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>` + // stripes
    `<ellipse cx="34" cy="40" rx="12" ry="8" fill="#fff" opacity="0.85" ${inkStroke()}/>` + // wing L
    `<ellipse cx="66" cy="40" rx="12" ry="8" fill="#fff" opacity="0.85" ${inkStroke()}/>` + // wing R
    eyes(50, 50, 4.2)
  );
}

function wing(c: CreatureConfig): string {
  // butterfly: symmetric coloured wings + a thin body line.
  return (
    `<line x1="50" y1="30" x2="50" y2="74" stroke="${palette.ink}" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="36" cy="42" r="14" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="64" cy="42" r="14" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="36" cy="64" r="11" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="64" cy="64" r="11" fill="url(#${FILL_ID})" ${inkStroke()}/>`
  );
}

function fish(c: CreatureConfig): string {
  return (
    `<path d="M70 50 l16 -12 v24 Z" fill="${c.accent}" ${inkStroke()}/>` + // tail
    `<ellipse cx="46" cy="50" rx="28" ry="20" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M40 30 q6 8 0 16" fill="none" stroke="${c.accent}" stroke-width="3" stroke-linecap="round"/>` + // fin
    `<circle cx="36" cy="46" r="4.4" fill="#fff" ${inkStroke()}/><circle cx="35" cy="47" r="2.4" fill="${palette.ink}"/>` +
    smile(40, 54, 8)
  );
}

// ── Produce / object templates ──────────────────────────────────────────────
function produce(c: CreatureConfig): string {
  // round fruit/food: body circle + a little leaf + stem.
  return (
    `<circle cx="50" cy="56" r="28" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M50 30 q2 -10 12 -12 q-2 10 -12 12 Z" fill="${c.detail ?? palette.success}" ${inkStroke()}/>` + // leaf
    `<line x1="50" y1="30" x2="50" y2="22" stroke="${palette.ink}" stroke-width="3" stroke-linecap="round"/>` + // stem
    `<ellipse cx="40" cy="48" rx="6" ry="9" fill="#fff" opacity="0.35"/>` // shine
  );
}

function leafy(c: CreatureConfig): string {
  // banana / curved produce.
  return (
    `<path d="M28 40 C30 70 70 78 78 56 C70 64 40 60 38 38 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M28 40 l-3 -6" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>`
  );
}

function vehicle(c: CreatureConfig): string {
  // bus / boxy body on two wheels + windows.
  return (
    `<rect x="20" y="36" width="60" height="30" rx="8" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<rect x="26" y="42" width="14" height="12" rx="3" fill="${c.detail ?? palette.backgroundSky}" ${inkStroke()}/>` +
    `<rect x="44" y="42" width="14" height="12" rx="3" fill="${c.detail ?? palette.backgroundSky}" ${inkStroke()}/>` +
    `<rect x="62" y="42" width="12" height="12" rx="3" fill="${c.detail ?? palette.backgroundSky}" ${inkStroke()}/>` +
    `<circle cx="34" cy="68" r="8" fill="${palette.ink}"/><circle cx="34" cy="68" r="3.5" fill="${c.accent}"/>` +
    `<circle cx="66" cy="68" r="8" fill="${palette.ink}"/><circle cx="66" cy="68" r="3.5" fill="${c.accent}"/>`
  );
}

function wheeled(c: CreatureConfig): string {
  // car: lower body + cabin + two wheels.
  return (
    `<path d="M16 60 L24 46 H50 L60 36 H70 L78 60 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<rect x="40" y="40" width="20" height="12" rx="3" fill="${c.detail ?? palette.backgroundSky}" ${inkStroke()}/>` +
    `<rect x="14" y="58" width="68" height="8" rx="4" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="32" cy="68" r="9" fill="${palette.ink}"/><circle cx="32" cy="68" r="4" fill="${c.accent}"/>` +
    `<circle cx="64" cy="68" r="9" fill="${palette.ink}"/><circle cx="64" cy="68" r="4" fill="${c.accent}"/>`
  );
}

function air(c: CreatureConfig): string {
  // plane / rocket: pointed fuselage + fin/wings.
  return (
    `<path d="M20 52 L66 44 L82 50 L66 56 Z" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // fuselage
    `<path d="M40 50 L34 32 L48 48 Z" fill="${c.accent}" ${inkStroke()}/>` + // top wing
    `<path d="M40 52 L34 70 L48 54 Z" fill="${c.accent}" ${inkStroke()}/>` + // bottom wing
    `<circle cx="64" cy="50" r="4" fill="#fff" ${inkStroke()}/>` // window
  );
}

function tool(c: CreatureConfig): string {
  // generic tool: a handle + a head, accent-coloured.
  return (
    `<rect x="44" y="40" width="9" height="44" rx="4" fill="${c.accent}" ${inkStroke()}/>` + // handle
    `<rect x="30" y="28" width="40" height="16" rx="6" fill="url(#${FILL_ID})" ${inkStroke()}/>` + // head
    `<circle cx="50" cy="36" r="3" fill="${palette.ink}" opacity="0.4"/>`
  );
}

function round(c: CreatureConfig): string {
  // ball / balloon / generic round object: a sphere with a highlight + accent band.
  return (
    `<circle cx="50" cy="52" r="30" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<path d="M22 50 q28 -16 56 0" fill="none" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>` +
    `<ellipse cx="40" cy="42" rx="8" ry="11" fill="#fff" opacity="0.4"/>`
  );
}

function dot(_c: CreatureConfig): string {
  // pattern token: a clean painted disc with a soft ink ring (colour from body).
  return (
    `<circle cx="50" cy="50" r="30" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<ellipse cx="42" cy="42" rx="8" ry="10" fill="#fff" opacity="0.35"/>`
  );
}

function label(c: CreatureConfig): string {
  // sorting basket label: a soft rounded badge tinted by body, accent ring.
  return (
    `<rect x="18" y="26" width="64" height="48" rx="14" fill="url(#${FILL_ID})" ${inkStroke()}/>` +
    `<circle cx="50" cy="50" r="16" fill="${c.accent}" ${inkStroke()}/>` +
    `<circle cx="44" cy="46" r="4" fill="#fff" opacity="0.7"/>`
  );
}

const TEMPLATES: Record<TemplateName, (c: CreatureConfig) => string> = {
  quadruped,
  bird,
  amphibian,
  bug,
  wing,
  fish,
  produce,
  leafy,
  vehicle,
  wheeled,
  air,
  tool,
  round,
  dot,
  label,
};
```

- [ ] **Step 3: tsc kiểm cú pháp tạm** (file chưa export `creature` nên test vẫn fail — chỉ kiểm biên dịch phần này không lỗi sau Task 3). Bỏ qua chạy test ở bước này; hoàn tất ở Task 3.

Run: `npx tsc -b 2>&1 | head -20`
Expected: có thể báo "TEMPLATES declared but never used" (sẽ dùng ở Task 3) — chấp nhận tạm; KHÔNG có lỗi cú pháp.

- [ ] **Step 4: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/art/creatures.ts
git commit -m "feat(art): creature kit body templates (quadruped/bird/produce/vehicle/...) (GĐ6.2)"
```

---

### Task 3: `creatures.ts` — CATALOG (id→config), `creature()`, `emojiToCreatureId()`

**Files:**
- Modify: `src/art/creatures.ts` (thêm CONFIG map + resolver + emoji map + exports; nối tiếp Task 2)

**Interfaces:**
- Produces (export công khai): `creature(id: string, title?: string): string`, `emojiToCreatureId(emoji: string): string`, `CREATURE_IDS: readonly string[]`, `COUNTING_CREATURE_IDS: readonly string[]`, `CreatureConfig` (đã export ở Task 2).

> **Màu:** mọi hue trong CONFIG là hằng hex thân thiện (giữ tông tươi storybook) HOẶC từ `palette`. `accent`/`detail` tương phản nhẹ. Đây là **nguồn màu duy nhất** cho sinh vật — scene KHÔNG truyền màu.

- [ ] **Step 1: Thêm CATALOG + resolver vào cuối `src/art/creatures.ts`**:

```ts
/**
 * The full catalog. Each id maps to a template + colours. Animals reuse the
 * quadruped/bird/etc templates with their own palette; produce/vehicles/tools
 * likewise. Colours are friendly storybook hues (some from `palette`).
 */
const CATALOG: Record<string, CreatureConfig> = {
  // ── Counting subset (6.1) — kept identical so the pilot is unchanged ──
  duck: { template: 'bird', body: '#ffd166', accent: '#ff8c42' },
  rabbit: { template: 'quadruped', body: '#f4e3ef', accent: '#ffb3a7' },
  frog: { template: 'amphibian', body: '#06d6a0', accent: '#bdf5e6' },
  bee: { template: 'bug', body: '#ffd166', accent: '#5b4636' },
  fish: { template: 'fish', body: '#7cc6fe', accent: '#bfeaff' },
  butterfly: { template: 'wing', body: '#b388ff', accent: '#ff8fab' },

  // ── Quadruped animals ──
  cat: { template: 'quadruped', body: '#ffb877', accent: '#ffd9b0' },
  dog: { template: 'quadruped', body: '#c89464', accent: '#f0d6bd' },
  tiger: { template: 'quadruped', body: '#ff9e4f', accent: '#fff0d6' },
  cow: { template: 'quadruped', body: '#f4f0ea', accent: '#d8b08a' },
  bear: { template: 'quadruped', body: '#a9744f', accent: '#e8cdb4' },
  elephant: { template: 'quadruped', body: '#b8c3cf', accent: '#dde6ee' },
  fox: { template: 'quadruped', body: '#ff8c42', accent: '#fff3e2' },
  panda: { template: 'quadruped', body: '#f6f6f6', accent: '#3a3a3a' },
  lion: { template: 'quadruped', body: '#f4b860', accent: '#c47f2e' },
  monkey: { template: 'quadruped', body: '#b07a4f', accent: '#e8c9a8' },
  turtle: { template: 'quadruped', body: '#06d6a0', accent: '#8be3c7' },

  // ── Birds ──
  bird: { template: 'bird', body: '#7cc6fe', accent: '#ffb703' },
  chicken: { template: 'bird', body: '#fff6e6', accent: '#ff8c42' },

  // ── Produce / food ──
  apple: { template: 'produce', body: '#ff6b6b', accent: '#ffd166', detail: '#06d6a0' },
  banana: { template: 'leafy', body: '#ffd166', accent: '#7a5c1e' },
  grapes: { template: 'produce', body: '#b388ff', accent: '#7a52cc', detail: '#06d6a0' },
  strawberry: { template: 'produce', body: '#ff5d7a', accent: '#ffd166', detail: '#06d6a0' },
  peach: { template: 'produce', body: '#ffb3a7', accent: '#ff8fab', detail: '#06d6a0' },
  watermelon: { template: 'produce', body: '#ff6b8a', accent: '#06d6a0', detail: '#06d6a0' },
  cake: { template: 'round', body: '#ffd9ec', accent: '#ff8fab' },
  milk: { template: 'round', body: '#f4faff', accent: '#7cc6fe' },
  egg: { template: 'round', body: '#fff6e6', accent: '#ffd166' },
  bread: { template: 'round', body: '#e6b877', accent: '#a06a3c' },

  // ── Objects ──
  ball: { template: 'round', body: '#ff8fab', accent: '#7cc6fe' },
  book: { template: 'round', body: '#7cc6fe', accent: '#ffd166' },
  cup: { template: 'round', body: '#ff8c42', accent: '#fff3e2' },
  hat: { template: 'round', body: '#b388ff', accent: '#ffd166' },
  key: { template: 'tool', body: '#ffd166', accent: '#c9a200' },
  star: { template: 'round', body: '#ffd166', accent: '#ff8c42' },
  flower: { template: 'round', body: '#ff8fab', accent: '#ffd166' },
  balloon: { template: 'round', body: '#ff6b6b', accent: '#ffd166' },
  tree: { template: 'round', body: '#06d6a0', accent: '#a06a3c' },
  sun: { template: 'round', body: '#ffd166', accent: '#ff8c42' },

  // ── Vehicles ──
  car: { template: 'wheeled', body: '#ff6b6b', accent: '#5b4636', detail: '#bfeaff' },
  bus: { template: 'vehicle', body: '#ffb703', accent: '#5b4636', detail: '#bfeaff' },
  bicycle: { template: 'wheeled', body: '#06d6a0', accent: '#5b4636', detail: '#bfeaff' },
  airplane: { template: 'air', body: '#7cc6fe', accent: '#ff8c42' },
  train: { template: 'vehicle', body: '#ff8fab', accent: '#5b4636', detail: '#bfeaff' },
  rocket: { template: 'air', body: '#ff6b6b', accent: '#ffd166' },

  // ── Tools ──
  hammer: { template: 'tool', body: '#b8c3cf', accent: '#a06a3c' },
  scissors: { template: 'tool', body: '#7cc6fe', accent: '#ff8fab' },
  wrench: { template: 'tool', body: '#b8c3cf', accent: '#5b4636' },
  ruler: { template: 'tool', body: '#ffd166', accent: '#ff8c42' },
  paintbrush: { template: 'tool', body: '#b388ff', accent: '#a06a3c' },

  // ── Pattern dots (colour tokens) ──
  'dot-red': { template: 'dot', body: '#ff5d5d', accent: '#ff5d5d' },
  'dot-blue': { template: 'dot', body: '#4f93ff', accent: '#4f93ff' },
  'dot-yellow': { template: 'dot', body: '#ffd23f', accent: '#ffd23f' },
  'dot-green': { template: 'dot', body: '#2ecf8f', accent: '#2ecf8f' },
  'dot-purple': { template: 'dot', body: '#b06bff', accent: '#b06bff' },

  // ── Sorting basket labels ──
  'label-animals': { template: 'label', body: '#ffd9b0', accent: '#ff8c42' },
  'label-food': { template: 'label', body: '#ffd9ec', accent: '#ff8fab' },
  'label-vehicles': { template: 'label', body: '#bfeaff', accent: '#7cc6fe' },
};

/** Every id the kit can draw (for the style board + the contract tests). */
export const CREATURE_IDS = Object.keys(CATALOG) as readonly string[];

/** The six counting animals (re-sourced here; `creaturesCounting.ts` re-exports). */
export const COUNTING_CREATURE_IDS = ['duck', 'rabbit', 'frog', 'bee', 'fish', 'butterfly'] as const;

/**
 * Resolve an id → a complete storybook <svg>. Unknown id → a safe friendly blob
 * (never blank, never throws), so a scene can never strand a wrong sprite.
 */
export function creature(id: string, title = ''): string {
  const cfg = CATALOG[id];
  if (!cfg) {
    const defs = paintedFill(FILL_ID, palette.primary) + softShadow(SHADOW_ID);
    return svgDoc(
      withDefs(
        defs,
        `<g filter="url(#${SHADOW_ID})"><circle cx="50" cy="52" r="30" fill="url(#${FILL_ID})" ${inkStroke()}/>${eyes(50, 48)}${smile(50, 60, 12)}</g>`,
      ),
      title,
    );
  }
  const defs = paintedFill(FILL_ID, cfg.body) + softShadow(SHADOW_ID);
  const body = TEMPLATES[cfg.template](cfg);
  return svgDoc(withDefs(defs, `<g filter="url(#${SHADOW_ID})">${body}</g>`), title);
}

/**
 * Map a CONTENT emoji (as stored in a game's *Logic.ts) to a creature id. The
 * single translation layer so every scene's render call is `creature(emojiToId(e))`
 * while logic keeps emitting its existing emoji tokens (byte-output unchanged).
 * Unknown emoji → a stable fallback id (never blank).
 */
const EMOJI_TO_ID: Record<string, string> = {
  // counting + animals
  '🦆': 'duck', '🐰': 'rabbit', '🐸': 'frog', '🐝': 'bee', '🐟': 'fish', '🦋': 'butterfly',
  '🐱': 'cat', '🐶': 'dog', '🐯': 'tiger', '🐮': 'cow', '🐻': 'bear', '🐘': 'elephant',
  '🦊': 'fox', '🐼': 'panda', '🦁': 'lion', '🐵': 'monkey', '🐢': 'turtle',
  '🐦': 'bird', '🐔': 'chicken',
  // produce / food
  '🍎': 'apple', '🍌': 'banana', '🍇': 'grapes', '🍓': 'strawberry', '🍑': 'peach',
  '🍉': 'watermelon', '🍰': 'cake', '🥛': 'milk', '🥚': 'egg', '🍞': 'bread',
  // objects
  '⚽': 'ball', '📖': 'book', '☕': 'cup', '🎩': 'hat', '🔑': 'key', '⭐': 'star',
  '🌸': 'flower', '🌷': 'flower', '🎈': 'balloon', '🌳': 'tree', '☀️': 'sun',
  // vehicles
  '🚗': 'car', '🚌': 'bus', '🚲': 'bicycle', '✈️': 'airplane', '🚂': 'train', '🚀': 'rocket',
  // tools
  '🔨': 'hammer', '✂️': 'scissors', '🔧': 'wrench', '📏': 'ruler', '🖌️': 'paintbrush',
  // pattern colour tokens
  '🔴': 'dot-red', '🔵': 'dot-blue', '🟡': 'dot-yellow', '🟢': 'dot-green', '🟣': 'dot-purple',
  // sorting basket labels
  '🐾': 'label-animals', '🍽️': 'label-food', '🚦': 'label-vehicles',
};

export function emojiToCreatureId(emoji: string): string {
  return EMOJI_TO_ID[emoji] ?? 'star';
}
```

- [ ] **Step 2: Chạy test creatures → PASS**

Run: `npx vitest run src/art/creatures.test.ts`
Expected: PASS (mọi id ra `<svg>`; mọi emoji game map vào id biết; fallback an toàn).

> Nếu một emoji nào FAIL (chưa có trong `EMOJI_TO_ID`/`CATALOG`): thêm cặp tương ứng. Test phủ TẤT CẢ emoji của 9 game nên đây là lưới an toàn.

- [ ] **Step 3: tsc + lint sạch**

Run: `npx tsc -b && npx eslint src/art/creatures.ts src/art/creatures.test.ts`
Expected: không lỗi (TEMPLATES giờ đã dùng).

- [ ] **Step 4: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/art/creatures.ts src/art/creatures.test.ts
git commit -m "feat(art): full creature catalog + creature()/emojiToCreatureId() + tests (GĐ6.2)"
```

---

### Task 4: Gộp `creaturesCounting.ts` → re-export mỏng (0 nhân đôi)

**Files:**
- Modify: `src/art/creaturesCounting.ts` (xoá định nghĩa trùng; re-export từ `./creatures`)

**Interfaces:**
- Produces (GIỮ NGUYÊN API 6.1 mà `CountingFunScene.ts` + `creaturesCounting.test.ts` import): `creature`, `emojiToCreatureId`, `COUNTING_CREATURE_IDS`, `type CreatureId`.

> **Mục tiêu spec:** "make creatures.ts the canonical kit and refactor creaturesCounting.ts to re-export/build on it — NO duplicated creature definitions". `CountingFunScene` import `creature, emojiToCreatureId` từ `'../../art/creaturesCounting'` — **không đổi import của scene** (re-export giữ đường dẫn cũ sống).

- [ ] **Step 1: Thay TOÀN BỘ `src/art/creaturesCounting.ts` bằng re-export**:

```ts
/**
 * KiddyHub — Counting-fun creature subset (Giai đoạn 6 · 6.1 → consolidated 6.2).
 *
 * 6.1 shipped a MINIMAL pilot kit here. 6.2 makes `creatures.ts` the canonical,
 * full kit; to avoid ANY duplicated creature definition, this module now simply
 * RE-EXPORTS the shared resolver + the counting subset from `creatures.ts`. The
 * counting-fun scene keeps importing `creature` / `emojiToCreatureId` from this
 * path unchanged — its behaviour and tests are untouched.
 */
export { creature, emojiToCreatureId, COUNTING_CREATURE_IDS } from './creatures';

/** The six counting animals as a literal union (6.1 type, preserved for callers). */
export type CreatureId = 'duck' | 'rabbit' | 'frog' | 'bee' | 'fish' | 'butterfly';
```

- [ ] **Step 2: Chạy test 6.1 (creaturesCounting + counting-fun) → PASS không đổi**

Run: `npx vitest run src/art/creaturesCounting.test.ts src/games/counting-fun`
Expected: PASS — `creature(id)` mọi counting id vẫn ra `<svg>` (giờ từ catalog đầy đủ), `emojiToCreatureId` phủ `COUNTING_ANIMALS`, counting-fun index/logic test xanh.

> **Lưu ý kiểu:** `creaturesCounting.test.ts` 6.1 dùng `creature(id)` với `id: CreatureId` và `COUNTING_CREATURE_IDS.includes(id)`. `creatures.ts` xuất `creature(id: string)` (rộng hơn) và `COUNTING_CREATURE_IDS` là `readonly ['duck'...]` → `.includes` so khớp `string` vẫn hợp lệ. `emojiToCreatureId` giờ trả `string` (thay vì `CreatureId`); test 6.1 chỉ khẳng định `COUNTING_CREATURE_IDS.toContain(id)` → vẫn xanh. Nếu `tsc` than về thu hẹp kiểu ở test cũ, KHÔNG sửa test — thay vào đó để `creaturesCounting` re-export đúng như trên (kiểu `string` tương thích `toContain`).

- [ ] **Step 3: tsc + lint**

Run: `npx tsc -b && npx eslint src/art/creaturesCounting.ts`
Expected: sạch.

- [ ] **Step 4: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/art/creaturesCounting.ts
git commit -m "refactor(art): creaturesCounting re-exports the canonical creatures kit (GĐ6.2)"
```

---

### Task 5: `first-words` — option emoji → creature SVG

**Files:**
- Modify: `src/games/first-words/FirstWordsScene.ts` (chỉ dòng render option label)

**Interfaces:**
- Consumes: `creature`, `emojiToCreatureId` (`../../art/creatures`); `addArt`, `type ArtScene` (`../../art/svg`).

> **Bất biến:** `item.emoji` (từ logic) GIỮ là khoá chọn? KHÔNG — khoá chọn là `item.word` (xem `choose(item.word,…)`). `label` chỉ là VIEW. Thay `label` từ `Text(emoji)` → `Image(creature)`. `optionObjs.label` kiểu hiện là `Phaser.GameObjects.Text` nhưng chỉ được truyền vào `shakeOption`/`dimDistractor`/`popCorrect`/`animateIn` (đều nhận object có `x`/`scale`/`setAlpha`) → đổi kiểu sang `Phaser.GameObjects.Image` an toàn. `tile`/`btn`/hit-area/scaffold KHÔNG đổi.

- [ ] **Step 1: Thêm import** (đầu file, sau dòng import sceneMotion):

```ts
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
```

- [ ] **Step 2: Đổi kiểu `optionObjs.label`** từ `Phaser.GameObjects.Text` → `Phaser.GameObjects.Image` (khai báo mảng, ~L24-29):

```ts
  private optionObjs: Array<{
    value: string;
    tile: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Image;
    btn: Phaser.GameObjects.Rectangle;
  }> = [];
```

- [ ] **Step 3: Thay dòng render label** (L89) và kiểu tham số `choose`:

Đổi:
```ts
      const label = this.add.text(x, y, item.emoji, { fontSize: '66px' }).setOrigin(0.5);
```
Thành:
```ts
      const id = emojiToCreatureId(item.emoji);
      const label = addArt(
        this as unknown as ArtScene,
        `creature-${id}`,
        creature(id),
        x,
        y,
        108,
      ) as unknown as Phaser.GameObjects.Image;
```

- [ ] **Step 4: Cập nhật chữ ký `choose(...)`** (L100-105) — `label` kiểu `Image`:

```ts
  private choose(
    word: string,
    btn: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Image,
  ): void {
```

(Thân `choose` không đổi: `popCorrect(this, label)` nhận `MotionObject` (Image hợp lệ); `shakeOption(this, tile, label, btn)` nhận `{x}` — Image hợp lệ.)

- [ ] **Step 5: Chạy test first-words + tsc + lint**

Run: `npx vitest run src/games/first-words && npx tsc -b && npx eslint src/games/first-words/FirstWordsScene.ts`
Expected: PASS + sạch (index/logic test của first-words không chạm scene render text, vẫn xanh).

- [ ] **Step 6: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/games/first-words/FirstWordsScene.ts
git commit -m "feat(first-words): draw creature SVG options instead of emoji (GĐ6.2)"
```

---

### Task 6: `first-letter` — emoji câu hỏi → creature SVG (option chữ GIỮ text)

**Files:**
- Modify: `src/games/first-letter/FirstLetterScene.ts` (chỉ dòng vẽ `entry.emoji`)

**Interfaces:**
- Consumes: `creature`, `emojiToCreatureId` (`../../art/creatures`); `addArt`, `type ArtScene` (`../../art/svg`).

> **Bất biến:** option chữ cái (`letter`, `label = add.text(letter…)`) là **text glyph — GIỮ NGUYÊN** (không phải emoji). Chỉ thay HÌNH minh hoạ câu hỏi (`entry.emoji`, L75). Logic/hit-area/scaffold không đổi.

- [ ] **Step 1: Thêm import**:

```ts
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
```

- [ ] **Step 2: Thay dòng vẽ emoji câu hỏi** (L74-76):

Đổi:
```ts
    this.layer.add(
      this.add.text(width / 2, height / 2 - 60, this.current.entry.emoji, { fontSize: '120px' }).setOrigin(0.5),
    );
```
Thành:
```ts
    const pictureId = emojiToCreatureId(this.current.entry.emoji);
    this.layer.add(
      addArt(
        this as unknown as ArtScene,
        `creature-${pictureId}`,
        creature(pictureId),
        width / 2,
        height / 2 - 60,
        160,
      ) as unknown as Phaser.GameObjects.Image,
    );
```

- [ ] **Step 3: Chạy test + tsc + lint**

Run: `npx vitest run src/games/first-letter && npx tsc -b && npx eslint src/games/first-letter/FirstLetterScene.ts`
Expected: PASS + sạch.

- [ ] **Step 4: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/games/first-letter/FirstLetterScene.ts
git commit -m "feat(first-letter): draw creature SVG picture instead of emoji (GĐ6.2)"
```

---

### Task 7: `odd-one-out` — item emoji → creature SVG

**Files:**
- Modify: `src/games/odd-one-out/OddOneOutScene.ts` (dòng render `label` item)

**Interfaces:**
- Consumes: `creature`, `emojiToCreatureId` (`../../art/creatures`); `addArt`, `type ArtScene` (`../../art/svg`).

> **Bất biến:** khoá chọn là `index` (vị trí), `choose(i,…)` không đổi. `label` = VIEW. `items.forEach((emoji,i)=>…)` giữ; chỉ đổi `label`. `popCorrect`/`shakeOption` nhận Image OK.

- [ ] **Step 1: Thêm import**:

```ts
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
```

- [ ] **Step 2: Thay dòng render label** (L65):

Đổi:
```ts
      const label = this.add.text(x, y, emoji, { fontSize: '64px' }).setOrigin(0.5);
```
Thành:
```ts
      const id = emojiToCreatureId(emoji);
      const label = addArt(
        this as unknown as ArtScene,
        `creature-${id}`,
        creature(id),
        x,
        y,
        104,
      ) as unknown as Phaser.GameObjects.Image;
```

- [ ] **Step 3: Cập nhật chữ ký `choose(...)`** (L75-80) — `label: Phaser.GameObjects.Image`:

```ts
  private choose(
    index: number,
    btn: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Image,
  ): void {
```

- [ ] **Step 4: Chạy test + tsc + lint**

Run: `npx vitest run src/games/odd-one-out && npx tsc -b && npx eslint src/games/odd-one-out/OddOneOutScene.ts`
Expected: PASS + sạch.

- [ ] **Step 5: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/games/odd-one-out/OddOneOutScene.ts
git commit -m "feat(odd-one-out): draw creature SVG items instead of emoji (GĐ6.2)"
```

---

### Task 8: `memory-match` — faceKey emoji → creature SVG (toggle visible)

**Files:**
- Modify: `src/games/memory-match/MemoryMatchScene.ts` (dòng tạo `label`)

**Interfaces:**
- Consumes: `creature`, `emojiToCreatureId` (`../../art/creatures`); `addArt`, `type ArtScene` (`../../art/svg`).

> **Bất biến:** `card.faceKey` (emoji) GIỮ ở logic (khoá ghép `pairId` so theo `card.pairId`, KHÔNG so faceKey). VIEW: thẻ úp = `setVisible(false)`, lật = `setVisible(true)`. Image hỗ trợ `setVisible`. `CardView.label` kiểu `Phaser.GameObjects.Text` → đổi `Phaser.GameObjects.Image`. `flip()`/`busy`/`matchedPairs`/`popCorrect(this, view.label)` không đổi.

- [ ] **Step 1: Thêm import**:

```ts
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
```

- [ ] **Step 2: Đổi kiểu `CardView.label`** (interface ~L7-13):

```ts
interface CardView {
  card: Card;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Image;
  matched: boolean;
  faceUp: boolean;
}
```

- [ ] **Step 3: Thay dòng tạo label** (L62-65):

Đổi:
```ts
      const label = this.add
        .text(x, y, card.faceKey, { fontSize: '64px' })
        .setOrigin(0.5)
        .setVisible(false);
```
Thành:
```ts
      const id = emojiToCreatureId(card.faceKey);
      const label = (
        addArt(this as unknown as ArtScene, `creature-${id}`, creature(id), x, y, 96) as unknown as Phaser.GameObjects.Image
      ).setVisible(false);
```

- [ ] **Step 4: Chạy test + tsc + lint**

Run: `npx vitest run src/games/memory-match && npx tsc -b && npx eslint src/games/memory-match/MemoryMatchScene.ts`
Expected: PASS + sạch.

- [ ] **Step 5: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/games/memory-match/MemoryMatchScene.ts
git commit -m "feat(memory-match): draw creature SVG card faces instead of emoji (GĐ6.2)"
```

---

### Task 9: `pattern-finder` — token màu → dot SVG (cell `?` GIỮ text)

**Files:**
- Modify: `src/games/pattern-finder/PatternFinderScene.ts` (sequence cells + option labels)

**Interfaces:**
- Consumes: `creature`, `emojiToCreatureId` (`../../art/creatures`); `addArt`, `type ArtScene` (`../../art/svg`).

> **Bất biến:** khoá chọn là `tok` (chuỗi emoji màu) — `choose(tok,…)` so `tok === answer` (cùng emoji literal) GIỮ NGUYÊN. Chỉ VIEW đổi. Ô `?` (chuỗi `'?'`) KHÔNG có trong `EMOJI_TO_ID` → giữ là `add.text('?')`. Tiếp cận: dot SVG giữ phân biệt rõ bằng MÀU + hình tròn (token vốn đã chỉ phân biệt bằng màu — không tệ hơn).

- [ ] **Step 1: Thêm import**:

```ts
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
```

- [ ] **Step 2: Thay vòng vẽ sequence cells** (L55-62) — `?` giữ text, token thành dot:

Đổi:
```ts
    const cells = [...this.current.sequence, '?'];
    const startX = width / 2 - ((cells.length - 1) * 84) / 2;
    cells.forEach((tok, i) => {
      const cell = this.add
        .text(startX + i * 84, height / 2 - 40, tok, { fontSize: '56px' })
        .setOrigin(0.5);
      this.layer!.add(cell);
    });
```
Thành:
```ts
    const cells = [...this.current.sequence, '?'];
    const startX = width / 2 - ((cells.length - 1) * 84) / 2;
    cells.forEach((tok, i) => {
      const cx = startX + i * 84;
      const cy = height / 2 - 40;
      if (tok === '?') {
        this.layer!.add(
          this.add
            .text(cx, cy, '?', { fontSize: '56px', color: '#5b4636', fontStyle: 'bold' })
            .setOrigin(0.5),
        );
      } else {
        const id = emojiToCreatureId(tok);
        this.layer!.add(
          addArt(this as unknown as ArtScene, `creature-${id}`, creature(id), cx, cy, 66) as unknown as Phaser.GameObjects.Image,
        );
      }
    });
```

- [ ] **Step 3: Thay dòng render option label** (L76) + chữ ký `choose`:

Đổi:
```ts
      const label = this.add.text(x, y, tok, { fontSize: '48px' }).setOrigin(0.5);
```
Thành:
```ts
      const id = emojiToCreatureId(tok);
      const label = addArt(
        this as unknown as ArtScene,
        `creature-${id}`,
        creature(id),
        x,
        y,
        72,
      ) as unknown as Phaser.GameObjects.Image;
```

- [ ] **Step 4: Cập nhật chữ ký `choose(...)`** (L86-91) — `label: Phaser.GameObjects.Image`:

```ts
  private choose(
    tok: string,
    btn: Phaser.GameObjects.Rectangle,
    tile: Phaser.GameObjects.Image,
    label: Phaser.GameObjects.Image,
  ): void {
```

- [ ] **Step 5: Chạy test + tsc + lint**

Run: `npx vitest run src/games/pattern-finder && npx tsc -b && npx eslint src/games/pattern-finder/PatternFinderScene.ts`
Expected: PASS + sạch.

- [ ] **Step 6: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/games/pattern-finder/PatternFinderScene.ts
git commit -m "feat(pattern-finder): draw painted dot SVG tokens instead of emoji (GĐ6.2)"
```

---

### Task 10: `match-quantity` — emoji nhóm → creature SVG (số kéo GIỮ)

**Files:**
- Modify: `src/games/match-quantity/MatchQuantityScene.ts` (vòng vẽ `pair.emoji` thành lưới)

**Interfaces:**
- Consumes: `creature`, `emojiToCreatureId` (`../../art/creatures`); `addArt`, `type ArtScene` (`../../art/svg`).

> **Bất biến:** ô số kéo (rectangle vàng + Text số) là HIT-AREA + drag — GIỮ NGUYÊN HOÀN TOÀN (không phải emoji). Chỉ thay nhóm emoji minh hoạ số lượng (L63-69). Đây là `furniture` (static, đưa vào `animateIn`) — Image vẫn vào được mảng `MotionObject`.

- [ ] **Step 1: Thêm import**:

```ts
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
```

- [ ] **Step 2: Thay vòng vẽ nhóm emoji** (L63-69):

Đổi:
```ts
      for (let k = 0; k < pair.value; k++) {
        const col = k % 5;
        const row = Math.floor(k / 5);
        furniture.push(
          this.add.text(startX + col * 46, y - 20 + row * 40, pair.emoji, { fontSize: '36px' }).setOrigin(0.5),
        );
      }
```
Thành:
```ts
      const id = emojiToCreatureId(pair.emoji);
      const svg = creature(id);
      for (let k = 0; k < pair.value; k++) {
        const col = k % 5;
        const row = Math.floor(k / 5);
        furniture.push(
          addArt(
            this as unknown as ArtScene,
            `creature-${id}`,
            svg,
            startX + col * 46,
            y - 20 + row * 40,
            44,
          ) as unknown as Phaser.GameObjects.Image,
        );
      }
```

- [ ] **Step 3: Chạy test + tsc + lint**

Run: `npx vitest run src/games/match-quantity && npx tsc -b && npx eslint src/games/match-quantity/MatchQuantityScene.ts`
Expected: PASS + sạch.

- [ ] **Step 4: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/games/match-quantity/MatchQuantityScene.ts
git commit -m "feat(match-quantity): draw creature SVG quantity groups instead of emoji (GĐ6.2)"
```

---

### Task 11: `more-less` — emoji nhóm → creature SVG

**Files:**
- Modify: `src/games/more-less/MoreLessScene.ts` (hàm `drawGroup`)

**Interfaces:**
- Consumes: `creature`, `emojiToCreatureId` (`../../art/creatures`); `addArt`, `type ArtScene` (`../../art/svg`).

> **Bất biến:** hit-area là `leftFrame`/`rightFrame` (rectangle trong suốt) — GIỮ. `isCorrect`/`choose` so theo `leftCount`/`rightCount` (số lượng object vẽ) — KHÔNG đổi. `drawGroup` vẽ `count` Image thay `count` Text.

- [ ] **Step 1: Thêm import**:

```ts
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
```

- [ ] **Step 2: Thay thân `drawGroup`** (L33-47):

Đổi:
```ts
  private drawGroup(cx: number, count: number, emoji: string): void {
    const cols = Math.min(3, count);
    const cellW = 56;
    const cellH = 56;
    const startX = cx - ((cols - 1) * cellW) / 2;
    const topY = 210;
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const t = this.add
        .text(startX + col * cellW, topY + row * cellH, emoji, { fontSize: '44px' })
        .setOrigin(0.5);
      this.layer!.add(t);
    }
  }
```
Thành:
```ts
  private drawGroup(cx: number, count: number, emoji: string): void {
    const cols = Math.min(3, count);
    const cellW = 56;
    const cellH = 56;
    const startX = cx - ((cols - 1) * cellW) / 2;
    const topY = 210;
    const id = emojiToCreatureId(emoji);
    const svg = creature(id);
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const t = addArt(
        this as unknown as ArtScene,
        `creature-${id}`,
        svg,
        startX + col * cellW,
        topY + row * cellH,
        50,
      ) as unknown as Phaser.GameObjects.Image;
      this.layer!.add(t);
    }
  }
```

- [ ] **Step 3: Chạy test + tsc + lint**

Run: `npx vitest run src/games/more-less && npx tsc -b && npx eslint src/games/more-less/MoreLessScene.ts`
Expected: PASS + sạch.

- [ ] **Step 4: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/games/more-less/MoreLessScene.ts
git commit -m "feat(more-less): draw creature SVG groups instead of emoji (GĐ6.2)"
```

---

### Task 12: `sorting` — item draggable Text→Image + label giỏ → creature SVG

**Files:**
- Modify: `src/games/sorting/SortingScene.ts` (label giỏ L62; pile item draggable L75-83; drag/dragend handler kiểu)

**Interfaces:**
- Consumes: `creature`, `emojiToCreatureId` (`../../art/creatures`); `addArt`, `type ArtScene` (`../../art/svg`).

> **Bất biến (QUAN TRỌNG — đây là drag game):** pile item vốn là `Text` **vừa hiển thị vừa là object draggable** (`setInteractive({draggable})` + `setData('basketIndex'/'homeX'/'homeY')` + `input.setDraggable(obj)`). Sprite mới phải là **Image draggable** thay đúng vai trò: `addArt(...)` trả Image, rồi `.setInteractive({useHandCursor:true, draggable:true})` + cùng `setData` + `setDraggable`. `onDrop` đọc `obj.x/obj.y` + `getData` → Image có đủ. Handler `drag`/`dragend` kiểu `Phaser.GameObjects.Text` → đổi `Phaser.GameObjects.Image`. SNAP distance + so `best.index === wantBasket` KHÔNG đổi. Label giỏ (`basket.label`, emoji 🐾/🍽️/🚦) là furniture tĩnh → Image qua `addArt`.

- [ ] **Step 1: Thêm import**:

```ts
import { addArt, type ArtScene } from '../../art/svg';
import { creature, emojiToCreatureId } from '../../art/creatures';
```

- [ ] **Step 2: Thay label giỏ** (L62):

Đổi:
```ts
      furniture.push(this.add.text(x, basketY, basket.label, { fontSize: '72px' }).setOrigin(0.5));
```
Thành:
```ts
      const labelId = emojiToCreatureId(basket.label);
      furniture.push(
        addArt(this as unknown as ArtScene, `creature-${labelId}`, creature(labelId), x, basketY, 100) as unknown as Phaser.GameObjects.Image,
      );
```

- [ ] **Step 3: Thay pile item draggable** (L75-82) — Text→Image, GIỮ mọi `setData`/`setDraggable`:

Đổi:
```ts
      const obj = this.add
        .text(x, trayY, item.emoji, { fontSize: '56px' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true, draggable: true });
      obj.setData('basketIndex', item.basketIndex);
      obj.setData('homeX', x);
      obj.setData('homeY', trayY);
      this.input.setDraggable(obj);
```
Thành:
```ts
      const itemId = emojiToCreatureId(item.emoji);
      const obj = (
        addArt(this as unknown as ArtScene, `creature-${itemId}`, creature(itemId), x, trayY, 72) as unknown as Phaser.GameObjects.Image
      ).setInteractive({ useHandCursor: true, draggable: true });
      obj.setData('basketIndex', item.basketIndex);
      obj.setData('homeX', x);
      obj.setData('homeY', trayY);
      this.input.setDraggable(obj);
```

- [ ] **Step 4: Đổi kiểu handler drag/dragend** (L88-92) `Text`→`Image`:

```ts
    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, dx: number, dy: number) => {
      obj.x = dx;
      obj.y = dy;
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => this.onDrop(obj));
```

- [ ] **Step 5: Đổi chữ ký `onDrop`** (L95) `Text`→`Image`:

```ts
  private onDrop(obj: Phaser.GameObjects.Image): void {
```

(Thân `onDrop` không đổi: đọc `obj.x/obj.y`, `obj.getData(...)`, `obj.disableInteractive()`, `popCorrect(this, obj)` — Image có đủ.)

- [ ] **Step 6: Chạy test + tsc + lint**

Run: `npx vitest run src/games/sorting && npx tsc -b && npx eslint src/games/sorting/SortingScene.ts`
Expected: PASS + sạch.

- [ ] **Step 7: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add src/games/sorting/SortingScene.ts
git commit -m "feat(sorting): draggable creature SVG items + drawn basket labels (GĐ6.2)"
```

---

### Task 13 (tuỳ chọn): Mở rộng style board với catalog creatures

**Files:**
- Modify: `scripts/build-style-sample.mjs` (thêm hàng catalog đầy đủ)

> Không bắt buộc; chỉ để eyeball. Nếu headless render rắc rối, BỎ QUA — không chặn hoàn thành.

- [ ] **Step 1: Đổi import + thêm hàng** trong `scripts/build-style-sample.mjs`:

Đổi dòng import (L12):
```js
import { creature, COUNTING_CREATURE_IDS } from '../src/art/creaturesCounting.ts';
```
Thành:
```js
import { creature, CREATURE_IDS } from '../src/art/creatures.ts';
```

Và thay chỗ dựng hàng creature (L111) để duyệt `CREATURE_IDS` (gói nhiều hàng nếu nhiều id), ví dụ:
```js
  CREATURE_IDS.map((id, i) => {
    const col = i % 8;
    const row = Math.floor(i / 8);
    return cell(60 + col * 116, 864 + row * 116, 96, 96, () => creature(id), id);
  }).join('') +
```

(Nếu `COUNTING_CREATURE_IDS` còn dùng ở chỗ khác trong script, vẫn re-export từ `creatures.ts` nên có thể import kèm.)

- [ ] **Step 2: Chạy thử** (cho phép thất bại nếu môi trường thiếu tsx/headless — KHÔNG chặn):

Run: `npx tsx scripts/build-style-sample.mjs 2>&1 | tail -5 || echo "style board skipped (non-blocking)"`
Expected: tạo file PNG/SVG board HOẶC bỏ qua sạch.

- [ ] **Step 3: Commit** *(BỎ QUA khi chạy 6.2)*

```bash
git add scripts/build-style-sample.mjs
git commit -m "chore(style-board): show full creature catalog (GĐ6.2)"
```

---

### Task 14: Verify tổng (verification-before-completion)

**Files:** none (chỉ chạy lệnh).

> REQUIRED SUB-SKILL khi tới đây: superpowers:verification-before-completion. KHÔNG tuyên bố xong trước khi cả 4 lệnh xanh/exit 0.

- [ ] **Step 1: `npm test`** — báo cáo tổng số (kỳ vọng ≥ 480; thêm `creatures.test.ts` nên cao hơn).

Run: `npm test 2>&1 | tail -8`
Expected: `Test Files  N passed (N)` · `Tests  M passed (M)` với M ≥ 480, exit 0.

- [ ] **Step 2: `npm run build`** (gồm `tsc -b && vite build`).

Run: `npm run build 2>&1 | tail -12`
Expected: build thành công, exit 0.

- [ ] **Step 3: `npm run lint`**.

Run: `npm run lint 2>&1 | tail -8`
Expected: 0 lỗi, exit 0.

- [ ] **Step 4: `npx tsc -b`**.

Run: `npx tsc -b 2>&1 | tail -8`
Expected: 0 lỗi, exit 0.

- [ ] **Step 5: Lưới an toàn — không còn `add.text(<emoji>)` nội dung sót**:

Run: `grep -rn "add\.text([^)]*emoji\|add\.text([^)]*faceKey\|add\.text([^)]*\.label\b\|add\.text([^)]*tok\b" src/games --include="*Scene.ts" | grep -v "'?'"`
Expected: KHÔNG còn dòng nào trả emoji nội dung qua `add.text` (chỉ còn chữ cái/số/`?` là text glyph hợp lệ). Kiểm thủ công nếu grep nhiễu.

- [ ] **Step 6: (KHÔNG commit/push/docker)** — orchestrator lo. Để thay đổi uncommitted.

---

## Self-Review (đối chiếu spec §5/§10/§12)

- **§5 "Khai tử emoji → `creatures.ts` kit tham số":** Task 1-3 tạo `creatures.ts` (templates + CONFIG + resolver + emoji map). ✅
- **§5/§10 "audit emoji → danh sách id":** mục "Audit" + "Danh sách id" ở đầu plan (58 id, 9 game). ✅
- **§10 6.2 "thay sprite các game số/chữ/logic/trí nhớ":** Task 5-12 phủ first-words, first-letter, odd-one-out, memory-match, pattern-finder, match-quantity, more-less, sorting. ✅ (counting-fun đã xong 6.1.)
- **Consolidate creaturesCounting (yêu cầu prompt):** Task 4 re-export, 0 nhân đôi. ✅
- **§12 không thêm dep / không đụng logic / không phá tiếp cận:** Global Constraints + mỗi task ghi "logic GIỮ byte-output", "hit-area/drag-snap KHÔNG đổi", "calmMode/mù màu không đụng". ✅
- **§11 test creatures (mọi id → svg, màu token, unknown → fallback):** Task 1 `creatures.test.ts`. ✅
- **Stub Phaser:** không chạm API mới (chỉ `add.image` qua `addArt` — đã có; counting-fun chứng minh). Không cần sửa stub. ✅
- **Placeholder scan:** mọi step có code thật + lệnh + expected. ✅
- **Type consistency:** `creature(id:string,title?)`, `emojiToCreatureId(emoji):string`, `CREATURE_IDS`, `COUNTING_CREATURE_IDS` dùng nhất quán Task 1↔3↔4↔5-12. Mọi scene đổi `label`/`obj`/handler từ `Text`→`Image` đồng bộ với chữ ký `choose`/`onDrop`. ✅

## Deviation đã biết / cần người soi mắt

- **jigsaw 🦊 (L55):** placeholder ảnh nền ghép hình (spec & comment ghi "Phase 4 only swaps this for a real AI image"), được `rt.draw` vào renderTexture rồi cắt thành mảnh — KHÔNG phải token nội dung trẻ thao tác. Ngoài phạm vi "thay emoji nội dung" của 6.2; GIỮ NGUYÊN, ghi deviation. (Có thể thay bằng `foxIdle()` SVG ở phase sau nếu muốn ảnh ghép đẹp hơn, nhưng cần renderTexture-draw-Image — rủi ro stub/headless, không làm trong 6.2.)
- **Tỉ lệ/căn chỉnh sprite:** kích thước render (size px) chọn xấp xỉ "trọng lượng thị giác" của fontSize emoji cũ (vd 66px emoji → ~108px sprite vì sprite có lề trong viewBox). Cần **manual-browser-test** xác nhận không tràn tile/đè chữ trên Chrome/Cốc Cốc macOS.
- **Vẽ tay sinh vật:** hình SVG tham số là "đủ nhận ra + dễ thương storybook", KHÔNG tả thực. Một số id (panda/lion/monkey/elephant…) chỉ khác màu trên cùng template quadruped → phân biệt chủ yếu bằng MÀU + ngữ cảnh. Người soi mắt nên xác nhận đủ phân biệt cho trẻ; nếu cần, phase sau có thể thêm chi tiết tai/vòi riêng (ngoài phạm vi 6.2).
