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
