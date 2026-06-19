# KiddyHub — Giai đoạn 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exactly one playable game to each of the 5 remaining islands (Chữ cái, Logic, Trí nhớ, Hình khối, Tiếng Anh) so every category has content, and pay down one tech debt by extracting + testing the `applyCompletion` flow.

**Architecture:** Each game clones the `counting-fun` template: a pure-logic module (`*Logic.ts`, randomness injected via `Rng`, fully unit-tested) + a `Phaser.Scene` (built from `(host, level)`, using `host.speak/playSfx/awardStars/complete/goHome`, guarded against double-advance) + a `GameModule` (`index.ts`) registered in `registerAllGames`. Placeholder voice keys (`''`) go into `AUDIO_MANIFEST`. The shell, map, garden, progression, registry, data layer and `GameModule`/`GameHost` contracts are NOT touched — `CategoryScreen` reads the registry dynamically, so registering a game is enough to fill an island. Separately, the inline `onComplete` handler in `GameContainer` is extracted into a pure `applyCompletion(deps, result)` with integration tests.

**Tech Stack:** TypeScript 5 (strict), Phaser 3 (scenes), Vitest 2 (+ fake-indexeddb for data-layer tests). In test runs, `phaser` is aliased to `src/test/phaser-stub.ts` (see `vite.config.ts`), so tests cover pure logic + module metadata only; scenes are verified manually via `npm run dev`.

## Global Constraints

- **Runtime/target:** Web app for tablet browsers. No server, no network, all persistence local (IndexedDB). Node >= 18.
- **TypeScript:** `strict: true`. No `any` in committed code unless justified by a comment.
- **Language/UI copy:** All player-facing UI text in Vietnamese (even the English game's instructions). Mascot is a fox ("Cáo 🦊").
- **Age (3–5, pre-readers):** Voiced instructions, large touch targets (≥ 72px), NO "lose"/"game over"/timer/penalty — wrong answers get gentle encouragement + retry.
- **Assets:** Emoji / coloured shapes / uppercase letters / Phaser `RenderTexture` only. NO AI art in Phase 2. Audio sources are empty (`''`); `AudioManager` treats `''` as a silent no-op so `speak()` resolves immediately and the app runs with no audio files. Real art + voice land in Phase 4.
- **Randomness:** All pure logic takes `rng: () => number` (type `Rng`) so tests are deterministic. Scenes pass `Math.random` at runtime.
- **Star semantics (must preserve):** scene calls `host.awardStars(n)` to persist stars immediately; `host.complete(result)` records progress + advances level but does NOT re-persist stars (no double-count). `result.stars` is informational.
- **Do NOT modify:** `src/App.tsx`, `src/state/*`, `src/components/AdventureMap.tsx`, `src/components/CategoryScreen.tsx`, `src/components/StarGarden.tsx`, `src/components/parent/*`, `src/games/progression.ts`, `src/games/GameModule.ts`, `src/games/registry.ts`, `src/data/*`, `src/audio/AudioManager.ts`, `src/content/categories.ts`. The ONLY shared files touched are `src/games/index.ts` (one register line per game) and `src/audio/audioManifest.ts` (voice keys per game), plus `src/components/GameContainer.tsx` (Task 1 only).
- **Scoring reuse:** the three "5-round listen→tap" games reuse `starsFor(correct, total)` semantics with `total = 5`: 5 correct → 3⭐, ≥60% (≥3) → 2⭐, else → 1⭐. The two "one-board, stars-by-mistakes" games define their own pure star function with its own test.
- **Test scope:** Unit-test pure logic + module metadata. Do NOT write Phaser scene tests (jsdom has no WebGL; `phaser` is stubbed). Verify scenes manually in Task 8.
- **Commits:** One commit per task minimum; commit at each task's final step. End nothing with special trailers (default commits).

---

## File Structure

```
kiddy-hub/
  src/
    games/
      index.ts                       # MODIFY: add 5 register lines
      letter-spotting/               # Task 2 (#4, letters)
        letterLogic.ts
        letterLogic.test.ts
        LetterSpottingScene.ts
        index.ts
        index.test.ts
      pattern-finder/                # Task 3 (#6, logic)
        patternLogic.ts
        patternLogic.test.ts
        PatternFinderScene.ts
        index.ts
        index.test.ts
      first-words/                   # Task 4 (#13, english)
        wordLogic.ts
        wordLogic.test.ts
        FirstWordsScene.ts
        index.ts
        index.test.ts
      memory-match/                  # Task 5 (#9, memory)
        memoryLogic.ts
        memoryLogic.test.ts
        MemoryMatchScene.ts
        index.ts
        index.test.ts
      jigsaw/                        # Task 6 (#11, shapes)
        jigsawLogic.ts
        jigsawLogic.test.ts
        JigsawScene.ts
        index.ts
        index.test.ts
      applyCompletion.ts             # Task 1 (extracted pure flow)
      applyCompletion.test.ts        # Task 1
    audio/
      audioManifest.ts               # MODIFY: add voice keys per game
    components/
      GameContainer.tsx              # MODIFY (Task 1 only): call applyCompletion
  ROADMAP.md                         # MODIFY (Task 7): tick Phase 2 + log
```

**Independence:** Tasks 2–6 (the five games) are fully independent — no game imports another; each touches only its own `src/games/<id>/` folder plus one insert line in `src/games/index.ts` and `src/audio/audioManifest.ts`. They may be implemented in parallel by separate agents; the only shared edits are additive single-line inserts. **Task 1 (`applyCompletion`) is independent of all five games** and should land first (or in parallel) since it's the common completion path every game runs through.

---

### Task 1: Extract `applyCompletion` + integration tests (tech debt)

**Files:**
- Create: `src/games/applyCompletion.ts`
- Test: `src/games/applyCompletion.test.ts`
- Modify: `src/components/GameContainer.tsx` (replace inline `onComplete` body with a call to `applyCompletion`)

**Interfaces:**
- Consumes: `nextLevel` (`src/games/progression.ts`), `recordPlay` (`src/data/progress.ts`), `addStars` (`src/data/stars.ts`), `GameResult` (`src/games/GameModule.ts`).
- Produces:
  - `interface CompletionDeps { profileId: number; maxLevels: number; recordPlay: (profileId: number, gameId: string, level: number, score: number) => Promise<void>; }`
  - `applyCompletion(deps: CompletionDeps, result: GameResult): Promise<number>` — records the play at the auto-advanced level and returns the level it stored. Stars are NOT touched here (already persisted via `onAward`), preserving the no-double-count semantics.

- [ ] **Step 1: Write the failing test**

`src/games/applyCompletion.test.ts`:
```ts
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { applyCompletion } from './applyCompletion';
import type { GameResult } from './GameModule';

function makeDeps(overrides: Partial<Parameters<typeof applyCompletion>[0]> = {}) {
  const recordPlay = vi.fn().mockResolvedValue(undefined);
  return {
    deps: { profileId: 7, maxLevels: 3, recordPlay, ...overrides },
    recordPlay,
  };
}

const result = (level: number, stars: number): GameResult => ({
  gameId: 'counting-fun',
  level,
  score: stars >= 3 ? 5 : 3,
  stars,
});

describe('applyCompletion', () => {
  it('advances one level on a perfect (3-star) session below max', async () => {
    const { deps, recordPlay } = makeDeps();
    const stored = await applyCompletion(deps, result(1, 3));
    expect(stored).toBe(2);
    expect(recordPlay).toHaveBeenCalledWith(7, 'counting-fun', 2, 5);
  });

  it('does not advance past the max level', async () => {
    const { deps, recordPlay } = makeDeps();
    const stored = await applyCompletion(deps, result(3, 3));
    expect(stored).toBe(3);
    expect(recordPlay).toHaveBeenCalledWith(7, 'counting-fun', 3, 5);
  });

  it('keeps the level unchanged when not perfect', async () => {
    const { deps, recordPlay } = makeDeps();
    const stored = await applyCompletion(deps, result(2, 2));
    expect(stored).toBe(2);
    expect(recordPlay).toHaveBeenCalledWith(7, 'counting-fun', 2, 3);
  });

  it('does not persist stars itself (no double-count)', async () => {
    const { deps } = makeDeps();
    // applyCompletion has no addStars dependency at all; calling it must not throw.
    await expect(applyCompletion(deps, result(1, 3))).resolves.toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/applyCompletion.test.ts`
Expected: FAIL — cannot find module `./applyCompletion`.

- [ ] **Step 3: Implement `applyCompletion`**

`src/games/applyCompletion.ts`:
```ts
import { nextLevel } from './progression';
import type { GameResult } from './GameModule';

export interface CompletionDeps {
  profileId: number;
  maxLevels: number;
  recordPlay: (profileId: number, gameId: string, level: number, score: number) => Promise<void>;
}

/**
 * Persists a finished session: computes the auto-advanced level (a perfect
 * 3-star game bumps one level, capped at maxLevels) and records the play.
 * Stars are NOT persisted here — they were already added via host.awardStars
 * -> onAward, so this keeps the no-double-count guarantee. Returns the level
 * that was stored.
 */
export async function applyCompletion(deps: CompletionDeps, result: GameResult): Promise<number> {
  const newLevel = nextLevel(result.stars, result.level, deps.maxLevels);
  await deps.recordPlay(deps.profileId, result.gameId, newLevel, result.score);
  return newLevel;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/applyCompletion.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire `GameContainer` to use it**

In `src/components/GameContainer.tsx`, add the import and replace the inline `onComplete` body. After the existing imports, add:
```ts
import { applyCompletion } from '../games/applyCompletion';
```
Remove the now-unused `nextLevel` import line (`import { nextLevel } from '../games/progression';`).
Replace the `onComplete` callback with:
```ts
      onComplete: async (result: GameResult) => {
        await applyCompletion(
          { profileId, maxLevels: moduleDef.levels, recordPlay },
          result,
        );
        onExit(result); // stars already persisted via onAward
      },
```
(The `onAward`, `onHome`, and the `recordPlay`/`addStars` imports stay exactly as they are.)

- [ ] **Step 6: Type-check + full test suite**

Run: `npx tsc -b`
Expected: no type errors (confirms `GameContainer` still compiles with the new helper).

Run: `npm test`
Expected: ALL tests pass (existing suite + 4 new).

- [ ] **Step 7: Commit**

```bash
git add src/games/applyCompletion.ts src/games/applyCompletion.test.ts src/components/GameContainer.tsx
git commit -m "refactor(games): extract pure applyCompletion flow with integration tests"
```

---

### Task 2: #4 Bé Nhận Mặt Chữ — letters (`letter-spotting`)

**Files:**
- Create: `src/games/letter-spotting/letterLogic.ts`, `src/games/letter-spotting/LetterSpottingScene.ts`, `src/games/letter-spotting/index.ts`
- Test: `src/games/letter-spotting/letterLogic.test.ts`, `src/games/letter-spotting/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule` (`../GameModule`); `registerGame` (`../registry`); the existing `starsFor` semantics (re-implemented locally, identical to `counting-fun`).
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `LETTERS: string[]` (uppercase, includes Ă Â Ê Ô Ơ Ư Đ)
  - `optionCountForLevel(level: number): number` → L1=3, L2=4, L3=5
  - `type Rng = () => number`
  - `interface LetterRound { target: string; options: string[] }`
  - `generateRound(level: number, rng: Rng): LetterRound`
  - `starsFor(correct: number, total: number): number`
  - `class LetterSpottingScene extends Phaser.Scene`
  - `letterSpotting: GameModule`

- [ ] **Step 1: Write the failing logic test**

`src/games/letter-spotting/letterLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  LETTERS,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './letterLogic';

describe('LETTERS', () => {
  it('contains the Vietnamese diacritic uppercase letters', () => {
    for (const ch of ['Ă', 'Â', 'Ê', 'Ô', 'Ơ', 'Ư', 'Đ']) {
      expect(LETTERS).toContain(ch);
    }
    expect(new Set(LETTERS).size).toBe(LETTERS.length); // no dups
  });
});

describe('optionCountForLevel', () => {
  it('grows the choices by level', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(4);
    expect(optionCountForLevel(3)).toBe(5);
  });
});

