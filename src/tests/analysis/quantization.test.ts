import { describe, expect, it } from 'vitest';
import { quantize } from '../../analysis/engine/quantization';
import type { NoteEvent, StepGrid } from '../../analysis/engine/types';

const GRID: StepGrid = { stepDurationSeconds: 0.125, phaseSeconds: 0, residualRatio: 0 };

function event(midi: number, onsetSeconds: number): NoteEvent {
  return { midi, onsetSeconds };
}

describe('quantize', () => {
  it('assigns events to nearest steps and normalizes to step 0', () => {
    const result = quantize([event(60, 0.25), event(64, 0.376), event(67, 0.499)], GRID);

    expect(result.notes.map((n) => n.stepIndex)).toEqual([0, 1, 2]);
    expect(result.notes.map((n) => n.midi)).toEqual([60, 64, 67]);
    expect(result.notes[1].residualSeconds).toBeCloseTo(0.001, 9);
    expect(result.notes[2].residualSeconds).toBeCloseTo(-0.001, 9);
    expect(result.holeCount).toBe(0);
  });

  it('keeps the closer event when two collide on one step', () => {
    const result = quantize([event(60, 0.01), event(64, 0.0)], GRID);

    expect(result.notes).toHaveLength(1);
    expect(result.notes[0].midi).toBe(64);
  });

  it('counts rests inside the occupied range as holes', () => {
    const result = quantize([event(60, 0), event(64, 0.125), event(67, 0.375)], GRID);

    expect(result.notes.map((n) => n.stepIndex)).toEqual([0, 1, 3]);
    expect(result.holeCount).toBe(1);
  });
});
