import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { _clearRegistry } from '../games/registry';
import { registerAllGames } from '../games';
import { CategoryScreen } from './CategoryScreen';

beforeEach(() => {
  _clearRegistry();
  registerAllGames();
});

describe('CategoryScreen', () => {
  it('lists games in a category and starts one', async () => {
    const onPlay = vi.fn();
    render(<CategoryScreen categoryId="numbers" onPlay={onPlay} onBack={() => {}} />);
    await userEvent.click(screen.getByText('Đếm Vui'));
    expect(onPlay).toHaveBeenCalledWith('counting-fun');
  });

  it('shows a friendly message for an empty category', () => {
    // After Phase 2 every category has a game, so exercise the empty-state
    // branch against an empty registry instead of a (now populated) category.
    _clearRegistry();
    render(<CategoryScreen categoryId="memory" onPlay={() => {}} onBack={() => {}} />);
    expect(screen.getByText(/Sắp có/)).toBeInTheDocument();
  });
});
