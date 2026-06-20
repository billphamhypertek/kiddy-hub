import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChildMasteryCard } from './ChildMasteryCard';
import type { ChildSkillView, WeeklyRecap } from '../../data/parentInsights';

const emptyRecap: WeeklyRecap = {
  weekKey: '2026-W25',
  newlyMastered: [],
  newlyMasteredCount: 0,
  stars: 0,
};

function view(over: Partial<ChildSkillView> & Pick<ChildSkillView, 'skillId'>): ChildSkillView {
  return {
    label: 'Kỹ năng',
    status: 'emerging',
    masteredCount: 0,
    emergingCount: 1,
    practiceCount: 0,
    total: 1,
    accuracy: 0.5,
    tip: '',
    ...over,
  };
}

describe('ChildMasteryCard', () => {
  it('renders the child name and skill labels', () => {
    render(
      <ChildMasteryCard
        name="Na"
        avatarKey="fox"
        recap={emptyRecap}
        childView={[view({ skillId: 'number-vi', label: 'Đếm số' })]}
      />,
    );
    expect(screen.getByText('Na')).toBeInTheDocument();
    expect(screen.getByText('Đếm số')).toBeInTheDocument();
  });

  it('practice-next row shows the badge, the practice game NAME (text), and a tip', () => {
    render(
      <ChildMasteryCard
        name="Na"
        avatarKey="fox"
        recap={emptyRecap}
        childView={[
          view({
            skillId: 'number-vi',
            label: 'Đếm số',
            status: 'practice-next',
            practiceGameId: 'counting-fun',
            practiceGameTitle: 'Đếm Vui',
            tip: 'Cùng đếm 3 món đồ thật quanh nhà nhé!',
          }),
        ]}
      />,
    );
    expect(screen.getByText('Nên luyện tiếp')).toBeInTheDocument();
    // game name shown as TEXT only — no launch button (deferred to Phần D).
    expect(screen.getByText(/Luyện tiếp với trò: Đếm Vui/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(/Cùng đếm 3 món đồ thật quanh nhà/)).toBeInTheDocument();
  });

  it('mastered row shows the "Đã thạo" badge and a tip', () => {
    render(
      <ChildMasteryCard
        name="Na"
        avatarKey="fox"
        recap={emptyRecap}
        childView={[
          view({
            skillId: 'color-vi',
            label: 'Màu sắc',
            status: 'mastered',
            tip: 'Đi “săn” đồ vật cùng màu quanh nhà nào!',
          }),
        ]}
      />,
    );
    expect(screen.getByText('Đã thạo')).toBeInTheDocument();
    expect(screen.getByText(/săn” đồ vật cùng màu/)).toBeInTheDocument();
  });

  it('status badge carries shape/icon (not color alone)', () => {
    const { container } = render(
      <ChildMasteryCard
        name="Na"
        avatarKey="fox"
        recap={emptyRecap}
        childView={[view({ skillId: 'shape', label: 'Hình khối', status: 'practice-next' })]}
      />,
    );
    // distinct status class (which carries a distinct border-shape) is present,
    // and the visible label text conveys meaning without relying on color.
    expect(container.querySelector('.status-practice-next')).not.toBeNull();
    expect(screen.getByText('Nên luyện tiếp')).toBeInTheDocument();
  });

  it('child with no play data shows a gentle empty line', () => {
    render(
      <ChildMasteryCard name="Bi" avatarKey="cat" recap={emptyRecap} childView={[]} />,
    );
    expect(screen.getByText(/Bé chưa chơi trò nào/)).toBeInTheDocument();
  });
});
