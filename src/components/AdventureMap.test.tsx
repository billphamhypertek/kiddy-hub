import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdventureMap } from './AdventureMap';
import type { AdventurePick } from '../data/todaysAdventure';

const profile = { id: 1, name: 'Na', avatarKey: 'cat', createdAt: 0 };

const picks: AdventurePick[] = [
  { gameId: 'counting-fun', title: 'Đếm Vui', reason: 'due' },
  { gameId: 'abc-english', title: 'ABC', reason: 'fresh' },
];

describe('AdventureMap', () => {
  it('renders 6 islands and navigates to a category and the garden', async () => {
    const onCategory = vi.fn();
    const onGarden = vi.fn();
    render(
      <AdventureMap profile={profile} totalStars={5} onCategory={onCategory} onGarden={onGarden} />,
    );
    const islands = screen.getAllByRole('button').filter((b) => b.classList.contains('island'));
    expect(islands).toHaveLength(6);
    await userEvent.click(screen.getByLabelText('Toán & Con số'));
    expect(onCategory).toHaveBeenCalledWith('numbers');
    await userEvent.click(screen.getByText(/Vườn sao/));
    expect(onGarden).toHaveBeenCalled();
  });

  it('shows the "Phiêu lưu hôm nay" strip and launches a pick', async () => {
    const onPlayPick = vi.fn();
    render(
      <AdventureMap
        profile={profile}
        totalStars={0}
        onCategory={() => {}}
        onGarden={() => {}}
        adventurePicks={picks}
        onPlayPick={onPlayPick}
      />,
    );
    expect(screen.getByText('Phiêu lưu hôm nay')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Chơi Đếm Vui'));
    expect(onPlayPick).toHaveBeenCalledWith('counting-fun');
  });

  it('speaks the gentle adventure invite ONCE when picks are present', () => {
    const speak = vi.fn().mockResolvedValue(undefined);
    const speakText = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <AdventureMap
        profile={profile}
        totalStars={0}
        onCategory={() => {}}
        onGarden={() => {}}
        adventurePicks={picks}
        onPlayPick={() => {}}
        audio={{ speak, speakText }}
      />,
    );
    expect(speak).toHaveBeenCalledWith('fox.adventure.invite');
    expect(speak).toHaveBeenCalledTimes(1);
    // a re-render with the same picks does not nag again
    rerender(
      <AdventureMap
        profile={profile}
        totalStars={0}
        onCategory={() => {}}
        onGarden={() => {}}
        adventurePicks={picks}
        onPlayPick={() => {}}
        audio={{ speak, speakText }}
      />,
    );
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('does not speak the invite when there are no picks', () => {
    const speak = vi.fn().mockResolvedValue(undefined);
    render(
      <AdventureMap
        profile={profile}
        totalStars={0}
        onCategory={() => {}}
        onGarden={() => {}}
        adventurePicks={[]}
        onPlayPick={() => {}}
        audio={{ speak, speakText: vi.fn() }}
      />,
    );
    expect(speak).not.toHaveBeenCalled();
  });
});
