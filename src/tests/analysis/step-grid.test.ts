import { describe, expect, it } from 'vitest';
import { estimateStepGrid } from '../../analysis/engine/step-grid';
import type { NoteEvent } from '../../analysis/engine/types';
import { DEFAULT_ANALYSIS_CONFIG } from '../../config/analysis';

function eventsAt(onsets: readonly number[]): NoteEvent[] {
  return onsets.map((onsetSeconds) => ({ midi: 60, onsetSeconds }));
}

describe('estimateStepGrid', () => {
  it('recovers a perfect grid with phase offset', () => {
    const onsets = Array.from({ length: 12 }, (_, k) => 0.03 + k * 0.125);
    const grid = estimateStepGrid(eventsAt(onsets), DEFAULT_ANALYSIS_CONFIG);

    expect(grid.stepDurationSeconds).toBeCloseTo(0.125, 9);
    expect(grid.phaseSeconds).toBeCloseTo(0.03, 9);
    expect(grid.residualRatio).toBeCloseTo(0, 9);
  });

  it('keeps the true step when one note is missing (a doubled IOI)', () => {
    const steps = [0, 1, 2, 4, 5, 6];
    const grid = estimateStepGrid(eventsAt(steps.map((k) => k * 0.125)), DEFAULT_ANALYSIS_CONFIG);

    expect(grid.stepDurationSeconds).toBeCloseTo(0.125, 9);
    expect(grid.residualRatio).toBeCloseTo(0, 9);
  });

  it('reports growing residuals for jittered onsets without losing the grid', () => {
    // Deterministic +/- alternating jitter of 4% of the step — the
    // adversarial case for IOI clustering, since IOIs split into two
    // clean clusters at +/-8% and neither center is the true step.
    // The contract is only that the grid stays usable: residualRatio
    // must remain at or below the maxResidualRatio gate.
    const onsets = Array.from({ length: 16 }, (_, k) => k * 0.125 + (k % 2 === 0 ? 1 : -1) * 0.005);
    const grid = estimateStepGrid(eventsAt(onsets), DEFAULT_ANALYSIS_CONFIG);

    expect(grid.stepDurationSeconds).toBeGreaterThan(0.11);
    expect(grid.stepDurationSeconds).toBeLessThan(0.14);
    expect(grid.residualRatio).toBeGreaterThan(0);
    expect(grid.residualRatio).toBeLessThanOrEqual(DEFAULT_ANALYSIS_CONFIG.maxResidualRatio);
  });

  it('is deterministic', () => {
    const onsets = Array.from({ length: 10 }, (_, k) => k * 0.2 + (k % 3) * 0.004);
    const first = estimateStepGrid(eventsAt(onsets), DEFAULT_ANALYSIS_CONFIG);
    const second = estimateStepGrid(eventsAt(onsets), DEFAULT_ANALYSIS_CONFIG);

    expect(second).toEqual(first);
  });

  it('throws when no positive inter-onset interval exists', () => {
    expect(() => estimateStepGrid(eventsAt([1, 1]), DEFAULT_ANALYSIS_CONFIG)).toThrow();
  });
});
