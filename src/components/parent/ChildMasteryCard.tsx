import { SvgArt } from '../../art/Art';
import { avatarArt } from '../../art/avatars';
import { avatarLabel } from '../../content/avatars';
import { WeeklyRecapCard } from './WeeklyRecapCard';
import type { ChildSkillView, SkillStatus, WeeklyRecap } from '../../data/parentInsights';

interface Props {
  name: string;
  avatarKey: string;
  childView: ChildSkillView[];
  recap: WeeklyRecap;
  /** Bé này (cho deep-link "Luyện tiếp"). Có khi parent biết id của card. */
  profileId?: number;
  /**
   * Deep-link "Luyện tiếp" (Phần D §9): khi có, "Luyện tiếp với <trò>" thành
   * NÚT mở thẳng trò đó cho đúng bé. Không có (ngữ cảnh chỉ-xem) → giữ chữ tĩnh
   * (backward-safe — test cũ vẫn xanh).
   */
  onPlayGame?: (gameId: string, profileId: number) => void;
}

/**
 * Nhãn + biểu tượng + hình-dạng (KHÔNG chỉ dựa màu — accessibility): mỗi trạng
 * thái có icon + ký tự + class hình-khối riêng để người không phân biệt được
 * màu vẫn đọc được. Màu chỉ là lớp trang trí thêm.
 */
const STATUS_META: Record<SkillStatus, { label: string; icon: string }> = {
  mastered: { label: 'Đã thạo', icon: '✅' },
  emerging: { label: 'Đang lên', icon: '👍' },
  'practice-next': { label: 'Nên luyện tiếp', icon: '✏️' },
};

/**
 * Thẻ mỗi bé — render THUẦN (props giả test được, không async, không DB):
 * header (tên + avatar) + thẻ tuần + danh sách dòng kỹ năng. Mỗi dòng: nhãn kỹ
 * năng + badge trạng thái (text + icon + shape, KHÔNG chỉ màu) + (practice-next)
 * tên trò luyện dạng CHỮ (không nút — điều hướng hoãn sang Phần D) + tip đời
 * thực (cho practice-next và mastered). Bé chưa chơi → câu dịu.
 */
export function ChildMasteryCard({
  name,
  avatarKey,
  childView,
  recap,
  profileId,
  onPlayGame,
}: Props): JSX.Element {
  return (
    <article className="mastery-card" aria-label={`Tiến bộ của ${name}`}>
      <header className="mastery-header">
        <SvgArt
          svg={avatarArt(avatarKey, avatarLabel(avatarKey))}
          alt={avatarLabel(avatarKey)}
          size={40}
          className="avatar-art-sm"
        />
        <span className="mastery-name">{name}</span>
      </header>

      <WeeklyRecapCard recap={recap} />

      <h4 className="mastery-subhead">Bé đang giỏi gì</h4>
      {childView.length === 0 ? (
        <p className="mastery-empty">Bé chưa chơi trò nào — cùng bắt đầu nhé!</p>
      ) : (
        <ul className="mastery-rows">
          {childView.map((v) => {
            const meta = STATUS_META[v.status];
            return (
              <li key={v.skillId} className="mastery-row">
                <div className="mastery-row-head">
                  <span className="skill-label">{v.label}</span>
                  <span className={`status-badge status-${v.status}`}>
                    <span aria-hidden="true">{meta.icon}</span> {meta.label}
                  </span>
                </div>
                {v.status === 'practice-next' && v.practiceGameTitle ? (
                  onPlayGame && v.practiceGameId && profileId != null ? (
                    <button
                      type="button"
                      className="practice-game practice-game-btn"
                      onClick={() => onPlayGame(v.practiceGameId!, profileId)}
                    >
                      Luyện tiếp với {v.practiceGameTitle}
                    </button>
                  ) : (
                    <p className="practice-game">Luyện tiếp với trò: {v.practiceGameTitle}</p>
                  )
                ) : null}
                {v.tip ? <p className="mastery-tip">{v.tip}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
