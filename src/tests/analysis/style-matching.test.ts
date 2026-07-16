import { describe, expect, it } from 'vitest';
import { enumerateHypotheses } from '../../analysis/engine/hypothesis-enumeration';
import type { DetectedCycle } from '../../analysis/engine/types';
import { matchHypotheses, selectMatch } from '../../analysis/matcher/style-matching';
import { DEFAULT_ANALYSIS_CONFIG } from '../../config/analysis';

function cycleOf(midis: readonly number[]): DetectedCycle {
  return { midis, periodSteps: midis.length, repetitions: 2 };
}

function select(midis: readonly number[]) {
  const cycle = cycleOf(midis);
  return selectMatch(matchHypotheses(cycle, enumerateHypotheses(cycle)), DEFAULT_ANALYSIS_CONFIG);
}

// C2, E2, G2.
const C = 36;
const E = 40;
const G = 43;

describe('style matching (D-201/D-202)', () => {
  it('matches an exact Up cycle with full confidence in the outcome', () => {
    const selection = select([C, E, G, C + 12, E + 12, G + 12]);

    expect(selection.best?.hypothesis.styleId).toBe('up');
    expect(selection.best?.distance).toBe(0);
    expect(selection.withinBudget).toBe(true);
    expect(selection.competitiveGroupCount).toBe(1);
    expect(selection.ambiguity).toBe(1);
  });

  it('prefers the parsimonious factorization for structural twins (fewest notes)', () => {
    // Up over {C,E,G} x2 octaves generates the same cycle as Up over
    // six distinct notes x1 octave; the twins share one output group
    // and the tie-break picks 3 notes x 2 octaves.
    const selection = select([C, E, G, C + 12, E + 12, G + 12]);

    expect(selection.best?.hypothesis.baseMidis).toEqual([C, E, G]);
    expect(selection.best?.hypothesis.octaves).toBe(2);
  });

  it('detects Down', () => {
    const selection = select([G + 12, E + 12, C + 12, G, E, C]);

    expect(selection.best?.hypothesis.styleId).toBe('down');
    expect(selection.best?.distance).toBe(0);
  });
});

describe('rotation-equivalent style resolution (D-206)', () => {
  it('phase-0 UpDown loop resolves to UpDown', () => {
    const selection = select([C, E, G, E]);

    expect(selection.best?.hypothesis.styleId).toBe('up-down');
    expect(selection.best?.bestRotation).toBe(0);
    expect(selection.competitiveGroupCount).toBe(1);
  });

  it('phase-0 DownUp loop resolves to DownUp', () => {
    const selection = select([G, E, C, E]);

    expect(selection.best?.hypothesis.styleId).toBe('down-up');
    expect(selection.best?.bestRotation).toBe(0);
  });

  it('a mid-cycle loop resolves deterministically via registry order', () => {
    // Rotation 1 of UpDown's [C,E,G,E]: neither UpDown nor DownUp
    // matches at rotation 0, so phase preference cannot separate
    // them and registry order picks UpDown.
    const selection = select([E, G, E, C]);

    expect(selection.best?.distance).toBe(0);
    expect(selection.best?.hypothesis.styleId).toBe('up-down');
  });

  it('treats rotation-equivalent aliases as ONE hypothesis for ambiguity', () => {
    // UpDown and DownUp both match with distance 0; if they counted
    // as two hypotheses, ambiguity would collapse to 0 and every
    // UpDown detection would be permanently Low confidence.
    const selection = select([C, E, G, E]);

    expect(selection.ambiguity).toBe(1);
  });

  it('degenerate two-index cycles collapse to the earliest registry style', () => {
    // With two total indices all four styles are rotation-equivalent
    // (M2 fixture); phase-0 ascending resolves to Up.
    const selection = select([C, E]);

    expect(selection.best?.hypothesis.styleId).toBe('up');
  });
});

describe('near matches and budget', () => {
  it('tolerates a local ordering flip within the edit budget', () => {
    // Up over 5 close notes x 2 octaves (cycle of 10) with two
    // adjacent notes swapped: distance 2, ratio 0.2 — right at the
    // budget. Note that merely ALTERING a pitch in an ascending run
    // keeps it ascending, which Up over the distinct notes matches
    // exactly; only an order flip produces a genuine near match.
    const base = [36, 38, 40, 43, 46];
    const perfect = [...base, ...base.map((m) => m + 12)];
    const flipped = [...perfect];
    [flipped[2], flipped[3]] = [flipped[3], flipped[2]];

    const selection = select(flipped);

    expect(selection.best?.hypothesis.styleId).toBe('up');
    expect(selection.best?.distance).toBe(2);
    expect(selection.withinBudget).toBe(true);
  });

  it('rejects a non-arpeggio ordering as out of budget', () => {
    const selection = select([C, G, E, C + 12, G - 2, E + 7, C + 1, G + 5]);

    expect(selection.withinBudget).toBe(false);
  });
});
