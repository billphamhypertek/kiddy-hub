import { useEffect, useState } from 'react';
import { listProfiles } from '../data/profiles';
import { avatarEmoji } from '../content/avatars';
import type { Profile } from '../data/types';

interface Props {
  onSelect: (p: Profile) => void;
  onParent: () => void;
}

export function WhoIsPlaying({ onSelect, onParent }: Props) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);

  useEffect(() => {
    void listProfiles().then(setProfiles);
  }, []);

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
            <button key={p.id} className="avatar-card" onClick={() => onSelect(p)}>
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
