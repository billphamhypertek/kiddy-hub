import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider, useSession } from './SessionContext';

function Probe() {
  const { profile, setProfile } = useSession();
  return (
    <div>
      <span data-testid="name">{profile?.name ?? 'none'}</span>
      <button onClick={() => setProfile({ name: 'Na', avatarKey: 'cat', createdAt: 0 })}>set</button>
    </div>
  );
}

describe('SessionContext', () => {
  it('exposes and updates the current profile', async () => {
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    expect(screen.getByTestId('name')).toHaveTextContent('none');
    await userEvent.click(screen.getByText('set'));
    expect(screen.getByTestId('name')).toHaveTextContent('Na');
  });
});
