import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivacyNote } from './PrivacyNote';
import { HealthyUseNote } from './HealthyUseNote';

describe('PrivacyNote', () => {
  it('renders the privacy trust-badge lines', () => {
    render(<PrivacyNote />);
    expect(screen.getByText(/Quyền riêng tư của bé/)).toBeInTheDocument();
    expect(screen.getByText(/100% trên máy này/)).toBeInTheDocument();
    expect(screen.getByText(/Không quảng cáo\. Không thu thập dữ liệu/)).toBeInTheDocument();
  });
});

describe('HealthyUseNote', () => {
  it('renders the gentle healthy-use lines and invites outdoor play', () => {
    const { container } = render(<HealthyUseNote />);
    expect(screen.getByText(/Chơi vừa đủ, lớn khôn nhiều/)).toBeInTheDocument();
    expect(container.textContent).toMatch(/ra ngoài chơi/);
    // gentle: no guilt / screen-time counting.
    expect(container.textContent).not.toMatch(/quá giờ|phút đã chơi/);
  });
});
