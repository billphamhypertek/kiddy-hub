# KiddyHub — Giai đoạn 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the runnable foundation of KiddyHub — app shell, local data layer, audio system, game-plugin architecture, avatar entry, parent area, adventure map, family star garden — plus one complete game ("Đếm Vui") proving the core experience loop end-to-end.

**Architecture:** A React + TypeScript app shell (Vite) handles all menu/navigation/profile UI and stores everything locally in IndexedDB (via Dexie). Each game is a self-contained module implementing a `GameModule` interface and rendered with Phaser 3 inside a thin `GameContainer` bridge. Games talk to the shell only through a `GameHost` (speak / playSfx / awardStars / complete / goHome), so the shell never touches a game's internals and vice-versa. Audio goes through one `AudioManager` whose playback engine (Howler) is injected, keeping its gating logic unit-testable.

**Tech Stack:** Vite 5, React 18, TypeScript 5 (strict), Phaser 3, Dexie 4, Howler 2, Vitest 2 + @testing-library/react + jsdom + fake-indexeddb.

## Global Constraints

- **Runtime/target:** Web app for tablet browsers. No server, no network calls, no external data egress. All persistence is local (IndexedDB).
- **Node:** >= 18.
- **TypeScript:** `strict: true`. No `any` in committed code unless justified by a comment.
- **Language/UI copy:** All player-facing text in Vietnamese. Mascot is a fox ("Cáo 🦊"). Working product name: "KiddyHub".
- **Age constraints (3–5, pre-readers):** Critical instructions must be voiced (audio), not text-only. Touch targets large (≥ 72px). No "lose"/"game over" state, no countdown timers, no penalties — wrong answers get gentle encouragement and a retry.
- **Assets:** Use placeholder art (emoji/coloured shapes) and placeholder/empty audio in Phase 1. Final AI art + recorded voice are deferred to Phase 4. The audio manifest may contain empty sources; `AudioManager` treats empty/missing sources as silent no-ops so development runs without audio files.
- **Star economy:** A game awards 1–3 stars per completed session. Stars accumulate into one shared family `garden` and into per-child weekly tallies keyed by ISO week (`YYYY-Www`).
- **TDD:** Write the failing test first for all pure logic and data-layer code. Phaser scenes and canvas-mounting components are verified by explicit manual test steps (jsdom has no WebGL).
- **Commits:** One commit per task minimum; commit at each task's final step.

---

## File Structure

```
kiddy-hub/
  package.json                      # deps + scripts
  index.html                        # Vite entry HTML
  vite.config.ts                    # Vite + Vitest config
  tsconfig.json                     # strict TS config (app)
  tsconfig.node.json                # TS config for vite.config
  eslint.config.js                  # lint rules
  .prettierrc.json                  # format rules
  src/
    main.tsx                        # React root render
    App.tsx                         # screen router + integration (Task 17)
    test/setup.ts                   # vitest setup (jest-dom + fake-indexeddb)
    data/
      types.ts                      # all persisted data types
      week.ts                       # getWeekKey() ISO-week helper
      db.ts                         # Dexie database definition
      profiles.ts                   # profile CRUD repository
      settings.ts                   # settings repository (singleton)
      progress.ts                   # per-game progress repository
      stars.ts                      # star events + weekly tally + garden growth
    audio/
      AudioManager.ts               # injectable, testable audio core
      audioManifest.ts              # key -> source maps (placeholder/empty)
      howlerPlayer.ts               # Howler-backed PlayFn (manual-tested)
    games/
      GameModule.ts                 # GameModule + GameHost + GameResult types
      GameHost.ts                   # createGameHost() factory
      registry.ts                   # register/lookup games
      index.ts                      # imports+registers all game modules
      counting-fun/
        countingLogic.ts            # pure round generation + scoring
        CountingFunScene.ts         # Phaser scene
        index.ts                    # GameModule for "Đếm Vui"
    content/
      categories.ts                 # the 6 categories metadata
      avatars.ts                    # avatar option list
    state/
      SessionContext.tsx            # current-profile React context
      screens.ts                    # Screen union type + nav params
    components/
      GameContainer.tsx             # mounts Phaser game, wires GameHost
      WhoIsPlaying.tsx              # avatar entry screen
      AdventureMap.tsx              # 6-island home
      CategoryScreen.tsx            # games within a category
      StarGarden.tsx                # family garden + weekly tally
      parent/
        ParentGate.tsx              # simple-math gate
        ParentArea.tsx              # profile CRUD + settings + tally
```

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `eslint.config.js`, `.prettierrc.json`
- Create: `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working dev server, a working test runner, and a placeholder `App` component (replaced in Task 17). Everything later builds on this toolchain.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "kiddy-hub",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=18" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "dexie": "^4.0.8",
    "howler": "^2.2.4",
    "phaser": "^3.80.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/howler": "^2.2.11",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "eslint": "^9.7.0",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^24.1.0",
    "prettier": "^3.3.2",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.0.0",
    "vite": "^5.3.3",
    "vitest": "^2.0.2"
  }
}
```

- [ ] **Step 2: Create config files**

`index.html`:
```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>KiddyHub</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

`.prettierrc.json`:
```json
{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 100 }
```

`eslint.config.js`:
```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
```

- [ ] **Step 3: Create React entry + placeholder App + test setup**

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
```

`src/App.tsx`:
```tsx
export default function App() {
  return <h1>KiddyHub 🦊</h1>;
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Write the smoke test**

`src/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs tests', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Install deps and verify toolchain**

Run:
```bash
npm install
npm test
```
Expected: smoke test passes (`1 passed`).

Run:
```bash
npm run build
```
Expected: type-check + build succeed, `dist/` produced.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Vitest toolchain"
```

---

### Task 2: Data types + ISO week helper

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/week.ts`
- Test: `src/data/week.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - Types `CategoryId`, `Profile`, `Progress`, `StarEvent`, `Garden`, `Settings` (used by every data-layer task).
  - `getWeekKey(date: Date): string` → `'YYYY-Www'` (used by `stars.ts`).

- [ ] **Step 1: Create the data types**

`src/data/types.ts`:
```ts
export type CategoryId = 'numbers' | 'letters' | 'logic' | 'memory' | 'shapes' | 'english';

export interface Profile {
  id?: number;
  name: string;
  avatarKey: string;
  birthYear?: number;
  createdAt: number;
}

export interface Progress {
  id?: number;
  profileId: number;
  gameId: string;
  level: number;
  bestScore: number;
  timesPlayed: number;
  lastPlayedAt: number;
}

export interface StarEvent {
  id?: number;
  profileId: number;
  amount: number;
  earnedAt: number;
  weekKey: string;
}

export interface Garden {
  id: 'family';
  totalStars: number;
  grownItems: string[];
}

export interface Settings {
  id: 'app';
  soundOn: boolean;
  voiceOn: boolean;
  language: 'vi' | 'en';
}
```

- [ ] **Step 2: Write the failing test for `getWeekKey`**

`src/data/week.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getWeekKey } from './week';

