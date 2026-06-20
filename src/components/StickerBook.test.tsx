import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { db } from '../data/db';
import { createProfile } from '../data/profiles';
import { recordItemResult } from '../data/mastery';
import { StickerBook } from './StickerBook';
import { STICKER_MILESTONES } from '../data/collection';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

/** Drive an item to mastery (box ≥ 4) by repeated correct first-tries. */
async function masterItem(profileId: number, itemKey: string): Promise<void> {
  for (let i = 0; i < 6; i++) {
    await recordItemResult(profileId, 'number-vi', itemKey, true, i * 10 ** 9);
  }
}

describe('StickerBook', () => {
  it('shows the collection title and the full ceiling count for a new child', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    render(<StickerBook profileId={id} profileName="Na" />);
    expect(await screen.findByText(/Bộ sưu tập của Na/)).toBeInTheDocument();
    expect(
      await screen.findByText(`Đã sưu tập: 0/${STICKER_MILESTONES.length}`),
    ).toBeInTheDocument();
  });

  it('reveals an earned sticker (full) and keeps the rest locked with "?" (no FOMO)', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await masterItem(id, '3'); // → first-mastery unlocks
    render(<StickerBook profileId={id} profileName="Na" />);
    // earned sticker label is visible (the first-mastery sticker)
    expect(await screen.findByText('Ngôi sao đầu tiên')).toBeInTheDocument();
    // at least one locked slot still shows the gentle "?" placeholder
    const locked = await screen.findAllByText('???');
    expect(locked.length).toBeGreaterThan(0);
    // count reflects exactly one earned
    expect(screen.getByText(`Đã sưu tập: 1/${STICKER_MILESTONES.length}`)).toBeInTheDocument();
  });

  it('flags a freshly-earned sticker with a gentle "Mới!"', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await masterItem(id, '3');
    render(<StickerBook profileId={id} profileName="Na" />);
    expect(await screen.findByText('Mới!')).toBeInTheDocument();
  });
});
