import { SvgArt } from '../../art/Art';
import { starArt } from '../../art/stars';
import type { WeeklyRecap } from '../../data/parentInsights';

interface Props {
  recap: WeeklyRecap;
}

/**
 * Thẻ tổng kết tuần mỗi bé — render THUẦN (không async, không DB): số mục MỚI
 * THẠO tuần này + sao tuần. CỐ Ý không có "phút đã chơi" (chống vanity-metric).
 * Recap rỗng (bé chưa tiến bộ tuần này) → câu khích lệ dịu, không số liệu trống.
 */
export function WeeklyRecapCard({ recap }: Props): JSX.Element {
  const { newlyMasteredCount, stars, topSkill } = recap;
  const nothingYet = newlyMasteredCount === 0 && stars === 0;

  return (
    <div className="weekly-recap">
      <h4 className="recap-heading">🌟 Tuần này</h4>
      {nothingYet ? (
        <p className="recap-empty">Tuần này cùng bé chơi vài trò mới nhé!</p>
      ) : (
        <p className="recap-line">
          {newlyMasteredCount > 0 ? (
            <>Thạo thêm {newlyMasteredCount} điều mới</>
          ) : (
            <>Bé vẫn chăm chơi</>
          )}{' '}
          · <SvgArt svg={starArt()} alt="sao" size={18} className="inline-star" /> {stars}
          {topSkill ? <span className="recap-top"> · giỏi nhất: {topSkill.label}</span> : null}
        </p>
      )}
    </div>
  );
}
