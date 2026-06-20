import { useEffect } from 'react';
import { SvgArt } from '../art/Art';
import { foxGuide } from '../art/fox';
import type { OnboardingStep } from '../state/screens';
import type { MenuAudio } from './menuAudio';

/**
 * KiddyHub — first-run onboarding (Giai đoạn 5 · Phần D1 §4).
 *
 * Replaces the old text-only zero-profile dead-end on `who` with a gentle,
 * Cáo-guided welcome. The primary action does NOT bypass the arithmetic gate:
 * "Bố mẹ tạo hồ sơ cho bé" leads the parent INTO the existing `ParentGate` →
 * profile creation → back to pick an avatar. The decision of WHEN to show this
 * lives in the pure `onboarding.ts`/`selectScreen` helpers; this component is
 * presentation + callbacks only (keeping App.tsx a thin dispatcher).
 *
 * Voice: the welcome line is spoken via the bundled `fox.welcome` Piper clip
 * (added in D2). WELCOME_LINE mirrors that clip's manifest text exactly so the
 * on-screen line never drifts from what Cáo says.
 */
interface Props {
  step: OnboardingStep;
  /** Begin profile creation — leads the parent into the arithmetic gate. */
  onStart: () => void;
  audio?: MenuAudio;
}

// Mirrors the `fox.welcome` entry in audioManifest.ts EXACTLY so the spoken
// Piper clip and the on-screen text always match.
const WELCOME_LINE = 'Chào bé! Mình là Cáo. Cùng tạo một bạn nhỏ để chơi nhé!';

export function Onboarding({ step, onStart, audio }: Props): JSX.Element {
  // Greet once on mount (respects the voice toggle inside AudioManager). Spoken
  // via the bundled `fox.welcome` clip rather than live Web Speech — see doc.
  useEffect(() => {
    if (step === 'welcome') void audio?.speak('fox.welcome');
  }, [audio, step]);

  return (
    <div className="screen onboarding">
      <SvgArt svg={foxGuide('Cáo chào mừng')} alt="Cáo chào mừng" size={140} className="mascot" />
      <h1 className="onboarding-title">Chào mừng đến KiddyHub!</h1>
      <p className="onboarding-line">{WELCOME_LINE}</p>
      <button className="onboarding-start" onClick={onStart}>
        Bố mẹ tạo hồ sơ cho bé
      </button>
      <p className="hint onboarding-note">
        Bố mẹ sẽ giải một phép tính nhỏ rồi tạo bạn nhỏ đầu tiên nhé.
      </p>
    </div>
  );
}
