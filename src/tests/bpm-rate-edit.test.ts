import { describe, expect, it } from 'vitest';
import { scaledBpmRate } from '../utils/bpm-rate-edit';

describe('scaledBpmRate (D-406)', () => {
  it('doubling BPM moves the rate one step coarser', () => {
    expect(scaledBpmRate(120, '1/16', 'double')).toEqual({ bpm: 240, rate: '1/8' });
  });

  it('halving BPM moves the rate one step finer', () => {
    expect(scaledBpmRate(120, '1/16', 'half')).toEqual({ bpm: 60, rate: '1/32' });
  });

  it('is undefined at the coarse boundary (cannot double past 1/4)', () => {
    expect(scaledBpmRate(120, '1/4', 'double')).toBeUndefined();
  });

  it('is undefined at the fine boundary (cannot halve past 1/32)', () => {
    expect(scaledBpmRate(120, '1/32', 'half')).toBeUndefined();
  });

  it('stays within the triplet family', () => {
    expect(scaledBpmRate(120, '1/16T', 'double')).toEqual({ bpm: 240, rate: '1/8T' });
    expect(scaledBpmRate(120, '1/4T', 'double')).toBeUndefined();
  });
});
