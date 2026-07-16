import { describe, expect, it } from 'vitest';
import { editDistance } from '../../analysis/matcher/edit-distance';

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
