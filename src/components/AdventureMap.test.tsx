import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdventureMap } from './AdventureMap';

const profile = { id: 1, name: 'Na', avatarKey: 'cat', createdAt: 0 };

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
});
