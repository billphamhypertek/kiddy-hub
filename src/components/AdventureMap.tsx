import { CATEGORIES } from '../content/categories';
import { avatarEmoji } from '../content/avatars';
import type { CategoryId, Profile } from '../data/types';
import type { MenuAudio } from './menuAudio';

interface Props {
  profile: Profile;
  totalStars: number;
  onCategory: (id: CategoryId) => void;
  onGarden: () => void;
  audio?: MenuAudio;
}

export function AdventureMap({ profile, totalStars, onCategory, onGarden, audio }: Props) {
  const handleCategory = (c: (typeof CATEGORIES)[number]): void => {
    void audio?.speakText(c.title);
    onCategory(c.id);
  };
  return (
    <div className="screen map">
      <header className="map-header">
        <span className="avatar-emoji">{avatarEmoji(profile.avatarKey)}</span>
        <button className="garden-btn" onClick={onGarden}>
          🌳 Vườn sao ⭐ {totalStars}
        </button>
      </header>
      <div className="island-field">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className="island"
            style={{ left: `${c.islandPos.x}%`, top: `${c.islandPos.y}%`, backgroundColor: c.color }}
            aria-label={c.title}
            onClick={() => handleCategory(c)}
          >
            <span className="island-icon">{c.icon}</span>
            <span className="island-title">{c.title}</span>
          </button>
        ))}
        <span className="mascot" aria-hidden="true">
          🦊
        </span>
      </div>
    </div>
  );
}
