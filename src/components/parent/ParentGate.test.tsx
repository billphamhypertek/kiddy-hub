import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParentGate } from './ParentGate';

describe('ParentGate', () => {
  it('passes on the correct answer', async () => {
    const onPass = vi.fn();
    render(<ParentGate onPass={onPass} makeProblem={() => ({ a: 3, b: 4 })} />);
    await userEvent.type(screen.getByLabelText('Đáp án'), '7');
    await userEvent.click(screen.getByText('Vào'));
    expect(onPass).toHaveBeenCalled();
  });

  it('rejects a wrong answer and shows a hint', async () => {
    const onPass = vi.fn();
    render(<ParentGate onPass={onPass} makeProblem={() => ({ a: 3, b: 4 })} />);
    await userEvent.type(screen.getByLabelText('Đáp án'), '5');
    await userEvent.click(screen.getByText('Vào'));
    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
