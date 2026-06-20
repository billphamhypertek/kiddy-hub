/**
 * KiddyHub — Calm-mode mirror (Giai đoạn 5 · Phần E1).
 *
 * "Chế độ êm" is an explicit parent setting (Dexie, additive) that forces
 * reduced motion across the WHOLE app, on top of the OS `prefers-reduced-motion`
 * preference. The setting itself lives in Dexie (async), but the Phaser scene
 * layer reads "should I animate?" SYNCHRONOUSLY from a plain function inside a
 * tween hot-path — it cannot await Dexie. So we keep a tiny module-level "live
 * mirror" of the flag that both worlds read:
 *
 *   - `setCalmMode(on)` is called by App on mount (seeded from Dexie) and by the
 *     ParentArea toggle, keeping this mirror in sync with the persisted setting.
 *   - `isCalmMode()` is read SYNCHRONOUSLY by the Phaser `prefersReducedMotion()`
 *     plain function and the React `usePrefersReducedMotion()` hook — both OR it
 *     with the OS media query (calm can only ADD reduce, never force motion ON).
 *   - `subscribeCalmMode(cb)` is a tiny synchronous pub-sub so the React hook can
 *     re-render live when the toggle flips, without threading a prop through the
 *     whole tree (Phaser scenes live OUTSIDE the React tree — a module mirror is
 *     the only shared source of truth they can both reach).
 *
 * jsdom-safe by construction: this module touches no `window`/`matchMedia` — it
 * is a pure in-memory flag + listener set, defaulting to `false` (calm off).
 */

let calmModeOn = false;

type CalmModeListener = (on: boolean) => void;
const listeners = new Set<CalmModeListener>();

/** Read the current calm-mode flag synchronously. Defaults to `false`. */
export function isCalmMode(): boolean {
  return calmModeOn;
}

/**
 * Update the live mirror. No-op (and no notification) when the value is
 * unchanged, so subscribers never re-render for a non-change. Called by App
 * (seeded from Dexie at mount) and by the ParentArea toggle.
 */
export function setCalmMode(on: boolean): void {
  if (on === calmModeOn) return;
  calmModeOn = on;
  for (const cb of listeners) cb(on);
}

/**
 * Subscribe to calm-mode changes. Returns an idempotent unsubscribe. Used by the
 * React hook to live-update; never fires on the initial subscribe (read
 * `isCalmMode()` for the current value).
 */
export function subscribeCalmMode(cb: CalmModeListener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
