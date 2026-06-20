import { useEffect, useState, type CSSProperties } from 'react';
import { listProfiles } from '../data/profiles';
import { avatarLabel } from '../content/avatars';
import { SvgArt } from '../art/Art';
import { avatarArt } from '../art/avatars';
import { foxIdle } from '../art/fox';
import type { Profile } from '../data/types';
import type { MenuAudio } from './menuAudio';

interface Props {
  onSelect: (p: Profile) => void;
  onParent: () => void;
  audio?: MenuAudio;
}

export function WhoIsPlaying({ onSelect, onParent, audio }: Props) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);

  useEffect(() => {
    void listProfiles().then(setProfiles);
  }, []);

  // Greet the child on mount (respects the voice toggle inside AudioManager).
  useEffect(() => {
    void audio?.speak('who.title');
  }, [audio]);

  const handleSelect = (p: Profile): void => {
    void audio?.speakText(p.name);
    onSelect(p);
  };

  // Voiced-nav (GĐ5E1): the parent entry was silent. Speak a gentle, child-
  // friendly line on tap before routing (respects the voice toggle).
  const handleParent = (): void => {
    void audio?.speak('nav.parents');
    onParent();
  };

  return (
    <div className="screen who">
      <h1>
        <SvgArt svg={foxIdle()} alt="" size={48} className="title-fox" /> Ai đang chơi?
      </h1>
      {profiles === null ? (
        <p className="loading-line" aria-live="polite">
          <SvgArt svg={foxIdle()} alt="" size={32} className="inline-fox" /> Đang tải…
        </p>
      ) : profiles.length === 0 ? (
        // First-run normally routes to <Onboarding> before reaching here (see
        // selectScreen). This stays as a safe fallback with a clear next action.
        <div className="who-empty">
          <p className="hint">Chưa có bé nào.</p>
          <button className="who-empty-create" onClick={handleParent}>
            Bố mẹ tạo hồ sơ cho bé
          </button>
        </div>
      ) : (
        <div className="avatar-grid">
          {profiles.map((p, i) => (
            <button
              key={p.id}
              className="avatar-card stagger-item"
              style={{ '--stagger-index': i } as CSSProperties}
              onClick={() => handleSelect(p)}
            >
              <SvgArt
                svg={avatarArt(p.avatarKey, avatarLabel(p.avatarKey))}
                alt={avatarLabel(p.avatarKey)}
                size={88}
                className="avatar-art"
              />
              <span className="avatar-name">{p.name}</span>
            </button>
          ))}
        </div>
      )}
      <button className="parent-link" aria-label="Khu phụ huynh" onClick={handleParent}>
        👨‍👩‍👧 Bố mẹ
      </button>
    </div>
  );
}
