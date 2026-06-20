import { useEffect, useState, type CSSProperties } from 'react';
import { SvgArt } from '../art/Art';
import { gardenItemArt, starArt, starOutlineArt } from '../art/stars';
import { foxCheer } from '../art/fox';
import { getMasterySummary } from '../data/mastery';
import { STICKER_MILESTONES, syncCollection, getCollection } from '../data/collection';
import type { MenuAudio } from './menuAudio';

interface Props {
  profileId: number;
  profileName: string;
  audio?: MenuAudio;
}

/** Map a sticker's art key to its SVG (reuses garden/star art). */
function stickerArt(art: string, title: string): string {
  return art === 'star' ? starArt(title) : gardenItemArt(art, title);
}

/**
 * Per-child sticker-book (GĐ5 D2 §6) shown under the family garden. Each sticker
 * unlocks from a REAL mastery milestone; the set is finite/completable. Unlocked
 * = full colour; locked = a soft greyed outline with "?" (NO countdown, NO FOMO).
 * Newly-earned stickers get a gentle "Mới!" label and Cáo cheers once (never
 * pressuring to keep going).
 */
export function StickerBook({ profileId, profileName, audio }: Props) {
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Sync from current mastery (catches stickers earned since last open),
      // then read the full owned set. Runs outside any round lifecycle.
      const summary = await getMasterySummary(profileId);
      const newly = await syncCollection(profileId, summary);
      const all = await getCollection(profileId);
      if (cancelled) return;
      setOwned(new Set(all.map((s) => s.stickerId)));
      setFresh(new Set(newly));
      if (newly.length > 0) void audio?.speak('fox.sticker.new');
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, audio]);

  const earnedCount = owned.size;

  return (
    <section className="sticker-book" aria-label={`Bộ sưu tập của ${profileName}`}>
      <h3 className="sticker-book-title">
        <SvgArt svg={foxCheer()} alt="" size={36} className="title-fox" /> Bộ sưu tập của{' '}
        {profileName}
      </h3>
      <p className="sticker-book-count">
        Đã sưu tập: {earnedCount}/{STICKER_MILESTONES.length}
      </p>
      <ul className="sticker-grid">
        {STICKER_MILESTONES.map((s, i) => {
          const got = owned.has(s.id);
          const isNew = fresh.has(s.id);
          return (
            <li
              key={s.id}
              className={`sticker-slot${got ? ' earned' : ' locked'}`}
              style={{ '--stagger-index': i } as CSSProperties}
            >
              {got ? (
                <SvgArt
                  svg={stickerArt(s.art, s.label)}
                  alt={s.label}
                  size={56}
                  className="sticker-art"
                />
              ) : (
                <span className="sticker-locked" role="img" aria-label="Chưa mở khoá">
                  <SvgArt svg={starOutlineArt('')} alt="" size={56} className="sticker-art muted" />
                  <span className="sticker-q" aria-hidden="true">
                    ?
                  </span>
                </span>
              )}
              <span className="sticker-label">{got ? s.label : '???'}</span>
              {isNew && <span className="sticker-new">Mới!</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
