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
        {items.map((item) => (
          <span key={item} className="garden-item">
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
