import type { DetectedCycle, QuantizedSequence } from './types';

/**
 * Stage 7 — Cycle Detection.
 *
 * Finds the shortest exactly-repeating period in the quantized note
 * sequence. Approximate cycle detection is intentionally outside the
 * MVP, so only exact periodicity counts.
 *
 * Case A (selection is exactly one cycle) falls out naturally: when
 * no shorter period repeats, the whole sequence is the cycle with
 * repetitions = 1. A truncated final repetition is allowed — the
 * periodicity check covers every index, so `A B C A B` still yields
 * period 3.
 */
export function detectCycle(sequence: QuantizedSequence): DetectedCycle {
  const midis = sequence.notes.map((note) => note.midi);
  const n = midis.length;

  for (let period = 1; period < n; period += 1) {
    let periodic = true;
    for (let i = period; i < n; i += 1) {
      if (midis[i] !== midis[i - period]) {
        periodic = false;
        break;
      }
    }
    if (periodic) {
      return {
        midis: midis.slice(0, period),
        periodSteps: period,
        repetitions: n / period,
      };
    }
  }

  return { midis, periodSteps: n, repetitions: 1 };
}
