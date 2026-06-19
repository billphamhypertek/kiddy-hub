import { useEffect, useState } from 'react';
import { listProfiles } from '../data/profiles';
import { avatarEmoji } from '../content/avatars';
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

  return (
    <div className="screen who">
      <h1>Ai đang chơi? 🦊</h1>
      {profiles === null ? (
        <p>Đang tải…</p>
      ) : profiles.length === 0 ? (
        <p className="hint">Chưa có bé nào. Bố mẹ hãy tạo hồ sơ nhé!</p>
      ) : (
        <div className="avatar-grid">
          {profiles.map((p) => (
            <button key={p.id} className="avatar-card" onClick={() => handleSelect(p)}>
              <span className="avatar-emoji">{avatarEmoji(p.avatarKey)}</span>
              <span className="avatar-name">{p.name}</span>
            </button>
          ))}
        </div>
      )}
      <button className="parent-link" aria-label="Khu phụ huynh" onClick={onParent}>
        👨‍👩‍👧 Bố mẹ
      </button>
    </div>
  );
}
