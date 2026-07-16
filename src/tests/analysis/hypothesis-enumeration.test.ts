import { describe, expect, it } from 'vitest';
import { enumerateHypotheses } from '../../analysis/engine/hypothesis-enumeration';
import type { DetectedCycle } from '../../analysis/engine/types';

function cycleOf(midis: readonly number[]): DetectedCycle {
  return { midis, periodSteps: midis.length, repetitions: 1 };
}

describe('enumerateHypotheses (D-200: joint enumeration)', () => {
  it('finds both the octave-replicated and flat factorizations', () => {
    // C2 E2 G2 replicated one octave up.
    const hypotheses = enumerateHypotheses(cycleOf([36, 40, 43, 48, 52, 55]));

    const shapes = new Set(hypotheses.map((h) => `${h.baseMidis.length}x${h.octaves}`));
    expect(shapes).toEqual(new Set(['3x2', '6x1']));
    // 2 valid factorizations x 4 registry styles.
    expect(hypotheses).toHaveLength(8);
  });

  it('emits styles in registry order within a factorization', () => {
    const hypotheses = enumerateHypotheses(cycleOf([36, 40, 43]));

    expect(hypotheses.map((h) => h.styleId)).toEqual(['up', 'down', 'up-down', 'down-up']);
    expect(hypotheses[0].baseMidis).toEqual([36, 40, 43]);
    expect(hypotheses[0].octaves).toBe(1);
  });

  it('rejects factorizations whose upper octaves are not exact replicas', () => {
    // 4 distinct notes but 40 + 12 = 52 != 47: no 2x2 shape.
    const hypotheses = enumerateHypotheses(cycleOf([36, 40, 47, 52]));

    const shapes = new Set(hypotheses.map((h) => `${h.baseMidis.length}x${h.octaves}`));
    expect(shapes).toEqual(new Set(['4x1']));
  });

  it('decomposes held notes wider than an octave (interleaved replicas)', () => {
    // C2 and A#2 over 2 octaves: sorted pitches interleave as
    // C2, A#2, C3, A#3 — replicas are not a contiguous block.
    const hypotheses = enumerateHypotheses(cycleOf([36, 46, 48, 58]));

    const shapes = new Set(hypotheses.map((h) => `${h.baseMidis.length}x${h.octaves}`));
    expect(shapes).toEqual(new Set(['2x2', '4x1']));

    const twoByTwo = hypotheses.find((h) => h.octaves === 2);
    expect(twoByTwo?.baseMidis).toEqual([36, 46]);
  });

  it('handles a single-pitch cycle', () => {
    const hypotheses = enumerateHypotheses(cycleOf([57]));

    expect(hypotheses).toHaveLength(4);
    expect(hypotheses[0].baseMidis).toEqual([57]);
    expect(hypotheses[0].octaves).toBe(1);
  });

  it('returns nothing for an empty cycle', () => {
    expect(enumerateHypotheses(cycleOf([]))).toEqual([]);
  });
});
