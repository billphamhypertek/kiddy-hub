import type { CSSProperties } from 'react';
import { CATEGORIES } from '../content/categories';
import { avatarLabel } from '../content/avatars';
import { SvgArt } from '../art/Art';
import { foxGuide } from '../art/fox';
import { avatarArt } from '../art/avatars';
import { islandArt, mapBackdrop } from '../art/islands';
import { starArt } from '../art/stars';
import type { CategoryId, Profile } from '../data/types';
import type { IslandKey } from '../art/tokens';
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
        <SvgArt
          svg={avatarArt(profile.avatarKey, avatarLabel(profile.avatarKey))}
          alt={avatarLabel(profile.avatarKey)}
          size={52}
          className="avatar-art"
        />
        <button className="garden-btn" onClick={onGarden}>
          <SvgArt svg={starArt()} alt="" size={24} className="inline-star" /> Vườn sao {totalStars}
        </button>
      </header>
      <div className="island-field">
        <SvgArt svg={mapBackdrop()} alt="" size={100} className="map-backdrop" />
        {CATEGORIES.map((c, i) => (
          <button
            key={c.id}
            className="island stagger-item"
            style={
              {
                left: `${c.islandPos.x}%`,
                top: `${c.islandPos.y}%`,
                '--stagger-index': i,
              } as CSSProperties
            }
            aria-label={c.title}
            onClick={() => handleCategory(c)}
          >
            <SvgArt
              svg={islandArt(c.id as IslandKey, c.title)}
              alt=""
              size={120}
              className="island-icon"
            />
            <span className="island-title">{c.title}</span>
          </button>
        ))}
        <SvgArt svg={foxGuide()} alt="Cáo dẫn đường" size={120} className="mascot" />
      </div>
    </div>
  );
}
