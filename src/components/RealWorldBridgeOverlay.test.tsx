import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RealWorldBridgeOverlay } from './RealWorldBridgeOverlay';
import { childBridgeLine } from '../content/realWorldBridge';

describe('RealWorldBridgeOverlay', () => {
  it('renders the gentle invite + the child-facing line', () => {
    const line = childBridgeLine('number-vi');
    render(<RealWorldBridgeOverlay line={line} onContinue={() => {}} />);
    expect(screen.getByText('Thử ngoài đời nhé?')).toBeInTheDocument();
    expect(screen.getByText(line.text)).toBeInTheDocument();
  });

  it('continues (does NOT block) via the "Xong" button', async () => {
    const onContinue = vi.fn();
    render(<RealWorldBridgeOverlay line={childBridgeLine('letter-vi')} onContinue={onContinue} />);
    await userEvent.click(screen.getByText('Xong'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('has no guilt / countdown text (ethical)', () => {
    render(<RealWorldBridgeOverlay line={childBridgeLine('shape')} onContinue={() => {}} />);
    expect(screen.queryByText(/đừng/i)).toBeNull();
    expect(screen.queryByText(/buồn/i)).toBeNull();
    expect(screen.queryByText(/nhanh lên/i)).toBeNull();
  });
});
