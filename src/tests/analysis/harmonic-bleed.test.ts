import { describe, expect, it } from 'vitest';
import { cleanup, type RawPitchEvent } from '../../analysis/engine/cleanup';
import { normalizePitches } from '../../analysis/engine/pitch-normalization';
import { analyze } from '../../analysis/pipeline/analyze';
import { DEFAULT_ANALYSIS_CONFIG } from '../../config/analysis';

/**
 * Synthetic re-creation of a real-audio failure (a Bb-major UpDown
 * arp, A#/D/F): the transcription model fired each struck note plus
 * consonant harmonic partials at the same instant, and the old
 * duration-overlap cleanup then dropped the quiet D turnaround,
 * garbling the sequence into a "Style Not Detected" partial.
 *
 * This rebuilds that raw-event pattern deterministically so the fix
 * (onset-simultaneity collapse) stays guarded without committing the
 * copyrighted audio.
 */

const STEP = 1 / 3; // ~90 BPM at 1/8
const PATTERN = [58, 62, 65, 62] as const; // A#2 D3 F3 D3 (UpDown of A#/D/F)

/** The consonant partials the model tends to fire under each note. */
const PHANTOMS: Readonly<Record<number, readonly number[]>> = {
  58: [62, 65], // Bb -> its major third and fifth
  62: [65], // D -> F
  65: [62], // F -> D
};

function buildRawStream(cycles: number): RawPitchEvent[] {
  const events: RawPitchEvent[] = [];

  for (let step = 0; step < cycles * PATTERN.length; step += 1) {
    const onset = step * STEP;
    const fundamental = PATTERN[step % PATTERN.length];

    events.push({
      midiFloat: fundamental + 0.33, // consistent global detune
      onsetSeconds: onset,
      durationSeconds: STEP * 0.95, // laps into the next step
      confidence: 0.85,
    });

    // Quieter harmonic partials at (near) the same instant. Kept
    // short so a partial never reaches an adjacent same-pitch step
    // (the real recording's timing jitter avoids that naturally).
    for (const partial of PHANTOMS[fundamental] ?? []) {
      events.push({
        midiFloat: partial + 0.33,
        onsetSeconds: onset + 0.01,
        durationSeconds: STEP * 0.4,
        confidence: 0.45,
      });
    }
  }

  return events;
}

describe('harmonic-bleed regression (real-audio UpDown)', () => {
  it('recovers the UpDown reconstruction despite simultaneous harmonics', () => {
    const raw = buildRawStream(6);
    const { events, transcriptionQuality } = cleanup(raw, DEFAULT_ANALYSIS_CONFIG);
    const result = analyze(normalizePitches(events), {
      config: DEFAULT_ANALYSIS_CONFIG,
      transcriptionQuality,
    });

    expect(result.status).toBe('complete');
    expect(result.style).toBe('up-down');
    expect(result.inputNotes).toEqual(['A#', 'D', 'F']);
    expect(result.octaves).toBe(1);
    expect(result.rate).toBe('1/8');
    expect(Math.abs((result.bpm ?? 0) - 90)).toBeLessThan(3);
  });

  it('cleanup keeps the turnaround note on every cycle', () => {
    const { events } = cleanup(buildRawStream(4), DEFAULT_ANALYSIS_CONFIG);
    const dCount = events.filter((event) => Math.round(event.midiFloat) === 62).length;

    // D falls on two of every four steps; over four cycles that is
    // eight, and it must survive rather than being swallowed.
    expect(dCount).toBeGreaterThanOrEqual(7);
  });
});