describe('generateRound', () => {
  it('always includes the target among unique options of the right size', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let i = 0; i < 40; i++) {
        const r = generateRound(lvl, () => i / 40);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options).size).toBe(r.options.length); // unique
        expect(r.options).toContain(r.target);
        expect(LETTERS).toContain(r.target);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    const a = generateRound(3, () => 0.42);
    const b = generateRound(3, () => 0.42);
    expect(a).toEqual(b);
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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/letter-spotting/letterLogic.test.ts`
Expected: FAIL — cannot find module `./letterLogic`.

- [ ] **Step 3: Implement the letter logic**

`src/games/letter-spotting/letterLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

// Uppercase letters used for pre-readers, including Vietnamese diacritics.
export const LETTERS: string[] = [
  'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M',
  'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X', 'Y',
];

// Look-alike groups: at higher levels we prefer distractors from the same
// group as the target to make discrimination harder.
const CONFUSABLES: string[][] = [
  ['O', 'Ô', 'Ơ', 'Q'],
  ['E', 'Ê'],
  ['U', 'Ư', 'V'],
  ['A', 'Ă', 'Â'],
  ['P', 'R'],
  ['M', 'N'],
  ['C', 'G'],
  ['I', 'Y'],
];

export interface LetterRound {
  target: string;
  options: string[];
}

export function optionCountForLevel(level: number): number {
  if (level <= 1) return 3;
  if (level === 2) return 4;
  return 5;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): LetterRound {
  const target = pick(LETTERS, rng);
  const options = new Set<string>([target]);
  const size = optionCountForLevel(level);

  // From level 2 up, seed a few look-alike distractors when the target has any.
  if (level >= 2) {
    const group = CONFUSABLES.find((g) => g.includes(target)) ?? [];
    const lookAlikes = group.filter((c) => c !== target);
    let guard = 0;
    while (options.size < size && lookAlikes.length > 0 && guard++ < 50) {
      options.add(pick(lookAlikes, rng));
    }
  }

  // Fill the rest with random distinct letters.
  let guard = 0;
  while (options.size < size && guard++ < 200) {
    options.add(pick(LETTERS, rng));
  }
  // Degenerate-rng safety net: walk LETTERS to guarantee enough options.
  for (let i = 0; options.size < size; i++) options.add(LETTERS[i % LETTERS.length]);

  return { target, options: [...options] };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/letter-spotting/letterLogic.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Implement the Phaser scene**

`src/games/letter-spotting/LetterSpottingScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  type LetterRound,
} from './letterLogic';

export class LetterSpottingScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: LetterRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'letter-spotting' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#fff3e6');
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
      .on('pointerdown', () => void this.host.speak('letter.prompt'));
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
      .text(width / 2, 110, `Hãy tìm chữ "${this.current.target}"`, {
        fontSize: '40px',
        color: '#7a3e00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('letter.prompt');

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 150) / 2;
    const y = height / 2 + 40;
    opts.forEach((letter, i) => {
      const x = optStartX + i * 150;
      const btn = this.add
        .rectangle(x, y, 120, 120, 0xffffff)
        .setStrokeStyle(6, 0xffb366)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, letter, { fontSize: '64px', color: '#444', fontStyle: 'bold' })
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
      this.answeredThisRound = true; // first try wrong -> round not counted
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
    this.host.complete({
      gameId: 'letter-spotting',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
```

- [ ] **Step 6: Implement the game module + register + manifest**

`src/games/letter-spotting/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { LetterSpottingScene } from './LetterSpottingScene';

export const letterSpotting: GameModule = {
  id: 'letter-spotting',
  categoryId: 'letters',
  title: 'Bé Nhận Mặt Chữ',
  iconKey: '🔤',
  skill: 'Nhận diện mặt chữ cái',
  levels: 3,
  createScene: (host: GameHost, level: number) => new LetterSpottingScene(host, level),
};
```

In `src/games/index.ts`, add the import (alongside the existing `counting-fun` import) and the register call:
```ts
import { letterSpotting } from './letter-spotting';
// ...inside registerAllGames():
  registerGame(letterSpotting);
```

In `src/audio/audioManifest.ts`, add to the `voices` map:
```ts
    'letter.prompt': '',
```

- [ ] **Step 7: Write the module metadata test**

`src/games/letter-spotting/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { letterSpotting } from './index';

describe('letter-spotting module', () => {
  it('declares the expected metadata', () => {
    expect(letterSpotting.id).toBe('letter-spotting');
    expect(letterSpotting.categoryId).toBe('letters');
    expect(letterSpotting.levels).toBe(3);
    expect(typeof letterSpotting.createScene).toBe('function');
  });
});
```

- [ ] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/letter-spotting/`
Expected: PASS (logic + metadata tests).

Run: `npx tsc -b`
Expected: no type errors.

> Scene rendering is verified manually in Task 8 (jsdom has no WebGL).

- [ ] **Step 9: Commit**

```bash
git add src/games/letter-spotting/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(letter-spotting): add 'Bé Nhận Mặt Chữ' letters game (#4)"
```

---

### Task 3: #6 Tìm Quy Luật — logic (`pattern-finder`)

**Files:**
- Create: `src/games/pattern-finder/patternLogic.ts`, `src/games/pattern-finder/PatternFinderScene.ts`, `src/games/pattern-finder/index.ts`
- Test: `src/games/pattern-finder/patternLogic.test.ts`, `src/games/pattern-finder/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `TOKENS: string[]` (distinct emoji/colour tokens)
  - `optionCountForLevel(level: number): number` → L1=3, L2=3, L3=4
  - `type Rng = () => number`
  - `interface PatternRound { sequence: string[]; answer: string; options: string[] }` — `sequence` is the visible prefix (the scene draws a "?" cell after it), `answer` fills the missing last cell.
  - `generateRound(level: number, rng: Rng): PatternRound`
  - `starsFor(correct: number, total: number): number`
  - `class PatternFinderScene extends Phaser.Scene`
  - `patternFinder: GameModule`

- [ ] **Step 1: Write the failing logic test**

`src/games/pattern-finder/patternLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  TOKENS,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './patternLogic';

describe('optionCountForLevel', () => {
  it('uses 3 options for L1/L2 and 4 for L3', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(3);
    expect(optionCountForLevel(3)).toBe(4);
  });
});

describe('generateRound', () => {
  it('builds a sequence whose continued pattern equals the answer', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let i = 0; i < 40; i++) {
        const r = generateRound(lvl, () => i / 40);
        // Reconstruct the full pattern: the answer is the token that comes
        // after the visible sequence under the level's repeating rule.
        expect(TOKENS).toContain(r.answer);
        expect(r.sequence.length).toBeGreaterThanOrEqual(3);
        for (const t of r.sequence) expect(TOKENS).toContain(t);
        expect(r.options).toContain(r.answer);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options).size).toBe(r.options.length); // unique
      }
    }
  });

  it('produces AB repetition at level 1', () => {
    // With rng=0 the first two distinct tokens are TOKENS[0], TOKENS[1].
    const r = generateRound(1, () => 0);
    // AB pattern: sequence alternates two tokens; answer continues it.
    const a = r.sequence[0];
    const b = r.sequence[1];
    expect(a).not.toBe(b);
    // Each even index is a, each odd index is b.
    r.sequence.forEach((tok, idx) => expect(tok).toBe(idx % 2 === 0 ? a : b));
    const nextIsA = r.sequence.length % 2 === 0;
    expect(r.answer).toBe(nextIsA ? a : b);
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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/pattern-finder/patternLogic.test.ts`
Expected: FAIL — cannot find module `./patternLogic`.

- [ ] **Step 3: Implement the pattern logic**

`src/games/pattern-finder/patternLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export const TOKENS: string[] = ['🔴', '🔵', '🟡', '🟢', '🟣'];

export interface PatternRound {
  sequence: string[]; // visible prefix; the scene shows a "?" after it
  answer: string; // the token that fills the missing last cell
  options: string[];
}

export function optionCountForLevel(level: number): number {
  return level >= 3 ? 4 : 3;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

/** Returns `n` distinct tokens chosen via rng. */
function distinctTokens(n: number, rng: Rng): string[] {
  const chosen: string[] = [];
  let guard = 0;
  while (chosen.length < n && guard++ < 200) {
    const t = pick(TOKENS, rng);
    if (!chosen.includes(t)) chosen.push(t);
  }
  for (let i = 0; chosen.length < n; i++) {
    if (!chosen.includes(TOKENS[i % TOKENS.length])) chosen.push(TOKENS[i % TOKENS.length]);
  }
  return chosen;
}

/** Builds the repeating unit for the level, e.g. [A,B] / [A,B,C] / [A,A,B,B]. */
function unitForLevel(level: number, rng: Rng): string[] {
  if (level <= 1) return distinctTokens(2, rng); // AB
  if (level === 2) return distinctTokens(3, rng); // ABC
  // L3: choose AABB or ABB
  const [a, b] = distinctTokens(2, rng);
  return rng() < 0.5 ? [a, a, b, b] : [a, b, b];
}

export function generateRound(level: number, rng: Rng): PatternRound {
  const unit = unitForLevel(level, rng);
  // Show enough cells that the rule is visible: ~2 units, at least 3 cells,
  // then the NEXT cell is the hidden answer.
  const visibleLen = Math.max(3, unit.length * 2 - 1);
  const full: string[] = [];
  for (let i = 0; i < visibleLen + 1; i++) full.push(unit[i % unit.length]);
  const sequence = full.slice(0, visibleLen);
  const answer = full[visibleLen];

  const options = new Set<string>([answer]);
  // Prefer the other tokens in the unit as distractors, then random tokens.
  for (const t of unit) if (options.size < optionCountForLevel(level)) options.add(t);
  let guard = 0;
  while (options.size < optionCountForLevel(level) && guard++ < 200) {
    options.add(pick(TOKENS, rng));
  }
  for (let i = 0; options.size < optionCountForLevel(level); i++) {
    options.add(TOKENS[i % TOKENS.length]);
  }

  return { sequence, answer, options: [...options] };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/pattern-finder/patternLogic.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Implement the Phaser scene**

`src/games/pattern-finder/PatternFinderScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  type PatternRound,
} from './patternLogic';

export class PatternFinderScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: PatternRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'pattern-finder' });
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
      .on('pointerdown', () => void this.host.speak('pattern.prompt'));
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
      .text(width / 2, 90, 'Ô tiếp theo là gì?', {
        fontSize: '36px',
        color: '#8a6d00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('pattern.prompt');

    // Sequence row (+ a "?" cell at the end).
    const cells = [...this.current.sequence, '?'];
    const startX = width / 2 - ((cells.length - 1) * 84) / 2;
    cells.forEach((tok, i) => {
      const cell = this.add
        .text(startX + i * 84, height / 2 - 40, tok, { fontSize: '56px' })
        .setOrigin(0.5);
      this.layer!.add(cell);
    });

    // Option buttons.
    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 130) / 2;
    const y = height - 130;
    opts.forEach((tok, i) => {
      const x = optStartX + i * 130;
      const btn = this.add
        .rectangle(x, y, 100, 100, 0xffffff)
        .setStrokeStyle(6, 0xffd36e)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, tok, { fontSize: '48px' }).setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(tok, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(tok: string, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (tok === this.current.answer) {
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
    this.host.complete({
      gameId: 'pattern-finder',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
```

- [ ] **Step 6: Implement the game module + register + manifest**

`src/games/pattern-finder/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { PatternFinderScene } from './PatternFinderScene';

export const patternFinder: GameModule = {
  id: 'pattern-finder',
  categoryId: 'logic',
  title: 'Tìm Quy Luật',
  iconKey: '🧩',
  skill: 'Nhận ra quy luật chuỗi',
  levels: 3,
  createScene: (host: GameHost, level: number) => new PatternFinderScene(host, level),
};
```

In `src/games/index.ts`: add `import { patternFinder } from './pattern-finder';` and `registerGame(patternFinder);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'pattern.prompt': '',`.

- [ ] **Step 7: Write the module metadata test**

`src/games/pattern-finder/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { patternFinder } from './index';

describe('pattern-finder module', () => {
  it('declares the expected metadata', () => {
    expect(patternFinder.id).toBe('pattern-finder');
    expect(patternFinder.categoryId).toBe('logic');
    expect(patternFinder.levels).toBe(3);
    expect(typeof patternFinder.createScene).toBe('function');
  });
});
```

- [ ] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/pattern-finder/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/games/pattern-finder/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(pattern-finder): add 'Tìm Quy Luật' logic game (#6)"
```

---

### Task 4: #13 First Words — english (`first-words`)

**Files:**
- Create: `src/games/first-words/wordLogic.ts`, `src/games/first-words/FirstWordsScene.ts`, `src/games/first-words/index.ts`
- Test: `src/games/first-words/wordLogic.test.ts`, `src/games/first-words/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `interface WordItem { word: string; emoji: string }`
  - `WORD_BANK: Record<1 | 2 | 3, WordItem[]>` (L1 animals, L2 objects, L3 food)
  - `optionCountForLevel(level: number): number` → L1=3, L2=3, L3=4
  - `type Rng = () => number`
  - `interface WordRound { target: WordItem; options: WordItem[] }`
  - `generateRound(level: number, rng: Rng): WordRound`
  - `starsFor(correct: number, total: number): number`
  - `class FirstWordsScene extends Phaser.Scene`
  - `firstWords: GameModule`

- [ ] **Step 1: Write the failing logic test**

`src/games/first-words/wordLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  WORD_BANK,
  optionCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './wordLogic';

describe('WORD_BANK', () => {
  it('has at least 5 distinct items per level', () => {
    for (const lvl of [1, 2, 3] as const) {
      const bank = WORD_BANK[lvl];
      expect(bank.length).toBeGreaterThanOrEqual(5);
      expect(new Set(bank.map((w) => w.word)).size).toBe(bank.length);
      expect(new Set(bank.map((w) => w.emoji)).size).toBe(bank.length);
    }
  });
});

describe('optionCountForLevel', () => {
  it('uses 3 for L1/L2 and 4 for L3', () => {
    expect(optionCountForLevel(1)).toBe(3);
    expect(optionCountForLevel(2)).toBe(3);
    expect(optionCountForLevel(3)).toBe(4);
  });
});

describe('generateRound', () => {
  it('keeps target in options, unique by word, from the level bank', () => {
    for (const lvl of [1, 2, 3] as const) {
      for (let i = 0; i < 40; i++) {
        const r = generateRound(lvl, () => i / 40);
        expect(r.options).toHaveLength(optionCountForLevel(lvl));
        expect(new Set(r.options.map((o) => o.word)).size).toBe(r.options.length);
        expect(r.options.map((o) => o.word)).toContain(r.target.word);
        const bankWords = WORD_BANK[lvl].map((w) => w.word);
        for (const o of r.options) expect(bankWords).toContain(o.word);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generateRound(2, () => 0.6)).toEqual(generateRound(2, () => 0.6));
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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/first-words/wordLogic.test.ts`
Expected: FAIL — cannot find module `./wordLogic`.

- [ ] **Step 3: Implement the word logic**

`src/games/first-words/wordLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;

export type Rng = () => number;

export interface WordItem {
  word: string;
  emoji: string;
}

// L1 animals, L2 objects, L3 food. UI stays Vietnamese; only words are English.
export const WORD_BANK: Record<1 | 2 | 3, WordItem[]> = {
  1: [
    { word: 'cat', emoji: '🐱' },
    { word: 'dog', emoji: '🐶' },
    { word: 'fish', emoji: '🐟' },
    { word: 'bird', emoji: '🐦' },
    { word: 'bear', emoji: '🐻' },
    { word: 'frog', emoji: '🐸' },
  ],
  2: [
    { word: 'ball', emoji: '⚽' },
    { word: 'car', emoji: '🚗' },
    { word: 'book', emoji: '📖' },
    { word: 'cup', emoji: '☕' },
    { word: 'hat', emoji: '🎩' },
    { word: 'key', emoji: '🔑' },
  ],
  3: [
    { word: 'apple', emoji: '🍎' },
    { word: 'banana', emoji: '🍌' },
    { word: 'cake', emoji: '🍰' },
    { word: 'milk', emoji: '🥛' },
    { word: 'egg', emoji: '🥚' },
    { word: 'bread', emoji: '🍞' },
  ],
};

export interface WordRound {
  target: WordItem;
  options: WordItem[];
}

export function optionCountForLevel(level: number): number {
  return level >= 3 ? 4 : 3;
}

function bankFor(level: number): WordItem[] {
  if (level <= 1) return WORD_BANK[1];
  if (level === 2) return WORD_BANK[2];
  return WORD_BANK[3];
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): WordRound {
  const bank = bankFor(level);
  const target = pick(bank, rng);
  const size = optionCountForLevel(level);

  const chosen: WordItem[] = [target];
  let guard = 0;
  while (chosen.length < size && guard++ < 200) {
    const cand = pick(bank, rng);
    if (!chosen.some((c) => c.word === cand.word)) chosen.push(cand);
  }
  // Degenerate-rng safety net.
  for (let i = 0; chosen.length < size; i++) {
    const cand = bank[i % bank.length];
    if (!chosen.some((c) => c.word === cand.word)) chosen.push(cand);
  }

  return { target, options: chosen };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/first-words/wordLogic.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Implement the Phaser scene**

`src/games/first-words/FirstWordsScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  type WordRound,
} from './wordLogic';

export class FirstWordsScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private roundResolved = false;
  private current!: WordRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'first-words' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#ffe6df');
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
      .on('pointerdown', () => void this.host.speak('firstwords.prompt'));
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
    // UI in Vietnamese; the English word is shown small as a learning aid.
    const prompt = this.add
      .text(width / 2, 90, `Hãy tìm: ${this.current.target.word}`, {
        fontSize: '38px',
        color: '#8a2b1a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('firstwords.prompt');

    const opts = this.current.options;
    const optStartX = width / 2 - ((opts.length - 1) * 160) / 2;
    const y = height / 2 + 40;
    opts.forEach((item, i) => {
      const x = optStartX + i * 160;
      const btn = this.add
        .rectangle(x, y, 130, 130, 0xffffff)
        .setStrokeStyle(6, 0xff8a65)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, y, item.emoji, { fontSize: '66px' }).setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(item.word, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(word: string, btn: Phaser.GameObjects.Rectangle): void {
    if (this.roundResolved) return;
    if (word === this.current.target.word) {
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
    this.host.complete({
      gameId: 'first-words',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
```

- [ ] **Step 6: Implement the game module + register + manifest**

`src/games/first-words/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { FirstWordsScene } from './FirstWordsScene';

export const firstWords: GameModule = {
  id: 'first-words',
  categoryId: 'english',
  title: 'First Words',
  iconKey: '🌎',
  skill: 'Từ vựng tiếng Anh cơ bản',
  levels: 3,
  createScene: (host: GameHost, level: number) => new FirstWordsScene(host, level),
};
```

In `src/games/index.ts`: add `import { firstWords } from './first-words';` and `registerGame(firstWords);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'firstwords.prompt': '',`.

- [ ] **Step 7: Write the module metadata test**

`src/games/first-words/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { firstWords } from './index';

describe('first-words module', () => {
  it('declares the expected metadata', () => {
    expect(firstWords.id).toBe('first-words');
    expect(firstWords.categoryId).toBe('english');
    expect(firstWords.levels).toBe(3);
    expect(typeof firstWords.createScene).toBe('function');
  });
});
```

- [ ] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/first-words/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/games/first-words/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(first-words): add 'First Words' English game (#13)"
```

---

### Task 5: #9 Lật Hình Tìm Cặp — memory (`memory-match`)

**Files:**
- Create: `src/games/memory-match/memoryLogic.ts`, `src/games/memory-match/MemoryMatchScene.ts`, `src/games/memory-match/index.ts`
- Test: `src/games/memory-match/memoryLogic.test.ts`, `src/games/memory-match/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `type Rng = () => number`
  - `interface Card { id: number; faceKey: string; pairId: number }`
  - `interface GridSpec { rows: number; cols: number; pairs: number }`
  - `gridForLevel(level: number): GridSpec` → L1 {2,2,2}, L2 {3,2,3}, L3 {4,3,6}
  - `buildBoard(level: number, rng: Rng): Card[]` (shuffled, each pairId twice)
  - `starsForFlips(flips: number, pairs: number): number` (monotone non-increasing, perfect=3, never 0)
  - `class MemoryMatchScene extends Phaser.Scene`
  - `memoryMatch: GameModule`

- [ ] **Step 1: Write the failing logic test**

`src/games/memory-match/memoryLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { gridForLevel, buildBoard, starsForFlips } from './memoryLogic';

describe('gridForLevel', () => {
  it('grows the board per level with even cell counts', () => {
    for (const lvl of [1, 2, 3]) {
      const g = gridForLevel(lvl);
      expect((g.rows * g.cols) % 2).toBe(0);
      expect(g.pairs).toBe((g.rows * g.cols) / 2);
    }
    expect(gridForLevel(1)).toEqual({ rows: 2, cols: 2, pairs: 2 });
    expect(gridForLevel(2)).toEqual({ rows: 3, cols: 2, pairs: 3 });
    expect(gridForLevel(3)).toEqual({ rows: 4, cols: 3, pairs: 6 });
  });
});

describe('buildBoard', () => {
  it('produces rows*cols cards with each pairId appearing exactly twice', () => {
    for (const lvl of [1, 2, 3]) {
      const g = gridForLevel(lvl);
      const cards = buildBoard(lvl, () => 0.5);
      expect(cards).toHaveLength(g.rows * g.cols);
      const counts = new Map<number, number>();
      for (const c of cards) counts.set(c.pairId, (counts.get(c.pairId) ?? 0) + 1);
      expect([...counts.values()].every((n) => n === 2)).toBe(true);
      expect(counts.size).toBe(g.pairs);
      // Same pairId shares one faceKey.
      const byPair = new Map<number, string>();
      for (const c of cards) {
        if (byPair.has(c.pairId)) expect(byPair.get(c.pairId)).toBe(c.faceKey);
        else byPair.set(c.pairId, c.faceKey);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(buildBoard(3, () => 0.2)).toEqual(buildBoard(3, () => 0.2));
  });
});

describe('starsForFlips', () => {
  it('gives 3 stars for a perfect run and never below 1', () => {
    expect(starsForFlips(2, 2)).toBe(3); // perfect: pairs flips
    expect(starsForFlips(999, 6)).toBeGreaterThanOrEqual(1);
  });
  it('is monotone non-increasing as flips grow', () => {
    let prev = 3;
    for (let f = 6; f <= 30; f++) {
      const s = starsForFlips(f, 6);
      expect(s).toBeLessThanOrEqual(prev);
      expect(s).toBeGreaterThanOrEqual(1);
      prev = s;
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/memory-match/memoryLogic.test.ts`
Expected: FAIL — cannot find module `./memoryLogic`.

- [ ] **Step 3: Implement the memory logic**

`src/games/memory-match/memoryLogic.ts`:
```ts
export type Rng = () => number;

export interface Card {
  id: number;
  faceKey: string;
  pairId: number;
}

export interface GridSpec {
  rows: number;
  cols: number;
  pairs: number;
}

const FACES = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐸', '🐯', '🐵'];

export function gridForLevel(level: number): GridSpec {
  if (level <= 1) return { rows: 2, cols: 2, pairs: 2 };
  if (level === 2) return { rows: 3, cols: 2, pairs: 3 };
  return { rows: 4, cols: 3, pairs: 6 };
}

/** Fisher–Yates shuffle using an injected rng (deterministic in tests). */
function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildBoard(level: number, rng: Rng): Card[] {
  const { pairs } = gridForLevel(level);
  const cards: Card[] = [];
  let id = 0;
  for (let p = 0; p < pairs; p++) {
    const faceKey = FACES[p % FACES.length];
    cards.push({ id: id++, faceKey, pairId: p });
    cards.push({ id: id++, faceKey, pairId: p });
  }
  return shuffle(cards, rng);
}

/**
 * Stars by how many flip-pairs were used. Minimum possible = `pairs`
 * (every flip a match). Allowance: up to ~1.5x the minimum -> 3 stars,
 * up to ~2.5x -> 2 stars, else 1. Monotone non-increasing; never 0.
 */
export function starsForFlips(flips: number, pairs: number): number {
  if (flips <= pairs * 1.5) return 3;
  if (flips <= pairs * 2.5) return 2;
  return 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/memory-match/memoryLogic.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Implement the Phaser scene**

`src/games/memory-match/MemoryMatchScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { buildBoard, gridForLevel, starsForFlips, type Card } from './memoryLogic';

interface CardView {
  card: Card;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  matched: boolean;
  faceUp: boolean;
}

export class MemoryMatchScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private views: CardView[] = [];
  private first: CardView | null = null;
  private flips = 0;
  private matchedPairs = 0;
  private busy = false; // guards the third tap while two cards resolve
  private finished = false;

  constructor(host: GameHost, level: number) {
    super({ key: 'memory-match' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#efe6ff');
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('memory.prompt'));

    void this.host.speak('memory.prompt');
    this.layoutBoard();
  }

  private layoutBoard(): void {
    const { rows, cols } = gridForLevel(this.level);
    const cards = buildBoard(this.level, Math.random);
    const { width, height } = this.scale;
    const cell = 120;
    const gap = 20;
    const boardW = cols * cell + (cols - 1) * gap;
    const boardH = rows * cell + (rows - 1) * gap;
    const x0 = (width - boardW) / 2 + cell / 2;
    const y0 = (height - boardH) / 2 + cell / 2 + 30;

    cards.forEach((card, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = x0 + c * (cell + gap);
      const y = y0 + r * (cell + gap);
      const rect = this.add
        .rectangle(x, y, cell, cell, 0xb89bff)
        .setStrokeStyle(6, 0x8a5cff)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, card.faceKey, { fontSize: '64px' })
        .setOrigin(0.5)
        .setVisible(false);
      const view: CardView = { card, rect, label, matched: false, faceUp: false };
      rect.on('pointerdown', () => this.flip(view));
      this.views.push(view);
    });
  }

  private flip(view: CardView): void {
    if (this.busy || view.faceUp || view.matched || this.finished) return;
    view.faceUp = true;
    view.label.setVisible(true);
    view.rect.setFillStyle(0xffffff);

    if (!this.first) {
      this.first = view;
      return;
    }

    // Second card of a flip-pair.
    this.flips++;
    const first = this.first;
    this.first = null;

    if (first.card.pairId === view.card.pairId) {
      this.host.playSfx('correct');
      first.matched = true;
      view.matched = true;
      this.matchedPairs++;
      first.rect.setFillStyle(0x9be08a);
      view.rect.setFillStyle(0x9be08a);
      if (this.matchedPairs === gridForLevel(this.level).pairs) this.finish();
    } else {
      this.busy = true;
      this.host.playSfx('wrong');
      this.time.delayedCall(700, () => {
        for (const v of [first, view]) {
          v.faceUp = false;
          v.label.setVisible(false);
          v.rect.setFillStyle(0xb89bff);
        }
        this.busy = false;
      });
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const stars = starsForFlips(this.flips, gridForLevel(this.level).pairs);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({
      gameId: 'memory-match',
      level: this.level,
      score: this.matchedPairs,
      stars,
    });
  }
}
```

- [ ] **Step 6: Implement the game module + register + manifest**

`src/games/memory-match/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { MemoryMatchScene } from './MemoryMatchScene';

export const memoryMatch: GameModule = {
  id: 'memory-match',
  categoryId: 'memory',
  title: 'Lật Hình Tìm Cặp',
  iconKey: '🧠',
  skill: 'Trí nhớ ngắn hạn',
  levels: 3,
  createScene: (host: GameHost, level: number) => new MemoryMatchScene(host, level),
};
```

In `src/games/index.ts`: add `import { memoryMatch } from './memory-match';` and `registerGame(memoryMatch);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'memory.prompt': '',`.

- [ ] **Step 7: Write the module metadata test**

`src/games/memory-match/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { memoryMatch } from './index';

describe('memory-match module', () => {
  it('declares the expected metadata', () => {
    expect(memoryMatch.id).toBe('memory-match');
    expect(memoryMatch.categoryId).toBe('memory');
    expect(memoryMatch.levels).toBe(3);
    expect(typeof memoryMatch.createScene).toBe('function');
  });
});
```

- [ ] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/memory-match/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/games/memory-match/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(memory-match): add 'Lật Hình Tìm Cặp' memory game (#9)"
```

---

### Task 6: #11 Ghép Hình — shapes (`jigsaw`)

**Files:**
- Create: `src/games/jigsaw/jigsawLogic.ts`, `src/games/jigsaw/JigsawScene.ts`, `src/games/jigsaw/index.ts`
- Test: `src/games/jigsaw/jigsawLogic.test.ts`, `src/games/jigsaw/index.test.ts`
- Modify: `src/games/index.ts`, `src/audio/audioManifest.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule`, `registerGame`.
- Produces:
  - `type Rng = () => number`
  - `interface Piece { id: number; row: number; col: number }`
  - `interface GridSpec { rows: number; cols: number }`
  - `gridForLevel(level: number): GridSpec` → L1 {2,2}, L2 {2,3}, L3 {3,3}
  - `sliceGrid(level: number, rng: Rng): Piece[]` (shuffled; one piece per (row,col))
  - `isCorrectDrop(piece: Piece, targetRow: number, targetCol: number): boolean`
  - `starsForMisplacements(misses: number): number` (monotone non-increasing, 0 misses=3, never 0)
  - `class JigsawScene extends Phaser.Scene`
  - `jigsaw: GameModule`

- [ ] **Step 1: Write the failing logic test**

`src/games/jigsaw/jigsawLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { gridForLevel, sliceGrid, isCorrectDrop, starsForMisplacements } from './jigsawLogic';

describe('gridForLevel', () => {
  it('grows the grid per level', () => {
    expect(gridForLevel(1)).toEqual({ rows: 2, cols: 2 });
    expect(gridForLevel(2)).toEqual({ rows: 2, cols: 3 });
    expect(gridForLevel(3)).toEqual({ rows: 3, cols: 3 });
  });
});

describe('sliceGrid', () => {
  it('returns rows*cols pieces, one per (row,col) cell', () => {
    for (const lvl of [1, 2, 3]) {
      const { rows, cols } = gridForLevel(lvl);
      const pieces = sliceGrid(lvl, () => 0.4);
      expect(pieces).toHaveLength(rows * cols);
      const seen = new Set(pieces.map((p) => `${p.row},${p.col}`));
      expect(seen.size).toBe(rows * cols);
      for (const p of pieces) {
        expect(p.row).toBeGreaterThanOrEqual(0);
        expect(p.row).toBeLessThan(rows);
        expect(p.col).toBeGreaterThanOrEqual(0);
        expect(p.col).toBeLessThan(cols);
      }
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(sliceGrid(3, () => 0.7)).toEqual(sliceGrid(3, () => 0.7));
  });
});

describe('isCorrectDrop', () => {
  it('is true only when the piece lands on its own cell', () => {
    const piece = { id: 0, row: 1, col: 2 };
    expect(isCorrectDrop(piece, 1, 2)).toBe(true);
    expect(isCorrectDrop(piece, 0, 2)).toBe(false);
    expect(isCorrectDrop(piece, 1, 1)).toBe(false);
  });
});

describe('starsForMisplacements', () => {
  it('gives 3 for a clean solve and is monotone non-increasing, never 0', () => {
    expect(starsForMisplacements(0)).toBe(3);
    let prev = 3;
    for (let m = 0; m <= 12; m++) {
      const s = starsForMisplacements(m);
      expect(s).toBeLessThanOrEqual(prev);
      expect(s).toBeGreaterThanOrEqual(1);
      prev = s;
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/jigsaw/jigsawLogic.test.ts`
Expected: FAIL — cannot find module `./jigsawLogic`.

- [ ] **Step 3: Implement the jigsaw logic**

`src/games/jigsaw/jigsawLogic.ts`:
```ts
export type Rng = () => number;

export interface Piece {
  id: number;
  row: number;
  col: number;
}

export interface GridSpec {
  rows: number;
  cols: number;
}

export function gridForLevel(level: number): GridSpec {
  if (level <= 1) return { rows: 2, cols: 2 };
  if (level === 2) return { rows: 2, cols: 3 };
  return { rows: 3, cols: 3 };
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** One piece per cell, returned in shuffled tray order. */
export function sliceGrid(level: number, rng: Rng): Piece[] {
  const { rows, cols } = gridForLevel(level);
  const pieces: Piece[] = [];
  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) pieces.push({ id: id++, row: r, col: c });
  }
  return shuffle(pieces, rng);
}

export function isCorrectDrop(piece: Piece, targetRow: number, targetCol: number): boolean {
  return piece.row === targetRow && piece.col === targetCol;
}

/** 0 wrong drops -> 3 stars, <=2 -> 2, else 1. Monotone non-increasing; never 0. */
export function starsForMisplacements(misses: number): number {
  if (misses <= 0) return 3;
  if (misses <= 2) return 2;
  return 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/jigsaw/jigsawLogic.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Implement the Phaser scene**

`src/games/jigsaw/JigsawScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import { gridForLevel, isCorrectDrop, sliceGrid, starsForMisplacements, type Piece } from './jigsawLogic';

const PIC = 480; // placeholder picture size (square)
const TEX_KEY = 'jigsaw-pic';

export class JigsawScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private misses = 0;
  private placed = 0;
  private finished = false;
  private rows = 2;
  private cols = 2;
  private slotW = 0;
  private slotH = 0;
  private boardX = 0;
  private boardY = 0;

  constructor(host: GameHost, level: number) {
    super({ key: 'jigsaw' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#e2fff2');
    const { width } = this.scale;
    this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.host.goHome());
    this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => void this.host.speak('jigsaw.prompt'));
    void this.host.speak('jigsaw.prompt');

    this.buildPicture();
    this.buildBoardAndPieces();
  }

  /** Placeholder picture: a coloured panel + big emoji, baked to a texture, then sliced.
   *  Phase 4 only swaps this drawing for a real AI image. */
  private buildPicture(): void {
    const rt = this.add.renderTexture(0, 0, PIC, PIC).setVisible(false);
    const g = this.add.graphics();
    g.fillStyle(0xffd166, 1).fillRect(0, 0, PIC, PIC);
    g.fillStyle(0x06d6a0, 1).fillRect(0, PIC * 0.6, PIC, PIC * 0.4); // ground
    rt.draw(g, 0, 0);
    const emoji = this.add.text(PIC / 2, PIC / 2, '🦊', { fontSize: '300px' }).setOrigin(0.5);
    rt.draw(emoji, PIC / 2, PIC / 2);
    g.destroy();
    emoji.destroy();
    rt.saveTexture(TEX_KEY);
    rt.destroy();
  }

  private buildBoardAndPieces(): void {
    const grid = gridForLevel(this.level);
    this.rows = grid.rows;
    this.cols = grid.cols;
    this.slotW = PIC / this.cols;
    this.slotH = PIC / this.rows;

    const { width, height } = this.scale;
    this.boardX = width / 2 - PIC / 2;
    this.boardY = 110;

    // Target board: faint outlined slots.
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.add
          .rectangle(
            this.boardX + c * this.slotW + this.slotW / 2,
            this.boardY + r * this.slotH + this.slotH / 2,
            this.slotW - 4,
            this.slotH - 4,
            0xffffff,
            0.25,
          )
          .setStrokeStyle(3, 0x06a37a);
      }
    }

    // Tray pieces (shuffled). Each piece crops its own region from the baked texture.
    const pieces = sliceGrid(this.level, Math.random);
    const trayY = this.boardY + PIC + 90;
    pieces.forEach((piece, i) => {
      const img = this.add
        .image(0, 0, TEX_KEY)
        .setCrop(piece.col * this.slotW, piece.row * this.slotH, this.slotW, this.slotH)
        .setDisplaySize(this.slotW, this.slotH);
      // Position so the cropped region sits at the tray slot.
      const trayX = width / 2 - (pieces.length * (this.slotW + 8)) / 2 + i * (this.slotW + 8);
      img.setPosition(trayX - piece.col * this.slotW + this.slotW / 2, trayY - piece.row * this.slotH + this.slotH / 2);
      img.setInteractive({ useHandCursor: true, draggable: true });
      img.setData('piece', piece);
      this.input.setDraggable(img);
    });

    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, dx: number, dy: number) => {
      obj.x = dx;
      obj.y = dy;
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) =>
      this.onDrop(obj),
    );
  }

  private onDrop(obj: Phaser.GameObjects.Image): void {
    if (this.finished) return;
    const piece = obj.getData('piece') as Piece;
    // The image is anchored so its cropped region is offset; compute the region centre.
    const regionCx = obj.x + (piece.col + 0.5) * this.slotW - this.slotW / 2;
    const regionCy = obj.y + (piece.row + 0.5) * this.slotH - this.slotH / 2;
    const col = Math.floor((regionCx - this.boardX) / this.slotW);
    const row = Math.floor((regionCy - this.boardY) / this.slotH);

    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols && isCorrectDrop(piece, row, col)) {
      // Snap the cropped region into its slot and lock the piece.
      obj.x = this.boardX + piece.col * this.slotW + this.slotW / 2 - (piece.col + 0.5) * this.slotW + this.slotW / 2;
      obj.y = this.boardY + piece.row * this.slotH + this.slotH / 2 - (piece.row + 0.5) * this.slotH + this.slotH / 2;
      this.input.setDraggable(obj, false);
      obj.disableInteractive();
      this.host.playSfx('correct');
      this.placed++;
      if (this.placed === this.rows * this.cols) this.finish();
    } else {
      this.misses++;
      this.host.playSfx('wrong');
      this.tweens.add({ targets: obj, x: obj.x + 8, duration: 60, yoyo: true, repeat: 2 });
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const stars = starsForMisplacements(this.misses);
    this.host.playSfx('star');
    void this.host.speak('reward.cheer');
    this.host.awardStars(stars);
    this.host.complete({
      gameId: 'jigsaw',
      level: this.level,
      score: this.rows * this.cols,
      stars,
    });
  }
}
```

> **Manual-test note:** the snap math (anchoring a cropped image so its visible
> region lands in a board slot) is fiddly and CANNOT be unit-tested (no WebGL in
> jsdom). Verify drag/snap visually in Task 8; if a piece snaps to the wrong
> offset, adjust the anchor arithmetic in `onDrop`/tray placement while keeping
> `isCorrectDrop`/`sliceGrid`/`starsForMisplacements` (the tested pure logic)
> unchanged.

- [ ] **Step 6: Implement the game module + register + manifest**

`src/games/jigsaw/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { JigsawScene } from './JigsawScene';

export const jigsaw: GameModule = {
  id: 'jigsaw',
  categoryId: 'shapes',
  title: 'Ghép Hình',
  iconKey: '🎨',
  skill: 'Tư duy không gian',
  levels: 3,
  createScene: (host: GameHost, level: number) => new JigsawScene(host, level),
};
```

In `src/games/index.ts`: add `import { jigsaw } from './jigsaw';` and `registerGame(jigsaw);`.

In `src/audio/audioManifest.ts`, add to `voices`: `'jigsaw.prompt': '',`.

- [ ] **Step 7: Write the module metadata test**

`src/games/jigsaw/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { jigsaw } from './index';

describe('jigsaw module', () => {
  it('declares the expected metadata', () => {
    expect(jigsaw.id).toBe('jigsaw');
    expect(jigsaw.categoryId).toBe('shapes');
    expect(jigsaw.levels).toBe(3);
    expect(typeof jigsaw.createScene).toBe('function');
  });
});
```

- [ ] **Step 8: Run tests + type-check**

Run: `npx vitest run src/games/jigsaw/`
Expected: PASS.

Run: `npx tsc -b`
Expected: no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/games/jigsaw/ src/games/index.ts src/audio/audioManifest.ts
git commit -m "feat(jigsaw): add 'Ghép Hình' shapes jigsaw game (#11)"
```

---

### Task 7: Phase-2 verification + roadmap update

**Files:**
- Modify: `ROADMAP.md`

**Interfaces:**
- Consumes: every game registered above; the running app.
- Produces: a verified Phase 2 deliverable and an up-to-date roadmap.

- [ ] **Step 1: Full test suite + type-check + build**

Run: `npm test`
Expected: ALL tests pass (Phase 1 suite + Task 1's 4 + the 5 games' logic & metadata tests).

Run: `npm run build`
Expected: type-check + production build succeed, `dist/` produced.

- [ ] **Step 2: End-to-end manual verification (Phase 2 Definition of Done)**

Run: `npm run dev`, open the URL, ensure ≥1 child profile exists (create via Bố mẹ if needed), pick a child, then verify EACH island now has a playable game:
1. **Chữ cái** island → "Bé Nhận Mặt Chữ": hears a letter prompt, taps the matching uppercase letter (including diacritic letters like Ô/Ơ at higher levels); wrong tap shakes + retries (no "game over"); after 5 rounds returns to the map and the star total increased.
2. **Giải đố** island → "Tìm Quy Luật": a colour/shape sequence with a "?" cell; tapping the correct continuation advances; finishes in 5 rounds and awards stars.
3. **Trí nhớ** island → "Lật Hình Tìm Cặp": a grid of face-down cards; flipping two reveals them; matches stay up, mismatches flip back after a pause; clearing all pairs awards stars (fewer flips → more stars).
4. **Hình & Màu** island → "Ghép Hình": a placeholder picture sliced into a grid; dragging each piece onto its correct slot snaps it; completing the picture awards stars (fewer wrong drops → more stars).
5. **Tiếng Anh** island → "First Words": hears/sees an English word; taps the matching picture; finishes in 5 rounds and awards stars (UI text is Vietnamese).
6. **Replay** a game with a perfect (3-star) result and confirm the difficulty advances next time (more options / bigger board).
7. **Vườn sao** reflects the new total; **reload the browser** → profiles, stars and progress persist.
8. **No errors** in the browser console.

- [ ] **Step 3: Update the roadmap**

In `ROADMAP.md`:
- Under "## Giai đoạn 2 — Phủ kín 6 đảo", change the heading marker `☐` → `✅` and tick all five game lines (`☐` → `✅`): #4 Bé Nhận Mặt Chữ, #6 Tìm Quy Luật, #9 Lật Hình Tìm Cặp, #11 Ghép Hình, #13 First Words.
- Update the "## 👉 Tiếp theo cần làm gì" section: note Phase 2 is complete and the next step is **Giai đoạn 3 — Đủ 16 trò** (the 10 remaining games).
- In "## 🧰 Nợ kỹ thuật", strike/mark the `applyCompletion`/`GameContainer.onComplete` integration-test item as done (it shipped in Task 1).
- Append a dated line to "## Nhật ký tiến độ", e.g.:
  `- **2026-06-19** — Giai đoạn 2 hoàn thành: thêm 5 trò (Bé Nhận Mặt Chữ, Tìm Quy Luật, Lật Hình Tìm Cặp, Ghép Hình, First Words) — mỗi đảo nay có nội dung; tách + test applyCompletion. Toàn bộ test xanh; build thành công. Kế tiếp: Giai đoạn 3.`

- [ ] **Step 4: Commit**

```bash
git add ROADMAP.md
git commit -m "docs(roadmap): mark Giai đoạn 2 complete (5 games + applyCompletion)"
```

---

## Self-Review

**Spec coverage (against `docs/superpowers/specs/2026-06-19-kiddyhub-phase-2-design.md`):**

| Phase 2 requirement | Task(s) |
|---|---|
| #4 Bé Nhận Mặt Chữ (letters, diacritics, 3/4/5 options, confusables at L3) | 2 |
| #6 Tìm Quy Luật (logic, AB / ABC / AABB-ABB, "?" cell) | 3 |
| #13 First Words (english, animals/objects/food by level, 3/3/4 options, VI UI) | 4 |
| #9 Lật Hình Tìm Cặp (memory, 2×2/3×2/4×3, starsForFlips) | 5 |
| #11 Ghép Hình (shapes, jigsaw RenderTexture placeholder, starsForMisplacements) | 6 |
| Voice keys placeholder `''` per game in AUDIO_MANIFEST | 2–6 (Step 6 each) |
| Register each game in registerAllGames | 2–6 (Step 6 each) |
| Reuse starsFor(correct,5) for the 3 "listen→tap" games | 2, 3, 4 |
| Own tested pure star fn for the 2 "one-board" games | 5 (starsForFlips), 6 (starsForMisplacements) |
| Tech debt: extract + integration-test applyCompletion | 1 |
| DoD: all tests green; build OK; ≥1 game per remaining island; ROADMAP updated | 7 |
| Independence / parallelism documented | File Structure note + design §7 |
| Gotchas (Rng, guards, emoji assets, no shell edits, phaser-stub, no double-count) | Global Constraints + each scene's guard flags |

No Phase 2 requirement is left without a task.

**Placeholder scan:** No "TBD/TODO/implement later". Empty audio sources are an intentional, documented design (silent no-op). The jigsaw snap arithmetic is flagged as manual-tune (with the tested pure logic frozen), not a plan gap.

**Type consistency:** Each game defines `Rng`, its round/board/piece types, `generateRound`/`buildBoard`/`sliceGrid`, and its star function once and consumes them with matching signatures in its scene + tests. `starsFor(correct, total)` keeps the Phase-1 signature in Tasks 2–4. `gridForLevel`/`GridSpec` are local to each of Tasks 5 and 6 (independent definitions, same name, no cross-import). `applyCompletion(deps, result)` and `CompletionDeps` (Task 1) match their use in `GameContainer`. Module exports (`letterSpotting`, `patternFinder`, `firstWords`, `memoryMatch`, `jigsaw`) match the imports added to `src/games/index.ts`.
