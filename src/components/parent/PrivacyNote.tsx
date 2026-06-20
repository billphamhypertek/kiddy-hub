import { PRIVACY_NOTE } from '../../content/parentTips';

/**
 * Quyền riêng tư là tính năng (privacy-as-feature) — khối tĩnh "huy hiệu tin
 * cậy" cho người mua. Thuần, không state, không async. Nội dung đến từ C1
 * (PRIVACY_NOTE), tách dòng bằng '\n'.
 */
export function PrivacyNote(): JSX.Element {
  return (
    <section className="parent-note privacy-note" aria-label="Quyền riêng tư của bé">
      <h3>🔒 Quyền riêng tư của bé</h3>
      <ul>
        {PRIVACY_NOTE.split('\n').map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
