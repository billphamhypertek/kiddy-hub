import { SvgArt } from '../art/Art';
import { foxGuide } from '../art/fox';
import type { BridgeLine } from '../content/realWorldBridge';

interface Props {
  line: BridgeLine;
  /** Continue back to the map. The bridge is optional & never blocks. */
  onContinue: () => void;
}

/**
 * Real-world bridge overlay (GĐ5 D2 §8) — a gentle, skippable card shown AFTER
 * a round completes (~1/3 of rounds). Invites the child to try what they learned
 * off-screen, then a single clear "Xong" continues. No countdown, no guilt; it
 * pushes the child AWAY from the device (anti-engagement by design).
 */
export function RealWorldBridgeOverlay({ line, onContinue }: Props) {
  return (
    <div className="bridge-overlay" role="dialog" aria-label="Thử ngoài đời nhé?">
      <div className="bridge-card">
        <SvgArt svg={foxGuide()} alt="" size={80} className="bridge-fox" />
        <p className="bridge-title">Thử ngoài đời nhé?</p>
        <p className="bridge-line">{line.text}</p>
        <button className="bridge-continue" onClick={onContinue}>
          Xong
        </button>
      </div>
    </div>
  );
}
