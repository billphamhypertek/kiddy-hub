import { useEffect, useState, type CSSProperties } from 'react';
import { getGarden, getWeeklyTally } from '../data/stars';
import { SvgArt } from '../art/Art';
import { starArt, gardenItemArt } from '../art/stars';
import { foxIdle } from '../art/fox';
import { StickerBook } from './StickerBook';
import type { Garden, Profile } from '../data/types';
import type { MenuAudio } from './menuAudio';

/** Vietnamese labels for grown garden props (used as accessible alt text). */
const ITEM_LABEL: Record<string, string> = {
  flower: 'Bông hoa',
  bush: 'Bụi cây',
  tree: 'Cây xanh',
  rabbit: 'Bạn thỏ',
  pond: 'Ao nước',
  butterflies: 'Bươm bướm',
  // mastery-driven growth (D2)
  sprout: 'Mầm non',
  mushroom: 'Cây nấm',
  birdhouse: 'Nhà chim',
};

type TallyRow = { profileId: number; name: string; stars: number };

interface Props {
  onBack: () => void;
  /** Active child — enables their personal sticker-book under the garden (D2). */
  profile?: Profile;
  audio?: MenuAudio;
}

export function StarGarden({ onBack, profile, audio }: Props) {
  const [garden, setGarden] = useState<Garden | null>(null);
  const [tally, setTally] = useState<TallyRow[]>([]);

  useEffect(() => {
    void getGarden().then(setGarden);
    void getWeeklyTally().then(setTally);
  }, []);

  const items = garden?.grownItems ?? [];

  // Voiced-nav (GĐ5E1): the back + "Đi chơi nào!" buttons were silent. Both mean
  // "go back to the map", so both speak `nav.back` (respects the voice toggle).
  const handleBack = (): void => {
    void audio?.speak('nav.back');
    onBack();
  };

  return (
    <div className="screen garden">
      <button className="back" aria-label="Quay lại bản đồ" onClick={handleBack}>
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
        {items.length === 0 && (
          <div className="garden-empty">
            <p className="hint">Hãy chơi để vườn lớn lên nhé!</p>
            <button className="garden-empty-play" onClick={handleBack}>
              Đi chơi nào!
            </button>
          </div>
        )}
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
      {profile?.id != null && (
        <StickerBook profileId={profile.id} profileName={profile.name} audio={audio} />
      )}
    </div>
  );
}
