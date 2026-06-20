import { useEffect, useState } from 'react';
import { listProfiles, createProfile, deleteProfile } from '../../data/profiles';
import { getSettings, updateSettings } from '../../data/settings';
import { getWeeklyTally } from '../../data/stars';
import { AVATARS, avatarLabel } from '../../content/avatars';
import { SvgArt } from '../../art/Art';
import { avatarArt } from '../../art/avatars';
import { starArt } from '../../art/stars';
import { ChildProgressList } from './ChildProgressList';
import { PrivacyNote } from './PrivacyNote';
import { HealthyUseNote } from './HealthyUseNote';
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
              <span className="child-row">
                <SvgArt
                  svg={avatarArt(p.avatarKey, avatarLabel(p.avatarKey))}
                  alt={avatarLabel(p.avatarKey)}
                  size={32}
                  className="avatar-art-sm"
                />{' '}
                {p.name}
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
                <SvgArt svg={avatarArt(a.key, a.label)} alt="" size={40} className="avatar-art-sm" />
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
              {t.name}: <SvgArt svg={starArt()} alt="" size={18} className="inline-star" />{' '}
              {t.stars}
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

      <ChildProgressList profiles={profiles} />

      <PrivacyNote />
      <HealthyUseNote />

      <button className="done" onClick={onExit}>
        Xong
      </button>
    </div>
  );
}
