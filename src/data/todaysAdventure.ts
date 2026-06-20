/**
 * KiddyHub — "Cuộc phiêu lưu hôm nay" curation (GĐ5 D2 §5).
 *
 * `pickTodaysAdventure` is PURE & synchronous (inject `rng` + data, no I/O) so
 * it is fully unit-tested in jsdom. It picks 2–3 gentle game suggestions, FRESH
 * each call — there is NO "day" state, NO streak infrastructure (decision #1).
 *
 * Tiers (deterministic, B-first but varied, never throws):
 *   A "due"     — games whose skill has items due for review (most due first,
 *                 then earliest dueAt). Read-only from B's getDueItems.
 *   B "fresh"   — games on a skill not yet picked, preferring non-recent ones
 *                 (anti-repeat across opens).
 *   C "variety" — rng-fills any remaining slots from allGames (new child / no
 *                 due items), preferring non-recent. Guarantees ≥2 picks.
 *
 * Within an equal tier rng shuffles, so the strip does not feel stale.
 */
import { db } from './db';
import { PRACTICE_GAME_BY_SKILL } from '../content/parentTips';
import type { ItemMastery, SkillId } from './types';
import type { SkillMastery } from './mastery';
import type { GameModule } from '../games/GameModule';

export type Rng = () => number;

export interface AdventureInput {
  /** getDueItems(profileId, now) — already sorted by dueAt asc (read-only B). */
  dueItems: ItemMastery[];
  /** getMasterySummary(profileId) — reserved for future weighting (read-only B). */
  summary: SkillMastery[];
  /** Most-recently-played gameIds, recent→older (anti-repeat). */
  recentGameIds: string[];
  /** allGames() from the registry. */
  allGames: GameModule[];
  /** Injectable randomness (deterministic in tests). */
  rng: Rng;
  /** Desired count, clamped to 2..3 (default 3). */
  count?: number;
}

export interface AdventurePick {
  gameId: string;
  title: string;
  /** Why it was suggested — drives a tiny hint icon + makes the tiers testable. */
  reason: 'due' | 'fresh' | 'variety';
}

/** Map a skill to the one game that practises it (hard-coded in parentTips). */
function gameForSkill(skillId: SkillId): string | undefined {
  return PRACTICE_GAME_BY_SKILL[skillId];
}

/** Fisher–Yates using the injected rng (stable for a fixed seed). */
function shuffled<T>(items: T[], rng: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick 2–3 game suggestions for today. Pure, deterministic for a fixed rng,
 * never throws (always falls back to variety).
 */
export function pickTodaysAdventure(input: AdventureInput): AdventurePick[] {
  const { dueItems, recentGameIds, allGames, rng } = input;
  const count = Math.min(3, Math.max(2, input.count ?? 3));

  const byId = new Map<string, GameModule>();
  for (const g of allGames) byId.set(g.id, g);
  const recent = new Set(recentGameIds);

  const picks: AdventurePick[] = [];
  const taken = new Set<string>();
  const add = (gameId: string, reason: AdventurePick['reason']): void => {
    if (taken.has(gameId) || picks.length >= count) return;
    const g = byId.get(gameId);
    if (!g) return;
    taken.add(gameId);
    picks.push({ gameId, title: g.title, reason });
  };

  // ── Tier A — "due": aggregate due items per practice game ──────────────────
  const dueAgg = new Map<string, { dueCount: number; earliest: number }>();
  for (const item of dueItems) {
    const gameId = gameForSkill(item.skillId);
    if (!gameId || !byId.has(gameId)) continue;
    const cur = dueAgg.get(gameId);
    if (cur) {
      cur.dueCount += 1;
      cur.earliest = Math.min(cur.earliest, item.dueAt);
    } else {
      dueAgg.set(gameId, { dueCount: 1, earliest: item.dueAt });
    }
  }
  const dueRanked = [...dueAgg.entries()].sort((a, b) => {
    if (b[1].dueCount !== a[1].dueCount) return b[1].dueCount - a[1].dueCount; // more due first
    return a[1].earliest - b[1].earliest; // then earliest due
  });
  for (const [gameId] of dueRanked) add(gameId, 'due');

  // ── Tier B — "fresh": a game on a not-yet-picked skill, non-recent first ───
  if (picks.length < count) {
    const pickedSkills = new Set<string>();
    for (const p of picks) {
      const g = byId.get(p.gameId);
      if (g) pickedSkills.add(g.skill);
    }
    const candidates = allGames.filter((g) => !taken.has(g.id) && !pickedSkills.has(g.skill));
    const nonRecent = shuffled(
      candidates.filter((g) => !recent.has(g.id)),
      rng,
    );
    const recentOnes = shuffled(
      candidates.filter((g) => recent.has(g.id)),
      rng,
    );
    for (const g of [...nonRecent, ...recentOnes]) {
      if (picks.length >= count) break;
      add(g.id, 'fresh');
      pickedSkills.add(g.skill);
    }
  }

  // ── Tier C — "variety": fill from anything left, non-recent first ──────────
  if (picks.length < count) {
    const leftovers = allGames.filter((g) => !taken.has(g.id));
    const nonRecent = shuffled(
      leftovers.filter((g) => !recent.has(g.id)),
      rng,
    );
    const recentOnes = shuffled(
      leftovers.filter((g) => recent.has(g.id)),
      rng,
    );
    for (const g of [...nonRecent, ...recentOnes]) {
      if (picks.length >= count) break;
      add(g.id, 'variety');
    }
  }

  return picks;
}

/**
 * Recently-played gameIds for a child, most-recent first. Read-only; reuses
 * `progress.lastPlayedAt` (no new column). Used to feed `recentGameIds`.
 */
export async function getRecentGameIds(profileId: number, limit: number): Promise<string[]> {
  const rows = await db.progress.where('profileId').equals(profileId).toArray();
  rows.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
  return rows.slice(0, limit).map((r) => r.gameId);
}
