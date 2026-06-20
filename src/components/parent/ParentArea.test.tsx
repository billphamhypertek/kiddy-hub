import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../../data/db';
import { listProfiles } from '../../data/profiles';
import { isCalmMode, setCalmMode } from '../../motion';
import { ParentArea } from './ParentArea';

const fakeAudio = {
  playSfx: vi.fn(),
  speak: vi.fn().mockResolvedValue(undefined),
  speakText: vi.fn().mockResolvedValue(undefined),
  stopVoice: vi.fn(),
  setSoundOn: vi.fn(),
  setVoiceOn: vi.fn(),
};

beforeEach(async () => {
  await db.delete();
  await db.open();
  vi.clearAllMocks();
  setCalmMode(false); // reset the calm-mode mirror between tests
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
    // toggle() is async (awaits the Dexie updateSettings write before calling
    // setVoiceOn), and userEvent.click doesn't await that chain — so wait for the
    // side-effect rather than asserting synchronously (fixes a load-dependent flake).
    await waitFor(() => expect(fakeAudio.setVoiceOn).toHaveBeenCalledWith(false));
  });

  // GĐ5E1 — "Chế độ êm" toggle (mirrors the audio toggles).
  it('toggling calm mode persists the setting and seeds the live mirror', async () => {
    render(<ParentArea audio={fakeAudio} onExit={() => {}} />);
    const calm = await screen.findByLabelText('Chế độ êm');
    expect(calm).not.toBeChecked();
    await userEvent.click(calm);
    // The Dexie write is awaited inside the handler; wait for the persisted
    // state to flip the checkbox + the calm-mode mirror to be on.
    await waitFor(() => expect(calm).toBeChecked());
    await waitFor(() => expect(isCalmMode()).toBe(true));
  });
});