describe('getWeekKey', () => {
  it('formats as YYYY-Www', () => {
    expect(getWeekKey(new Date(2026, 5, 19))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('returns ISO week 1 for 2026-01-01 (a Thursday)', () => {
    expect(getWeekKey(new Date(2026, 0, 1))).toBe('2026-W01');
  });

  it('returns 2026-W25 for 2026-06-19', () => {
    expect(getWeekKey(new Date(2026, 5, 19))).toBe('2026-W25');
  });

  it('rolls a late-December date into next ISO year', () => {
    // 2025-12-29 is a Monday whose Thursday is 2026-01-01 -> ISO week 1 of 2026
    expect(getWeekKey(new Date(2025, 11, 29))).toBe('2026-W01');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/data/week.test.ts`
Expected: FAIL — cannot find module `./week`.

- [ ] **Step 4: Implement `getWeekKey`**

`src/data/week.ts`:
```ts
/** Returns the ISO-8601 week key for a date, e.g. "2026-W25". */
export function getWeekKey(date: Date): string {
  // Work on a UTC copy at midnight to avoid DST drift.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1 .. Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to the Thursday of this week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/data/week.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data/types.ts src/data/week.ts src/data/week.test.ts
git commit -m "feat(data): add persisted types and ISO week-key helper"
```

---

### Task 3: Dexie database + profiles repository

**Files:**
- Create: `src/data/db.ts`
- Create: `src/data/profiles.ts`
- Test: `src/data/profiles.test.ts`

**Interfaces:**
- Consumes: types from `src/data/types.ts`.
- Produces:
  - `db` — the Dexie instance with tables `profiles`, `progress`, `starEvents`, `garden`, `settings` (used by all repositories).
  - `createProfile(data: Omit<Profile,'id'|'createdAt'>): Promise<number>`
  - `listProfiles(): Promise<Profile[]>`
  - `getProfile(id: number): Promise<Profile | undefined>`
  - `updateProfile(id: number, changes: Partial<Profile>): Promise<void>`
  - `deleteProfile(id: number): Promise<void>` (also deletes that profile's progress + star events)

- [ ] **Step 1: Create the Dexie database**

`src/data/db.ts`:
```ts
import Dexie, { type Table } from 'dexie';
import type { Profile, Progress, StarEvent, Garden, Settings } from './types';

export class KiddyHubDB extends Dexie {
  profiles!: Table<Profile, number>;
  progress!: Table<Progress, number>;
  starEvents!: Table<StarEvent, number>;
  garden!: Table<Garden, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('kiddyhub');
    this.version(1).stores({
      profiles: '++id, createdAt',
      progress: '++id, profileId, gameId, [profileId+gameId]',
      starEvents: '++id, profileId, weekKey',
      garden: 'id',
      settings: 'id',
    });
  }
}

export const db = new KiddyHubDB();
```

- [ ] **Step 2: Write the failing test for the profiles repository**

`src/data/profiles.test.ts`:
```ts
import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import {
  createProfile,
  listProfiles,
  getProfile,
  updateProfile,
  deleteProfile,
} from './profiles';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('profiles repository', () => {
  it('creates and lists profiles in creation order', async () => {
    await createProfile({ name: 'Na', avatarKey: 'cat' });
    await createProfile({ name: 'Bo', avatarKey: 'dog' });
    const all = await listProfiles();
    expect(all.map((p) => p.name)).toEqual(['Na', 'Bo']);
    expect(all[0].id).toBeTypeOf('number');
    expect(all[0].createdAt).toBeTypeOf('number');
  });

  it('gets and updates a profile', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await updateProfile(id, { avatarKey: 'fox' });
    const p = await getProfile(id);
    expect(p?.avatarKey).toBe('fox');
  });

  it('deletes a profile and its related rows', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await db.progress.add({
      profileId: id, gameId: 'counting-fun', level: 1, bestScore: 0, timesPlayed: 1, lastPlayedAt: 0,
    });
    await db.starEvents.add({ profileId: id, amount: 3, earnedAt: 0, weekKey: '2026-W25' });

    await deleteProfile(id);

    expect(await getProfile(id)).toBeUndefined();
    expect(await db.progress.where('profileId').equals(id).count()).toBe(0);
    expect(await db.starEvents.where('profileId').equals(id).count()).toBe(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/data/profiles.test.ts`
Expected: FAIL — cannot find module `./profiles`.

- [ ] **Step 4: Implement the profiles repository**

`src/data/profiles.ts`:
```ts
import { db } from './db';
import type { Profile } from './types';

export function createProfile(data: Omit<Profile, 'id' | 'createdAt'>): Promise<number> {
  return db.profiles.add({ ...data, createdAt: Date.now() });
}

export function listProfiles(): Promise<Profile[]> {
  return db.profiles.orderBy('createdAt').toArray();
}

export function getProfile(id: number): Promise<Profile | undefined> {
  return db.profiles.get(id);
}

export async function updateProfile(id: number, changes: Partial<Profile>): Promise<void> {
  await db.profiles.update(id, changes);
}

export async function deleteProfile(id: number): Promise<void> {
  await db.transaction('rw', db.profiles, db.progress, db.starEvents, async () => {
    await db.profiles.delete(id);
    await db.progress.where('profileId').equals(id).delete();
    await db.starEvents.where('profileId').equals(id).delete();
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/data/profiles.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data/db.ts src/data/profiles.ts src/data/profiles.test.ts
git commit -m "feat(data): add Dexie database and profiles repository"
```

---

### Task 4: Settings + progress repositories

**Files:**
- Create: `src/data/settings.ts`
- Create: `src/data/progress.ts`
- Test: `src/data/settings.test.ts`, `src/data/progress.test.ts`

**Interfaces:**
- Consumes: `db` (Task 3), types (Task 2).
- Produces:
  - `getSettings(): Promise<Settings>` (returns defaults when none stored)
  - `updateSettings(changes: Partial<Omit<Settings,'id'>>): Promise<Settings>`
  - `recordPlay(profileId: number, gameId: string, level: number, score: number): Promise<void>`
  - `getProgress(profileId: number, gameId: string): Promise<Progress | undefined>`

- [ ] **Step 1: Write the failing test for settings**

`src/data/settings.test.ts`:
```ts
import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { getSettings, updateSettings } from './settings';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('settings repository', () => {
  it('returns sensible defaults when nothing is stored', async () => {
    const s = await getSettings();
    expect(s).toEqual({ id: 'app', soundOn: true, voiceOn: true, language: 'vi' });
  });

  it('persists partial updates', async () => {
    await updateSettings({ soundOn: false });
    const s = await getSettings();
    expect(s.soundOn).toBe(false);
    expect(s.voiceOn).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/settings.test.ts`
Expected: FAIL — cannot find module `./settings`.

- [ ] **Step 3: Implement the settings repository**

`src/data/settings.ts`:
```ts
import { db } from './db';
import type { Settings } from './types';

const DEFAULT_SETTINGS: Settings = { id: 'app', soundOn: true, voiceOn: true, language: 'vi' };

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? DEFAULT_SETTINGS;
}

export async function updateSettings(changes: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const current = await getSettings();
  const next: Settings = { ...current, ...changes, id: 'app' };
  await db.settings.put(next);
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/settings.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for progress**

`src/data/progress.test.ts`:
```ts
import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { recordPlay, getProgress } from './progress';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('progress repository', () => {
  it('creates a progress row on first play', async () => {
    await recordPlay(1, 'counting-fun', 1, 4);
    const p = await getProgress(1, 'counting-fun');
    expect(p?.timesPlayed).toBe(1);
    expect(p?.bestScore).toBe(4);
    expect(p?.level).toBe(1);
  });

  it('keeps best level/score and increments play count', async () => {
    await recordPlay(1, 'counting-fun', 1, 4);
    await recordPlay(1, 'counting-fun', 2, 2);
    const p = await getProgress(1, 'counting-fun');
    expect(p?.timesPlayed).toBe(2);
    expect(p?.bestScore).toBe(4); // 4 > 2
    expect(p?.level).toBe(2); // 2 > 1
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/data/progress.test.ts`
Expected: FAIL — cannot find module `./progress`.

- [ ] **Step 7: Implement the progress repository**

`src/data/progress.ts`:
```ts
import { db } from './db';
import type { Progress } from './types';

export function getProgress(profileId: number, gameId: string): Promise<Progress | undefined> {
  return db.progress.where({ profileId, gameId }).first();
}

export async function recordPlay(
  profileId: number,
  gameId: string,
  level: number,
  score: number,
): Promise<void> {
  const existing = await getProgress(profileId, gameId);
  if (existing) {
    await db.progress.update(existing.id!, {
      level: Math.max(existing.level, level),
      bestScore: Math.max(existing.bestScore, score),
      timesPlayed: existing.timesPlayed + 1,
      lastPlayedAt: Date.now(),
    });
  } else {
    await db.progress.add({
      profileId,
      gameId,
      level,
      bestScore: score,
      timesPlayed: 1,
      lastPlayedAt: Date.now(),
    });
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/data/progress.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add src/data/settings.ts src/data/settings.test.ts src/data/progress.ts src/data/progress.test.ts
git commit -m "feat(data): add settings and progress repositories"
```

---

### Task 5: Stars + family garden repository

**Files:**
- Create: `src/data/stars.ts`
- Test: `src/data/stars.test.ts`

**Interfaces:**
- Consumes: `db` (Task 3), `getWeekKey` (Task 2), types (Task 2).
- Produces:
  - `GARDEN_MILESTONES: { stars: number; item: string }[]`
  - `itemsForStars(totalStars: number): string[]` (pure)
  - `addStars(profileId: number, amount: number): Promise<Garden>`
  - `getGarden(): Promise<Garden>`
  - `getWeeklyStars(profileId: number, weekKey?: string): Promise<number>`
  - `getWeeklyTally(weekKey?: string): Promise<{ profileId: number; name: string; stars: number }[]>` (sorted desc)

- [ ] **Step 1: Write the failing test**

`src/data/stars.test.ts`:
```ts
import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { createProfile } from './profiles';
import {
  itemsForStars,
  addStars,
  getGarden,
  getWeeklyStars,
  getWeeklyTally,
} from './stars';
import { getWeekKey } from './week';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('itemsForStars (pure)', () => {
  it('unlocks nothing below the first milestone', () => {
    expect(itemsForStars(4)).toEqual([]);
  });
  it('unlocks cumulative items as stars grow', () => {
    expect(itemsForStars(5)).toEqual(['flower']);
    expect(itemsForStars(30)).toEqual(['flower', 'bush', 'tree']);
  });
});

describe('stars + garden repository', () => {
  it('accumulates total stars into the shared garden', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const b = await createProfile({ name: 'Bo', avatarKey: 'dog' });
    await addStars(a, 3);
    await addStars(b, 2);
    const garden = await getGarden();
    expect(garden.totalStars).toBe(5);
    expect(garden.grownItems).toEqual(['flower']);
  });

  it('tracks weekly stars per child', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await addStars(a, 3);
    await addStars(a, 1);
    expect(await getWeeklyStars(a)).toBe(4);
  });

  it('ignores stars from other weeks in the weekly total', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await db.starEvents.add({ profileId: a, amount: 9, earnedAt: 0, weekKey: '1999-W01' });
    await addStars(a, 2);
    expect(await getWeeklyStars(a, getWeekKey(new Date()))).toBe(2);
  });

  it('builds a weekly tally sorted by stars desc with names', async () => {
    const a = await createProfile({ name: 'Na', avatarKey: 'cat' });
    const b = await createProfile({ name: 'Bo', avatarKey: 'dog' });
    await addStars(a, 2);
    await addStars(b, 5);
    const tally = await getWeeklyTally();
    expect(tally).toEqual([
      { profileId: b, name: 'Bo', stars: 5 },
      { profileId: a, name: 'Na', stars: 2 },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/stars.test.ts`
Expected: FAIL — cannot find module `./stars`.

- [ ] **Step 3: Implement the stars + garden repository**

`src/data/stars.ts`:
```ts
import { db } from './db';
import { getWeekKey } from './week';
import type { Garden } from './types';

export const GARDEN_MILESTONES: { stars: number; item: string }[] = [
  { stars: 5, item: 'flower' },
  { stars: 15, item: 'bush' },
  { stars: 30, item: 'tree' },
  { stars: 50, item: 'rabbit' },
  { stars: 80, item: 'pond' },
  { stars: 120, item: 'butterflies' },
];

/** Cumulative garden items unlocked at a given total star count. */
export function itemsForStars(totalStars: number): string[] {
  return GARDEN_MILESTONES.filter((m) => totalStars >= m.stars).map((m) => m.item);
}

const EMPTY_GARDEN: Garden = { id: 'family', totalStars: 0, grownItems: [] };

export function getGarden(): Promise<Garden> {
  return db.garden.get('family').then((g) => g ?? EMPTY_GARDEN);
}

export async function addStars(profileId: number, amount: number): Promise<Garden> {
  const weekKey = getWeekKey(new Date());
  return db.transaction('rw', db.starEvents, db.garden, async () => {
    await db.starEvents.add({ profileId, amount, earnedAt: Date.now(), weekKey });
    const current = (await db.garden.get('family')) ?? EMPTY_GARDEN;
    const next: Garden = {
      id: 'family',
      totalStars: current.totalStars + amount,
      grownItems: itemsForStars(current.totalStars + amount),
    };
    await db.garden.put(next);
    return next;
  });
}

export async function getWeeklyStars(
  profileId: number,
  weekKey: string = getWeekKey(new Date()),
): Promise<number> {
  const events = await db.starEvents
    .where('profileId')
    .equals(profileId)
    .filter((e) => e.weekKey === weekKey)
    .toArray();
  return events.reduce((sum, e) => sum + e.amount, 0);
}

export async function getWeeklyTally(
  weekKey: string = getWeekKey(new Date()),
): Promise<{ profileId: number; name: string; stars: number }[]> {
  const profiles = await db.profiles.toArray();
  const rows = await Promise.all(
    profiles.map(async (p) => ({
      profileId: p.id!,
      name: p.name,
      stars: await getWeeklyStars(p.id!, weekKey),
    })),
  );
  return rows.sort((x, y) => y.stars - x.stars);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/stars.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/stars.ts src/data/stars.test.ts
git commit -m "feat(data): add star events, weekly tally and family garden growth"
```

---

### Task 6: Audio system (injectable, testable core)

**Files:**
- Create: `src/audio/AudioManager.ts`
- Create: `src/audio/audioManifest.ts`
- Create: `src/audio/howlerPlayer.ts`
- Test: `src/audio/AudioManager.test.ts`

**Interfaces:**
- Consumes: nothing (Howler is wrapped behind an injected `PlayFn`).
- Produces:
  - `type PlayFn = (src: string, onEnd: () => void) => () => void` (returns a stop function)
  - `interface AudioManager { playSfx(key): void; speak(key): Promise<void>; stopVoice(): void; setSoundOn(on): void; setVoiceOn(on): void; }`
  - `createAudioManager(play: PlayFn, manifest?: AudioManifest): AudioManager`
  - `createHowlerPlayer(): PlayFn` (real engine; manual-tested)
  - `AUDIO_MANIFEST` with `voices` and `sfx` key maps (placeholder/empty sources)

- [ ] **Step 1: Write the failing test**

`src/audio/AudioManager.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { createAudioManager, type PlayFn } from './AudioManager';

const MANIFEST = {
  voices: { hello: 'hello.mp3', empty: '' },
  sfx: { tap: 'tap.mp3' },
};

function makePlay() {
  const calls: { src: string; onEnd: () => void }[] = [];
  const stop = vi.fn();
  const play: PlayFn = (src, onEnd) => {
    calls.push({ src, onEnd });
    return stop;
  };
  return { play, calls, stop };
}

describe('AudioManager', () => {
  it('plays a known sfx by key', () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    am.playSfx('tap');
    expect(calls).toHaveLength(1);
    expect(calls[0].src).toBe('tap.mp3');
  });

  it('does not play sfx when sound is off', () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    am.setSoundOn(false);
    am.playSfx('tap');
    expect(calls).toHaveLength(0);
  });

  it('resolves speak() immediately for an empty/missing source', async () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    await expect(am.speak('empty')).resolves.toBeUndefined();
    await expect(am.speak('does-not-exist')).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('resolves speak() when playback fires onEnd', async () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    const promise = am.speak('hello');
    expect(calls).toHaveLength(1);
    calls[0].onEnd(); // simulate clip finishing
    await expect(promise).resolves.toBeUndefined();
  });

  it('stops the previous voice clip when a new one starts', () => {
    const { play, stop } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    am.speak('hello');
    am.speak('hello');
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('resolves speak() immediately when voice is off', async () => {
    const { play, calls } = makePlay();
    const am = createAudioManager(play, MANIFEST);
    am.setVoiceOn(false);
    await expect(am.speak('hello')).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/audio/AudioManager.test.ts`
Expected: FAIL — cannot find module `./AudioManager`.

- [ ] **Step 3: Implement the AudioManager core**

`src/audio/AudioManager.ts`:
```ts
export type PlayFn = (src: string, onEnd: () => void) => () => void;

export interface AudioManifest {
  voices: Record<string, string>;
  sfx: Record<string, string>;
}

export interface AudioManager {
  playSfx(key: string): void;
  speak(key: string): Promise<void>;
  stopVoice(): void;
  setSoundOn(on: boolean): void;
  setVoiceOn(on: boolean): void;
}

export function createAudioManager(play: PlayFn, manifest: AudioManifest): AudioManager {
  let soundOn = true;
  let voiceOn = true;
  let stopCurrentVoice: (() => void) | null = null;

  function stopVoice(): void {
    if (stopCurrentVoice) {
      stopCurrentVoice();
      stopCurrentVoice = null;
    }
  }

  return {
    playSfx(key) {
      if (!soundOn) return;
      const src = manifest.sfx[key];
      if (!src) return; // missing/empty -> silent no-op (placeholder phase)
      play(src, () => {});
    },
    speak(key) {
      return new Promise<void>((resolve) => {
        if (!voiceOn) return resolve();
        const src = manifest.voices[key];
        if (!src) return resolve(); // missing/empty -> silent no-op
        stopVoice();
        stopCurrentVoice = play(src, () => {
          stopCurrentVoice = null;
          resolve();
        });
      });
    },
    stopVoice,
    setSoundOn(on) {
      soundOn = on;
    },
    setVoiceOn(on) {
      voiceOn = on;
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/audio/AudioManager.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Create the manifest and the Howler-backed player (no test — manual)**

`src/audio/audioManifest.ts`:
```ts
import type { AudioManifest } from './AudioManager';

// Phase 1 uses placeholder/empty sources. AudioManager treats '' as a silent
// no-op, so the app runs with no audio files. Real assets land in Phase 4.
export const AUDIO_MANIFEST: AudioManifest = {
  voices: {
    'counting.prompt': '',
    'feedback.correct': '',
    'feedback.tryagain': '',
    'reward.cheer': '',
    'who.title': '',
  },
  sfx: {
    tap: '',
    correct: '',
    wrong: '',
    star: '',
  },
};
```

`src/audio/howlerPlayer.ts`:
```ts
import { Howl } from 'howler';
import type { PlayFn } from './AudioManager';

/** Real audio engine. Returns a stop() handle for each clip. */
export function createHowlerPlayer(): PlayFn {
  return (src, onEnd) => {
    const howl = new Howl({ src: [src], html5: true });
    howl.once('end', onEnd);
    howl.play();
    return () => howl.stop();
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add src/audio/
git commit -m "feat(audio): add injectable AudioManager, manifest and Howler player"
```

---

### Task 7: Content metadata (categories + avatars)

**Files:**
- Create: `src/content/categories.ts`
- Create: `src/content/avatars.ts`
- Test: `src/content/categories.test.ts`

**Interfaces:**
- Consumes: `CategoryId` (Task 2).
- Produces:
  - `interface Category { id: CategoryId; title: string; icon: string; color: string; islandPos: { x: number; y: number } }`
  - `CATEGORIES: Category[]` (exactly the 6 categories)
  - `interface AvatarOption { key: string; emoji: string; label: string }`
  - `AVATARS: AvatarOption[]`

- [ ] **Step 1: Write the failing test**

`src/content/categories.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { CATEGORIES } from './categories';
import { AVATARS } from './avatars';

describe('content metadata', () => {
  it('defines exactly the 6 categories with unique ids', () => {
    expect(CATEGORIES).toHaveLength(6);
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(6);
    expect(ids).toContain('numbers');
    expect(ids).toContain('english');
  });

  it('gives every category a title, icon, colour and island position', () => {
    for (const c of CATEGORIES) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.icon.length).toBeGreaterThan(0);
      expect(c.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(c.islandPos.x).toBeGreaterThanOrEqual(0);
      expect(c.islandPos.y).toBeGreaterThanOrEqual(0);
    }
  });

  it('provides several unique avatar options', () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(AVATARS.map((a) => a.key)).size).toBe(AVATARS.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/categories.test.ts`
Expected: FAIL — cannot find module `./categories`.

- [ ] **Step 3: Implement the content metadata**

`src/content/categories.ts`:
```ts
import type { CategoryId } from '../data/types';

export interface Category {
  id: CategoryId;
  title: string;
  icon: string;
  color: string;
  /** Island position on the adventure map, in percent of the map area. */
  islandPos: { x: number; y: number };
}

export const CATEGORIES: Category[] = [
  { id: 'numbers', title: 'Toán & Con số', icon: '🔢', color: '#ff8fab', islandPos: { x: 18, y: 22 } },
  { id: 'letters', title: 'Chữ cái', icon: '🔤', color: '#7cc6fe', islandPos: { x: 60, y: 14 } },
  { id: 'logic', title: 'Giải đố', icon: '🧩', color: '#ffb703', islandPos: { x: 34, y: 50 } },
  { id: 'memory', title: 'Trí nhớ', icon: '🧠', color: '#b388ff', islandPos: { x: 70, y: 48 } },
  { id: 'shapes', title: 'Hình & Màu', icon: '🎨', color: '#06d6a0', islandPos: { x: 20, y: 76 } },
  { id: 'english', title: 'Tiếng Anh', icon: '🌎', color: '#ff7043', islandPos: { x: 64, y: 78 } },
];
```

`src/content/avatars.ts`:
```ts
export interface AvatarOption {
  key: string;
  emoji: string;
  label: string;
}

export const AVATARS: AvatarOption[] = [
  { key: 'cat', emoji: '🐱', label: 'Mèo' },
  { key: 'dog', emoji: '🐶', label: 'Cún' },
  { key: 'bear', emoji: '🐻', label: 'Gấu' },
  { key: 'rabbit', emoji: '🐰', label: 'Thỏ' },
  { key: 'fox', emoji: '🦊', label: 'Cáo' },
  { key: 'panda', emoji: '🐼', label: 'Trúc' },
  { key: 'lion', emoji: '🦁', label: 'Sư tử' },
  { key: 'frog', emoji: '🐸', label: 'Ếch' },
];

export function avatarEmoji(key: string): string {
  return AVATARS.find((a) => a.key === key)?.emoji ?? '🐱';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/content/categories.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/content/
git commit -m "feat(content): add category and avatar metadata"
```

---

### Task 8: Game plugin contracts — GameModule, GameHost, registry

**Files:**
- Create: `src/games/GameModule.ts`
- Create: `src/games/GameHost.ts`
- Create: `src/games/registry.ts`
- Test: `src/games/GameHost.test.ts`, `src/games/registry.test.ts`

**Interfaces:**
- Consumes: `CategoryId` (Task 2), `AudioManager` (Task 6).
- Produces:
  - `interface GameResult { gameId: string; level: number; score: number; stars: number }`
  - `interface GameHost { speak(key): Promise<void>; playSfx(key): void; awardStars(n): void; complete(r: GameResult): void; goHome(): void }`
  - `interface GameModule { id; categoryId: CategoryId; title; iconKey; skill; levels: number; createScene(host: GameHost, level: number): Phaser.Scene }`
  - `createGameHost(deps): GameHost`
  - `registerGame(m)`, `getGame(id)`, `getGamesByCategory(categoryId)`, `allGames()`

- [ ] **Step 1: Create the contracts**

`src/games/GameModule.ts`:
```ts
import type Phaser from 'phaser';
import type { CategoryId } from '../data/types';

export interface GameResult {
  gameId: string;
  level: number;
  score: number;
  stars: number;
}

export interface GameHost {
  speak(key: string): Promise<void>;
  playSfx(key: string): void;
  awardStars(n: number): void;
  complete(result: GameResult): void;
  goHome(): void;
}

export interface GameModule {
  id: string;
  categoryId: CategoryId;
  title: string;
  iconKey: string;
  skill: string;
  levels: number;
  createScene(host: GameHost, level: number): Phaser.Scene;
}
```

- [ ] **Step 2: Write the failing test for `createGameHost`**

`src/games/GameHost.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { createGameHost } from './GameHost';

describe('createGameHost', () => {
  it('routes speak/playSfx to the audio manager', () => {
    const audio = { speak: vi.fn().mockResolvedValue(undefined), playSfx: vi.fn() };
    const host = createGameHost({
      audio: audio as never,
      onAward: vi.fn(),
      onComplete: vi.fn(),
      onHome: vi.fn(),
    });
    host.speak('counting.prompt');
    host.playSfx('tap');
    expect(audio.speak).toHaveBeenCalledWith('counting.prompt');
    expect(audio.playSfx).toHaveBeenCalledWith('tap');
  });

  it('routes awardStars/complete/goHome to the supplied callbacks', () => {
    const onAward = vi.fn();
    const onComplete = vi.fn();
    const onHome = vi.fn();
    const host = createGameHost({
      audio: { speak: vi.fn(), playSfx: vi.fn() } as never,
      onAward,
      onComplete,
      onHome,
    });
    host.awardStars(3);
    host.complete({ gameId: 'counting-fun', level: 1, score: 5, stars: 3 });
    host.goHome();
    expect(onAward).toHaveBeenCalledWith(3);
    expect(onComplete).toHaveBeenCalledWith({ gameId: 'counting-fun', level: 1, score: 5, stars: 3 });
    expect(onHome).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/games/GameHost.test.ts`
Expected: FAIL — cannot find module `./GameHost`.

- [ ] **Step 4: Implement `createGameHost`**

`src/games/GameHost.ts`:
```ts
import type { AudioManager } from '../audio/AudioManager';
import type { GameHost, GameResult } from './GameModule';

export interface GameHostDeps {
  audio: Pick<AudioManager, 'speak' | 'playSfx'>;
  onAward: (n: number) => void;
  onComplete: (result: GameResult) => void;
  onHome: () => void;
}

export function createGameHost(deps: GameHostDeps): GameHost {
  return {
    speak: (key) => deps.audio.speak(key),
    playSfx: (key) => deps.audio.playSfx(key),
    awardStars: (n) => deps.onAward(n),
    complete: (result) => deps.onComplete(result),
    goHome: () => deps.onHome(),
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/games/GameHost.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Write the failing test for the registry**

`src/games/registry.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { registerGame, getGame, getGamesByCategory, allGames, _clearRegistry } from './registry';
import type { GameModule } from './GameModule';

function fakeGame(id: string, categoryId: GameModule['categoryId']): GameModule {
  return {
    id,
    categoryId,
    title: id,
    iconKey: '🎲',
    skill: 'test',
    levels: 3,
    createScene: () => ({}) as never,
  };
}

beforeEach(() => _clearRegistry());

describe('game registry', () => {
  it('registers and looks up by id', () => {
    registerGame(fakeGame('a', 'numbers'));
    expect(getGame('a')?.id).toBe('a');
    expect(getGame('missing')).toBeUndefined();
  });

  it('filters by category', () => {
    registerGame(fakeGame('a', 'numbers'));
    registerGame(fakeGame('b', 'numbers'));
    registerGame(fakeGame('c', 'logic'));
    expect(getGamesByCategory('numbers').map((g) => g.id)).toEqual(['a', 'b']);
    expect(allGames()).toHaveLength(3);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/games/registry.test.ts`
Expected: FAIL — cannot find module `./registry`.

- [ ] **Step 8: Implement the registry**

`src/games/registry.ts`:
```ts
import type { CategoryId } from '../data/types';
import type { GameModule } from './GameModule';

const games = new Map<string, GameModule>();

export function registerGame(module: GameModule): void {
  games.set(module.id, module);
}

export function getGame(id: string): GameModule | undefined {
  return games.get(id);
}

export function getGamesByCategory(categoryId: CategoryId): GameModule[] {
  return [...games.values()].filter((g) => g.categoryId === categoryId);
}

export function allGames(): GameModule[] {
  return [...games.values()];
}

/** Test-only: reset registry state between tests. */
export function _clearRegistry(): void {
  games.clear();
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run src/games/registry.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 10: Commit**

```bash
git add src/games/GameModule.ts src/games/GameHost.ts src/games/GameHost.test.ts src/games/registry.ts src/games/registry.test.ts
git commit -m "feat(games): add GameModule/GameHost contracts and game registry"
```

---

### Task 9: "Đếm Vui" pure logic (round generation + scoring)

**Files:**
- Create: `src/games/counting-fun/countingLogic.ts`
- Test: `src/games/counting-fun/countingLogic.test.ts`

**Interfaces:**
- Consumes: nothing (pure module; randomness injected).
- Produces:
  - `QUESTIONS_PER_GAME = 5`
  - `COUNTING_ANIMALS: string[]`
  - `maxCountForLevel(level: number): number`
  - `type Rng = () => number`
  - `interface CountingRound { count: number; animal: string; options: number[] }`
  - `generateRound(level: number, rng: Rng): CountingRound`
  - `starsFor(correct: number, total: number): number`

- [ ] **Step 1: Write the failing test**

`src/games/counting-fun/countingLogic.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  maxCountForLevel,
  generateRound,
  starsFor,
  QUESTIONS_PER_GAME,
} from './countingLogic';

describe('maxCountForLevel', () => {
  it('grows the counting range by level', () => {
    expect(maxCountForLevel(1)).toBe(3);
    expect(maxCountForLevel(2)).toBe(5);
    expect(maxCountForLevel(3)).toBe(10);
  });
});

describe('generateRound', () => {
  it('produces a count within the level range and 3 unique options including the answer', () => {
    // rng returns 0 -> picks first index/value deterministically
    const round = generateRound(2, () => 0);
    expect(round.count).toBeGreaterThanOrEqual(1);
    expect(round.count).toBeLessThanOrEqual(maxCountForLevel(2));
    expect(round.options).toHaveLength(3);
    expect(new Set(round.options).size).toBe(3);
    expect(round.options).toContain(round.count);
    expect(round.animal.length).toBeGreaterThan(0);
  });

  it('keeps all options within 1..max', () => {
    for (let i = 0; i < 50; i++) {
      const r = generateRound(3, () => i / 50);
      for (const opt of r.options) {
        expect(opt).toBeGreaterThanOrEqual(1);
        expect(opt).toBeLessThanOrEqual(maxCountForLevel(3));
      }
    }
  });
});

describe('starsFor', () => {
  it('awards 3 for a perfect game, 2 for >=60%, else 1', () => {
    expect(starsFor(5, 5)).toBe(3);
    expect(starsFor(3, 5)).toBe(2);
    expect(starsFor(1, 5)).toBe(1);
    expect(starsFor(0, 5)).toBe(1);
  });
  it('exposes a 5-question session length', () => {
    expect(QUESTIONS_PER_GAME).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/games/counting-fun/countingLogic.test.ts`
Expected: FAIL — cannot find module `./countingLogic`.

- [ ] **Step 3: Implement the counting logic**

`src/games/counting-fun/countingLogic.ts`:
```ts
export const QUESTIONS_PER_GAME = 5;

export const COUNTING_ANIMALS = ['🦆', '🐰', '🐸', '🐝', '🐟', '🦋'];

export type Rng = () => number;

export interface CountingRound {
  count: number;
  animal: string;
  options: number[];
}

export function maxCountForLevel(level: number): number {
  if (level <= 1) return 3;
  if (level === 2) return 5;
  return 10;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))];
}

export function generateRound(level: number, rng: Rng): CountingRound {
  const max = maxCountForLevel(level);
  const count = 1 + Math.floor(rng() * max); // 1..max
  const animal = pick(COUNTING_ANIMALS, rng);

  const options = new Set<number>([count]);
  let guard = 0;
  while (options.size < 3 && guard++ < 100) {
    const candidate = 1 + Math.floor(rng() * max);
    options.add(candidate);
  }
  // Guarantee 3 distinct options even if rng is degenerate.
  for (let v = 1; options.size < 3; v++) options.add(((v - 1) % max) + 1);

  return { count, animal, options: [...options].sort((a, b) => a - b) };
}

export function starsFor(correct: number, total: number): number {
  if (correct >= total) return 3;
  if (correct / total >= 0.6) return 2;
  return 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/games/counting-fun/countingLogic.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/games/counting-fun/countingLogic.ts src/games/counting-fun/countingLogic.test.ts
git commit -m "feat(counting-fun): add pure round generation and scoring logic"
```

---

### Task 10: "Đếm Vui" Phaser scene + game module

**Files:**
- Create: `src/games/counting-fun/CountingFunScene.ts`
- Create: `src/games/counting-fun/index.ts`
- Create: `src/games/index.ts`
- Test: `src/games/counting-fun/index.test.ts`

**Interfaces:**
- Consumes: `GameHost`, `GameModule` (Task 8); `generateRound`, `starsFor`, `QUESTIONS_PER_GAME`, `CountingRound` (Task 9); `registerGame` (Task 8).
- Produces:
  - `class CountingFunScene extends Phaser.Scene` (constructed with `(host, level)`)
  - `countingFun: GameModule`
  - `registerAllGames(): void` (called once at app startup)

**Host semantics (important):** `host.awardStars(n)` persists `n` stars immediately; `host.complete(result)` records the play and ends the session but does NOT itself persist stars (so a game that calls both does not double-count). `result.stars` is informational (the total awarded this session).

- [ ] **Step 1: Implement the Phaser scene**

`src/games/counting-fun/CountingFunScene.ts`:
```ts
import Phaser from 'phaser';
import type { GameHost } from '../GameModule';
import {
  QUESTIONS_PER_GAME,
  generateRound,
  starsFor,
  type CountingRound,
} from './countingLogic';

export class CountingFunScene extends Phaser.Scene {
  private host: GameHost;
  private level: number;
  private roundIndex = 0;
  private correctCount = 0;
  private answeredThisRound = false;
  private current!: CountingRound;
  private layer?: Phaser.GameObjects.Container;

  constructor(host: GameHost, level: number) {
    super({ key: 'counting-fun' });
    this.host = host;
    this.level = level;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#dff3ff');
    this.buildChrome();
    this.nextRound();
  }

  private buildChrome(): void {
    const { width } = this.scale;
    const home = this.add
      .text(24, 18, '🏠', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true });
    home.on('pointerdown', () => this.host.goHome());

    const listen = this.add
      .text(width - 64, 18, '🔊', { fontSize: '40px' })
      .setInteractive({ useHandCursor: true });
    listen.on('pointerdown', () => void this.host.speak('counting.prompt'));
  }

  private nextRound(): void {
    if (this.roundIndex >= QUESTIONS_PER_GAME) {
      this.finish();
      return;
    }
    this.answeredThisRound = false;
    this.current = generateRound(this.level, Math.random);
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);

    const { width, height } = this.scale;

    const prompt = this.add
      .text(width / 2, 90, `Có mấy chú ${this.current.animal}?`, {
        fontSize: '34px',
        color: '#22335a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.layer.add(prompt);
    void this.host.speak('counting.prompt');

    const startX = width / 2 - ((this.current.count - 1) * 72) / 2;
    for (let i = 0; i < this.current.count; i++) {
      const sprite = this.add
        .text(startX + i * 72, height / 2 - 30, this.current.animal, { fontSize: '60px' })
        .setOrigin(0.5);
      this.layer.add(sprite);
    }

    const optY = height - 130;
    const optStartX = width / 2 - ((this.current.options.length - 1) * 140) / 2;
    this.current.options.forEach((opt, i) => {
      const x = optStartX + i * 140;
      const btn = this.add
        .rectangle(x, optY, 104, 104, 0xffffff)
        .setStrokeStyle(6, 0xffd36e)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, optY, String(opt), { fontSize: '52px', color: '#444', fontStyle: 'bold' })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.choose(opt, btn));
      this.layer!.add(btn);
      this.layer!.add(label);
    });
  }

  private choose(opt: number, btn: Phaser.GameObjects.Rectangle): void {
    if (opt === this.current.count) {
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
      this.answeredThisRound = true; // first try was wrong -> round not counted
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
      gameId: 'counting-fun',
      level: this.level,
      score: this.correctCount,
      stars,
    });
  }
}
```

- [ ] **Step 2: Implement the game module and the registration entry point**

`src/games/counting-fun/index.ts`:
```ts
import type { GameHost, GameModule } from '../GameModule';
import { CountingFunScene } from './CountingFunScene';

export const countingFun: GameModule = {
  id: 'counting-fun',
  categoryId: 'numbers',
  title: 'Đếm Vui',
  iconKey: '🦆',
  skill: 'Đếm và nhận diện số',
  levels: 3,
  createScene: (host: GameHost, level: number) => new CountingFunScene(host, level),
};
```

`src/games/index.ts`:
```ts
import { registerGame } from './registry';
import { countingFun } from './counting-fun';

/** Registers every game module. Call once at app startup. */
export function registerAllGames(): void {
  registerGame(countingFun);
}
```

- [ ] **Step 3: Write the module metadata test**

`src/games/counting-fun/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { countingFun } from './index';

describe('counting-fun module', () => {
  it('declares the expected metadata', () => {
    expect(countingFun.id).toBe('counting-fun');
    expect(countingFun.categoryId).toBe('numbers');
    expect(countingFun.levels).toBe(3);
    expect(typeof countingFun.createScene).toBe('function');
  });
});
```

- [ ] **Step 4: Run the test + type-check**

Run: `npx vitest run src/games/counting-fun/index.test.ts`
Expected: PASS (1 test).

Run: `npx tsc -b`
Expected: no type errors.

> Note: the scene renders on a real canvas and is verified visually in Task 11 (it cannot run under jsdom).

- [ ] **Step 5: Commit**

```bash
git add src/games/counting-fun/CountingFunScene.ts src/games/counting-fun/index.ts src/games/counting-fun/index.test.ts src/games/index.ts
git commit -m "feat(counting-fun): add Phaser scene and game module registration"
```

---

### Task 11: GameContainer (React ↔ Phaser bridge)

**Files:**
- Create: `src/components/GameContainer.tsx`
- Modify (temporarily, for manual test only): `src/App.tsx`

**Interfaces:**
- Consumes: `getGame` (Task 8), `createGameHost` (Task 8), `AudioManager` (Task 6), `GameResult` (Task 8), `recordPlay` (Task 4), `addStars` (Task 5), `registerAllGames` (Task 10).
- Produces:
  - `GameContainer` React component with props `{ gameId, level, profileId, audio, onExit }`.
  - On `complete`: persists progress (recordPlay) and exits; stars are persisted via `onAward` (so they are not double-counted).

- [ ] **Step 1: Implement the GameContainer**

`src/components/GameContainer.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { getGame } from '../games/registry';
import { createGameHost } from '../games/GameHost';
import type { AudioManager } from '../audio/AudioManager';
import type { GameResult } from '../games/GameModule';
import { recordPlay } from '../data/progress';
import { addStars } from '../data/stars';

interface GameContainerProps {
  gameId: string;
  level: number;
  profileId: number;
  audio: AudioManager;
  onExit: (result?: GameResult) => void;
}

export function GameContainer({ gameId, level, profileId, audio, onExit }: GameContainerProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moduleDef = getGame(gameId);
    const parent = parentRef.current;
    if (!moduleDef || !parent) return;

    const host = createGameHost({
      audio,
      onAward: (n) => {
        void addStars(profileId, n); // awardStars persists immediately
      },
      onComplete: async (result: GameResult) => {
        // Auto-advance difficulty: a perfect session bumps the saved level
        // (capped at the game's max). recordPlay stores max(existing, level).
        const advance = result.stars >= 3 && result.level < moduleDef.levels;
        const newLevel = advance ? result.level + 1 : result.level;
        await recordPlay(profileId, result.gameId, newLevel, result.score);
        onExit(result); // stars already persisted via onAward
      },
      onHome: () => onExit(),
    });

    const scene = moduleDef.createScene(host, level);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: 1024,
      height: 768,
      backgroundColor: '#dff3ff',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene,
    });

    return () => {
      game.destroy(true);
    };
  }, [gameId, level, profileId, audio, onExit]);

  return <div ref={parentRef} style={{ width: '100%', height: '100%' }} />;
}
```

- [ ] **Step 2: Temporarily wire it into `App.tsx` for a manual play test**

Replace `src/App.tsx` with this scratch version (reverted in Task 17):
```tsx
import { useCallback, useMemo } from 'react';
import { GameContainer } from './components/GameContainer';
import { createAudioManager } from './audio/AudioManager';
import { createHowlerPlayer } from './audio/howlerPlayer';
import { AUDIO_MANIFEST } from './audio/audioManifest';
import { registerAllGames } from './games';

registerAllGames();

export default function App() {
  const audio = useMemo(
    () => createAudioManager(createHowlerPlayer(), AUDIO_MANIFEST),
    [],
  );
  const onExit = useCallback((r?: unknown) => {
    // eslint-disable-next-line no-console
    console.log('game exited with', r);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GameContainer gameId="counting-fun" level={1} profileId={1} audio={audio} onExit={onExit} />
    </div>
  );
}
```

- [ ] **Step 3: Manual play test**

Run: `npm run dev` and open the served URL in a browser.
Verify ALL of:
- A counting scene appears: prompt "Có mấy chú …?", some animal emoji to count, three number buttons.
- Tapping the correct number turns it green and advances after a short pause.
- Tapping a wrong number shakes it and lets you try again (no penalty, no "game over").
- After 5 questions the scene ends and the browser console logs `game exited with { gameId: 'counting-fun', level: 1, score: <0-5>, stars: <1-3> }`.
- Tapping 🏠 logs `game exited with undefined`.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameContainer.tsx src/App.tsx
git commit -m "feat(games): add GameContainer bridge mounting Phaser scenes in React"
```

---

### Task 12: Session context + screen navigation types

**Files:**
- Create: `src/state/screens.ts`
- Create: `src/state/SessionContext.tsx`
- Test: `src/state/SessionContext.test.tsx`

**Interfaces:**
- Consumes: `CategoryId` (Task 2), `Profile` (Task 2).
- Produces:
  - `type Screen` — discriminated union of all screens (`who | map | category | game | garden | parentGate | parent`).
  - `SessionProvider` component + `useSession(): { profile: Profile | null; setProfile(p): void }`.

- [ ] **Step 1: Create the screen navigation types**

`src/state/screens.ts`:
```ts
import type { CategoryId } from '../data/types';

export type Screen =
  | { name: 'who' }
  | { name: 'map' }
  | { name: 'category'; categoryId: CategoryId }
  | { name: 'game'; gameId: string; level: number }
  | { name: 'garden' }
  | { name: 'parentGate' }
  | { name: 'parent' };
```

- [ ] **Step 2: Write the failing test for the session context**

`src/state/SessionContext.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider, useSession } from './SessionContext';

function Probe() {
  const { profile, setProfile } = useSession();
  return (
    <div>
      <span data-testid="name">{profile?.name ?? 'none'}</span>
      <button onClick={() => setProfile({ name: 'Na', avatarKey: 'cat', createdAt: 0 })}>set</button>
    </div>
  );
}

describe('SessionContext', () => {
  it('exposes and updates the current profile', async () => {
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    expect(screen.getByTestId('name')).toHaveTextContent('none');
    await userEvent.click(screen.getByText('set'));
    expect(screen.getByTestId('name')).toHaveTextContent('Na');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/state/SessionContext.test.tsx`
Expected: FAIL — cannot find module `./SessionContext`.

- [ ] **Step 4: Implement the session context**

`src/state/SessionContext.tsx`:
```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Profile } from '../data/types';

interface SessionValue {
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  return (
    <SessionContext.Provider value={{ profile, setProfile }}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/state/SessionContext.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add src/state/screens.ts src/state/SessionContext.tsx src/state/SessionContext.test.tsx
git commit -m "feat(state): add screen navigation types and session context"
```

---

### Task 13: "Ai đang chơi?" avatar entry screen

**Files:**
- Create: `src/components/WhoIsPlaying.tsx`
- Test: `src/components/WhoIsPlaying.test.tsx`

**Interfaces:**
- Consumes: `listProfiles` (Task 3), `avatarEmoji` (Task 7), `Profile` (Task 2).
- Produces: `WhoIsPlaying` component with props `{ onSelect: (p: Profile) => void; onParent: () => void }`.

- [ ] **Step 1: Write the failing test**

`src/components/WhoIsPlaying.test.tsx`:
```tsx
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../data/db';
import { createProfile } from '../data/profiles';
import { WhoIsPlaying } from './WhoIsPlaying';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('WhoIsPlaying', () => {
  it('lists stored profiles and selects one', async () => {
    await createProfile({ name: 'Na', avatarKey: 'cat' });
    const onSelect = vi.fn();
    render(<WhoIsPlaying onSelect={onSelect} onParent={() => {}} />);
    await userEvent.click(await screen.findByText('Na'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Na' }));
  });

  it('exposes the parent entry', async () => {
    const onParent = vi.fn();
    render(<WhoIsPlaying onSelect={() => {}} onParent={onParent} />);
    await userEvent.click(await screen.findByLabelText('Khu phụ huynh'));
    expect(onParent).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/WhoIsPlaying.test.tsx`
Expected: FAIL — cannot find module `./WhoIsPlaying`.

- [ ] **Step 3: Implement the screen**

`src/components/WhoIsPlaying.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { listProfiles } from '../data/profiles';
import { avatarEmoji } from '../content/avatars';
import type { Profile } from '../data/types';

interface Props {
  onSelect: (p: Profile) => void;
  onParent: () => void;
}

export function WhoIsPlaying({ onSelect, onParent }: Props) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);

  useEffect(() => {
    void listProfiles().then(setProfiles);
  }, []);

  return (
    <div className="screen who">
      <h1>Ai đang chơi? 🦊</h1>
      {profiles === null ? (
        <p>Đang tải…</p>
      ) : profiles.length === 0 ? (
        <p className="hint">Chưa có bé nào. Bố mẹ hãy tạo hồ sơ nhé!</p>
      ) : (
        <div className="avatar-grid">
          {profiles.map((p) => (
            <button key={p.id} className="avatar-card" onClick={() => onSelect(p)}>
              <span className="avatar-emoji">{avatarEmoji(p.avatarKey)}</span>
              <span className="avatar-name">{p.name}</span>
            </button>
          ))}
        </div>
      )}
      <button className="parent-link" aria-label="Khu phụ huynh" onClick={onParent}>
        👨‍👩‍👧 Bố mẹ
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/WhoIsPlaying.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/WhoIsPlaying.tsx src/components/WhoIsPlaying.test.tsx
git commit -m "feat(ui): add 'Ai đang chơi?' avatar entry screen"
```

---

### Task 14: Parent gate + parent area

**Files:**
- Create: `src/components/parent/ParentGate.tsx`
- Create: `src/components/parent/ParentArea.tsx`
- Test: `src/components/parent/ParentGate.test.tsx`, `src/components/parent/ParentArea.test.tsx`

**Interfaces:**
- Consumes: `listProfiles`, `createProfile`, `deleteProfile` (Task 3); `getSettings`, `updateSettings` (Task 4); `getWeeklyTally` (Task 5); `AVATARS`, `avatarEmoji` (Task 7); `AudioManager` (Task 6).
- Produces:
  - `ParentGate` with props `{ onPass: () => void; makeProblem?: () => { a: number; b: number } }`.
  - `ParentArea` with props `{ audio: AudioManager; onExit: () => void }`.

- [ ] **Step 1: Write the failing test for the gate**

`src/components/parent/ParentGate.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParentGate } from './ParentGate';

describe('ParentGate', () => {
  it('passes on the correct answer', async () => {
    const onPass = vi.fn();
    render(<ParentGate onPass={onPass} makeProblem={() => ({ a: 3, b: 4 })} />);
    await userEvent.type(screen.getByLabelText('Đáp án'), '7');
    await userEvent.click(screen.getByText('Vào'));
    expect(onPass).toHaveBeenCalled();
  });

  it('rejects a wrong answer and shows a hint', async () => {
    const onPass = vi.fn();
    render(<ParentGate onPass={onPass} makeProblem={() => ({ a: 3, b: 4 })} />);
    await userEvent.type(screen.getByLabelText('Đáp án'), '5');
    await userEvent.click(screen.getByText('Vào'));
    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/parent/ParentGate.test.tsx`
Expected: FAIL — cannot find module `./ParentGate`.

- [ ] **Step 3: Implement the gate**

`src/components/parent/ParentGate.tsx`:
```tsx
import { useState } from 'react';

interface Problem {
  a: number;
  b: number;
}

function randomProblem(): Problem {
  return { a: 2 + Math.floor(Math.random() * 8), b: 2 + Math.floor(Math.random() * 8) };
}

interface Props {
  onPass: () => void;
  makeProblem?: () => Problem;
}

export function ParentGate({ onPass, makeProblem = randomProblem }: Props) {
  const [problem, setProblem] = useState<Problem>(makeProblem);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function check() {
    if (Number(value) === problem.a + problem.b) {
      onPass();
    } else {
      setError(true);
      setValue('');
      setProblem(makeProblem());
    }
  }

  return (
    <div className="screen parent-gate">
      <h2>Khu vực dành cho bố mẹ</h2>
      <p>
        Giải nhanh:{' '}
        <strong>
          {problem.a} + {problem.b} = ?
        </strong>
      </p>
      <input
        aria-label="Đáp án"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={check}>Vào</button>
      {error && <p role="alert">Chưa đúng, thử lại nhé.</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/parent/ParentGate.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for the parent area**

`src/components/parent/ParentArea.test.tsx`:
```tsx
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../../data/db';
import { listProfiles } from '../../data/profiles';
import { ParentArea } from './ParentArea';

const fakeAudio = {
  playSfx: vi.fn(),
  speak: vi.fn().mockResolvedValue(undefined),
  stopVoice: vi.fn(),
  setSoundOn: vi.fn(),
  setVoiceOn: vi.fn(),
};

beforeEach(async () => {
  await db.delete();
  await db.open();
  vi.clearAllMocks();
});

describe('ParentArea', () => {
  it('adds a child profile', async () => {
    render(<ParentArea audio={fakeAudio} onExit={() => {}} />);
    await userEvent.type(screen.getByLabelText('Tên bé'), 'Na');
    await userEvent.click(screen.getByText('Thêm bé'));
    expect(await screen.findByText(/Na/)).toBeInTheDocument();
    expect(await listProfiles()).toHaveLength(1);
  });

  it('toggling voice updates settings and the audio manager', async () => {
    render(<ParentArea audio={fakeAudio} onExit={() => {}} />);
    const voice = await screen.findByLabelText('Giọng đọc');
    await userEvent.click(voice);
    expect(fakeAudio.setVoiceOn).toHaveBeenCalledWith(false);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/components/parent/ParentArea.test.tsx`
Expected: FAIL — cannot find module `./ParentArea`.

- [ ] **Step 7: Implement the parent area**

`src/components/parent/ParentArea.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { listProfiles, createProfile, deleteProfile } from '../../data/profiles';
import { getSettings, updateSettings } from '../../data/settings';
import { getWeeklyTally } from '../../data/stars';
import { AVATARS, avatarEmoji } from '../../content/avatars';
import type { Profile, Settings } from '../../data/types';
import type { AudioManager } from '../../audio/AudioManager';

interface Props {
  audio: AudioManager;
  onExit: () => void;
}

type TallyRow = { profileId: number; name: string; stars: number };

export function ParentArea({ audio, onExit }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tally, setTally] = useState<TallyRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [name, setName] = useState('');
  const [avatarKey, setAvatarKey] = useState(AVATARS[0].key);

  async function refresh() {
    setProfiles(await listProfiles());
    setTally(await getWeeklyTally());
  }

  useEffect(() => {
    void refresh();
    void getSettings().then(setSettings);
  }, []);

  async function addChild() {
    if (!name.trim()) return;
    await createProfile({ name: name.trim(), avatarKey });
    setName('');
    await refresh();
  }

  async function removeChild(id: number) {
    await deleteProfile(id);
    await refresh();
  }

  async function toggle(key: 'soundOn' | 'voiceOn') {
    if (!settings) return;
    const next = await updateSettings({ [key]: !settings[key] });
    setSettings(next);
    audio.setSoundOn(next.soundOn);
    audio.setVoiceOn(next.voiceOn);
  }

  return (
    <div className="screen parent-area">
      <h2>Khu phụ huynh</h2>

      <section>
        <h3>Các bé</h3>
        <ul className="child-list">
          {profiles.map((p) => (
            <li key={p.id}>
              <span>
                {avatarEmoji(p.avatarKey)} {p.name}
              </span>
              <button aria-label={`Xoá ${p.name}`} onClick={() => removeChild(p.id!)}>
                🗑️
              </button>
            </li>
          ))}
        </ul>
        <div className="add-child">
          <input
            aria-label="Tên bé"
            value={name}
            placeholder="Tên bé"
            onChange={(e) => setName(e.target.value)}
          />
          <div className="avatar-pick">
            {AVATARS.map((a) => (
              <button
                key={a.key}
                aria-label={a.label}
                aria-pressed={a.key === avatarKey}
                onClick={() => setAvatarKey(a.key)}
              >
                {a.emoji}
              </button>
            ))}
          </div>
          <button onClick={addChild}>Thêm bé</button>
        </div>
      </section>

      <section>
        <h3>Sao tuần này</h3>
        <ol className="tally">
          {tally.map((t) => (
            <li key={t.profileId}>
              {t.name}: ⭐ {t.stars}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3>Âm thanh</h3>
        {settings && (
          <>
            <label>
              <input type="checkbox" checked={settings.soundOn} onChange={() => toggle('soundOn')} />{' '}
              Hiệu ứng âm thanh
            </label>
            <label>
              <input type="checkbox" checked={settings.voiceOn} onChange={() => toggle('voiceOn')} />{' '}
              Giọng đọc
            </label>
          </>
        )}
      </section>

      <button className="done" onClick={onExit}>
        Xong
      </button>
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/components/parent/ParentArea.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add src/components/parent/
git commit -m "feat(ui): add parent gate and parent area (profiles, tally, audio settings)"
```

---

### Task 15: Adventure map + category screen

**Files:**
- Create: `src/components/AdventureMap.tsx`
- Create: `src/components/CategoryScreen.tsx`
- Test: `src/components/AdventureMap.test.tsx`, `src/components/CategoryScreen.test.tsx`

**Interfaces:**
- Consumes: `CATEGORIES` (Task 7), `avatarEmoji` (Task 7), `getGamesByCategory` (Task 8), `Profile`/`CategoryId` (Task 2).
- Produces:
  - `AdventureMap` with props `{ profile: Profile; totalStars: number; onCategory: (id: CategoryId) => void; onGarden: () => void }`.
  - `CategoryScreen` with props `{ categoryId: CategoryId; onPlay: (gameId: string) => void; onBack: () => void }`.

- [ ] **Step 1: Write the failing tests**

`src/components/AdventureMap.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdventureMap } from './AdventureMap';

const profile = { id: 1, name: 'Na', avatarKey: 'cat', createdAt: 0 };

describe('AdventureMap', () => {
  it('renders 6 islands and navigates to a category and the garden', async () => {
    const onCategory = vi.fn();
    const onGarden = vi.fn();
    render(
      <AdventureMap profile={profile} totalStars={5} onCategory={onCategory} onGarden={onGarden} />,
    );
    const islands = screen.getAllByRole('button').filter((b) => b.classList.contains('island'));
    expect(islands).toHaveLength(6);
    await userEvent.click(screen.getByLabelText('Toán & Con số'));
    expect(onCategory).toHaveBeenCalledWith('numbers');
    await userEvent.click(screen.getByText(/Vườn sao/));
    expect(onGarden).toHaveBeenCalled();
  });
});
```

`src/components/CategoryScreen.test.tsx`:
```tsx
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { _clearRegistry } from '../games/registry';
import { registerAllGames } from '../games';
import { CategoryScreen } from './CategoryScreen';

beforeEach(() => {
  _clearRegistry();
  registerAllGames();
});

describe('CategoryScreen', () => {
  it('lists games in a category and starts one', async () => {
    const onPlay = vi.fn();
    render(<CategoryScreen categoryId="numbers" onPlay={onPlay} onBack={() => {}} />);
    await userEvent.click(screen.getByText('Đếm Vui'));
    expect(onPlay).toHaveBeenCalledWith('counting-fun');
  });

  it('shows a friendly message for an empty category', () => {
    render(<CategoryScreen categoryId="memory" onPlay={() => {}} onBack={() => {}} />);
    expect(screen.getByText(/Sắp có/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/AdventureMap.test.tsx src/components/CategoryScreen.test.tsx`
Expected: FAIL — cannot find modules `./AdventureMap` / `./CategoryScreen`.

- [ ] **Step 3: Implement the adventure map**

`src/components/AdventureMap.tsx`:
```tsx
import { CATEGORIES } from '../content/categories';
import { avatarEmoji } from '../content/avatars';
import type { CategoryId, Profile } from '../data/types';

interface Props {
  profile: Profile;
  totalStars: number;
  onCategory: (id: CategoryId) => void;
  onGarden: () => void;
}

export function AdventureMap({ profile, totalStars, onCategory, onGarden }: Props) {
  return (
    <div className="screen map">
      <header className="map-header">
        <span className="avatar-emoji">{avatarEmoji(profile.avatarKey)}</span>
        <button className="garden-btn" onClick={onGarden}>
          🌳 Vườn sao ⭐ {totalStars}
        </button>
      </header>
      <div className="island-field">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className="island"
            style={{ left: `${c.islandPos.x}%`, top: `${c.islandPos.y}%`, backgroundColor: c.color }}
            aria-label={c.title}
            onClick={() => onCategory(c.id)}
          >
            <span className="island-icon">{c.icon}</span>
            <span className="island-title">{c.title}</span>
          </button>
        ))}
        <span className="mascot" aria-hidden="true">
          🦊
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement the category screen**

`src/components/CategoryScreen.tsx`:
```tsx
import { getGamesByCategory } from '../games/registry';
import { CATEGORIES } from '../content/categories';
import type { CategoryId } from '../data/types';

interface Props {
  categoryId: CategoryId;
  onPlay: (gameId: string) => void;
  onBack: () => void;
}

export function CategoryScreen({ categoryId, onPlay, onBack }: Props) {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const games = getGamesByCategory(categoryId);

  return (
    <div className="screen category">
      <button className="back" aria-label="Quay lại bản đồ" onClick={onBack}>
        ⬅️
      </button>
      <h2>
        {category?.icon} {category?.title}
      </h2>
      {games.length === 0 ? (
        <p className="hint">Sắp có trò chơi mới ở đây! 🦊</p>
      ) : (
        <div className="game-list">
          {games.map((g) => (
            <button key={g.id} className="game-card" onClick={() => onPlay(g.id)}>
              <span className="game-icon">{g.iconKey}</span>
              <span className="game-title">{g.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/AdventureMap.test.tsx src/components/CategoryScreen.test.tsx`
Expected: PASS (3 tests total).

- [ ] **Step 6: Commit**

```bash
git add src/components/AdventureMap.tsx src/components/AdventureMap.test.tsx src/components/CategoryScreen.tsx src/components/CategoryScreen.test.tsx
git commit -m "feat(ui): add adventure map and category screen"
```

---

### Task 16: Star garden screen

**Files:**
- Create: `src/components/StarGarden.tsx`
- Test: `src/components/StarGarden.test.tsx`

**Interfaces:**
- Consumes: `getGarden`, `getWeeklyTally` (Task 5); `Garden` (Task 2).
- Produces: `StarGarden` with props `{ onBack: () => void }`.

- [ ] **Step 1: Write the failing test**

`src/components/StarGarden.test.tsx`:
```tsx
import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { db } from '../data/db';
import { createProfile } from '../data/profiles';
import { addStars } from '../data/stars';
import { StarGarden } from './StarGarden';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('StarGarden', () => {
  it('shows the family total and the first grown item', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await addStars(id, 6); // crosses the 5-star "flower" milestone
    render(<StarGarden onBack={() => {}} />);
    expect(await screen.findByText(/⭐ 6/)).toBeInTheDocument();
    expect(await screen.findByText('🌸')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/StarGarden.test.tsx`
Expected: FAIL — cannot find module `./StarGarden`.

- [ ] **Step 3: Implement the star garden**

`src/components/StarGarden.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { getGarden, getWeeklyTally } from '../data/stars';
import type { Garden } from '../data/types';

const ITEM_EMOJI: Record<string, string> = {
  flower: '🌸',
  bush: '🌿',
  tree: '🌳',
  rabbit: '🐰',
  pond: '💧',
  butterflies: '🦋',
};

type TallyRow = { profileId: number; name: string; stars: number };

interface Props {
  onBack: () => void;
}

export function StarGarden({ onBack }: Props) {
  const [garden, setGarden] = useState<Garden | null>(null);
  const [tally, setTally] = useState<TallyRow[]>([]);

  useEffect(() => {
    void getGarden().then(setGarden);
    void getWeeklyTally().then(setTally);
  }, []);

  const items = garden?.grownItems ?? [];

  return (
    <div className="screen garden">
      <button className="back" aria-label="Quay lại bản đồ" onClick={onBack}>
        ⬅️
      </button>
      <h2>🌳 Vườn sao của cả nhà</h2>
      <p>Tổng cộng: ⭐ {garden?.totalStars ?? 0}</p>
      <div className="garden-field" aria-label="Khu vườn">
        {items.map((item, i) => (
          <span key={i} className="garden-item">
            {ITEM_EMOJI[item] ?? '✨'}
          </span>
        ))}
        {items.length === 0 && <p className="hint">Hãy chơi để vườn lớn lên nhé! 🌱</p>}
      </div>
      <h3>Sao tuần này</h3>
      <ol className="tally">
        {tally.map((t) => (
          <li key={t.profileId}>
            {t.name}: ⭐ {t.stars}
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/StarGarden.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/StarGarden.tsx src/components/StarGarden.test.tsx
git commit -m "feat(ui): add family star garden screen"
```

---

### Task 17: Final integration (App shell) + end-to-end verification

**Files:**
- Modify: `src/App.tsx` (replace the Task 11 scratch version with the real screen router)
- Create: `src/App.css`
- Modify: `ROADMAP.md` (mark Phase 1 complete, add log entry)

**Interfaces:**
- Consumes: every component and module built above; `SessionProvider`/`useSession` (Task 12); `getSettings` (Task 4); `getGarden` (Task 5); `getProgress` (Task 4); `registerAllGames` (Task 10); audio (Task 6).
- Produces: a fully wired app — the deliverable of Phase 1.

- [ ] **Step 1: Write the final App shell**

Replace `src/App.tsx` entirely with:
```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SessionProvider, useSession } from './state/SessionContext';
import type { Screen } from './state/screens';
import { createAudioManager, type AudioManager } from './audio/AudioManager';
import { createHowlerPlayer } from './audio/howlerPlayer';
import { AUDIO_MANIFEST } from './audio/audioManifest';
import { registerAllGames } from './games';
import { getSettings } from './data/settings';
import { getGarden } from './data/stars';
import { getProgress } from './data/progress';
import type { CategoryId, Profile } from './data/types';
import type { GameResult } from './games/GameModule';
import { WhoIsPlaying } from './components/WhoIsPlaying';
import { AdventureMap } from './components/AdventureMap';
import { CategoryScreen } from './components/CategoryScreen';
import { StarGarden } from './components/StarGarden';
import { GameContainer } from './components/GameContainer';
import { ParentGate } from './components/parent/ParentGate';
import { ParentArea } from './components/parent/ParentArea';
import './App.css';

registerAllGames();

function Root({ audio }: { audio: AudioManager }) {
  const { profile, setProfile } = useSession();
  const [screen, setScreen] = useState<Screen>({ name: 'who' });
  const [totalStars, setTotalStars] = useState(0);

  const refreshStars = useCallback(async () => {
    setTotalStars((await getGarden()).totalStars);
  }, []);

  useEffect(() => {
    void getSettings().then((s) => {
      audio.setSoundOn(s.soundOn);
      audio.setVoiceOn(s.voiceOn);
    });
    void refreshStars();
  }, [audio, refreshStars]);

  const selectProfile = useCallback(
    (p: Profile) => {
      setProfile(p);
      setScreen({ name: 'map' });
    },
    [setProfile],
  );

  const onCategory = useCallback((categoryId: CategoryId) => {
    setScreen({ name: 'category', categoryId });
  }, []);

  const onPlay = useCallback(
    async (gameId: string) => {
      if (!profile?.id) return;
      const prog = await getProgress(profile.id, gameId);
      setScreen({ name: 'game', gameId, level: prog?.level ?? 1 });
    },
    [profile],
  );

  const onGameExit = useCallback(
    async (_result?: GameResult) => {
      await refreshStars();
      setScreen({ name: 'map' });
    },
    [refreshStars],
  );

  if (screen.name === 'who') {
    return (
      <WhoIsPlaying onSelect={selectProfile} onParent={() => setScreen({ name: 'parentGate' })} />
    );
  }
  if (screen.name === 'parentGate') {
    return <ParentGate onPass={() => setScreen({ name: 'parent' })} />;
  }
  if (screen.name === 'parent') {
    return (
      <ParentArea
        audio={audio}
        onExit={() => {
          void refreshStars();
          setScreen({ name: 'who' });
        }}
      />
    );
  }
  if (!profile) {
    return (
      <WhoIsPlaying onSelect={selectProfile} onParent={() => setScreen({ name: 'parentGate' })} />
    );
  }
  if (screen.name === 'map') {
    return (
      <AdventureMap
        profile={profile}
        totalStars={totalStars}
        onCategory={onCategory}
        onGarden={() => setScreen({ name: 'garden' })}
      />
    );
  }
  if (screen.name === 'category') {
    return (
      <CategoryScreen
        categoryId={screen.categoryId}
        onPlay={onPlay}
        onBack={() => setScreen({ name: 'map' })}
      />
    );
  }
  if (screen.name === 'garden') {
    return <StarGarden onBack={() => setScreen({ name: 'map' })} />;
  }
  // screen.name === 'game'
  return (
    <div className="game-screen">
      <GameContainer
        gameId={screen.gameId}
        level={screen.level}
        profileId={profile.id!}
        audio={audio}
        onExit={onGameExit}
      />
    </div>
  );
}

export default function App() {
  const audio = useMemo(() => createAudioManager(createHowlerPlayer(), AUDIO_MANIFEST), []);
  return (
    <SessionProvider>
      <Root audio={audio} />
    </SessionProvider>
  );
}
```

- [ ] **Step 2: Add layout styles**

`src/App.css`:
```css
:root {
  font-family: system-ui, 'Segoe UI', sans-serif;
  -webkit-text-size-adjust: 100%;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
}
.screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  gap: 16px;
  background: linear-gradient(#cdeeff, #e9fbe2);
}
h1 {
  font-size: 40px;
}
.hint {
  font-size: 22px;
  color: #555;
}

/* Large touch targets everywhere */
button {
  font-size: 22px;
  min-height: 72px;
  border: none;
  border-radius: 16px;
  padding: 12px 20px;
  cursor: pointer;
  background: #ffffff;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.12);
}

/* Avatar entry */
.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 140px);
  gap: 20px;
  justify-content: center;
}
.avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 140px;
  height: 140px;
}
.avatar-emoji {
  font-size: 56px;
}
.avatar-name {
  font-size: 22px;
  font-weight: 700;
}
.parent-link {
  position: fixed;
  right: 16px;
  bottom: 16px;
  background: #fff3c4;
}

/* Adventure map */
.map {
  padding: 0;
}
.map-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
}
.garden-btn {
  background: #fff3c4;
}
.island-field {
  position: relative;
  flex: 1;
  width: 100%;
}
.island {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.island-icon {
  font-size: 44px;
}
.island-title {
  font-size: 16px;
  font-weight: 700;
}
.mascot {
  position: absolute;
  right: 16px;
  bottom: 12px;
  font-size: 64px;
}

/* Category + games */
.back {
  align-self: flex-start;
}
.game-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, 160px);
  gap: 20px;
  justify-content: center;
}
.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 160px;
  height: 160px;
}
.game-icon {
  font-size: 56px;
}
.game-title {
  font-size: 20px;
  font-weight: 700;
}

/* Garden */
.garden-field {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 48px;
  min-height: 80px;
}

/* Parent area */
.child-list {
  list-style: none;
  padding: 0;
  width: 100%;
  max-width: 480px;
}
.child-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 22px;
  padding: 6px 0;
}
.avatar-pick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.avatar-pick button[aria-pressed='true'] {
  outline: 4px solid #ffb703;
}

/* Game screen fills the viewport */
.game-screen {
  width: 100vw;
  height: 100vh;
}
```

- [ ] **Step 3: Full test suite + type-check + build**

Run: `npm test`
Expected: ALL tests pass.

Run: `npm run build`
Expected: type-check + production build succeed.

- [ ] **Step 4: End-to-end manual verification (the Phase 1 Definition of Done)**

Run: `npm run dev`, open the URL in a browser, and verify every item:
1. **Who screen** appears with title "Ai đang chơi? 🦊" and a "Bố mẹ" button.
2. Click **Bố mẹ** → gate shows "a + b = ?"; entering the correct sum opens the parent area; a wrong sum shows "Chưa đúng, thử lại nhえ" and a new problem.
3. In the parent area, **add two children** (e.g. Na/🐱, Bo/🐶) — both appear in the list. Toggle "Giọng đọc" off and on.
4. Click **Xong** → who screen now shows both avatars.
5. Click **Na** → adventure map with **6 coloured islands**, the fox 🦊, the child avatar and "⭐ 0".
6. Click the **Toán & Con số** island → category screen lists **Đếm Vui** (other islands show "Sắp có…").
7. Play **Đếm Vui**: count animals, tap a number; correct → green + advance, wrong → shake + retry (no "game over"). After 5 questions you return to the map and the **star total has increased**.
8. Replay after a perfect (3-star) game and confirm the counts get harder (level advances).
9. Click **Vườn sao** → total stars + at least one grown item once ≥5 stars; weekly tally lists each child's stars.
10. **Reload the browser** → who screen still lists Na & Bo; the map's star total persists; toggled audio settings persist.
11. **No errors** in the browser console.

- [ ] **Step 5: Update the roadmap**

In `ROADMAP.md`: change the "Giai đoạn 1" heading marker from 🔨 to ✅, tick every Phase 1 checkbox (`- [ ]` → `- [x]` / ☐ → ✅), update the "👉 Tiếp theo" section to point at Giai đoạn 2 (add 1 game per remaining category), and append a dated line to "Nhật ký tiến độ" summarising what shipped.

- [ ] **Step 6: Final commit**

```bash
git add src/App.tsx src/App.css ROADMAP.md
git commit -m "feat: wire KiddyHub Phase 1 app shell and complete the foundation"
```

---

## Self-Review

**Spec coverage (against `docs/superpowers/specs/2026-06-19-kiddyhub-design.md` §12):**

| Phase 1 requirement | Task(s) |
|---|---|
| Scaffold (Vite+React+TS+Phaser+Dexie+Howler+Vitest) | 1 |
| Data layer (Dexie schema + repositories + tests) | 2, 3, 4, 5 |
| Audio system (Howler wrapper + VoiceManager, placeholder voice) | 6 |
| GameHost + registry + GameModule | 8, 10 |
| "Ai đang chơi?" avatar entry | 13 |
| Parent area (math gate + CRUD + view stars + sound toggle) | 14 |
| Adventure map (6 islands + fox) + category screen | 7 (metadata), 15 |
| Star garden + weekly tally (basic) | 5, 16 |
| "Đếm Vui" immersive scene (3 levels, voice, gentle feedback, stars) | 9, 10, 11 |
| Persist & restore across reload | 3–5 (IndexedDB) + 17 (manual reload check) |
| Difficulty auto-advance | 11 (advancement logic) + 17 (launch level from progress) |
| Tests (data layer, star/difficulty logic, avatar flow) + manual game test | per-task tests + 11, 17 manual |

No Phase 1 requirement is left without a task.

**Placeholder scan:** No "TBD/TODO/implement later". Empty audio sources are an intentional, documented design (silent no-op), not a plan gap.

**Type consistency:** `CategoryId`, `Profile`, `Settings`, `Garden`, `GameResult`, `GameHost`, `GameModule`, `AudioManager`, `PlayFn` are defined once and consumed with matching signatures. Repository names (`createProfile`, `listProfiles`, `getProfile`, `updateProfile`, `deleteProfile`, `getSettings`, `updateSettings`, `recordPlay`, `getProgress`, `addStars`, `getGarden`, `getWeeklyStars`, `getWeeklyTally`, `itemsForStars`) are used identically across tasks. `getWeeklyTally` returns `{ profileId, name, stars }[]` everywhere it is consumed (Tasks 14, 16). `registerAllGames` / `_clearRegistry` used consistently in tests.




