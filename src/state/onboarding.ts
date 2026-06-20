/**
 * KiddyHub — first-run onboarding decisions (Giai đoạn 5 · Phần D1 §4).
 *
 * Pure & synchronous, like every routing decision in this module: the answers
 * depend only on the profile count and the current screen, never on React or
 * the DB. This keeps "when does onboarding show?" fully unit-tested and lets
 * `App.tsx` stay a thin dispatcher (closing the known App.tsx coverage gap).
 *
 * Design (baked decision): onboarding does NOT skip or replace the arithmetic
 * gate. It turns the text-only zero-profile dead-end on `who` into a gentle,
 * Cáo-guided screen whose primary action leads the PARENT into the existing
 * `ParentGate` → profile creation → back to pick an avatar. The `welcome` step
 * is the only interactive step; `done` is terminal (a profile now exists, so
 * `needsOnboarding` returns false and the child is routed onward).
 */
import type { OnboardingStep, Screen } from './screens';

/**
 * Does this run need the gentle first-run guide? True only when there are no
 * profiles yet AND we're not already mid-onboarding / inside the parent flow.
 *
 * Pure: depends solely on `profileCount` and the screen's name. The parent
 * screens (`parentGate`/`parent`) are explicitly excluded so a parent who is
 * deleting the last profile and exiting isn't yanked into onboarding while
 * still inside their own area — they land on `who`, and the NEXT open of `who`
 * (now zero-profile) shows onboarding (intended & gentle, per spec §4.2).
 */
export function needsOnboarding(profileCount: number, screen: Screen): boolean {
  if (profileCount > 0) return false;
  // Already on the onboarding screen → stay (the step machine drives it).
  if (screen.name === 'onboarding') return true;
  // Inside the parent flow (gate/area) — don't hijack it.
  if (screen.name === 'parentGate' || screen.name === 'parent') return false;
  // Any child-facing screen with zero profiles is the soft dead-end we replace.
  return true;
}

/**
 * Next onboarding step from the current one given how many profiles now exist.
 * Deterministic: once ≥1 profile exists we're `done`; otherwise we stay on the
 * interactive `welcome` step. (There are only two steps — `welcome` leads into
 * the real ParentGate/creation flow, so we don't model "create" as a step.)
 */
export function firstRunStep(profileCount: number, current: OnboardingStep): OnboardingStep {
  if (profileCount > 0) return 'done';
  return current === 'done' ? 'welcome' : current;
}

/** Initial step when onboarding first opens with no profiles. */
export function initialOnboardingStep(): OnboardingStep {
  return 'welcome';
}
