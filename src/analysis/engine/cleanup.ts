import type { AnalysisConfig } from '../../config/analysis';

/**
 * One raw transcription observation (stage 2 output). Pitch may be
 * fractional: the model reports bends around the nominal semitone,
 * which stage 4 uses to estimate the global tuning offset.
 */
export interface RawPitchEvent {
  readonly midiFloat: number;
  readonly onsetSeconds: number;
  readonly durationSeconds: number;
  /** Model amplitude/confidence in [0, 1]. */
  readonly confidence: number;
}

export interface CleanupResult {
  readonly events: readonly RawPitchEvent[];
  /** Mean confidence of the kept events, in [0, 1]. */
  readonly transcriptionQuality: number;
}

/**
 * Stage 3 — Cleanup.
 *
 * Converts noisy transcription into a clean monophonic event
 * stream: confidence filtering, minimum-duration filtering, merging
 * split notes, collapsing overlapping duplicates to the stronger
 * event, and removing sustained background notes (pad filter).
 * Never classifies styles.
 */
export function cleanup(events: readonly RawPitchEvent[], config: AnalysisConfig): CleanupResult {
  const ordered = [...events].sort(
    (a, b) => a.onsetSeconds - b.onsetSeconds || a.midiFloat - b.midiFloat,
  );

  const confident = ordered.filter(
    (event) =>
      event.confidence >= config.minEventConfidence &&
      event.durationSeconds >= config.minEventDurationSeconds,
  );

  const merged = mergeSplitNotes(confident, config.mergeGapSeconds);
  // Pad removal must precede the monophonic collapse: a sustained
  // background note overlaps every arp step, and letting it into the
  // overlap resolution would let it swallow the sequence it sits under.
  const withoutSustained = removeSustained(merged, config.sustainedDurationFactor);
  const kept = collapseOverlaps(withoutSustained, config.overlapTolerance);

  const transcriptionQuality =
    kept.length === 0
      ? 0
      : Math.min(1, kept.reduce((sum, event) => sum + event.confidence, 0) / kept.length);

  return { events: kept, transcriptionQuality };
}

/** Re-joins one note the model split into fragments across a tiny gap. */
function mergeSplitNotes(events: readonly RawPitchEvent[], maxGap: number): RawPitchEvent[] {
  const result: RawPitchEvent[] = [];

  for (const event of events) {
    const previous = result[result.length - 1];
    const samePitch =
      previous !== undefined && Math.round(previous.midiFloat) === Math.round(event.midiFloat);
    const gap =
      previous !== undefined
        ? event.onsetSeconds - (previous.onsetSeconds + previous.durationSeconds)
        : Number.POSITIVE_INFINITY;

    if (previous !== undefined && samePitch && gap >= 0 && gap <= maxGap) {
      result[result.length - 1] = {
        ...previous,
        durationSeconds: event.onsetSeconds + event.durationSeconds - previous.onsetSeconds,
        confidence: Math.max(previous.confidence, event.confidence),
      };
    } else {
      result.push(event);
    }
  }

  return result;
}

/**
 * Enforces monophony: when two events share more than the tolerated
 * fraction of the shorter one's duration, the more confident event
 * wins (ties keep the earlier, then lower-pitched one — the sort
 * order).
 */
function collapseOverlaps(events: readonly RawPitchEvent[], tolerance: number): RawPitchEvent[] {
  const result: RawPitchEvent[] = [];

  for (const event of events) {
    const previous = result[result.length - 1];
    if (previous === undefined) {
      result.push(event);
      continue;
    }

    const overlap = previous.onsetSeconds + previous.durationSeconds - event.onsetSeconds;
    const shorter = Math.min(previous.durationSeconds, event.durationSeconds);

    if (overlap > 0 && shorter > 0 && overlap / shorter > tolerance) {
      if (event.confidence > previous.confidence) {
        result[result.length - 1] = event;
      }
    } else {
      result.push(event);
    }
  }

  return result;
}

/**
 * Pad filter: with enough events to trust a median, notes lasting
 * far longer than the typical step are background material, not
 * arpeggio steps.
 */
function removeSustained(events: readonly RawPitchEvent[], factor: number): RawPitchEvent[] {
  if (events.length < 4) {
    return [...events];
  }

  const durations = events.map((event) => event.durationSeconds).sort((a, b) => a - b);
  const median = durations[Math.floor(durations.length / 2)];

  return events.filter((event) => event.durationSeconds <= median * factor);
}
