import { describe, expect, it } from 'vitest';
import { editDistance, editDistanceToPrefix } from '../../analysis/matcher/edit-distance';

describe('editDistance', () => {
  it('is 0 for identical sequences', () => {
    expect(editDistance([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it('is the length against an empty sequence', () => {
    expect(editDistance([], [4, 5])).toBe(2);
    expect(editDistance([4, 5, 6], [])).toBe(3);
  });

  it('counts substitutions, insertions and deletions', () => {
    expect(editDistance([1, 2, 3], [1, 9, 3])).toBe(1);
    expect(editDistance([1, 2, 3], [1, 2, 3, 4])).toBe(1);
    expect(editDistance([1, 2, 3, 4], [2, 3, 4])).toBe(1);
    expect(editDistance([1, 2, 3], [4, 5, 6])).toBe(3);
  });

  it('is symmetric', () => {
    expect(editDistance([1, 2, 3, 4], [2, 4, 3])).toBe(editDistance([2, 4, 3], [1, 2, 3, 4]));
  });
});

describe('editDistanceToPrefix', () => {
  it('unused pattern tail is free', () => {
    expect(editDistanceToPrefix([1, 2, 3, 1, 2, 3], [1, 2, 3, 1])).toBe(0);
  });

  it('edits inside the target span still count', () => {
    expect(editDistanceToPrefix([1, 2, 3, 1, 2, 3], [1, 9, 3, 1])).toBe(1);
  });

  it('a dropout in the target costs one deletion, not a cascade', () => {
    // Pattern tiled past the target: [1,2,3] x4; target lost one "1"
    // mid-way. Rigid same-length comparison would misalign the tail.
    expect(
      editDistanceToPrefix([1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3], [1, 2, 3, 2, 3, 1, 2, 3]),
    ).toBe(1);
  });

  it('never beats the full distance when the target is longer', () => {
    expect(editDistanceToPrefix([1, 2], [1, 2, 9])).toBe(1);
  });

  it('handles the empty pattern', () => {
    expect(editDistanceToPrefix([], [1, 2])).toBe(2);
  });
});
