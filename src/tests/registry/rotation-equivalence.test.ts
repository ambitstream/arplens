import { describe, expect, it } from 'vitest';
import {
  generateDown,
  generateDownUp,
  generateUp,
  generateUpDown,
} from '../../analysis/registry/generators';
import { areCyclesEqual, rotationOffset } from '../../analysis/registry/rotation';

// Regression fixtures for D-206 (Rotation-Equivalent Style Resolution).
//
// The v2.0 architecture review proved that UpDown and DownUp generate
// cycles that are exact rotations of each other for EVERY input, so
// rotation-invariant matching alone can never distinguish them. These
// fixtures pin that mathematical fact down permanently: the M3 matcher
// must resolve the tie with the phase-preference rule (D-202 rule 3),
// and must count rotation-equivalent aliases as one hypothesis for the
// ambiguity confidence component.

const NOTE_COUNTS = [2, 3, 4, 5, 6] as const;
const OCTAVES = [1, 2, 3, 4] as const;

const ALL_COMBOS = NOTE_COUNTS.flatMap((noteCount) =>
  OCTAVES.map((octaves) => [noteCount, octaves] as const),
);

describe('rotation equivalence (D-206 regression fixtures)', () => {
  describe('DownUp is always an exact rotation of UpDown', () => {
    it.each(ALL_COMBOS)('noteCount=%i, octaves=%i', (noteCount, octaves) => {
      const context = { noteCount, octaves };
      const total = noteCount * octaves;

      const upDown = generateUpDown(context);
      const downUp = generateDownUp(context);

      // Both styles walk the same cyclic up-down path starting at
      // opposite ends, so DownUp always equals UpDown rotated by the
      // index of the highest note (total - 1).
      expect(rotationOffset(upDown, downUp)).toBe(total - 1);
    });
  });

  describe('Up and Down are not rotation-equivalent above the two-index degenerate case', () => {
    it.each(ALL_COMBOS.filter(([noteCount, octaves]) => noteCount * octaves > 2))(
      'noteCount=%i, octaves=%i',
      (noteCount, octaves) => {
        const context = { noteCount, octaves };

        expect(rotationOffset(generateUp(context), generateDown(context))).toBeNull();
      },
    );
  });

  describe('degenerate case: two total indices', () => {
    // With only two indices, every traversal is either [0,1] or [1,0]
    // and all four styles collapse into a single rotation class. The
    // matcher's tie-break (fewest notes, fewest octaves, phase, registry
    // order) is what produces a deterministic answer here.
    const context = { noteCount: 2, octaves: 1 };

    it('UpDown collapses into Up', () => {
      expect(areCyclesEqual(generateUpDown(context), generateUp(context))).toBe(true);
    });

    it('DownUp collapses into Down', () => {
      expect(areCyclesEqual(generateDownUp(context), generateDown(context))).toBe(true);
    });

    it('Up and Down become rotations of each other', () => {
      expect(rotationOffset(generateUp(context), generateDown(context))).toBe(1);
    });
  });

  describe('phase-0 identity', () => {
    // Generator output order defines rotation 0 (the pattern start).
    // Phase preference relies on this: an observed loop that begins on
    // the style's first note matches at offset 0.
    it.each(ALL_COMBOS)('noteCount=%i, octaves=%i', (noteCount, octaves) => {
      const context = { noteCount, octaves };

      for (const generate of [generateUp, generateDown, generateUpDown, generateDownUp]) {
        const cycle = generate(context);
        expect(rotationOffset(cycle, cycle)).toBe(0);
      }
    });
  });
});
