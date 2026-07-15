import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../app/app';

describe('App', () => {
  it('renders the placeholder header', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'ArpLens' })).toBeInTheDocument();
    expect(screen.getByText('Recreate standard arpeggios from audio.')).toBeInTheDocument();
  });
});
