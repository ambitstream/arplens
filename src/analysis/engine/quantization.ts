import type { NoteEvent, QuantizedSequence, StepGrid } from './types';

/**
 * Stage 6 — Quantization.
 *
 * Assigns every event to its nearest grid step and records timing
 * residuals. When two events land on the same step (a grid or
 * transcription artifact), the one with the smaller |residual| wins;
 * ties keep the earlier event.
 */
export function quantize(events: readonly NoteEvent[], grid: StepGrid): QuantizedSequence {
  const step = grid.stepDurationSeconds;

  const byStep = new Map<number, { midi: number; residualSeconds: number }>();

  for (const event of events) {
    const exact = (event.onsetSeconds - grid.phaseSeconds) / step;
    const stepIndex = Math.round(exact);
    const residualSeconds = (exact - stepIndex) * step;

    const existing = byStep.get(stepIndex);
    if (existing === undefined || Math.abs(residualSeconds) < Math.abs(existing.residualSeconds)) {
      byStep.set(stepIndex, { midi: event.midi, residualSeconds });
    }
  }

  const indices = [...byStep.keys()].sort((a, b) => a - b);
  const first = indices[0] ?? 0;
  const last = indices[indices.length - 1] ?? 0;

  const notes = indices.map((index) => {
    const entry = byStep.get(index);
    if (entry === undefined) {
      throw new Error('Quantization bookkeeping failed.');
    }
    return {
      midi: entry.midi,
      stepIndex: index - first,
      residualSeconds: entry.residualSeconds,
    };
  });

  // Rests inside the occupied range are not standard-arpeggio
  // material in the MVP; they are counted so downstream stages can
  // reflect them in quality scoring.
  const holeCount = last - first + 1 - indices.length;

  return { notes, grid, holeCount };
}
