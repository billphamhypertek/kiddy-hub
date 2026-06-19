import { useEffect, useState } from 'react';
import { listProfiles, createProfile, deleteProfile } from '../../data/profiles';
import { getSettings, updateSettings } from '../../data/settings';
import { getWeeklyTally } from '../../data/stars';
import { AVATARS, avatarEmoji } from '../../content/avatars';
import type { Profile, Settings } from '../../data/types';
import type { AudioManager } from '../../audio/AudioManager';

interface Props {
  audio: AudioManager;
  onExit: () => void;
}

type TallyRow = { profileId: number; name: string; stars: number };

export function ParentArea({ audio, onExit }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tally, setTally] = useState<TallyRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [name, setName] = useState('');
  const [avatarKey, setAvatarKey] = useState(AVATARS[0].key);

  async function refresh() {
    setProfiles(await listProfiles());
    setTally(await getWeeklyTally());
  }

  useEffect(() => {
    void refresh();
    void getSettings().then(setSettings);
  }, []);

  async function addChild() {
    if (!name.trim()) return;
    await createProfile({ name: name.trim(), avatarKey });
    setName('');
    await refresh();
  }

  async function removeChild(id: number) {
    await deleteProfile(id);
    await refresh();
  }

  async function toggle(key: 'soundOn' | 'voiceOn') {
    if (!settings) return;
    const next = await updateSettings({ [key]: !settings[key] });
    setSettings(next);
    audio.setSoundOn(next.soundOn);
    audio.setVoiceOn(next.voiceOn);
  }

  return (
    <div className="screen parent-area">
      <h2>Khu phụ huynh</h2>

      <section>
        <h3>Các bé</h3>
        <ul className="child-list">
          {profiles.map((p) => (
            <li key={p.id}>
              <span>
                {avatarEmoji(p.avatarKey)} {p.name}
              </span>
              <button aria-label={`Xoá ${p.name}`} onClick={() => removeChild(p.id!)}>
                🗑️
              </button>
            </li>
          ))}
        </ul>
        <div className="add-child">
          <input
            aria-label="Tên bé"
            value={name}
            placeholder="Tên bé"
            onChange={(e) => setName(e.target.value)}
          />
          <div className="avatar-pick">
            {AVATARS.map((a) => (
              <button
                key={a.key}
                aria-label={a.label}
                aria-pressed={a.key === avatarKey}
                onClick={() => setAvatarKey(a.key)}
              >
                {a.emoji}
              </button>
            ))}
          </div>
          <button onClick={addChild}>Thêm bé</button>
        </div>
      </section>

      <section>
        <h3>Sao tuần này</h3>
        <ol className="tally">
          {tally.map((t) => (
            <li key={t.profileId}>
              {t.name}: ⭐ {t.stars}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3>Âm thanh</h3>
        {settings && (
          <>
            <label>
              <input
                type="checkbox"
                aria-label="Hiệu ứng âm thanh"
                checked={settings.soundOn}
                onChange={() => toggle('soundOn')}
              />{' '}
              Hiệu ứng âm thanh
            </label>
            <label>
              <input
                type="checkbox"
                aria-label="Giọng đọc"
                checked={settings.voiceOn}
                onChange={() => toggle('voiceOn')}
              />{' '}
              Giọng đọc
            </label>
          </>
        )}
      </section>

      <button className="done" onClick={onExit}>
        Xong
      </button>
    </div>
  );
}
