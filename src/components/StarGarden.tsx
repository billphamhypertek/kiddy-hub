import { useEffect, useState, type CSSProperties } from 'react';
import { getGarden, getWeeklyTally } from '../data/stars';
import { SvgArt } from '../art/Art';
import { starArt, gardenItemArt } from '../art/stars';
import { foxIdle } from '../art/fox';
import type { Garden } from '../data/types';

/** Vietnamese labels for grown garden props (used as accessible alt text). */
const ITEM_LABEL: Record<string, string> = {
  flower: 'Bông hoa',
  bush: 'Bụi cây',
  tree: 'Cây xanh',
  rabbit: 'Bạn thỏ',
  pond: 'Ao nước',
  butterflies: 'Bươm bướm',
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
      <h2>
        <SvgArt svg={foxIdle()} alt="" size={40} className="title-fox" /> Vườn sao của cả nhà
      </h2>
      <p className="garden-total">
        Tổng cộng: <SvgArt svg={starArt()} alt="" size={28} className="inline-star" />{' '}
        {garden?.totalStars ?? 0}
      </p>
      <div className="garden-field" aria-label="Khu vườn">
        {items.map((item, i) => (
          <SvgArt
            key={item}
            svg={gardenItemArt(item, ITEM_LABEL[item] ?? 'Vật trang trí')}
            alt={ITEM_LABEL[item] ?? 'Vật trang trí'}
            size={64}
            className="garden-item stagger-item"
            style={{ '--stagger-index': i } as CSSProperties}
          />
        ))}
        {items.length === 0 && <p className="hint">Hãy chơi để vườn lớn lên nhé!</p>}
      </div>
      <h3>Sao tuần này</h3>
      <ol className="tally">
        {tally.map((t) => (
          <li key={t.profileId}>
            {t.name}: <SvgArt svg={starArt()} alt="" size={20} className="inline-star" />{' '}
            {t.stars}
          </li>
        ))}
      </ol>
    </div>
  );
}
