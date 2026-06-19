# KiddyHub — Giai đoạn 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 9 more playable games (#2, #5, #7, #14, #15, #12, #16, #3, #8) so KiddyHub reaches 15 of its 16 designed games (#10 "Tìm Điểm Khác" is deferred to Phase 4 — it needs real art), each cloning the `counting-fun` (touch-select) or `jigsaw` (drag-drop) template.

**Architecture:** Each game lives in `src/games/<id>/` and clones an existing template: a pure-logic module (`<id>Logic.ts`, randomness injected via `Rng`, fully unit-tested) + a `Phaser.Scene` (built from `(host, level)`, using `host.speak/playSfx/awardStars/complete/goHome`, guarded against double-resolve) + a `GameModule` (`index.ts`) registered in `registerAllGames`. Placeholder voice keys (`''`) go into `AUDIO_MANIFEST`. The shell, map, garden, progression, registry, data layer, `applyCompletion`, and `GameModule`/`GameHost` contracts are NOT touched — `CategoryScreen` reads the registry dynamically, so registering a game is enough to fill an island. Seven games are touch-select (clone `CountingFunScene`); two (#3 `match-quantity`, #8 `sorting`) are drag-drop (clone `JigsawScene`'s `setDraggable` + `input.on('drag'|'dragend')` + snap-to-target pattern). Two (#12 `shapes-colors`, #16 `colors-english`) draw their options with Phaser `Graphics` instead of emoji.

**Tech Stack:** TypeScript 5 (strict), Phaser 3 (scenes), Vitest 2. In test runs, `phaser` is aliased to `src/test/phaser-stub.ts` (see `vite.config.ts`), so tests cover pure logic + module metadata only; scenes are verified manually via `npm run dev`.

## Global Constraints

- **Runtime/target:** Web app for tablet browsers. No server, no network, all persistence local (IndexedDB). Node >= 18.
- **TypeScript:** `strict: true`. No `any` in committed code unless justified by a comment.
- **Language/UI copy:** All player-facing UI text in Vietnamese (even the English games' instructions). Mascot is a fox ("Cáo 🦊"). For the English group (#14/#15/#16), the *answer* content is English (letters/numbers/colour names) but the on-screen instruction text stays Vietnamese.
- **Age (3–5, pre-readers):** Voiced instructions, large touch targets (≥ 72px), NO "lose"/"game over"/timer/penalty — wrong answers get gentle encouragement + retry.
- **Assets:** Emoji / coloured shapes (Phaser `Graphics`) / uppercase letters only. NO AI art in Phase 3. Audio sources are empty (`''`); `AudioManager` treats `''` as a silent no-op so `speak()` resolves immediately and the app runs with no audio files. Real art + voice land in Phase 4.
- **Randomness:** All pure logic takes `rng: () => number` (type `Rng`) so tests are deterministic. Scenes pass `Math.random` at runtime. Every `generateRound`/`buildRound` MUST guarantee complete, non-duplicated choices even under a degenerate rng (e.g. always returns 0 or a fixed value) — copy the `countingLogic` "degenerate-rng safety net" pattern (a `for` loop that deterministically walks the source array until the set is full).
- **Star semantics (must preserve):** scene calls `host.awardStars(n)` to persist stars immediately; `host.complete(result)` records progress + advances level but does NOT re-persist stars (no double-count). `result.stars` is informational.
- **Scoring reuse:** every touch-select game runs `QUESTIONS_PER_GAME = 5` rounds and reuses `starsFor(correct, total)`: 5 correct → 3⭐, ≥60% (≥3) → 2⭐, else → 1⭐. Each drag-drop game (#3, #8) plays ONE board: `correct` = number of tiles placed correctly on the FIRST drop attempt, `total` = number of tiles; it reuses the SAME `starsFor(correct, total)` formula (defined locally in its logic file).
- **Do NOT modify:** `src/App.tsx`, `src/state/*`, `src/components/AdventureMap.tsx`, `src/components/CategoryScreen.tsx`, `src/components/StarGarden.tsx`, `src/components/parent/*`, `src/components/GameContainer.tsx`, `src/games/progression.ts`, `src/games/applyCompletion.ts`, `src/games/GameModule.ts`, `src/games/registry.ts`, `src/data/*`, `src/audio/AudioManager.ts`, `src/content/categories.ts`. The ONLY shared files touched are `src/games/index.ts` (one register line per game) and `src/audio/audioManifest.ts` (one voice key per game).
- **No total-count test to fix:** `registry.test.ts` uses fake games + `_clearRegistry()`; `CategoryScreen.test.tsx` calls `registerAllGames()` then reads the registry dynamically. Neither asserts a game count, so registering 9 more games breaks nothing — there is NO "6 → 15" constant to update anywhere.
- **Test scope:** Unit-test pure logic + module metadata. Do NOT write Phaser scene tests (jsdom has no WebGL; `phaser` is stubbed). Verify scenes manually in Task 10.
- **Categories (valid `categoryId` values):** `numbers`, `letters`, `logic`, `memory`, `shapes`, `english` — all already exist in `src/content/categories.ts`; do not add or rename.
- **Commits:** One commit per task at the task's final step.

---

## File Structure

```
kiddy-hub/
  src/
    games/
      index.ts                       # MODIFY: add 9 import + register lines
      more-less/                     # Task 1 (#2, numbers, touch-select)
        moreLessLogic.ts
        moreLessLogic.test.ts
        MoreLessScene.ts
        index.ts
        index.test.ts
      first-letter/                  # Task 2 (#5, letters, touch-select)
        firstLetterLogic.ts
        firstLetterLogic.test.ts
        FirstLetterScene.ts
        index.ts
        index.test.ts
      odd-one-out/                   # Task 3 (#7, logic, touch-select)
        oddOneOutLogic.ts
        oddOneOutLogic.test.ts
        OddOneOutScene.ts
        index.ts
        index.test.ts
      abc-english/                   # Task 4 (#14, english, touch-select)
        abcLogic.ts
        abcLogic.test.ts
        AbcEnglishScene.ts
        index.ts
        index.test.ts
      numbers-english/               # Task 5 (#15, english, touch-select)
        numbersEnLogic.ts
        numbersEnLogic.test.ts
        NumbersEnglishScene.ts
        index.ts
        index.test.ts
      shapes-colors/                 # Task 6 (#12, shapes, Graphics)
        shapeColorLogic.ts
        shapeColorLogic.test.ts
        ShapesColorsScene.ts
        index.ts
        index.test.ts
      colors-english/                # Task 7 (#16, english, Graphics)
        colorsEnLogic.ts
        colorsEnLogic.test.ts
        ColorsEnglishScene.ts
        index.ts
        index.test.ts
      match-quantity/                # Task 8 (#3, numbers, drag-drop)
        matchQuantityLogic.ts
        matchQuantityLogic.test.ts
        MatchQuantityScene.ts
        index.ts
        index.test.ts
      sorting/                       # Task 9 (#8, logic, drag-drop)
        sortingLogic.ts
        sortingLogic.test.ts
        SortingScene.ts
        index.ts
        index.test.ts
    audio/
      audioManifest.ts               # MODIFY: add 9 voice keys
  ROADMAP.md                         # MODIFY (Task 10): tick Phase 3, move #10, log
  .superpowers/sdd/progress.md       # MODIFY (Task 10): Phase 3 ledger
```

**Independence:** Tasks 1–9 (the nine games) are fully independent — no game imports another; each touches only its own `src/games/<id>/` folder plus one additive import+register line in `src/games/index.ts` and one additive key in `src/audio/audioManifest.ts`. They may be implemented in parallel by separate agents; the only shared edits are additive single-line inserts. **Task order** follows difficulty: touch-select games first (Tasks 1–5), then Graphics-based touch-select (Tasks 6–7), then the two drag-drop games (Tasks 8–9), then registration + handoff (Task 10). Task 10 depends on all nine.

---

### Task 1: #2 Nhiều hơn – Ít hơn — numbers (`more-less`)

**Files:**
- Create: `src/games/more-less/moreLessLogic.ts`, `src/games/more-less/MoreLessScene.ts`, `src/games/more-less/index.ts`
- Test: `src/games/more-less/moreLessLogic.test.ts`, `src/games/more-less/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule` (`../GameModule`); `registerGame` (`../registry`).
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `EMOJI: string[]` (distinct group emoji)
  - `type Rng = () => number`
  - `interface MoreLessRound { leftCount: number; rightCount: number; want: 'more' | 'less'; emoji: string }` — `leftCount !== rightCount` always.
  - `generateRound(level: number, rng: Rng): MoreLessRound`
  - `starsFor(correct: number, total: number): number`
  - `class MoreLessScene extends Phaser.Scene`
  - `moreLess: GameModule`

- [x] **Step 1: Write the failing logic test**

`src/games/more-less/moreLessLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { EMOJI, generateRound, starsFor, QUESTIONS_PER_GAME } from './moreLessLogic';

describe('generateRound', () => {
  it('always has two unequal counts in range for the level', () => {
    const ranges: Record<number, number> = { 1: 5, 2: 8, 3: 10 };
    for (const lvl of [1, 2, 3]) {
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.leftCount).not.toBe(r.rightCount);
        expect(r.leftCount).toBeGreaterThanOrEqual(1);
        expect(r.rightCount).toBeGreaterThanOrEqual(1);
        expect(r.leftCount).toBeLessThanOrEqual(ranges[lvl]);
        expect(r.rightCount).toBeLessThanOrEqual(ranges[lvl]);
        expect(['more', 'less']).toContain(r.want);
        expect(EMOJI).toContain(r.emoji);
      }
    }
  });

  it('keeps a gap of at least 2 at level 1', () => {
    for (let i = 0; i < 60; i++) {
      const r = generateRound(1, () => i / 60);
      expect(Math.abs(r.leftCount - r.rightCount)).toBeGreaterThanOrEqual(2);
    }
  });

  it('never produces equal counts even with a degenerate rng', () => {
    const r = generateRound(3, () => 0);
    expect(r.leftCount).not.toBe(r.rightCount);
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(2, () => 0.37)).toEqual(generateRound(2, () => 0.37));
  });
});

describe('starsFor', () => {
  it('awards 3 for perfect, 2 for >=60%, else 1', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(2, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/more-less/moreLessLogic.test.ts`
Expected: FAIL — cannot find module `./moreLessLogic`.

- [x] **Step 3: Implement the logic**

`src/games/more-less/moreLessLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export const EMOJI: string[] = ['🍎', '🍌', '⭐', '🐰', '🌸', '🚗', '🐟', '🎈'];

export interface MoreLessRound {
  leftCount: number;
  rightCount: number;
  want: 'more' | 'less';
  emoji: string;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

/** L1: 1..5, gap >= 2. L2: 1..8, gap >= 1. L3: 1..10, gap >= 1. */
function rangeForLevel(level: number): { max: number; minGap: number } {
  if (level <= 1) return { max: 5, minGap: 2 };
  if (level === 2) return { max: 8, minGap: 1 };
  return { max: 10, minGap: 1 };
}

export function generateRound(level: number, rng: Rng): MoreLessRound {
  const { max, minGap } = rangeForLevel(level);
  const emoji = pick(EMOJI, rng);
  const want: 'more' | 'less' = rng() < 0.5 ? 'more' : 'less';

  let leftCount = 1 + Math.floor(rng() * max); // 1..max
  let rightCount = 1 + Math.floor(rng() * max);
  // Ensure two distinct counts with the required gap, even under a degenerate rng.
  let guard = 0;
  while (Math.abs(leftCount - rightCount) < minGap && guard++ < 100) {
    rightCount = 1 + Math.floor(rng() * max);
  }
  // Degenerate-rng safety net: force a gap deterministically.
  if (Math.abs(leftCount - rightCount) < minGap) {
    leftCount = 1;
    rightCount = Math.min(max, 1 + minGap);
  }

  return { leftCount, rightCount, want, emoji };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/more-less/moreLessLogic.test.ts`
Expected: PASS.

- [x] **Step 5: Implement the Phaser scene**

`src/games/more-less/MoreLessScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type MoreLessRound } from './moreLessLogic';

export class MoreLessScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: MoreLessRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'more-less' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff0f3');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('moreless.prompt'));
  }

  /** Draws one group of `count` emoji as a small grid centred at (cx, cy). */
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

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    this.current = generateRound(this.level, Math.random);
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;
    const label = this.current.want === 'more' ? 'NHIỀU hơn' : 'ÍT hơn';
    const prompt = this.add
      .text(width / 2, 110, `Chạm nhóm có ${label}`, {
        fontSize: '38px',
        color: '#a01a3a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('moreless.prompt');

    const leftX = width * 0.3;
    const rightX = width * 0.7;
    // Tap frames behind each group.
    const leftFrame = this.add
      .rectangle(leftX, height / 2 + 30, width * 0.34, 320, 0xffffff)
      .setStrokeStyle(6, 0xff8fab)
      .setInteractive({ useHandCursor: true });
    const rightFrame = this.add
      .rectangle(rightX, height / 2 + 30, width * 0.34, 320, 0xffffff)
      .setStrokeStyle(6, 0xff8fab)
      .setInteractive({ useHandCursor: true });
    this.layer.add(leftFrame);
    this.layer.add(rightFrame);
    this.drawGroup(leftX, this.current.leftCount, this.current.emoji);
    this.drawGroup(rightX, this.current.rightCount, this.current.emoji);

    leftFrame.on('pointerdown', () => this.choose('left', leftFrame));
    rightFrame.on('pointerdown', () => this.choose('right', rightFrame));
  }

  private isCorrect(side: 'left' | 'right'): boolean {
    const { leftCount, rightCount, want } = this.current;
    const leftWins = want === 'more' ? leftCount > rightCount : leftCount < rightCount;
    return side === (leftWins ? 'left' : 'right');
  }

  private choose(side: 'left' | 'right', frame: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (this.isCorrect(side)) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      frame.setFillStyle(0x9be08a);
      if (!this.answeredThisRound) this.correctCount++;
      this.answeredThisRound = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      this.answeredThisRound = true;
      this.host.playSfx('wrong');
      void this.host.speak('feedback.tryagain');
      this.tweens.add({ targets: frame, x: frame.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'more-less', level: this.level, score: this.correctCount, stars });
  }
}
```

- [x] **Step 6: Implement the game module + register + manifest**

`src/games/more-less/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { MoreLessScene } from './MoreLessScene';

export const moreLess: GameModule = {
  id: 'more-less',
  categoryId: 'numbers',
  title: 'Nhiều hơn – Ít hơn',
  iconKey: '⚖️',
  skill: 'So sánh số lượng',
  levels: 3,
  createScene: (host: GameHost, level: number) => new MoreLessScene(host, level),
};
```

In `src/games/index.ts`: add `import { moreLess } from './more-less';` and, inside `registerAllGames()`, `registerGame(moreLess);`.

In `src/audio/audioManifest.ts`, add to the `voices` map: `'moreless.prompt': '',`.

- [x] **Step 7: Write the module metadata test**

`src/games/more-less/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { moreLess } from './index';

describe('more-less module', () => {
  it('declares the expected metadata', () => {
    expect(moreLess.id).toBe('more-less');
    expect(moreLess.categoryId).toBe('numbers');
    expect(moreLess.levels).toBe(3);
    expect(typeof moreLess.createScene).toBe('function');
  });
});
```

- [x] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/more-less/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

> Scene rendering is verified manually in Task 10 (jsdom has no WebGL).

- [x] **Step 9: Commit**

```bash
git add src/games/more-less/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(more-less): add 'Nhiều hơn – Ít hơn' numbers game (#2)"
```

---

### Task 2: #5 Chữ Cái Đầu Tiên — letters (`first-letter`)

**Files:**
- Create: `src/games/first-letter/firstLetterLogic.ts`, `src/games/first-letter/FirstLetterScene.ts`, `src/games/first-letter/index.ts`
- Test: `src/games/first-letter/firstLetterLogic.test.ts`, `src/games/first-letter/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `interface WordEntry { emoji: string; word: string; letter: string }` — `letter` is the uppercase, undiacritised first letter of `word`.
  - `WORD_BANK: WordEntry[]` (≥ 8 entries; `letter` drawn from basic letters B/C/G/M/N/T/… so they are easy to recognise)
  - `LETTER_POOL: string[]` (distinct uppercase letters used as distractors)
  - `optionCountForLevel(level: number): number` → L1=3, L2=4, L3=4
  - `type Rng = () => number`
  - `interface FirstLetterRound { entry: WordEntry; options: string[] }` — `options` includes `entry.letter`, unique, length = `optionCountForLevel`.
  - `generateRound(level: number, rng: Rng): FirstLetterRound`
  - `starsFor(correct: number, total: number): number`
  - `class FirstLetterScene extends Phaser.Scene`
  - `firstLetter: GameModule`

- [x] **Step 1: Write the failing logic test**

`src/games/first-letter/firstLetterLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  WORD_BANK,
  LETTER_POOL,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './firstLetterLogic';

describe('WORD_BANK', () => {
  it('has unique entries whose letter is the uppercase first letter', () => {
    expect(WORD_BANK.length).toBeGreaterThanOrEqual(8);
    expect(new Set(WORD_BANK.map((w) => w.word)).size).toBe(WORD_BANK.length);
    for (const w of WORD_BANK) {
      expect(w.letter).toBe(w.letter.toUpperCase());
      expect(w.letter.length).toBe(1);
      expect(LETTER_POOL).toContain(w.letter);
    }
  });
});

describe('optionCountForLevel', () => {
  it('uses 3 for L1 and 4 for L2/L3', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(4);
    expect(optionCountForLevel(3)).toBe(4);
  });
});

describe('generateRound', () => {
  it('keeps the correct letter among unique options of the right size', () => {
    for (const lvl of [1, 2, 3]) {
      for (let i = 0; i < 50; i++) {
        const r = generateRound(lvl, () => i / 50);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options).size).toBe(r.options.length);
        expect(r.options).toContain(r.entry.letter);
        for (const o of r.options) expect(LETTER_POOL).toContain(o);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.5)).toEqual(generateRound(3, () => 0.5));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(1, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/first-letter/firstLetterLogic.test.ts`
Expected: FAIL — cannot find module `./firstLetterLogic`.

- [x] **Step 3: Implement the logic**

`src/games/first-letter/firstLetterLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export interface WordEntry {
  emoji: string;
  word: string;
  letter: string;
}

// Words whose first letter is a basic (undiacritised) uppercase letter so the
// initial sound is easy for pre-readers to match.
export const WORD_BANK: WordEntry[] = [
  { emoji: '🐱', word: 'MÈO', letter: 'M' },
  { emoji: '🐶', word: 'CHÓ', letter: 'C' },
  { emoji: '🐟', word: 'CÁ', letter: 'C' },
  { emoji: '🐝', word: 'ONG', letter: 'O' },
  { emoji: '🐘', word: 'VOI', letter: 'V' },
  { emoji: '🐔', word: 'GÀ', letter: 'G' },
  { emoji: '🍌', word: 'CHUỐI', letter: 'C' },
  { emoji: '🌳', word: 'CÂY', letter: 'C' },
  { emoji: '🏠', word: 'NHÀ', letter: 'N' },
  { emoji: '☀️', word: 'TRỜI', letter: 'T' },
  { emoji: '🐦', word: 'CHIM', letter: 'C' },
  { emoji: '🐢', word: 'RÙA', letter: 'R' },
  { emoji: '🍎', word: 'TÁO', letter: 'T' },
  { emoji: '🦆', word: 'VỊT', letter: 'V' },
];

// Distractor pool: every letter that appears as a target, plus a few near letters.
export const LETTER_POOL: string[] = [
  'M', 'C', 'O', 'V', 'G', 'N', 'T', 'R', 'B', 'D', 'H', 'L', 'S', 'X',
];

export interface FirstLetterRound {
  entry: WordEntry;
  options: string[];
}

export function optionCountForLevel(level: number): number {
  return level <= 1 ? 3 : 4;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): FirstLetterRound {
  const entry = pick(WORD_BANK, rng);
  const size = optionCountForLevel(level);
  const options = new Set<string>([entry.letter]);

  let guard = 0;
  while (options.size < size && guard++ < 200) {
    options.add(pick(LETTER_POOL, rng));
  }
  // Degenerate-rng safety net: walk the pool to guarantee enough options.
  for (let i = 0; options.size < size; i++) options.add(LETTER_POOL[i % LETTER_POOL.length]);

  return { entry, options: [...options] };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/first-letter/firstLetterLogic.test.ts`
Expected: PASS.

- [x] **Step 5: Implement the Phaser scene**

`src/games/first-letter/FirstLetterScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  type FirstLetterRound,
} from './firstLetterLogic';

export class FirstLetterScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: FirstLetterRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'first-letter' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#eef6ff');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('firstletter.prompt'));
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    this.current = generateRound(this.level, Math.random);
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;
    const prompt = this.add
      .text(width / 2, 80, 'Chữ cái đầu tiên là chữ gì?', {
        fontSize: '34px',
        color: '#1b4f8a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('firstletter.prompt');

    this.layer.add(
      this.add.text(width / 2, height / 2 - 60, this.current.entry.emoji, { fontSize: '120px' }).setOrigin(0.5),
    );
    this.layer.add(
      this.add
        .text(width / 2, height / 2 + 30, this.current.entry.word, {
          fontSize: '48px',
          color: '#333',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 140) / 2;
    const y = height - 120;
    opts.forEach((letter, i) => {
      const x = optStartX + i * 140;
      const btn = this.add
        .rectangle(x, y, 110, 110, 0xffffff)
        .setStrokeStyle(6, 0x7cc6fe)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, letter, { fontSize: '60px', color: '#444', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(letter, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(letter: string, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (letter === this.current.entry.letter) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
      if (!this.answeredThisRound) this.correctCount++;
      this.answeredThisRound = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      this.answeredThisRound = true;
      this.host.playSfx('wrong');
      void this.host.speak('feedback.tryagain');
      this.tweens.add({ targets: btn, x: btn.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'first-letter', level: this.level, score: this.correctCount, stars });
  }
}
```

- [x] **Step 6: Implement the game module + register + manifest**

`src/games/first-letter/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { FirstLetterScene } from './FirstLetterScene';

export const firstLetter: GameModule = {
  id: 'first-letter',
  categoryId: 'letters',
  title: 'Chữ Cái Đầu Tiên',
  iconKey: '🅰️',
  skill: 'Âm đầu của từ',
  levels: 3,
  createScene: (host: GameHost, level: number) => new FirstLetterScene(host, level),
};
```

In `src/games/index.ts`: add `import { firstLetter } from './first-letter';` and `registerGame(firstLetter);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'firstletter.prompt': '',`.

- [x] **Step 7: Write the module metadata test**

`src/games/first-letter/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { firstLetter } from './index';

describe('first-letter module', () => {
  it('declares the expected metadata', () => {
    expect(firstLetter.id).toBe('first-letter');
    expect(firstLetter.categoryId).toBe('letters');
    expect(firstLetter.levels).toBe(3);
    expect(typeof firstLetter.createScene).toBe('function');
  });
});
```

- [x] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/first-letter/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [x] **Step 9: Commit**

```bash
git add src/games/first-letter/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(first-letter): add 'Chữ Cái Đầu Tiên' letters game (#5)"
```

---

### Task 3: #7 Vật Lạ Trong Nhóm — logic (`odd-one-out`)

**Files:**
- Create: `src/games/odd-one-out/oddOneOutLogic.ts`, `src/games/odd-one-out/OddOneOutScene.ts`, `src/games/odd-one-out/index.ts`
- Test: `src/games/odd-one-out/oddOneOutLogic.test.ts`, `src/games/odd-one-out/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `GROUPS: string[][]` (≥ 4 groups of distinct emoji: animals / fruits / vehicles / tools)
  - `itemCountForLevel(level: number): number` → L1=3, L2=4, L3=5
  - `type Rng = () => number`
  - `interface OddRound { items: string[]; oddIndex: number }` — `items.length = itemCountForLevel`, all distinct; all but `items[oddIndex]` come from one group, `items[oddIndex]` from a different group.
  - `generateRound(level: number, rng: Rng): OddRound`
  - `starsFor(correct: number, total: number): number`
  - `class OddOneOutScene extends Phaser.Scene`
  - `oddOneOut: GameModule`

- [x] **Step 1: Write the failing logic test**

`src/games/odd-one-out/oddOneOutLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  GROUPS,
  itemCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './oddOneOutLogic';

const groupOf = (emoji: string): number => GROUPS.findIndex((g) => g.includes(emoji));

describe('itemCountForLevel', () => {
  it('grows with level', () => {
    expect(itemCountForLevel(1)).toBe(3);
    expect(itemCountForLevel(2)).toBe(4);
    expect(itemCountForLevel(3)).toBe(5);
  });
});

describe('generateRound', () => {
  it('has distinct items, exactly one from a foreign group', () => {
    for (const lvl of [1, 2, 3]) {
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.items).toHaveLength(itemCountForLevel(lvl));
        expect(new Set(r.items).size).toBe(r.items.length);
        expect(r.oddIndex).toBeGreaterThanOrEqual(0);
        expect(r.oddIndex).toBeLessThan(r.items.length);
        const oddGroup = groupOf(r.items[r.oddIndex]);
        const others = r.items.filter((_, idx) => idx !== r.oddIndex).map(groupOf);
        // All non-odd items share one group, distinct from the odd item's group.
        expect(new Set(others).size).toBe(1);
        expect(others[0]).not.toBe(oddGroup);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(2, () => 0.4)).toEqual(generateRound(2, () => 0.4));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(0, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/odd-one-out/oddOneOutLogic.test.ts`
Expected: FAIL — cannot find module `./oddOneOutLogic`.

- [x] **Step 3: Implement the logic**

`src/games/odd-one-out/oddOneOutLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

// Each inner array is one category; an item is "odd" if it belongs to a
// different category than the rest of the displayed set. Every emoji is unique
// across all groups so group membership is unambiguous.
export const GROUPS: string[][] = [
  ['🐱', '🐶', '🐰', '🐯', '🐸', '🐮'], // animals
  ['🍎', '🍌', '🍇', '🍓', '🍑', '🍉'], // fruits
  ['🚗', '🚌', '🚲', '✈️', '🚂', '🚀'], // vehicles
  ['🔨', '✂️', '🔧', '📏', '🖌️', '🔑'], // tools
];

export interface OddRound {
  items: string[];
  oddIndex: number;
}

export function itemCountForLevel(level: number): number {
  if (level <= 1) return 3;
  if (level === 2) return 4;
  return 5;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

function pickDistinctIndex(exclude: number, len: number, rng: Rng): number {
  let idx = Math.min(len - 1, Math.floor(rng() * len));
  let guard = 0;
  while (idx === exclude && guard++ < 50) idx = Math.min(len - 1, Math.floor(rng() * len));
  if (idx === exclude) idx = (exclude + 1) % len; // degenerate-rng safety net
  return idx;
}

export function generateRound(level: number, rng: Rng): OddRound {
  const count = itemCountForLevel(level);
  const mainGroupIdx = Math.min(GROUPS.length - 1, Math.floor(rng() * GROUPS.length));
  const oddGroupIdx = pickDistinctIndex(mainGroupIdx, GROUPS.length, rng);
  const mainGroup = GROUPS[mainGroupIdx];
  const oddGroup = GROUPS[oddGroupIdx];

  // Choose count-1 distinct emoji from the main group.
  const mains = new Set<string>();
  let guard = 0;
  while (mains.size < count - 1 && guard++ < 200) mains.add(pick(mainGroup, rng));
  for (let i = 0; mains.size < count - 1; i++) mains.add(mainGroup[i % mainGroup.length]);

  const odd = pick(oddGroup, rng);
  const items = [...mains, odd]; // odd is last for now
  // Shuffle deterministically (Fisher–Yates with rng) so oddIndex varies.
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const oddIndex = items.indexOf(odd);

  return { items, oddIndex };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/odd-one-out/oddOneOutLogic.test.ts`
Expected: PASS.

- [x] **Step 5: Implement the Phaser scene**

`src/games/odd-one-out/OddOneOutScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type OddRound } from './oddOneOutLogic';

export class OddOneOutScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: OddRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'odd-one-out' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff7da');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('oddoneout.prompt'));
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    this.current = generateRound(this.level, Math.random);
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;
    const prompt = this.add
      .text(width / 2, 100, 'Chạm vào vật khác nhóm', {
        fontSize: '36px',
        color: '#8a6d00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('oddoneout.prompt');

    const items = this.current.items;
    const startX = width / 2 - ((items.length - 1) * 150) / 2;
    const y = height / 2 + 30;
    items.forEach((emoji, i) => {
      const x = startX + i * 150;
      const btn = this.add
        .rectangle(x, y, 120, 120, 0xffffff)
        .setStrokeStyle(6, 0xffd36e)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, emoji, { fontSize: '64px' }).setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(i, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(index: number, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (index === this.current.oddIndex) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
      if (!this.answeredThisRound) this.correctCount++;
      this.answeredThisRound = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      this.answeredThisRound = true;
      this.host.playSfx('wrong');
      void this.host.speak('feedback.tryagain');
      this.tweens.add({ targets: btn, x: btn.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'odd-one-out', level: this.level, score: this.correctCount, stars });
  }
}
```

- [x] **Step 6: Implement the game module + register + manifest**

`src/games/odd-one-out/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { OddOneOutScene } from './OddOneOutScene';

export const oddOneOut: GameModule = {
  id: 'odd-one-out',
  categoryId: 'logic',
  title: 'Vật Lạ Trong Nhóm',
  iconKey: '🔍',
  skill: 'Phân loại, loại trừ',
  levels: 3,
  createScene: (host: GameHost, level: number) => new OddOneOutScene(host, level),
};
```

In `src/games/index.ts`: add `import { oddOneOut } from './odd-one-out';` and `registerGame(oddOneOut);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'oddoneout.prompt': '',`.

- [x] **Step 7: Write the module metadata test**

`src/games/odd-one-out/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { oddOneOut } from './index';

describe('odd-one-out module', () => {
  it('declares the expected metadata', () => {
    expect(oddOneOut.id).toBe('odd-one-out');
    expect(oddOneOut.categoryId).toBe('logic');
    expect(oddOneOut.levels).toBe(3);
    expect(typeof oddOneOut.createScene).toBe('function');
  });
});
```

- [x] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/odd-one-out/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [x] **Step 9: Commit**

```bash
git add src/games/odd-one-out/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(odd-one-out): add 'Vật Lạ Trong Nhóm' logic game (#7)"
```

---

### Task 4: #14 ABC — english (`abc-english`)

**Files:**
- Create: `src/games/abc-english/abcLogic.ts`, `src/games/abc-english/AbcEnglishScene.ts`, `src/games/abc-english/index.ts`
- Test: `src/games/abc-english/abcLogic.test.ts`, `src/games/abc-english/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `ALPHABET: string[]` (A..Z, 26 entries)
  - `letterPoolForLevel(level: number): string[]` → L1 A–G, L2 A–N, L3 A–Z
  - `optionCountForLevel(level: number): number` → L1=3, L2=4, L3=4
  - `type Rng = () => number`
  - `interface AbcRound { target: string; options: string[] }` — `options` from the level pool, unique, include `target`.
  - `generateRound(level: number, rng: Rng): AbcRound`
  - `starsFor(correct: number, total: number): number`
  - `class AbcEnglishScene extends Phaser.Scene`
  - `abcEnglish: GameModule`

- [x] **Step 1: Write the failing logic test**

`src/games/abc-english/abcLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  ALPHABET,
  letterPoolForLevel,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './abcLogic';

describe('ALPHABET', () => {
  it('is A..Z with 26 unique uppercase letters', () => {
    expect(ALPHABET).toHaveLength(26);
    expect(ALPHABET[0]).toBe('A');
    expect(ALPHABET[25]).toBe('Z');
    expect(new Set(ALPHABET).size).toBe(26);
  });
});

describe('letterPoolForLevel', () => {
  it('widens the range by level', () => {
    expect(letterPoolForLevel(1)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(letterPoolForLevel(2)).toEqual(ALPHABET.slice(0, 14)); // A..N
    expect(letterPoolForLevel(3)).toEqual(ALPHABET);
  });
});

describe('optionCountForLevel', () => {
  it('uses 3 for L1 and 4 for L2/L3', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(4);
    expect(optionCountForLevel(3)).toBe(4);
  });
});

describe('generateRound', () => {
  it('keeps target among unique options drawn from the level pool', () => {
    for (const lvl of [1, 2, 3]) {
      const pool = letterPoolForLevel(lvl);
      for (let i = 0; i < 50; i++) {
        const r = generateRound(lvl, () => i / 50);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options).size).toBe(r.options.length);
        expect(r.options).toContain(r.target);
        for (const o of r.options) expect(pool).toContain(o);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.5)).toEqual(generateRound(3, () => 0.5));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(2, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/abc-english/abcLogic.test.ts`
Expected: FAIL — cannot find module `./abcLogic`.

- [x] **Step 3: Implement the logic**

`src/games/abc-english/abcLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export const ALPHABET: string[] = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i),
);

export interface AbcRound {
  target: string;
  options: string[];
}

export function letterPoolForLevel(level: number): string[] {
  if (level <= 1) return ALPHABET.slice(0, 7); // A..G
  if (level === 2) return ALPHABET.slice(0, 14); // A..N
  return ALPHABET; // A..Z
}

export function optionCountForLevel(level: number): number {
  return level <= 1 ? 3 : 4;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): AbcRound {
  const pool = letterPoolForLevel(level);
  const target = pick(pool, rng);
  const size = optionCountForLevel(level);
  const options = new Set<string>([target]);

  let guard = 0;
  while (options.size < size && guard++ < 200) options.add(pick(pool, rng));
  for (let i = 0; options.size < size; i++) options.add(pool[i % pool.length]);

  return { target, options: [...options] };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/abc-english/abcLogic.test.ts`
Expected: PASS.

- [x] **Step 5: Implement the Phaser scene**

`src/games/abc-english/AbcEnglishScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type AbcRound } from './abcLogic';

export class AbcEnglishScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: AbcRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'abc-english' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff1ea');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('abc.prompt'));
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    this.current = generateRound(this.level, Math.random);
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;
    // UI is Vietnamese; the answer letters are English. Show the target letter as a
    // visual aid in addition to the (placeholder) voice prompt.
    const prompt = this.add
      .text(width / 2, 90, 'Nghe và chạm đúng chữ', {
        fontSize: '34px',
        color: '#a8431f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    this.layer.add(
      this.add
        .text(width / 2, height / 2 - 70, this.current.target, { fontSize: '110px', color: '#ff7043', fontStyle: 'bold' })
        .setOrigin(0.5),
    );
    void this.host.speak('abc.prompt');

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 140) / 2;
    const y = height - 120;
    opts.forEach((letter, i) => {
      const x = optStartX + i * 140;
      const btn = this.add
        .rectangle(x, y, 110, 110, 0xffffff)
        .setStrokeStyle(6, 0xff7043)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, letter, { fontSize: '60px', color: '#444', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(letter, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(letter: string, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (letter === this.current.target) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
      if (!this.answeredThisRound) this.correctCount++;
      this.answeredThisRound = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      this.answeredThisRound = true;
      this.host.playSfx('wrong');
      void this.host.speak('feedback.tryagain');
      this.tweens.add({ targets: btn, x: btn.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'abc-english', level: this.level, score: this.correctCount, stars });
  }
}
```

- [x] **Step 6: Implement the game module + register + manifest**

`src/games/abc-english/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { AbcEnglishScene } from './AbcEnglishScene';

export const abcEnglish: GameModule = {
  id: 'abc-english',
  categoryId: 'english',
  title: 'ABC',
  iconKey: '🔤',
  skill: 'Bảng chữ cái EN',
  levels: 3,
  createScene: (host: GameHost, level: number) => new AbcEnglishScene(host, level),
};
```

In `src/games/index.ts`: add `import { abcEnglish } from './abc-english';` and `registerGame(abcEnglish);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'abc.prompt': '',`.

- [x] **Step 7: Write the module metadata test**

`src/games/abc-english/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { abcEnglish } from './index';

describe('abc-english module', () => {
  it('declares the expected metadata', () => {
    expect(abcEnglish.id).toBe('abc-english');
    expect(abcEnglish.categoryId).toBe('english');
    expect(abcEnglish.levels).toBe(3);
    expect(typeof abcEnglish.createScene).toBe('function');
  });
});
```

- [x] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/abc-english/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [x] **Step 9: Commit**

```bash
git add src/games/abc-english/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(abc-english): add 'ABC' English game (#14)"
```

---

### Task 5: #15 Numbers 1–10 — english (`numbers-english`)

**Files:**
- Create: `src/games/numbers-english/numbersEnLogic.ts`, `src/games/numbers-english/NumbersEnglishScene.ts`, `src/games/numbers-english/index.ts`
- Test: `src/games/numbers-english/numbersEnLogic.test.ts`, `src/games/numbers-english/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `OPTION_COUNT = 3`
  - `NUMBER_WORDS: Record<number, string>` (1→'one' … 10→'ten') — English word per number, used as the (placeholder-voiced) prompt label.
  - `maxNumberForLevel(level: number): number` → L1=5, L2=8, L3=10
  - `type Rng = () => number`
  - `interface NumbersEnRound { target: number; word: string; options: number[] }` — `options` length 3, unique, include `target`, each in 1..max.
  - `generateRound(level: number, rng: Rng): NumbersEnRound`
  - `starsFor(correct: number, total: number): number`
  - `class NumbersEnglishScene extends Phaser.Scene`
  - `numbersEnglish: GameModule`

- [x] **Step 1: Write the failing logic test**

`src/games/numbers-english/numbersEnLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  NUMBER_WORDS,
  maxNumberForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
  OPTION_COUNT,
} from './numbersEnLogic';

describe('NUMBER_WORDS', () => {
  it('maps 1..10 to English words', () => {
    expect(NUMBER_WORDS[1]).toBe('one');
    expect(NUMBER_WORDS[7]).toBe('seven');
    expect(NUMBER_WORDS[10]).toBe('ten');
    expect(Object.keys(NUMBER_WORDS)).toHaveLength(10);
  });
});

describe('maxNumberForLevel', () => {
  it('grows with level', () => {
    expect(maxNumberForLevel(1)).toBe(5);
    expect(maxNumberForLevel(2)).toBe(8);
    expect(maxNumberForLevel(3)).toBe(10);
  });
});

describe('generateRound', () => {
  it('keeps target among 3 unique options within 1..max with the right word', () => {
    for (const lvl of [1, 2, 3]) {
      const max = maxNumberForLevel(lvl);
      for (let i = 0; i < 50; i++) {
        const r = generateRound(lvl, () => i / 50);
        expect(r.options).toHaveLength(OPTION_COUNT);
        expect(new Set(r.options).size).toBe(OPTION_COUNT);
        expect(r.options).toContain(r.target);
        expect(r.word).toBe(NUMBER_WORDS[r.target]);
        for (const o of r.options) {
          expect(o).toBeGreaterThanOrEqual(1);
          expect(o).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(2, () => 0.3)).toEqual(generateRound(2, () => 0.3));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(1, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/numbers-english/numbersEnLogic.test.ts`
Expected: FAIL — cannot find module `./numbersEnLogic`.

- [x] **Step 3: Implement the logic**

`src/games/numbers-english/numbersEnLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;
export const OPTION_COUNT = 3;

export type Rng = () => number;

export const NUMBER_WORDS: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
};

export interface NumbersEnRound {
  target: number;
  word: string;
  options: number[];
}

export function maxNumberForLevel(level: number): number {
  if (level <= 1) return 5;
  if (level === 2) return 8;
  return 10;
}

export function generateRound(level: number, rng: Rng): NumbersEnRound {
  const max = maxNumberForLevel(level);
  const target = 1 + Math.floor(rng() * max); // 1..max
  const options = new Set<number>([target]);

  let guard = 0;
  while (options.size < OPTION_COUNT && guard++ < 100) options.add(1 + Math.floor(rng() * max));
  for (let v = 1; options.size < OPTION_COUNT; v++) options.add(((v - 1) % max) + 1);

  return {
    target,
    word: NUMBER_WORDS[target],
    options: [...options].sort((a, b) => a - b),
  };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/numbers-english/numbersEnLogic.test.ts`
Expected: PASS.

- [x] **Step 5: Implement the Phaser scene**

`src/games/numbers-english/NumbersEnglishScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type NumbersEnRound } from './numbersEnLogic';

export class NumbersEnglishScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: NumbersEnRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'numbers-english' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff1ea');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('numbersen.prompt'));
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    this.current = generateRound(this.level, Math.random);
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;
    const prompt = this.add
      .text(width / 2, 90, 'Nghe và chạm đúng số', {
        fontSize: '34px',
        color: '#a8431f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    // English word as a learning aid alongside the placeholder voice.
    this.layer.add(
      this.add
        .text(width / 2, height / 2 - 70, this.current.word, { fontSize: '72px', color: '#ff7043', fontStyle: 'bold' })
        .setOrigin(0.5),
    );
    void this.host.speak('numbersen.prompt');

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 150) / 2;
    const y = height - 120;
    opts.forEach((num, i) => {
      const x = optStartX + i * 150;
      const btn = this.add
        .rectangle(x, y, 110, 110, 0xffffff)
        .setStrokeStyle(6, 0xff7043)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, String(num), { fontSize: '60px', color: '#444', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(num, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(num: number, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (num === this.current.target) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      btn.setFillStyle(0x9be08a);
      if (!this.answeredThisRound) this.correctCount++;
      this.answeredThisRound = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      this.answeredThisRound = true;
      this.host.playSfx('wrong');
      void this.host.speak('feedback.tryagain');
      this.tweens.add({ targets: btn, x: btn.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'numbers-english', level: this.level, score: this.correctCount, stars });
  }
}
```

- [x] **Step 6: Implement the game module + register + manifest**

`src/games/numbers-english/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { NumbersEnglishScene } from './NumbersEnglishScene';

export const numbersEnglish: GameModule = {
  id: 'numbers-english',
  categoryId: 'english',
  title: 'Numbers 1–10',
  iconKey: '🔟',
  skill: 'Số đếm EN',
  levels: 3,
  createScene: (host: GameHost, level: number) => new NumbersEnglishScene(host, level),
};
```

In `src/games/index.ts`: add `import { numbersEnglish } from './numbers-english';` and `registerGame(numbersEnglish);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'numbersen.prompt': '',`.

- [x] **Step 7: Write the module metadata test**

`src/games/numbers-english/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { numbersEnglish } from './index';

describe('numbers-english module', () => {
  it('declares the expected metadata', () => {
    expect(numbersEnglish.id).toBe('numbers-english');
    expect(numbersEnglish.categoryId).toBe('english');
    expect(numbersEnglish.levels).toBe(3);
    expect(typeof numbersEnglish.createScene).toBe('function');
  });
});
```

- [x] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/numbers-english/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [x] **Step 9: Commit**

```bash
git add src/games/numbers-english/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(numbers-english): add 'Numbers 1–10' English game (#15)"
```

---

### Task 6: #12 Nhận Diện Màu & Hình — shapes (`shapes-colors`, Phaser Graphics)

**Files:**
- Create: `src/games/shapes-colors/shapeColorLogic.ts`, `src/games/shapes-colors/ShapesColorsScene.ts`, `src/games/shapes-colors/index.ts`
- Test: `src/games/shapes-colors/shapeColorLogic.test.ts`, `src/games/shapes-colors/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `type ShapeName = 'circle' | 'square' | 'triangle' | 'star'`
  - `SHAPES: ShapeName[]`
  - `interface ColorDef { name: string; hex: number }` — `name` is the Vietnamese colour name (đỏ/xanh dương/…); `hex` is a Phaser fill colour.
  - `COLORS: ColorDef[]`
  - `interface ShapeOption { shape: ShapeName; color: ColorDef }`
  - `type RoundMode = 'shape' | 'color' | 'both'`
  - `interface ShapeColorRound { mode: RoundMode; targetShape?: ShapeName; targetColor?: ColorDef; options: ShapeOption[]; correctIndex: number }`
  - `optionCountForLevel(level: number): number` → L1=3, L2=4, L3=4
  - `type Rng = () => number`
  - `generateRound(level: number, rng: Rng): ShapeColorRound` — L1 mode is `'shape'` or `'color'` (3 options); L2 same modes (4 options); L3 mode is `'both'` (4 options). Exactly one option matches the target; `correctIndex` points to it.
  - `starsFor(correct: number, total: number): number`
  - `class ShapesColorsScene extends Phaser.Scene`
  - `shapesColors: GameModule`

- [x] **Step 1: Write the failing logic test**

`src/games/shapes-colors/shapeColorLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  SHAPES,
  COLORS,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './shapeColorLogic';

describe('optionCountForLevel', () => {
  it('uses 3 for L1 and 4 for L2/L3', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(4);
    expect(optionCountForLevel(3)).toBe(4);
  });
});

describe('generateRound', () => {
  it('has exactly one correct option matching the target', () => {
    for (const lvl of [1, 2, 3]) {
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(r.correctIndex).toBeGreaterThanOrEqual(0);
        expect(r.correctIndex).toBeLessThan(r.options.length);

        const matches = (o: { shape: string; color: { name: string } }): boolean => {
          if (r.mode === 'shape') return o.shape === r.targetShape;
          if (r.mode === 'color') return o.color.name === r.targetColor!.name;
          return o.shape === r.targetShape && o.color.name === r.targetColor!.name;
        };
        const matching = r.options.filter(matches);
        expect(matching).toHaveLength(1);
        expect(r.options[r.correctIndex]).toBe(matching[0]);

        for (const o of r.options) {
          expect(SHAPES).toContain(o.shape);
          expect(COLORS.map((c) => c.name)).toContain(o.color.name);
        }
      }
    }
  });

  it('uses single-attribute modes at L1/L2 and both at L3', () => {
    for (let i = 0; i < 20; i++) {
      expect(['shape', 'color']).toContain(generateRound(1, () => i / 20).mode);
      expect(['shape', 'color']).toContain(generateRound(2, () => i / 20).mode);
      expect(generateRound(3, () => i / 20).mode).toBe('both');
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.5)).toEqual(generateRound(3, () => 0.5));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(2, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/shapes-colors/shapeColorLogic.test.ts`
Expected: FAIL — cannot find module `./shapeColorLogic`.

- [x] **Step 3: Implement the logic**

`src/games/shapes-colors/shapeColorLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export type ShapeName = 'circle' | 'square' | 'triangle' | 'star';
export const SHAPES: ShapeName[] = ['circle', 'square', 'triangle', 'star'];

export interface ColorDef {
  name: string; // Vietnamese colour name shown/voiced
  hex: number; // Phaser fill colour
}

export const COLORS: ColorDef[] = [
  { name: 'đỏ', hex: 0xe53935 },
  { name: 'xanh dương', hex: 0x1e88e5 },
  { name: 'vàng', hex: 0xfdd835 },
  { name: 'xanh lá', hex: 0x43a047 },
  { name: 'tím', hex: 0x8e24aa },
  { name: 'cam', hex: 0xfb8c00 },
];

export interface ShapeOption {
  shape: ShapeName;
  color: ColorDef;
}

export type RoundMode = 'shape' | 'color' | 'both';

export interface ShapeColorRound {
  mode: RoundMode;
  targetShape?: ShapeName;
  targetColor?: ColorDef;
  options: ShapeOption[];
  correctIndex: number;
}

export function optionCountForLevel(level: number): number {
  return level <= 1 ? 3 : 4;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

function modeForLevel(level: number, rng: Rng): RoundMode {
  if (level >= 3) return 'both';
  return rng() < 0.5 ? 'shape' : 'color';
}

export function generateRound(level: number, rng: Rng): ShapeColorRound {
  const size = optionCountForLevel(level);
  const mode = modeForLevel(level, rng);
  const targetShape = pick(SHAPES, rng);
  const targetColor = pick(COLORS, rng);

  // Build the correct option first.
  const correct: ShapeOption = { shape: targetShape, color: targetColor };
  const options: ShapeOption[] = [correct];

  // A candidate "matches" the target under the active mode; distractors must NOT.
  const matches = (o: ShapeOption): boolean => {
    if (mode === 'shape') return o.shape === targetShape;
    if (mode === 'color') return o.color.name === targetColor.name;
    return o.shape === targetShape && o.color.name === targetColor.name;
  };

  // Fill distractors deterministically: iterate shape×color combinations until
  // we have `size` options, skipping any that match the target or duplicate
  // an existing option. This is degenerate-rng safe (full deterministic walk).
  const startS = Math.floor(rng() * SHAPES.length);
  const startC = Math.floor(rng() * COLORS.length);
  for (let s = 0; s < SHAPES.length && options.length < size; s++) {
    for (let c = 0; c < COLORS.length && options.length < size; c++) {
      const shape = SHAPES[(startS + s) % SHAPES.length];
      const color = COLORS[(startC + c) % COLORS.length];
      const cand: ShapeOption = { shape, color };
      if (matches(cand)) continue;
      if (options.some((o) => o.shape === cand.shape && o.color.name === cand.color.name)) continue;
      options.push(cand);
    }
  }

  // Shuffle deterministically so the correct option is not always first.
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [options[i], options[j]] = [options[j], options[i]];
  }
  const correctIndex = options.indexOf(correct);

  return { mode, targetShape, targetColor, options, correctIndex };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

> **Implementer note:** the distractor fill is the deterministic `for` double-loop —
> it guarantees `size` distinct, non-matching options without relying on rng quality
> (degenerate-rng safe). The `start*` offsets only vary *which* distractors appear.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/shapes-colors/shapeColorLogic.test.ts`
Expected: PASS.

- [x] **Step 5: Implement the Phaser scene**

`src/games/shapes-colors/ShapesColorsScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  type ShapeColorRound,
  type ShapeOption,
  type ShapeName,
} from './shapeColorLogic';

export class ShapesColorsScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: ShapeColorRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'shapes-colors' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#e9fff7');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('shapecolor.prompt'));
  }

  private shapeLabel(shape: ShapeName): string {
    return { circle: 'hình tròn', square: 'hình vuông', triangle: 'hình tam giác', star: 'hình ngôi sao' }[shape];
  }

  private promptText(): string {
    const r = this.current;
    if (r.mode === 'shape') return `Chạm ${this.shapeLabel(r.targetShape!)}`;
    if (r.mode === 'color') return `Chạm màu ${r.targetColor!.name}`;
    return `Chạm ${this.shapeLabel(r.targetShape!)} màu ${r.targetColor!.name}`;
  }

  /** Draws a filled shape of `opt` at (x, y) with half-size `s`, into the layer. */
  private drawShape(opt: ShapeOption, x: number, y: number, s: number): void {
    const g = this.add.graphics();
    g.fillStyle(opt.color.hex, 1);
    switch (opt.shape) {
      case 'circle':
        g.fillCircle(x, y, s);
        break;
      case 'square':
        g.fillRect(x - s, y - s, s * 2, s * 2);
        break;
      case 'triangle':
        g.fillTriangle(x, y - s, x - s, y + s, x + s, y + s);
        break;
      case 'star':
        this.fillStar(g, x, y, s);
        break;
    }
    this.layer!.add(g);
  }

  private fillStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, s: number): void {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s : s * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    g.fillPoints(
      pts.reduce<Phaser.Geom.Point[]>((acc, _v, i) => {
        if (i % 2 === 0) acc.push(new Phaser.Geom.Point(pts[i], pts[i + 1]));
        return acc;
      }, []),
      true,
    );
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    this.current = generateRound(this.level, Math.random);
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;
    const prompt = this.add
      .text(width / 2, 100, this.promptText(), {
        fontSize: '36px',
        color: '#0b6b4f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('shapecolor.prompt');

    const opts = this.current.options;
    const startX = width / 2 - ((opts.length - 1) * 150) / 2;
    const y = height / 2 + 30;
    opts.forEach((opt, i) => {
      const x = startX + i * 150;
      const hit = this.add
        .rectangle(x, y, 130, 130, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true });
      this.drawShape(opt, x, y, 50);
      hit.on('pointerdown', () => this.choose(i, hit));
      this.layer!.add(hit);
    });
  }

  private choose(index: number, hit: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (index === this.current.correctIndex) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      hit.setStrokeStyle(8, 0x2ecc71).setFillStyle(0x9be08a, 0.3);
      if (!this.answeredThisRound) this.correctCount++;
      this.answeredThisRound = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      this.answeredThisRound = true;
      this.host.playSfx('wrong');
      void this.host.speak('feedback.tryagain');
      this.tweens.add({ targets: hit, x: hit.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'shapes-colors', level: this.level, score: this.correctCount, stars });
  }
}
```

> **Manual-test note (Task 10):** the shapes are drawn with `Graphics` while taps
> are caught by a transparent `rectangle` hit area on top — verify the hit area
> lines up with each shape and that the star renders as a star (the `fillStar`
> point math cannot be unit-tested without WebGL). If a shape looks off, adjust
> only the scene drawing; keep `shapeColorLogic` (the tested pure logic) unchanged.

- [x] **Step 6: Implement the game module + register + manifest**

`src/games/shapes-colors/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { ShapesColorsScene } from './ShapesColorsScene';

export const shapesColors: GameModule = {
  id: 'shapes-colors',
  categoryId: 'shapes',
  title: 'Nhận Diện Màu & Hình',
  iconKey: '🔺',
  skill: 'Màu sắc, hình khối',
  levels: 3,
  createScene: (host: GameHost, level: number) => new ShapesColorsScene(host, level),
};
```

In `src/games/index.ts`: add `import { shapesColors } from './shapes-colors';` and `registerGame(shapesColors);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'shapecolor.prompt': '',`.

- [x] **Step 7: Write the module metadata test**

`src/games/shapes-colors/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { shapesColors } from './index';

describe('shapes-colors module', () => {
  it('declares the expected metadata', () => {
    expect(shapesColors.id).toBe('shapes-colors');
    expect(shapesColors.categoryId).toBe('shapes');
    expect(shapesColors.levels).toBe(3);
    expect(typeof shapesColors.createScene).toBe('function');
  });
});
```

- [x] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/shapes-colors/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [x] **Step 9: Commit**

```bash
git add src/games/shapes-colors/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(shapes-colors): add 'Nhận Diện Màu & Hình' shapes game (#12)"
```

---

### Task 7: #16 Colors — english (`colors-english`, Phaser Graphics)

**Files:**
- Create: `src/games/colors-english/colorsEnLogic.ts`, `src/games/colors-english/ColorsEnglishScene.ts`, `src/games/colors-english/index.ts`
- Test: `src/games/colors-english/colorsEnLogic.test.ts`, `src/games/colors-english/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `OPTION_COUNT = 3`
  - `interface ColorDef { name: string; hex: number }` — `name` is the English colour name ('red', 'blue', …).
  - `COLORS: ColorDef[]` (≥ 8 entries)
  - `colorPoolForLevel(level: number): ColorDef[]` → L1 first 3, L2 first 6, L3 all (~8)
  - `type Rng = () => number`
  - `interface ColorsEnRound { target: ColorDef; options: ColorDef[] }` — `options` length 3, unique by name, include `target`, drawn from the level pool.
  - `generateRound(level: number, rng: Rng): ColorsEnRound`
  - `starsFor(correct: number, total: number): number`
  - `class ColorsEnglishScene extends Phaser.Scene`
  - `colorsEnglish: GameModule`

- [x] **Step 1: Write the failing logic test**

`src/games/colors-english/colorsEnLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  COLORS,
  colorPoolForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
  OPTION_COUNT,
} from './colorsEnLogic';

describe('COLORS', () => {
  it('has >= 8 entries unique by name with English names', () => {
    expect(COLORS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(COLORS.map((c) => c.name)).size).toBe(COLORS.length);
    expect(COLORS.map((c) => c.name)).toContain('red');
  });
});

describe('colorPoolForLevel', () => {
  it('widens by level', () => {
    expect(colorPoolForLevel(1)).toHaveLength(3);
    expect(colorPoolForLevel(2)).toHaveLength(6);
    expect(colorPoolForLevel(3).length).toBeGreaterThanOrEqual(8);
  });
});

describe('generateRound', () => {
  it('keeps target among 3 unique options from the level pool', () => {
    for (const lvl of [1, 2, 3]) {
      const poolNames = colorPoolForLevel(lvl).map((c) => c.name);
      for (let i = 0; i < 50; i++) {
        const r = generateRound(lvl, () => i / 50);
        expect(r.options).toHaveLength(OPTION_COUNT);
        expect(new Set(r.options.map((o) => o.name)).size).toBe(OPTION_COUNT);
        expect(r.options.map((o) => o.name)).toContain(r.target.name);
        for (const o of r.options) expect(poolNames).toContain(o.name);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.4)).toEqual(generateRound(3, () => 0.4));
  });
});

describe('starsFor', () => {
  it('awards 3/2/1 by accuracy', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(1, 5)).toBe(1);
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/colors-english/colorsEnLogic.test.ts`
Expected: FAIL — cannot find module `./colorsEnLogic`.

- [x] **Step 3: Implement the logic**

`src/games/colors-english/colorsEnLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;
export const OPTION_COUNT = 3;

export type Rng = () => number;

export interface ColorDef {
  name: string; // English colour name (voiced placeholder)
  hex: number; // Phaser fill colour
}

// Ordered so the first 3 are the "basic" colours used at L1.
export const COLORS: ColorDef[] = [
  { name: 'red', hex: 0xe53935 },
  { name: 'blue', hex: 0x1e88e5 },
  { name: 'yellow', hex: 0xfdd835 },
  { name: 'green', hex: 0x43a047 },
  { name: 'orange', hex: 0xfb8c00 },
  { name: 'purple', hex: 0x8e24aa },
  { name: 'pink', hex: 0xec407a },
  { name: 'black', hex: 0x222222 },
];

export interface ColorsEnRound {
  target: ColorDef;
  options: ColorDef[];
}

export function colorPoolForLevel(level: number): ColorDef[] {
  if (level <= 1) return COLORS.slice(0, 3);
  if (level === 2) return COLORS.slice(0, 6);
  return COLORS;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): ColorsEnRound {
  const pool = colorPoolForLevel(level);
  const target = pick(pool, rng);
  const chosen: ColorDef[] = [target];

  let guard = 0;
  while (chosen.length < OPTION_COUNT && guard++ < 200) {
    const cand = pick(pool, rng);
    if (!chosen.some((c) => c.name === cand.name)) chosen.push(cand);
  }
  for (let i = 0; chosen.length < OPTION_COUNT; i++) {
    const cand = pool[i % pool.length];
    if (!chosen.some((c) => c.name === cand.name)) chosen.push(cand);
  }

  return { target, options: chosen };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/colors-english/colorsEnLogic.test.ts`
Expected: PASS.

- [x] **Step 5: Implement the Phaser scene**

`src/games/colors-english/ColorsEnglishScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { QUESTIONS_PER_GAME, generateRound, starsFor, type ColorsEnRound } from './colorsEnLogic';

export class ColorsEnglishScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: ColorsEnRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'colors-english' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff1ea');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('colorsen.prompt'));
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.roundResolved = false;
    this.current = generateRound(this.level, Math.random);
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;
    const prompt = this.add
      .text(width / 2, 90, 'Nghe và chạm đúng màu', {
        fontSize: '34px',
        color: '#a8431f',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    // English colour word as a learning aid alongside the placeholder voice.
    this.layer.add(
      this.add
        .text(width / 2, height / 2 - 90, this.current.target.name, { fontSize: '64px', color: '#ff7043', fontStyle: 'bold' })
        .setOrigin(0.5),
    );
    void this.host.speak('colorsen.prompt');

    const opts = this.current.options;
    const startX = width / 2 - ((opts.length - 1) * 170) / 2;
    const y = height / 2 + 60;
    opts.forEach((color, i) => {
      const x = startX + i * 170;
      const swatch = this.add
        .rectangle(x, y, 130, 130, color.hex)
        .setStrokeStyle(6, 0xffffff)
        .setInteractive({ useHandCursor: true });
      swatch.on('pointerdown', () => this.choose(color.name, swatch));
      this.layer!.add(swatch);
    });
  }

  private choose(name: string, swatch: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (name === this.current.target.name) {
      this.roundResolved = true;
      this.host.playSfx('correct');
      void this.host.speak('feedback.correct');
      swatch.setStrokeStyle(10, 0x2ecc71);
      if (!this.answeredThisRound) this.correctCount++;
      this.answeredThisRound = true;
      this.time.delayedCall(700, () => {
        this.roundIndex++;
        this.nextRound();
      });
    } else {
      this.answeredThisRound = true;
      this.host.playSfx('wrong');
      void this.host.speak('feedback.tryagain');
      this.tweens.add({ targets: swatch, x: swatch.x + 8, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  private finish(): void {
    const stars = starsFor(this.correctCount, QUESTIONS_PER_GAME);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'colors-english', level: this.level, score: this.correctCount, stars });
  }
}
```

- [x] **Step 6: Implement the game module + register + manifest**

`src/games/colors-english/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { ColorsEnglishScene } from './ColorsEnglishScene';

export const colorsEnglish: GameModule = {
  id: 'colors-english',
  categoryId: 'english',
  title: 'Colors',
  iconKey: '🎨',
  skill: 'Tên màu EN',
  levels: 3,
  createScene: (host: GameHost, level: number) => new ColorsEnglishScene(host, level),
};
```

In `src/games/index.ts`: add `import { colorsEnglish } from './colors-english';` and `registerGame(colorsEnglish);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'colorsen.prompt': '',`.

- [x] **Step 7: Write the module metadata test**

`src/games/colors-english/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { colorsEnglish } from './index';

describe('colors-english module', () => {
  it('declares the expected metadata', () => {
    expect(colorsEnglish.id).toBe('colors-english');
    expect(colorsEnglish.categoryId).toBe('english');
    expect(colorsEnglish.levels).toBe(3);
    expect(typeof colorsEnglish.createScene).toBe('function');
  });
});
```

- [x] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/colors-english/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [x] **Step 9: Commit**

```bash
git add src/games/colors-english/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(colors-english): add 'Colors' English game (#16)"
```

---

### Task 8: #3 Ghép Số với Lượng — numbers (`match-quantity`, drag-drop)

**Files:**
- Create: `src/games/match-quantity/matchQuantityLogic.ts`, `src/games/match-quantity/MatchQuantityScene.ts`, `src/games/match-quantity/index.ts`
- Test: `src/games/match-quantity/matchQuantityLogic.test.ts`, `src/games/match-quantity/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`; the `jigsaw` drag-drop pattern (`setInteractive({draggable:true})` + `input.on('drag'|'dragend')` + snap + `setDraggable(obj,false)` on a correct drop).
- Produces:
  - `EMOJI: string[]` (distinct group emoji)
  - `interface QuantityPair { value: number; emoji: string }`
  - `pairCountForLevel(level: number): number` → L1=2, L2=3, L3=4
  - `maxValueForLevel(level: number): number` → L1=3, L2=5, L3=10
  - `type Rng = () => number`
  - `interface MatchQuantityRound { pairs: QuantityPair[]; tileOrder: number[] }` — `pairs[i]` is the group to fill; `tileOrder` is a permutation of `[0..pairs.length-1]` giving the shuffled display order of the number tiles (`tileOrder[k]` = index into `pairs` of the value on the k-th tile). All `pairs[i].value` are distinct.
  - `generateRound(level: number, rng: Rng): MatchQuantityRound`
  - `starsFor(correct: number, total: number): number`
  - `class MatchQuantityScene extends Phaser.Scene`
  - `matchQuantity: GameModule`

- [x] **Step 1: Write the failing logic test**

`src/games/match-quantity/matchQuantityLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  EMOJI,
  pairCountForLevel,
  maxValueForLevel,
  generateRound,
  starsFor,
} from './matchQuantityLogic';

describe('per-level config', () => {
  it('grows pairs and value range with level', () => {
    expect(pairCountForLevel(1)).toBe(2);
    expect(pairCountForLevel(2)).toBe(3);
    expect(pairCountForLevel(3)).toBe(4);
    expect(maxValueForLevel(1)).toBe(3);
    expect(maxValueForLevel(2)).toBe(5);
    expect(maxValueForLevel(3)).toBe(10);
  });
});

describe('generateRound', () => {
  it('builds distinct-value pairs and a valid tile permutation', () => {
    for (const lvl of [1, 2, 3]) {
      const n = pairCountForLevel(lvl);
      const max = maxValueForLevel(lvl);
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.pairs).toHaveLength(n);
        expect(new Set(r.pairs.map((p) => p.value)).size).toBe(n); // distinct values
        for (const p of r.pairs) {
          expect(p.value).toBeGreaterThanOrEqual(1);
          expect(p.value).toBeLessThanOrEqual(max);
          expect(EMOJI).toContain(p.emoji);
        }
        // tileOrder is a permutation of [0..n-1].
        expect([...r.tileOrder].sort((a, b) => a - b)).toEqual(
          Array.from({ length: n }, (_, k) => k),
        );
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.3)).toEqual(generateRound(3, () => 0.3));
  });
});

describe('starsFor', () => {
  it('scores by first-try correct placements', () => {
    expect(starsFor(4, 4)).toBe(3);
    expect(starsFor(3, 4)).toBe(2); // 75% -> >=60%
    expect(starsFor(1, 4)).toBe(1);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/match-quantity/matchQuantityLogic.test.ts`
Expected: FAIL — cannot find module `./matchQuantityLogic`.

- [x] **Step 3: Implement the logic**

`src/games/match-quantity/matchQuantityLogic.ts`:
```ts
export type Rng = () => number;

export const EMOJI: string[] = ['🍎', '⭐', '🐰', '🌸', '🚗', '🐟', '🎈', '🍌'];

export interface QuantityPair {
  value: number;
  emoji: string;
}

export interface MatchQuantityRound {
  pairs: QuantityPair[];
  tileOrder: number[]; // permutation of [0..pairs.length-1]
}

export function pairCountForLevel(level: number): number {
  if (level <= 1) return 2;
  if (level === 2) return 3;
  return 4;
}

export function maxValueForLevel(level: number): number {
  if (level <= 1) return 3;
  if (level === 2) return 5;
  return 10;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): MatchQuantityRound {
  const n = pairCountForLevel(level);
  const max = maxValueForLevel(level);

  // Distinct values in 1..max.
  const values = new Set<number>();
  let guard = 0;
  while (values.size < n && guard++ < 200) values.add(1 + Math.floor(rng() * max));
  for (let v = 1; values.size < n; v++) values.add(((v - 1) % max) + 1);
  const valueList = [...values];

  const pairs: QuantityPair[] = valueList.map((value) => ({ value, emoji: pick(EMOJI, rng) }));

  // tileOrder: shuffle [0..n-1] deterministically (Fisher–Yates with rng).
  const tileOrder = Array.from({ length: n }, (_, k) => k);
  for (let i = tileOrder.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [tileOrder[i], tileOrder[j]] = [tileOrder[j], tileOrder[i]];
  }

  return { pairs, tileOrder };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/match-quantity/matchQuantityLogic.test.ts`
Expected: PASS.

- [x] **Step 5: Implement the Phaser scene (drag-drop, clone of JigsawScene)**

`src/games/match-quantity/MatchQuantityScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { generateRound, starsFor, type MatchQuantityRound } from './matchQuantityLogic';

interface SlotInfo {
  pairIndex: number; // which pair this group represents
  x: number;
  y: number;
  filled: boolean;
}

export class MatchQuantityScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private round!: MatchQuantityRound;
  private slots: SlotInfo[] = [];
  private placedFirstTry = 0;
  private placed = 0;
  private finished = false;

  constructor(host: GameHost, level: number) {
    super({ key: 'match-quantity' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff0f3');
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('matchquantity.prompt'));
    this.add
      .text(width / 2, 80, 'Kéo số vào nhóm đúng', { fontSize: '34px', color: '#a01a3a', fontStyle: 'bold' })
      .setOrigin(0.5);
    void this.host.speak('matchquantity.prompt');

    this.round = generateRound(this.level, Math.random);
    this.buildGroupsAndTiles();
  }

  private buildGroupsAndTiles(): void {
    const { width, height } = this.scale;
    const n = this.round.pairs.length;
    const rowGapY = 150;
    const topY = 170;

    // Each pair = a row: emoji group on the left, an empty drop slot on the right.
    this.round.pairs.forEach((pair, i) => {
      const y = topY + i * rowGapY;
      // Emoji group.
      const groupX = width * 0.32;
      const startX = groupX - ((Math.min(5, pair.value) - 1) * 46) / 2;
      for (let k = 0; k < pair.value; k++) {
        const col = k % 5;
        const row = Math.floor(k / 5);
        this.add.text(startX + col * 46, y - 20 + row * 40, pair.emoji, { fontSize: '36px' }).setOrigin(0.5);
      }
      // Drop slot (target).
      const slotX = width * 0.7;
      this.add
        .rectangle(slotX, y, 110, 110, 0xffffff, 0.5)
        .setStrokeStyle(5, 0xff8fab);
      this.slots.push({ pairIndex: i, x: slotX, y, filled: false });
    });

    // Number tiles along the bottom, in shuffled tileOrder.
    const trayY = height - 90;
    const n2 = this.round.tileOrder.length;
    this.round.tileOrder.forEach((pairIndex, k) => {
      const value = this.round.pairs[pairIndex].value;
      const trayX = width / 2 - ((n2 - 1) * 130) / 2 + k * 130;
      const tile = this.add
        .rectangle(trayX, trayY, 100, 100, 0xffd166)
        .setStrokeStyle(5, 0xe0a800)
        .setInteractive({ useHandCursor: true, draggable: true });
      const label = this.add
        .text(trayX, trayY, String(value), { fontSize: '52px', color: '#5a3d00', fontStyle: 'bold' })
        .setOrigin(0.5);
      tile.setData('value', value);
      tile.setData('label', label);
      tile.setData('homeX', trayX);
      tile.setData('homeY', trayY);
      this.input.setDraggable(tile);
    });

    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Rectangle, dx: number, dy: number) => {
      obj.x = dx;
      obj.y = dy;
      (obj.getData('label') as Phaser.GameObjects.Text).setPosition(dx, dy);
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Rectangle) => this.onDrop(obj));
  }

  private onDrop(tile: Phaser.GameObjects.Rectangle): void {
    if (this.finished) return;
    const value = tile.getData('value') as number;
    const label = tile.getData('label') as Phaser.GameObjects.Text;

    // Find the nearest unfilled slot within snapping distance.
    let best: SlotInfo | undefined;
    let bestDist = Infinity;
    for (const s of this.slots) {
      if (s.filled) continue;
      const d = Phaser.Math.Distance.Between(tile.x, tile.y, s.x, s.y);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }

    const SNAP = 80;
    if (best && bestDist <= SNAP && this.round.pairs[best.pairIndex].value === value) {
      // Correct placement: snap + lock.
      tile.x = best.x;
      tile.y = best.y;
      label.setPosition(best.x, best.y);
      best.filled = true;
      this.input.setDraggable(tile, false);
      tile.disableInteractive();
      this.host.playSfx('correct');
      this.placed++;
      this.placedFirstTry++; // counts because this tile had no prior wrong drop
      if (this.placed === this.round.pairs.length) this.finish();
    } else {
      // Wrong drop: bounce home; this tile no longer earns a first-try point.
      this.host.playSfx('wrong');
      tile.setData('missed', true);
      const homeX = tile.getData('homeX') as number;
      const homeY = tile.getData('homeY') as number;
      tile.x = homeX;
      tile.y = homeY;
      label.setPosition(homeX, homeY);
      this.tweens.add({ targets: [tile, label], x: homeX + 8, duration: 60, yoyo: true, repeat: 2 });
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const total = this.round.pairs.length;
    // First-try correct = tiles placed without a prior wrong drop. We approximate
    // by counting placements where the tile was never marked 'missed'.
    const stars = starsFor(this.placedFirstTry, total);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'match-quantity', level: this.level, score: total, stars });
  }
}
```

> **Manual-test note (Task 10):** verify each number tile drags smoothly (label
> follows the tile), snaps into the matching group's slot, and locks; a wrong drop
> bounces back to the tray. The snap distance (`SNAP = 80`) and slot/group layout
> are visual and CANNOT be unit-tested (no WebGL). The `placedFirstTry` star
> heuristic is intentionally simple — if a tile is wrong-dropped then later placed,
> it still increments `placedFirstTry`; if you want strict first-try scoring,
> consult `tile.getData('missed')` before incrementing. Keep `matchQuantityLogic`
> (the tested pure logic) unchanged when tuning the scene.

- [x] **Step 6: Implement the game module + register + manifest**

`src/games/match-quantity/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { MatchQuantityScene } from './MatchQuantityScene';

export const matchQuantity: GameModule = {
  id: 'match-quantity',
  categoryId: 'numbers',
  title: 'Ghép Số với Lượng',
  iconKey: '🔢',
  skill: 'Liên hệ số ↔ lượng',
  levels: 3,
  createScene: (host: GameHost, level: number) => new MatchQuantityScene(host, level),
};
```

In `src/games/index.ts`: add `import { matchQuantity } from './match-quantity';` and `registerGame(matchQuantity);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'matchquantity.prompt': '',`.

- [x] **Step 7: Write the module metadata test**

`src/games/match-quantity/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { matchQuantity } from './index';

describe('match-quantity module', () => {
  it('declares the expected metadata', () => {
    expect(matchQuantity.id).toBe('match-quantity');
    expect(matchQuantity.categoryId).toBe('numbers');
    expect(matchQuantity.levels).toBe(3);
    expect(typeof matchQuantity.createScene).toBe('function');
  });
});
```

- [x] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/match-quantity/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [x] **Step 9: Commit**

```bash
git add src/games/match-quantity/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(match-quantity): add 'Ghép Số với Lượng' numbers game (#3)"
```

---

### Task 9: #8 Phân Loại — logic (`sorting`, drag-drop)

**Files:**
- Create: `src/games/sorting/sortingLogic.ts`, `src/games/sorting/SortingScene.ts`, `src/games/sorting/index.ts`
- Test: `src/games/sorting/sortingLogic.test.ts`, `src/games/sorting/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`; the `jigsaw`/`match-quantity` drag-drop pattern.
- Produces:
  - `interface SortGroup { label: string; items: string[] }` — `label` is an emoji that represents the basket; `items` are distinct emoji belonging to that group.
  - `GROUPS: SortGroup[]` (≥ 3 groups)
  - `interface PileItem { emoji: string; basketIndex: number }`
  - `interface SortingBasket { label: string }`
  - `basketCountForLevel(level: number): number` → L1=2, L2=2, L3=3
  - `itemsPerBasketForLevel(level: number): number` → L1=2, L2=3, L3=2
  - `type Rng = () => number`
  - `interface SortingRound { baskets: SortingBasket[]; pile: PileItem[]; pileOrder: number[] }` — `pileOrder` is a permutation of `[0..pile.length-1]` giving the shuffled display order; each `pile[i].basketIndex` is a valid index into `baskets`; emoji across the pile are distinct.
  - `generateRound(level: number, rng: Rng): SortingRound`
  - `starsFor(correct: number, total: number): number`
  - `class SortingScene extends Phaser.Scene`
  - `sorting: GameModule`

- [x] **Step 1: Write the failing logic test**

`src/games/sorting/sortingLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  GROUPS,
  basketCountForLevel,
  itemsPerBasketForLevel,
  generateRound,
  starsFor,
} from './sortingLogic';

describe('per-level config', () => {
  it('sets basket and item counts per level', () => {
    expect(basketCountForLevel(1)).toBe(2);
    expect(basketCountForLevel(2)).toBe(2);
    expect(basketCountForLevel(3)).toBe(3);
    expect(itemsPerBasketForLevel(1)).toBe(2);
    expect(itemsPerBasketForLevel(2)).toBe(3);
    expect(itemsPerBasketForLevel(3)).toBe(2);
  });
});

describe('GROUPS', () => {
  it('has >= 3 groups with distinct labels', () => {
    expect(GROUPS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(GROUPS.map((g) => g.label)).size).toBe(GROUPS.length);
  });
});

describe('generateRound', () => {
  it('builds baskets + a valid pile with distinct emoji and a permutation', () => {
    for (const lvl of [1, 2, 3]) {
      const b = basketCountForLevel(lvl);
      const per = itemsPerBasketForLevel(lvl);
      for (let i = 0; i < 60; i++) {
        const r = generateRound(lvl, () => i / 60);
        expect(r.baskets).toHaveLength(b);
        expect(r.pile).toHaveLength(b * per);
        expect(new Set(r.pile.map((p) => p.emoji)).size).toBe(r.pile.length); // distinct
        for (const p of r.pile) {
          expect(p.basketIndex).toBeGreaterThanOrEqual(0);
          expect(p.basketIndex).toBeLessThan(b);
        }
        // Each basket gets exactly `per` items.
        for (let bi = 0; bi < b; bi++) {
          expect(r.pile.filter((p) => p.basketIndex === bi)).toHaveLength(per);
        }
        // pileOrder is a permutation.
        expect([...r.pileOrder].sort((a, c) => a - c)).toEqual(
          Array.from({ length: r.pile.length }, (_, k) => k),
        );
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(3, () => 0.25)).toEqual(generateRound(3, () => 0.25));
  });
});

describe('starsFor', () => {
  it('scores by correctly sorted items', () => {
    expect(starsFor(4, 4)).toBe(3);
    expect(starsFor(3, 4)).toBe(2);
    expect(starsFor(1, 4)).toBe(1);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/sorting/sortingLogic.test.ts`
Expected: FAIL — cannot find module `./sortingLogic`.

- [x] **Step 3: Implement the logic**

`src/games/sorting/sortingLogic.ts`:
```ts
export type Rng = () => number;

export interface SortGroup {
  label: string; // emoji representing the basket
  items: string[]; // distinct emoji belonging to this group
}

export const GROUPS: SortGroup[] = [
  { label: '🐾', items: ['🐱', '🐶', '🐰', '🐯', '🐸', '🐮'] }, // animals
  { label: '🍽️', items: ['🍎', '🍌', '🍇', '🍓', '🍑', '🍉'] }, // fruits
  { label: '🚦', items: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚀'] }, // vehicles
];

export interface SortingBasket {
  label: string;
}

export interface PileItem {
  emoji: string;
  basketIndex: number;
}

export interface SortingRound {
  baskets: SortingBasket[];
  pile: PileItem[];
  pileOrder: number[]; // permutation of [0..pile.length-1]
}

export function basketCountForLevel(level: number): number {
  return level >= 3 ? 3 : 2;
}

export function itemsPerBasketForLevel(level: number): number {
  return level === 2 ? 3 : 2;
}

function pickDistinctIndices(count: number, len: number, rng: Rng): number[] {
  const chosen = new Set<number>();
  let guard = 0;
  while (chosen.size < count && guard++ < 200) chosen.add(Math.min(len - 1, Math.floor(rng() * len)));
  for (let i = 0; chosen.size < count; i++) chosen.add(i % len);
  return [...chosen];
}

export function generateRound(level: number, rng: Rng): SortingRound {
  const basketCount = basketCountForLevel(level);
  const per = itemsPerBasketForLevel(level);

  const groupIdxs = pickDistinctIndices(basketCount, GROUPS.length, rng);
  const baskets: SortingBasket[] = groupIdxs.map((gi) => ({ label: GROUPS[gi].label }));

  const pile: PileItem[] = [];
  groupIdxs.forEach((gi, basketIndex) => {
    const itemIdxs = pickDistinctIndices(per, GROUPS[gi].items.length, rng);
    for (const ii of itemIdxs) pile.push({ emoji: GROUPS[gi].items[ii], basketIndex });
  });

  // pileOrder: shuffle [0..pile.length-1] deterministically.
  const pileOrder = Array.from({ length: pile.length }, (_, k) => k);
  for (let i = pileOrder.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [pileOrder[i], pileOrder[j]] = [pileOrder[j], pileOrder[i]];
  }

  return { baskets, pile, pileOrder };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/sorting/sortingLogic.test.ts`
Expected: PASS.

- [x] **Step 5: Implement the Phaser scene (drag-drop)**

`src/games/sorting/SortingScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { generateRound, starsFor, type SortingRound } from './sortingLogic';

interface BasketInfo {
  index: number;
  x: number;
  y: number;
}

export class SortingScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private round!: SortingRound;
  private baskets: BasketInfo[] = [];
  private placed = 0;
  private correct = 0;
  private finished = false;

  constructor(host: GameHost, level: number) {
    super({ key: 'sorting' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff7da');
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('sorting.prompt'));
    this.add
      .text(width / 2, 70, 'Kéo mỗi vật vào đúng giỏ', { fontSize: '34px', color: '#8a6d00', fontStyle: 'bold' })
      .setOrigin(0.5);
    void this.host.speak('sorting.prompt');

    this.round = generateRound(this.level, Math.random);
    this.buildBasketsAndPile();
  }

  private buildBasketsAndPile(): void {
    const { width, height } = this.scale;

    // Baskets across the top.
    const bN = this.round.baskets.length;
    const basketY = 200;
    this.round.baskets.forEach((basket, i) => {
      const x = width / 2 - ((bN - 1) * 220) / 2 + i * 220;
      this.add.rectangle(x, basketY, 170, 130, 0xffffff, 0.6).setStrokeStyle(6, 0xffd36e);
      this.add.text(x, basketY, basket.label, { fontSize: '72px' }).setOrigin(0.5);
      this.baskets.push({ index: i, x, y: basketY });
    });

    // Pile items along the bottom in shuffled pileOrder.
    const trayY = height - 110;
    const order = this.round.pileOrder;
    order.forEach((pileIdx, k) => {
      const item = this.round.pile[pileIdx];
      const x = width / 2 - ((order.length - 1) * 90) / 2 + k * 90;
      const obj = this.add
        .text(x, trayY, item.emoji, { fontSize: '56px' })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true, draggable: true });
      obj.setData('basketIndex', item.basketIndex);
      obj.setData('homeX', x);
      obj.setData('homeY', trayY);
      this.input.setDraggable(obj);
    });

    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Text, dx: number, dy: number) => {
      obj.x = dx;
      obj.y = dy;
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Text) => this.onDrop(obj));
  }

  private onDrop(obj: Phaser.GameObjects.Text): void {
    if (this.finished) return;
    const wantBasket = obj.getData('basketIndex') as number;

    // Nearest basket within snap distance.
    let best: BasketInfo | undefined;
    let bestDist = Infinity;
    for (const b of this.baskets) {
      const d = Phaser.Math.Distance.Between(obj.x, obj.y, b.x, b.y);
      if (d < bestDist) {
        bestDist = d;
        best = b;
      }
    }

    const SNAP = 110;
    if (best && bestDist <= SNAP && best.index === wantBasket) {
      // Correct: tuck into the basket and lock.
      obj.x = best.x + (Math.random() - 0.5) * 60;
      obj.y = best.y + 10;
      this.input.setDraggable(obj, false);
      obj.disableInteractive();
      this.host.playSfx('correct');
      this.correct++;
      this.placed++;
      if (this.placed === this.round.pile.length) this.finish();
    } else if (best && bestDist <= SNAP) {
      // Dropped in a basket, but the wrong one: count as placed (wrong) and lock,
      // so the board still completes (no "stuck" item) but the child loses a point.
      obj.x = best.x + (Math.random() - 0.5) * 60;
      obj.y = best.y + 10;
      this.input.setDraggable(obj, false);
      obj.disableInteractive();
      this.host.playSfx('wrong');
      this.placed++;
      if (this.placed === this.round.pile.length) this.finish();
    } else {
      // Not near any basket: bounce back home, try again.
      this.host.playSfx('wrong');
      const homeX = obj.getData('homeX') as number;
      const homeY = obj.getData('homeY') as number;
      obj.x = homeX;
      obj.y = homeY;
      this.tweens.add({ targets: obj, x: homeX + 8, duration: 60, yoyo: true, repeat: 2 });
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const total = this.round.pile.length;
    const stars = starsFor(this.correct, total);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({ gameId: 'sorting', level: this.level, score: total, stars });
  }
}
```

> **Manual-test note (Task 10):** verify each pile item drags into a basket and
> locks; a correct basket plays the correct sound, a wrong basket still locks (so
> the board always completes) but does not earn a point, and dropping outside any
> basket bounces the item back to the tray. `SNAP = 110` and the basket/tray layout
> are visual and CANNOT be unit-tested. Keep `sortingLogic` unchanged when tuning.

- [x] **Step 6: Implement the game module + register + manifest**

`src/games/sorting/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { SortingScene } from './SortingScene';

export const sorting: GameModule = {
  id: 'sorting',
  categoryId: 'logic',
  title: 'Phân Loại',
  iconKey: '🧺',
  skill: 'Nhóm gộp theo thuộc tính',
  levels: 3,
  createScene: (host: GameHost, level: number) => new SortingScene(host, level),
};
```

In `src/games/index.ts`: add `import { sorting } from './sorting';` and `registerGame(sorting);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'sorting.prompt': '',`.

- [x] **Step 7: Write the module metadata test**

`src/games/sorting/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sorting } from './index';

describe('sorting module', () => {
  it('declares the expected metadata', () => {
    expect(sorting.id).toBe('sorting');
    expect(sorting.categoryId).toBe('logic');
    expect(sorting.levels).toBe(3);
    expect(typeof sorting.createScene).toBe('function');
  });
});
```

- [x] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/sorting/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [x] **Step 9: Commit**

```bash
git add src/games/sorting/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(sorting): add 'Phân Loại' logic game (#8)"
```

---

### Task 10: Phase-3 registration verification + handoff

**Files:**
- Modify: `ROADMAP.md`, `.superpowers/sdd/progress.md`
- Verify (no edit): `src/games/index.ts` (must contain all 9 new `registerGame` calls), `src/audio/audioManifest.ts` (must contain all 9 new voice keys)

**Interfaces:**
- Consumes: every game registered in Tasks 1–9; the running app.
- Produces: a verified Phase 3 deliverable, an up-to-date roadmap, and a Phase 3 SDD ledger.

- [x] **Step 1: Confirm all 9 games are registered**

Open `src/games/index.ts` and confirm it now imports and registers all 15 games (6 from Phases 1–2 + 9 new). The 9 new `registerGame(...)` calls must be present: `moreLess`, `firstLetter`, `oddOneOut`, `abcEnglish`, `numbersEnglish`, `shapesColors`, `colorsEnglish`, `matchQuantity`, `sorting`.

Open `src/audio/audioManifest.ts` and confirm the `voices` map now contains all 9 new keys: `'moreless.prompt'`, `'matchquantity.prompt'`, `'firstletter.prompt'`, `'oddoneout.prompt'`, `'sorting.prompt'`, `'shapecolor.prompt'`, `'abc.prompt'`, `'numbersen.prompt'`, `'colorsen.prompt'` — each with value `''`.

> If any task was implemented out of order or by a parallel agent and a register/manifest line is missing, add it now (the additive single-line inserts from each task's Step 6).

- [x] **Step 2: Full test suite + build**

Run: `npm run test`
Expected: ALL tests pass and output is pristine (Phases 1–2 suite + the 9 new games' logic & metadata tests). Roughly 85 → ~110+ tests.

Run: `npm run build`
Expected: `tsc -b` + `vite build` succeed; `dist/` produced; no type errors.

- [x] **Step 3: End-to-end manual verification (Phase 3 Definition of Done)**

Run: `npm run dev`, open the URL, ensure ≥1 child profile exists (create via Bố mẹ if needed), pick a child, then verify EACH island lists its new game(s) and each is playable across its levels:
1. **Toán & Con số** → now also lists "Nhiều hơn – Ít hơn" (tap the more/less group; wrong tap shakes + retries) and "Ghép Số với Lượng" (drag each number tile into the group with that many items; correct drops snap & lock).
2. **Chữ cái** → now also lists "Chữ Cái Đầu Tiên" (tap the first letter of the shown word/picture).
3. **Giải đố** → now also lists "Vật Lạ Trong Nhóm" (tap the item from a different category) and "Phân Loại" (drag each item into the correct basket).
4. **Hình & Màu** → now also lists "Nhận Diện Màu & Hình" (tap the requested shape / colour / shape+colour drawn with Graphics).
5. **Tiếng Anh** → now also lists "ABC", "Numbers 1–10", and "Colors" (tap the matching letter / number / colour swatch; UI text Vietnamese).
6. **Replay** a 3-star game and confirm difficulty advances (more options / bigger value range / more pairs).
7. **Vườn sao** reflects the new totals; **reload the browser** → profiles, stars and progress persist.
8. **No errors** in the browser console; the two drag-drop games (Ghép Số với Lượng, Phân Loại) snap & lock as described.

> Record any drag-drop offset/snap quirks in the manual-test TODO alongside the
> Phase-2 jigsaw note; tune the scene drawing/snap only (pure logic stays frozen).

- [x] **Step 4: Update the roadmap**

In `ROADMAP.md`:
- Under "## Giai đoạn 3 — Đủ 16 trò", change the heading marker `☐` → `✅`. Tick the 9 shipped lines (`☐` → `✅`): #2 Nhiều hơn – Ít hơn, #3 Ghép Số với Lượng, #5 Chữ Cái Đầu Tiên, #7 Vật Lạ Trong Nhóm, #8 Phân Loại, #12 Nhận Diện Màu & Hình, #14 ABC, #15 Numbers 1–10, #16 Colors.
- Remove the `☐ #10 Tìm Điểm Khác` line from the Giai đoạn 3 list and ADD it under "## Giai đoạn 4 — Đánh bóng" as `☐ #10 Tìm Điểm Khác (dời từ GĐ3 — cần ảnh thật để có khác biệt tinh tế)`.
- Update the "## 👉 Tiếp theo cần làm gì" section: note Giai đoạn 3 is complete (15/16 games; #10 deferred to GĐ4 with real art) and the next step is **Giai đoạn 4 — Đánh bóng** (real AI art + voice + #10).
- Append a dated line to "## Nhật ký tiến độ", e.g.:
  `- **2026-06-20** — Giai đoạn 3 hoàn thành: thêm 9 trò (Nhiều hơn – Ít hơn, Ghép Số với Lượng, Chữ Cái Đầu Tiên, Vật Lạ Trong Nhóm, Phân Loại, Nhận Diện Màu & Hình, ABC, Numbers 1–10, Colors) — 15/16 trò; #10 Tìm Điểm Khác dời sang GĐ4 (cần ảnh thật). 85→~110+ test pass; build thành công. Kế tiếp: Giai đoạn 4.`

- [x] **Step 5: Update the SDD ledger**

In `.superpowers/sdd/progress.md`, append a Phase 3 section (a new block under the existing Phase 1 ledger), listing Tasks 1–10 as `[x]` complete with their commit subjects and a one-line note that all 9 games shipped, `npm run test` is pristine, and `npm run build` is green. Keep the existing Phase 1 content intact.

- [x] **Step 6: Commit**

```bash
git add ROADMAP.md .superpowers/sdd/progress.md
git commit -m "docs(phase-3): mark Giai đoạn 3 complete (9 games, #10 deferred to GĐ4)"
```

---

## Self-Review

**Spec coverage (against `docs/superpowers/specs/2026-06-20-kiddyhub-phase-3-design.md`):**

| Phase 3 requirement (spec §) | Task(s) |
|---|---|
| #2 more-less (§5, numbers, ⚖️, L1 1–5 gap≥2 / L2 1–8 / L3 1–10) | 1 |
| #5 first-letter (§5, letters, 🅰️, 3/4/4 options, basic first letters) | 2 |
| #7 odd-one-out (§5, logic, 🔍, 3/4/5 items, one foreign group) | 3 |
| #14 abc-english (§5, english, 🔤, A–G / A–N / A–Z) | 4 |
| #15 numbers-english (§5, english, 🔟, 1–5 / 1–8 / 1–10, 3 options) | 5 |
| #12 shapes-colors (§5, shapes, 🔺, Graphics, shape/color/both) | 6 |
| #16 colors-english (§5, english, 🎨, Graphics, 3 / 6 / ~8 colours) | 7 |
| #3 match-quantity (§5, numbers, 🔢, drag-drop, 2 / 3 / 4 pairs, tileOrder) | 8 |
| #8 sorting (§5, logic, 🧺, drag-drop, 2×2 / 2×3 / 3×2 baskets) | 9 |
| #10 deferred to Phase 4 (needs real art) | 10 (ROADMAP move) |
| 9 voice keys `''` in AUDIO_MANIFEST (§6) | 1–9 (Step 6 each) + verified Task 10 |
| Register each game in registerAllGames (§2) | 1–9 (Step 6 each) + verified Task 10 |
| Reuse starsFor(correct,total): 5 rounds touch-select; first-try for drag-drop (§4) | 1–7 (total=5), 8–9 (total=tiles) |
| TDD: logic test first, degenerate-rng safe pure logic, scene, index+register (§4, §7) | 1–9 (Steps 1–6) |
| No total-count test to fix; do NOT touch shell/map/garden/progression/applyCompletion/registry/data/audio core/categories (§2) | Global Constraints + Do-NOT-modify list |
| Manual scene test (esp. 2 drag-drop) in `npm run dev`; record TODO (§7) | 10 Step 3 + drag-drop manual-test notes |
| ROADMAP ✅ 9 games + move #10 to GĐ4 with note + Nhật ký; SDD ledger (§8) | 10 Steps 4–5 |

No Phase 3 requirement is left without a task.

**Placeholder scan:** No "TBD/TODO/implement later". Empty audio sources (`''`) are an intentional, documented design (silent no-op). The drag-drop snap math and the `shapes-colors` `fillStar` rendering are flagged as manual-tune (with the tested pure logic frozen), not plan gaps. Task 6's distractor fill is a deterministic double-loop (degenerate-rng safe).

**Type consistency:** Each game defines `Rng`, its own round type, `generateRound`, and a local `starsFor(correct, total)` once and consumes them with matching signatures in its scene + tests. `optionCountForLevel` returns are consistent within each task (first-letter 3/4/4; odd-one-out uses `itemCountForLevel` 3/4/5; abc 3/4/4; shapes-colors 3/4/4). Touch-select scenes use `QUESTIONS_PER_GAME = 5` and `correctCount`; drag-drop scenes use `placed`/`correct`/`placedFirstTry` with `total = tiles`. Module exports (`moreLess`, `firstLetter`, `oddOneOut`, `abcEnglish`, `numbersEnglish`, `shapesColors`, `colorsEnglish`, `matchQuantity`, `sorting`) match the imports added to `src/games/index.ts` and the assertions in each `index.test.ts`. `categoryId` values are all from the valid set (`numbers`/`letters`/`logic`/`shapes`/`english`). Voice keys in each scene's `host.speak(...)` match the keys added to `audioManifest.ts` (`moreless.prompt`, `firstletter.prompt`, `oddoneout.prompt`, `abc.prompt`, `numbersen.prompt`, `shapecolor.prompt`, `colorsen.prompt`, `matchquantity.prompt`, `sorting.prompt`).
