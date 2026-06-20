import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyRecapCard } from './WeeklyRecapCard';
import type { WeeklyRecap } from '../../data/parentInsights';

function recap(over: Partial<WeeklyRecap> = {}): WeeklyRecap {
  return {
    weekKey: '2026-W25',
    newlyMastered: [],
    newlyMasteredCount: 0,
    stars: 0,
    ...over,
  };
}

describe('WeeklyRecapCard', () => {
  it('shows newly-mastered count and stars', () => {
    render(
      <WeeklyRecapCard
        recap={recap({
          newlyMasteredCount: 3,
          stars: 12,
          newlyMastered: [{ skillId: 'number-vi', label: 'Đếm số', itemKey: '1' }],
        })}
      />,
    );
    expect(screen.getByText(/Thạo thêm 3 điều mới/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('shows topSkill when present', () => {
    render(
      <WeeklyRecapCard
        recap={recap({
          newlyMasteredCount: 2,
          stars: 5,
          topSkill: { skillId: 'shape', label: 'Hình khối' },
        })}
      />,
    );
    expect(screen.getByText(/giỏi nhất: Hình khối/)).toBeInTheDocument();
  });

  it('empty recap shows a gentle line, never crashes, and shows no "phút"', () => {
    const { container } = render(<WeeklyRecapCard recap={recap()} />);
    expect(screen.getByText(/cùng bé chơi vài trò mới/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/phút/);
  });
});
