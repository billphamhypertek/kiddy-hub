import { SvgArt } from '../art/Art';
import { foxGuide } from '../art/fox';
import type { AdventurePick } from '../data/todaysAdventure';

interface Props {
  picks: AdventurePick[];
  onPlayPick: (gameId: string) => void;
}

/**
 * "Cuộc phiêu lưu hôm nay" (GĐ5 D2 §5) — a small, gentle strip of 2–3 games Cáo
 * suggests, shown atop the map. FRESH each open (no streak, no day-counter, no
 * countdown). Purely a suggestion: the child can ignore it and tap any island.
 *
 * Pure presentational component — picks are computed by `pickTodaysAdventure`
 * upstream and passed in; tapping a card launches that game via the existing
 * play handler (D1's onPlayGame / from:'adventure').
 */
export function TodaysAdventure({ picks, onPlayPick }: Props) {
  if (picks.length === 0) return null;
  return (
    <section className="todays-adventure" aria-label="Cuộc phiêu lưu hôm nay">
      <div className="ta-header">
        <SvgArt svg={foxGuide()} alt="" size={36} className="ta-fox" />
        <p className="ta-title">Phiêu lưu hôm nay</p>
      </div>
      <ul className="ta-cards">
        {picks.map((p) => (
          <li key={p.gameId}>
            <button
              className="ta-card"
              onClick={() => onPlayPick(p.gameId)}
              aria-label={`Chơi ${p.title}`}
            >
              <span className="ta-card-title">{p.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
