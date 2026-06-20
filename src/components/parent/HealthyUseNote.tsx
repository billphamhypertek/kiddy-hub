import { HEALTHY_USE_NOTE } from '../../content/parentTips';

/**
 * Nhắc dùng lành mạnh (healthy-use nudge) — dịu, hướng cha mẹ, theo AAP. Tĩnh:
 * KHÔNG đo screen-time, KHÔNG đếm phiên, KHÔNG cảnh báo/guilt. Nội dung đến từ
 * C1 (HEALTHY_USE_NOTE).
 */
export function HealthyUseNote(): JSX.Element {
  return (
    <section className="parent-note healthy-note" aria-label="Chơi vừa đủ, lớn khôn nhiều">
      <h3>🌳 Chơi vừa đủ, lớn khôn nhiều</h3>
      <p>
        {HEALTHY_USE_NOTE.split('\n').map((line, i, arr) => (
          <span key={line}>
            {line}
            {i < arr.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </section>
  );
}
