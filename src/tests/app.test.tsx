import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from '../app/app';

describe('App workflow', () => {
  it('shows the upload panel first', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'ArpLens' })).toBeInTheDocument();
    expect(screen.getByLabelText('Audio file')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Arpeggio Sandbox' })).toBeInTheDocument();
  });

  it('enters the sandbox with seeded defaults and no Play Source', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to Arpeggio Sandbox' }));

    expect(screen.getByText('SANDBOX')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Modulation' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play Source' })).not.toBeInTheDocument();
    expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Style' })).toHaveTextContent('Up');
  });

  it('regenerates the sequence when the style is edited', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to Arpeggio Sandbox' }));

    // Up over C/E/G x2: E3 appears once in the sequence.
    expect(screen.getAllByText('E3')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Style' }));
    fireEvent.click(screen.getByRole('button', { name: 'UpDown' }));

    // UpDown revisits the interior: E3 now appears twice.
    expect(screen.getAllByText('E3')).toHaveLength(2);
  });

  it('BPM +/- adjusts BPM without changing Rate', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to Arpeggio Sandbox' }));

    expect(screen.getByRole('button', { name: 'Rate' })).toHaveTextContent('1/16');
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));

    expect(screen.getByText('121')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rate' })).toHaveTextContent('1/16');
  });

  it('BPM x2 doubles BPM and coarsens Rate', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to Arpeggio Sandbox' }));

    fireEvent.click(screen.getByRole('button', { name: 'Double BPM' }));

    expect(screen.getByText('240')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rate' })).toHaveTextContent('1/8');
  });
});
