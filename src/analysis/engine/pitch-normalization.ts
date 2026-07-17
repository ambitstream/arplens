import type { NoteEvent } from './types';
import type { RawPitchEvent } from './cleanup';

/**
 * Stage 4 — Pitch Normalization.
 *
 * Estimates the recording's global tuning offset as the median
 * fractional deviation from the nearest semitone, then snaps every
 * pitch to an integer MIDI note with that offset removed. Note
 * naming (sharp only, D-004) happens at the DTO boundary.
 */
export function estimateTuningOffset(events: readonly RawPitchEvent[]): number {
  if (events.length === 0) {
    return 0;
  }

  const deviations = events
    .map((event) => event.midiFloat - Math.round(event.midiFloat))
    .sort((a, b) => a - b);

  return deviations[Math.floor(deviations.length / 2)];
}

export function normalizePitches(events: readonly RawPitchEvent[]): NoteEvent[] {
  const offset = estimateTuningOffset(events);

  return events.map((event) => ({
    midi: Math.round(event.midiFloat - offset),
    onsetSeconds: event.onsetSeconds,
    durationSeconds: event.durationSeconds,
  }));
}
