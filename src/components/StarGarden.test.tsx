import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    expect(await screen.findByText(/⭐ 6/)).toBeInTheDocument();
    expect(await screen.findByText('🌸')).toBeInTheDocument();
  });
});
