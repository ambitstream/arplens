import { describe, expect, it } from 'vitest';
import { linearResample } from '../../analysis/engine/resample';

describe('linearResample', () => {
  it('returns the input unchanged when rates match', () => {
    const input = new Float32Array([0.1, 0.2, 0.3]);

    expect(linearResample(input, 44100, 44100)).toBe(input);
  });

  it('halves the length when downsampling 2:1', () => {
    const input = new Float32Array(1000).map((_, i) => i / 1000);
    const output = linearResample(input, 44100, 22050);

    expect(output.length).toBe(500);
  });

  it('interpolates a linear ramp exactly', () => {
    // A ramp stays a ramp under linear interpolation.
    const input = new Float32Array(101).map((_, i) => i / 100);
    const output = linearResample(input, 40000, 20000);

    for (let i = 0; i < output.length; i += 1) {
      expect(output[i]).toBeCloseTo((i * 2) / 100, 6);
    }
  });

  it('upsamples with midpoint interpolation', () => {
    const input = new Float32Array([0, 1]);
    const output = linearResample(input, 10, 20);

    expect(output.length).toBe(4);
    expect(output[0]).toBeCloseTo(0, 6);
    expect(output[1]).toBeCloseTo(0.5, 6);
    expect(output[2]).toBeCloseTo(1, 6);
  });

  it('is deterministic', () => {
    const input = new Float32Array(500).map((_, i) => ((i * 31) % 17) / 17 - 0.5);

    expect(linearResample(input, 48000, 22050)).toEqual(linearResample(input, 48000, 22050));
  });
});
