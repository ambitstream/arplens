import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RegistryDebug } from '../components/registry-debug';

describe('RegistryDebug', () => {
  it('renders the default Up sequence for 3 notes over 1 octave', () => {
    render(<RegistryDebug />);

    expect(screen.getByLabelText('Generated sequence')).toHaveTextContent('0 1 2');
    expect(screen.getByText(/3 steps/)).toBeInTheDocument();
  });

  it('regenerates through the registry when parameters change', () => {
    render(<RegistryDebug />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Style' }), {
      target: { value: 'down-up' },
    });

    expect(screen.getByLabelText('Generated sequence')).toHaveTextContent('2 1 0 1');
    expect(screen.getByText(/4 steps/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Octaves' }), {
      target: { value: '2' },
    });

    expect(screen.getByLabelText('Generated sequence')).toHaveTextContent('5 4 3 2 1 0 1 2 3 4');
    expect(screen.getByText(/10 steps/)).toBeInTheDocument();
  });
});
