import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../../data/db';
import { listProfiles } from '../../data/profiles';
import { ParentArea } from './ParentArea';

const fakeAudio = {
  playSfx: vi.fn(),
  speak: vi.fn().mockResolvedValue(undefined),
  stopVoice: vi.fn(),
  setSoundOn: vi.fn(),
  setVoiceOn: vi.fn(),
};

beforeEach(async () => {
  await db.delete();
  await db.open();
  vi.clearAllMocks();
});

describe('ParentArea', () => {
  it('adds a child profile', async () => {
    render(<ParentArea audio={fakeAudio} onExit={() => {}} />);
    await userEvent.type(await screen.findByLabelText('Tên bé'), 'Na');
    await userEvent.click(screen.getByText('Thêm bé'));
    expect(await screen.findByText(/Na/)).toBeInTheDocument();
    expect(await listProfiles()).toHaveLength(1);
  });

  it('toggling voice updates settings and the audio manager', async () => {
    render(<ParentArea audio={fakeAudio} onExit={() => {}} />);
    const voice = await screen.findByLabelText('Giọng đọc');
    await userEvent.click(voice);
    expect(fakeAudio.setVoiceOn).toHaveBeenCalledWith(false);
  });
});
