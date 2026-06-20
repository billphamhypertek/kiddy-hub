import type { CategoryId } from '../data/types';

/**
 * Steps of the gentle first-run onboarding (Phần D1 §4). `welcome` shows Cáo's
 * greeting + a "Bố mẹ tạo hồ sơ cho bé" action that leads INTO the existing
 * arithmetic ParentGate; `done` is the terminal step once a profile exists.
 */
export type OnboardingStep = 'welcome' | 'done';

export type Screen =
  | { name: 'who' }
  | { name: 'onboarding'; step: OnboardingStep }
  | { name: 'map' }
  | { name: 'category'; categoryId: CategoryId }
  // `from` only tags how we got here (transition + return target for the
  // "Luyện tiếp" deep-link). It does NOT change the routed `kind` — see
  // selectScreen — so existing game-routing tests stay stable.
  | { name: 'game'; gameId: string; level: number; from?: 'category' | 'adventure' | 'parent' }
  | { name: 'garden' }
  | { name: 'parentGate' }
  | { name: 'parent' };
