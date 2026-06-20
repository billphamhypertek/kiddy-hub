import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { db } from '../data/db';
import { createProfile } from '../data/profiles';
import { addStars } from '../data/stars';
import { StarGarden } from './StarGarden';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('StarGarden', () => {
  it('shows the family total and the first grown item', async () => {
    const id = await createProfile({ name: 'Na', avatarKey: 'cat' });
    await addStars(id, 6); // crosses the 5-star "flower" milestone
    render(<StarGarden onBack={() => {}} />);
    // Wait for the async garden load (flower appears once 5 stars are crossed).
    expect(await screen.findByAltText('Bông hoa')).toBeInTheDocument();
    expect(screen.getByText(/Tổng cộng/)).toHaveTextContent('6');
  });

  // GĐ5E1 — voiced-nav: the back button (and "Đi chơi nào!") were silent.
  it('speaks nav.back when the back button is tapped', async () => {
    const speak = vi.fn().mockResolvedValue(undefined);
    const onBack = vi.fn();
    render(<StarGarden onBack={onBack} audio={{ speak, speakText: vi.fn() }} />);
    await userEvent.click(await screen.findByLabelText('Quay lại bản đồ'));
    expect(speak).toHaveBeenCalledWith('nav.back');
    expect(onBack).toHaveBeenCalled();
  });

  it('speaks nav.back when the empty-state "Đi chơi nào!" is tapped', async () => {
    const speak = vi.fn().mockResolvedValue(undefined);
    const onBack = vi.fn();
    render(<StarGarden onBack={onBack} audio={{ speak, speakText: vi.fn() }} />);
    await userEvent.click(await screen.findByText('Đi chơi nào!'));
    expect(speak).toHaveBeenCalledWith('nav.back');
    expect(onBack).toHaveBeenCalled();
  });
});
