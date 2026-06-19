import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../data/db';
import { createProfile } from '../data/profiles';
import { WhoIsPlaying } from './WhoIsPlaying';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('WhoIsPlaying', () => {
  it('lists stored profiles and selects one', async () => {
    await createProfile({ name: 'Na', avatarKey: 'cat' });
    const onSelect = vi.fn();
    render(<WhoIsPlaying onSelect={onSelect} onParent={() => {}} />);
    await userEvent.click(await screen.findByText('Na'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'Na' }));
  });

  it('exposes the parent entry', async () => {
    const onParent = vi.fn();
    render(<WhoIsPlaying onSelect={() => {}} onParent={onParent} />);
    await userEvent.click(await screen.findByLabelText('Khu phụ huynh'));
    expect(onParent).toHaveBeenCalled();
  });
});
