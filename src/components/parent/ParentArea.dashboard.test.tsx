import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { db } from '../../data/db';
import { createProfile } from '../../data/profiles';
import { upsertMastery } from '../../data/mastery';
import { addStars } from '../../data/stars';
import { registerAllGames } from '../../games';
import type { MasteryRow } from '../../data/leitner';
import { ParentArea } from './ParentArea';

const fakeAudio = {
  playSfx: vi.fn(),
  speak: vi.fn().mockResolvedValue(undefined),
  speakText: vi.fn().mockResolvedValue(undefined),
  stopVoice: vi.fn(),
  setSoundOn: vi.fn(),
  setVoiceOn: vi.fn(),
};

const now = Date.now();

function row(over: Partial<MasteryRow> & Pick<MasteryRow, 'itemKey' | 'box'>): MasteryRow {
  return {
    dueAt: now,
    seenCount: 4,
    correctCount: 3,
    lastResult: 'correct',
    lastSeenAt: now,
    ...over,
  };
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  vi.clearAllMocks();
  registerAllGames(); // so practiceGameTitle resolves via getGame()
});

describe('ParentArea — Tiến bộ của bé dashboard (Phần 5C)', () => {
  it('renders each child mastery card with status labels, practice game name, tip and weekly recap', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'fox' });
    // mastered skill: box ≥ 4 (masteredAt this week → counts in weekly recap)
    await upsertMastery(id, 'color-vi', row({ itemKey: 'red', box: 4, masteredAt: now }));
    // practice-next skill: box 0
    await upsertMastery(id, 'number-vi', row({ itemKey: '5', box: 0, correctCount: 1 }));
    await addStars(id, 7);

    render(<ParentArea audio={fakeAudio} onExit={() => {}} />);

    // Section heading appears
    expect(await screen.findByText('Tiến bộ của bé')).toBeInTheDocument();

    const card = await screen.findByLabelText('Tiến bộ của Na');

    // status labels (practice-next sorted first)
    expect(within(card).getByText('Nên luyện tiếp')).toBeInTheDocument();
    expect(within(card).getByText('Đã thạo')).toBeInTheDocument();

    // practice game NAME shown as text (counting-fun → "Đếm Vui"); no launch button
    expect(within(card).getByText(/Luyện tiếp với trò: Đếm Vui/)).toBeInTheDocument();
    expect(within(card).queryByRole('button')).toBeNull();

    // offline tip rendered for practice-next + mastered rows
    expect(within(card).getByText(/Cùng đếm 3 món đồ thật quanh nhà/)).toBeInTheDocument();
    expect(within(card).getByText(/săn” đồ vật cùng màu quanh nhà/)).toBeInTheDocument();

    // weekly recap: 1 newly mastered this week + 7 stars, no "phút"
    expect(within(card).getByText(/Thạo thêm 1 điều mới/)).toBeInTheDocument();
    expect(within(card).getByText(/7/)).toBeInTheDocument();
  });

  it('renders PrivacyNote and HealthyUseNote, and never shows "phút đã chơi"', async () => {
    await createProfile({ name: 'Bi', avatarKey: 'cat' });

    const { container } = render(<ParentArea audio={fakeAudio} onExit={() => {}} />);

    expect(await screen.findByText(/Quyền riêng tư của bé/)).toBeInTheDocument();
    expect(screen.getByText(/Chơi vừa đủ, lớn khôn nhiều/)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Tiến bộ của bé')).toBeInTheDocument());
    expect(container.textContent).not.toMatch(/phút đã chơi/);
  });

  it('hides the progress section when there are no children', async () => {
    render(<ParentArea audio={fakeAudio} onExit={() => {}} />);
    // wait until the existing area is rendered
    expect(await screen.findByText('Các bé')).toBeInTheDocument();
    expect(screen.queryByText('Tiến bộ của bé')).toBeNull();
    // static notes still render
    expect(screen.getByText(/Quyền riêng tư của bé/)).toBeInTheDocument();
  });
});
