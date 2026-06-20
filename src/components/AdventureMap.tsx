import { useEffect, useRef, type CSSProperties } from 'react';
import { CATEGORIES } from '../content/categories';
import { avatarLabel } from '../content/avatars';
import { SvgArt } from '../art/Art';
import { foxGuide } from '../art/fox';
import { avatarArt } from '../art/avatars';
import { islandArt, mapBackdrop } from '../art/islands';
import { starArt } from '../art/stars';
import { TodaysAdventure } from './TodaysAdventure';
import type { AdventurePick } from '../data/todaysAdventure';
import type { CategoryId, Profile } from '../data/types';
import type { IslandKey } from '../art/tokens';
import type { MenuAudio } from './menuAudio';

interface Props {
  profile: Profile;
  totalStars: number;
  onCategory: (id: CategoryId) => void;
  onGarden: () => void;
  /** Back to "Ai đang chơi?" — the "đổi bé" affordance (D1 audit #8). */
  onSwitchChild?: () => void;
  /** "Cuộc phiêu lưu hôm nay" picks (D2 §5). Empty → strip is hidden. */
  adventurePicks?: AdventurePick[];
  /** Launch a suggested game (wired to D1's onPlayGame / from:'adventure'). */
  onPlayPick?: (gameId: string) => void;
  audio?: MenuAudio;
}

export function AdventureMap({
  profile,
  totalStars,
  onCategory,
  onGarden,
  onSwitchChild,
  adventurePicks = [],
  onPlayPick,
  audio,
}: Props) {
  // Cáo invites the child to today's adventure ONCE per map open (never nags).
  // Gated on having picks so we don't greet into an empty strip.
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current || adventurePicks.length === 0) return;
    greeted.current = true;
    void audio?.speak('fox.adventure.invite');
  }, [adventurePicks.length, audio]);

  const handleCategory = (c: (typeof CATEGORIES)[number]): void => {
    void audio?.speakText(c.title);
    onCategory(c.id);
  };

  // Voiced-nav (GĐ5E1): the "Đổi bạn" and "Vườn sao" buttons were silent.
  const handleSwitchChild = (): void => {
    void audio?.speak('nav.switchchild');
    onSwitchChild?.();
  };
  const handleGarden = (): void => {
    void audio?.speak('nav.garden');
    onGarden();
  };
  return (
    <div className="screen map">
      <header className="map-header">
        {onSwitchChild ? (
          <button
            className="switch-child-btn"
            aria-label="Đổi bạn chơi"
            onClick={handleSwitchChild}
          >
            <SvgArt
              svg={avatarArt(profile.avatarKey, avatarLabel(profile.avatarKey))}
              alt={avatarLabel(profile.avatarKey)}
              size={52}
              className="avatar-art"
            />
            <span className="switch-child-label">Đổi bạn</span>
          </button>
        ) : (
          <SvgArt
            svg={avatarArt(profile.avatarKey, avatarLabel(profile.avatarKey))}
            alt={avatarLabel(profile.avatarKey)}
            size={52}
            className="avatar-art"
          />
        )}
        <button className="garden-btn" onClick={handleGarden}>
          <SvgArt svg={starArt()} alt="" size={24} className="inline-star" /> Vườn sao {totalStars}
        </button>
      </header>
      {onPlayPick && adventurePicks.length > 0 && (
        <TodaysAdventure picks={adventurePicks} onPlayPick={onPlayPick} audio={audio} />
      )}
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
