import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodaysAdventure } from './TodaysAdventure';
import type { AdventurePick } from '../data/todaysAdventure';

const picks: AdventurePick[] = [
  { gameId: 'counting-fun', title: 'Đếm Vui', reason: 'due' },
  { gameId: 'abc-english', title: 'ABC', reason: 'fresh' },
];

describe('TodaysAdventure strip', () => {
  it('renders a gentle "Phiêu lưu hôm nay" strip with a card per pick', () => {
    render(<TodaysAdventure picks={picks} onPlayPick={() => {}} />);
    expect(screen.getByText('Phiêu lưu hôm nay')).toBeInTheDocument();
    expect(screen.getByLabelText('Chơi Đếm Vui')).toBeInTheDocument();
    expect(screen.getByLabelText('Chơi ABC')).toBeInTheDocument();
  });

  it('has NO streak counter / day-count text (ethical framing)', () => {
    render(<TodaysAdventure picks={picks} onPlayPick={() => {}} />);
    expect(screen.queryByText(/liên tiếp/i)).toBeNull();
    expect(screen.queryByText(/ngày thứ/i)).toBeNull();
    expect(screen.queryByText(/streak/i)).toBeNull();
  });

  it('launches the tapped game via onPlayPick', async () => {
    const onPlayPick = vi.fn();
    render(<TodaysAdventure picks={picks} onPlayPick={onPlayPick} />);
    await userEvent.click(screen.getByLabelText('Chơi ABC'));
    expect(onPlayPick).toHaveBeenCalledWith('abc-english');
  });

  // GĐ5E1 — voiced-nav: the cards now read the title aloud on tap (when audio is
  // threaded in). They must also still work when audio is absent.
  it('speaks the picked title before launching when audio is provided', async () => {
    const onPlayPick = vi.fn();
    const speakText = vi.fn().mockResolvedValue(undefined);
    render(
      <TodaysAdventure
        picks={picks}
        onPlayPick={onPlayPick}
        audio={{ speak: vi.fn(), speakText }}
      />,
    );
    await userEvent.click(screen.getByLabelText('Chơi ABC'));
    expect(speakText).toHaveBeenCalledWith('ABC');
    expect(onPlayPick).toHaveBeenCalledWith('abc-english');
  });

  it('renders nothing when there are no picks', () => {
    const { container } = render(<TodaysAdventure picks={[]} onPlayPick={() => {}} />);
    expect(container.querySelector('.todays-adventure')).toBeNull();
  });
});
