import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AnalysisDebug } from '../components/analysis-debug';

function resultText(): string {
  return screen.getByLabelText('Analysis result').textContent ?? '';
}

describe('AnalysisDebug', () => {
  it('round-trips the default settings through the real pipeline', () => {
    render(<AnalysisDebug />);

    const text = resultText();
    expect(text).toContain('"status": "complete"');
    expect(text).toContain('"style": "up"');
    expect(text).toContain('"bpm": 120');
    expect(text).toContain('"rate": "1/16"');
    expect(text).toContain('"confidence": "high"');
  });

  it('re-analyzes when settings change', () => {
    render(<AnalysisDebug />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Style' }), {
      target: { value: 'down-up' },
    });

    expect(resultText()).toContain('"style": "down-up"');
  });

  it('prompts for valid input instead of analyzing garbage', () => {
    render(<AnalysisDebug />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Input notes' }), {
      target: { value: 'Qx' },
    });

    expect(resultText()).toContain('Enter valid notes');
  });
});
