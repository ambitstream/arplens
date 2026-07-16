import { describe, expect, it } from 'vitest';
import { resolveBpmRate } from '../../analysis/engine/bpm-rate';
import { DEFAULT_ANALYSIS_CONFIG } from '../../config/analysis';

describe('resolveBpmRate (D-203/D-207)', () => {
  it('prefers the configured rate order among in-range candidates', () => {
    // step 0.125s: 1/16 -> 120 BPM and 1/8T -> 160 BPM are both in
    // [90, 180); the preference order picks 1/16.
    const resolution = resolveBpmRate(0.125, DEFAULT_ANALYSIS_CONFIG);

    expect(resolution.rate).toBe('1/16');
    expect(resolution.bpm).toBeCloseTo(120, 9);
  });

  it('resolves a slow step to the only in-range candidate', () => {
    // step 0.5s: only 1/4 -> 120 BPM lies inside the range.
    const resolution = resolveBpmRate(0.5, DEFAULT_ANALYSIS_CONFIG);

    expect(resolution.rate).toBe('1/4');
    expect(resolution.bpm).toBeCloseTo(120, 9);
  });

  it('falls back to the BPM closest to the anchor when nothing is in range', () => {
    // step 2s: every candidate is far below 90 BPM; 1/4 -> 30 BPM is
    // closest to the 120 anchor.
    const resolution = resolveBpmRate(2, DEFAULT_ANALYSIS_CONFIG);

    expect(resolution.rate).toBe('1/4');
    expect(resolution.bpm).toBeCloseTo(30, 9);
  });

  it('is invariant to how the same step duration was produced', () => {
    const a = resolveBpmRate(60 / 480, DEFAULT_ANALYSIS_CONFIG);
    const b = resolveBpmRate(0.125, DEFAULT_ANALYSIS_CONFIG);

    expect(a).toEqual(b);
  });
});
