import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Onboarding } from './Onboarding';

describe('Onboarding', () => {
  it('greets with fox.welcome on the welcome step', () => {
    const speak = vi.fn().mockResolvedValue(undefined);
    render(<Onboarding step="welcome" onStart={() => {}} audio={{ speak, speakText: vi.fn() }} />);
    expect(speak).toHaveBeenCalledWith('fox.welcome');
  });

  // GĐ5E1 — voiced-nav: the "tạo hồ sơ" button speaks before routing.
  it('speaks nav.parents and starts when the create button is tapped', async () => {
    const speak = vi.fn().mockResolvedValue(undefined);
    const onStart = vi.fn();
    render(<Onboarding step="welcome" onStart={onStart} audio={{ speak, speakText: vi.fn() }} />);
    await userEvent.click(screen.getByText('Bố mẹ tạo hồ sơ cho bé'));
    expect(speak).toHaveBeenCalledWith('nav.parents');
    expect(onStart).toHaveBeenCalled();
  });

  it('does not crash starting when audio is absent', async () => {
    const onStart = vi.fn();
    render(<Onboarding step="welcome" onStart={onStart} />);
    await userEvent.click(screen.getByText('Bố mẹ tạo hồ sơ cho bé'));
    expect(onStart).toHaveBeenCalled();
  });
});
