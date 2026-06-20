import { useEffect, useState } from 'react';
import { getChildMastery, getWeeklyMasteryRecap } from '../../data/parentInsights';
import { ChildMasteryCard } from './ChildMasteryCard';
import type { ChildSkillView, WeeklyRecap } from '../../data/parentInsights';
import type { Profile } from '../../data/types';

interface Props {
  profiles: Profile[];
  /** Deep-link "Luyện tiếp" (Phần D §9) — passed through to each card. */
  onPlayGame?: (gameId: string, profileId: number) => void;
}

interface LoadedChild {
  profile: Profile;
  view: ChildSkillView[];
  recap: WeeklyRecap;
}

/**
 * Khu "Tiến bộ của bé": làm việc đọc-only bất đồng bộ (getChildMastery +
 * getWeeklyMasteryRecap) một lần cho từng bé khi mở khu phụ huynh, rồi render
 * các ChildMasteryCard THUẦN (truyền view xuống — card không async, dễ test).
 *
 * Có cờ `cancelled` (mounted-guard) trong effect: nếu component unmount hoặc
 * `profiles` đổi trước khi các Promise giải quyết thì KHÔNG setState (tránh cảnh
 * báo setState-after-unmount và tránh hiển thị dữ liệu cũ).
 */
export function ChildProgressList({ profiles, onPlayGame }: Props): JSX.Element | null {
  const [loaded, setLoaded] = useState<LoadedChild[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const rows = await Promise.all(
        profiles.map(async (profile) => {
          const [view, recap] = await Promise.all([
            getChildMastery(profile.id!),
            getWeeklyMasteryRecap(profile.id!),
          ]);
          return { profile, view, recap };
        }),
      );
      if (!cancelled) setLoaded(rows);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [profiles]);

  // Chưa có bé → ẩn cả section (mục "Các bé"/"Sao tuần này" hiện có vẫn giữ).
  if (profiles.length === 0) return null;

  return (
    <section className="child-progress" aria-label="Tiến bộ của bé">
      <h3>Tiến bộ của bé</h3>
      {loaded === null ? (
        <p className="hint">Đang tải…</p>
      ) : (
        loaded.map(({ profile, view, recap }) => (
          <ChildMasteryCard
            key={profile.id}
            name={profile.name}
            avatarKey={profile.avatarKey}
            childView={view}
            recap={recap}
            profileId={profile.id}
            onPlayGame={onPlayGame}
          />
        ))
      )}
    </section>
  );
}
