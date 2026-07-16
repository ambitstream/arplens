import { describe, expect, it } from 'vitest';
import {
  allRotations,
  areCyclesEqual,
  areStepsEqual,
  rotateCycle,
  rotationOffset,
} from '../../analysis/registry/rotation';
import type { Cycle } from '../../analysis/registry/types';

const CYCLE: Cycle = [[0], [1], [2], [1]];

describe('areStepsEqual', () => {
  it('compares index sets element-wise', () => {
    expect(areStepsEqual([0, 2], [0, 2])).toBe(true);
    expect(areStepsEqual([0, 2], [0, 1])).toBe(false);
    expect(areStepsEqual([0], [0, 1])).toBe(false);
  });
});

describe('areCyclesEqual', () => {
  it('requires equal length and equal steps in order', () => {
    expect(areCyclesEqual(CYCLE, [[0], [1], [2], [1]])).toBe(true);
    expect(areCyclesEqual(CYCLE, [[0], [1], [2]])).toBe(false);
    expect(areCyclesEqual(CYCLE, [[1], [0], [2], [1]])).toBe(false);
  });
});

describe('rotateCycle', () => {
  it('shifts left by the offset', () => {
    expect(rotateCycle(CYCLE, 1)).toEqual([[1], [2], [1], [0]]);
    expect(rotateCycle(CYCLE, 3)).toEqual([[1], [0], [1], [2]]);
  });

  it('normalizes offsets modulo the cycle length', () => {
    expect(rotateCycle(CYCLE, 0)).toEqual(CYCLE);
    expect(rotateCycle(CYCLE, 4)).toEqual(CYCLE);
    expect(rotateCycle(CYCLE, 5)).toEqual(rotateCycle(CYCLE, 1));
    expect(rotateCycle(CYCLE, -1)).toEqual(rotateCycle(CYCLE, 3));
  });

  it('handles the empty cycle', () => {
    expect(rotateCycle([], 3)).toEqual([]);
  });
});

describe('allRotations', () => {
  it('returns one rotation per step, starting at rotation 0', () => {
    const rotations = allRotations(CYCLE);

    expect(rotations).toHaveLength(CYCLE.length);
    expect(rotations[0]).toEqual(CYCLE);
    expect(rotations[2]).toEqual(rotateCycle(CYCLE, 2));
  });
});

describe('rotationOffset', () => {
  it('is 0 for identical cycles (phase-0 match)', () => {
    expect(rotationOffset(CYCLE, CYCLE)).toBe(0);
  });

  it('finds the smallest offset', () => {
    expect(rotationOffset(CYCLE, [[2], [1], [0], [1]])).toBe(2);
  });

  it('returns null for non-rotations of equal length', () => {
    expect(rotationOffset([[0], [1], [2], [3]], [[0], [2], [1], [3]])).toBeNull();
  });

  it('returns null for different lengths', () => {
    expect(rotationOffset(CYCLE, [[0], [1]])).toBeNull();
  });

  it('round-trips: rotating by the found offset reproduces the target', () => {
    const target: Cycle = [[1], [0], [1], [2]];
    const offset = rotationOffset(CYCLE, target);

    expect(offset).not.toBeNull();
    expect(rotateCycle(CYCLE, offset ?? 0)).toEqual(target);
  });
});
