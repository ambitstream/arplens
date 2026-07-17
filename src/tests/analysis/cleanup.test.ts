import { describe, expect, it } from 'vitest';
import { cleanup, type RawPitchEvent } from '../../analysis/engine/cleanup';
import { DEFAULT_ANALYSIS_CONFIG } from '../../config/analysis';

function raw(
  midiFloat: number,
  onsetSeconds: number,
  durationSeconds = 0.1,
  confidence = 0.8,
): RawPitchEvent {
  return { midiFloat, onsetSeconds, durationSeconds, confidence };
}

describe('cleanup (stage 3)', () => {
  it('drops low-confidence and too-short events', () => {
    const result = cleanup(
      [
        raw(60, 0),
        raw(62, 0.2, 0.1, 0.05), // below confidence floor
        raw(64, 0.4, 0.01), // below duration floor
        raw(65, 0.6),
      ],
      DEFAULT_ANALYSIS_CONFIG,
    );

    expect(result.events.map((e) => e.midiFloat)).toEqual([60, 65]);
  });

  it('merges a note the model split across a tiny gap', () => {
    const result = cleanup(
      [raw(60, 0, 0.1), raw(60, 0.12, 0.1), raw(64, 0.4, 0.1)],
      DEFAULT_ANALYSIS_CONFIG,
    );

    expect(result.events).toHaveLength(2);
    expect(result.events[0].durationSeconds).toBeCloseTo(0.22, 9);
  });

  it('collapses heavily overlapping events to the stronger one', () => {
    const result = cleanup(
      [raw(60, 0, 0.2, 0.4), raw(64, 0.02, 0.2, 0.9), raw(67, 0.4, 0.1)],
      DEFAULT_ANALYSIS_CONFIG,
    );

    expect(result.events.map((e) => e.midiFloat)).toEqual([64, 67]);
  });

  it('keeps lightly overlapping events (release tails)', () => {
    const result = cleanup(
      [raw(60, 0, 0.13), raw(64, 0.125, 0.13), raw(67, 0.25, 0.13)],
      DEFAULT_ANALYSIS_CONFIG,
    );

    expect(result.events).toHaveLength(3);
  });

  it('removes sustained background notes (pad filter)', () => {
    const result = cleanup(
      [
        raw(40, 0, 2.0), // sustained pad under the arp
        raw(60, 0, 0.1),
        raw(64, 0.125, 0.1),
        raw(67, 0.25, 0.1),
        raw(72, 0.375, 0.1),
      ],
      DEFAULT_ANALYSIS_CONFIG,
    );

    expect(result.events.map((e) => e.midiFloat)).toEqual([60, 64, 67, 72]);
  });

  it('reports mean confidence of kept events as transcription quality', () => {
    const result = cleanup([raw(60, 0, 0.1, 0.6), raw(64, 0.2, 0.1, 1.0)], DEFAULT_ANALYSIS_CONFIG);

    expect(result.transcriptionQuality).toBeCloseTo(0.8, 9);
  });

  it('reports zero quality when nothing survives', () => {
    const result = cleanup([raw(60, 0, 0.001, 0.01)], DEFAULT_ANALYSIS_CONFIG);

    expect(result.events).toHaveLength(0);
    expect(result.transcriptionQuality).toBe(0);
  });
});
