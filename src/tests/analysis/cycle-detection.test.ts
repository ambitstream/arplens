import { describe, expect, it } from 'vitest';
import { detectCycle } from '../../analysis/engine/cycle-detection';
import type { QuantizedSequence, StepGrid } from '../../analysis/engine/types';

const GRID: StepGrid = { stepDurationSeconds: 0.125, phaseSeconds: 0, residualRatio: 0 };

function sequenceOf(midis: readonly number[]): QuantizedSequence {
  return {
    grid: GRID,
    holeCount: 0,
    notes: midis.map((midi, stepIndex) => ({ midi, stepIndex, residualSeconds: 0 })),
  };
}

describe('detectCycle', () => {
  it('finds the shortest exact period', () => {
    const cycle = detectCycle(sequenceOf([60, 64, 67, 60, 64, 67]));

    expect(cycle.midis).toEqual([60, 64, 67]);
    expect(cycle.periodSteps).toBe(3);
    expect(cycle.repetitions).toBe(2);
  });

  it('allows a truncated final repetition', () => {
    const cycle = detectCycle(sequenceOf([60, 64, 67, 60, 64]));

    expect(cycle.midis).toEqual([60, 64, 67]);
    expect(cycle.repetitions).toBeCloseTo(5 / 3, 9);
  });

  it('treats a non-repeating selection as one whole cycle (Case A)', () => {
    const cycle = detectCycle(sequenceOf([60, 62, 65, 69]));

    expect(cycle.midis).toEqual([60, 62, 65, 69]);
    expect(cycle.repetitions).toBe(1);
  });

  it('collapses a constant pitch to period 1', () => {
    const cycle = detectCycle(sequenceOf([57, 57, 57]));

    expect(cycle.midis).toEqual([57]);
    expect(cycle.repetitions).toBe(3);
  });
});
