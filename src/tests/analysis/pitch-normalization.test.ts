import { describe, expect, it } from 'vitest';
import type { RawPitchEvent } from '../../analysis/engine/cleanup';
import { estimateTuningOffset, normalizePitches } from '../../analysis/engine/pitch-normalization';

function at(midiFloat: number, onsetSeconds: number): RawPitchEvent {
  return { midiFloat, onsetSeconds, durationSeconds: 0.1, confidence: 0.8 };
}

describe('pitch normalization (stage 4)', () => {
  it('estimates a consistent global detune as the median deviation', () => {
    const events = [at(60.3, 0), at(64.3, 0.125), at(67.3, 0.25)];

    expect(estimateTuningOffset(events)).toBeCloseTo(0.3, 9);
  });

  it('snaps detuned pitches back to the intended semitones', () => {
    const events = [at(60.3, 0), at(64.28, 0.125), at(67.32, 0.25)];

    expect(normalizePitches(events).map((e) => e.midi)).toEqual([60, 64, 67]);
  });

  it('handles negative detune', () => {
    const events = [at(59.75, 0), at(63.73, 0.125), at(66.76, 0.25)];

    expect(normalizePitches(events).map((e) => e.midi)).toEqual([60, 64, 67]);
  });

  it('is the identity for in-tune material', () => {
    const events = [at(60, 0), at(64, 0.125)];

    expect(estimateTuningOffset(events)).toBe(0);
    expect(normalizePitches(events).map((e) => e.midi)).toEqual([60, 64]);
  });

  it('a single outlier does not drag the median', () => {
    const events = [at(60.02, 0), at(64.01, 0.125), at(66.6, 0.25), at(72.02, 0.375)];

    expect(estimateTuningOffset(events)).toBeCloseTo(0.02, 9);
  });

  it('preserves onsets and durations', () => {
    const normalized = normalizePitches([at(60.1, 0.5)]);

    expect(normalized[0].onsetSeconds).toBe(0.5);
    expect(normalized[0].durationSeconds).toBe(0.1);
  });
});
