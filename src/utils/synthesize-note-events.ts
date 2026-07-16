import { BEATS_PER_STEP } from '../config/analysis';
import type { SupportedRate } from '../config/rates';
import type { NoteEvent } from '../analysis/engine/types';
import { getStyleById } from '../analysis/registry/style-registry';
import { indexToMidi } from './index-to-midi';

export interface SynthesisSettings {
  readonly styleId: string;
  /** Sorted MIDI values of the held input notes. */
  readonly baseMidis: readonly number[];
  readonly octaves: number;
  readonly bpm: number;
  readonly rate: SupportedRate;
  /** Number of full cycles to render. */
  readonly cycles: number;
  /** Max |onset offset| as a fraction of the step duration. */
  readonly jitterRatio?: number;
  /** Seed for the deterministic jitter generator. */
  readonly seed?: number;
}

/**
 * Renders known arpeggiator settings into a note-event stream —
 * ground truth for Tier 0 round-trip tests and the M3 debug page.
 * Jitter is produced by a seeded LCG, so identical settings always
 * yield identical events; the Analysis Engine itself contains no
 * randomness.
 */
export function synthesizeNoteEvents(settings: SynthesisSettings): NoteEvent[] {
  const style = getStyleById(settings.styleId);
  if (style === undefined) {
    throw new Error(`Unknown style id: ${settings.styleId}`);
  }

  const cycle = style.generate({
    noteCount: settings.baseMidis.length,
    octaves: settings.octaves,
  });

  const stepSeconds = (60 * BEATS_PER_STEP[settings.rate]) / settings.bpm;
  const jitterRatio = settings.jitterRatio ?? 0;
  let seed = (settings.seed ?? 1) >>> 0;

  const nextJitter = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const unit = seed / 0x100000000; // [0, 1)
    return (unit * 2 - 1) * jitterRatio * stepSeconds;
  };

  const events: NoteEvent[] = [];
  for (let repetition = 0; repetition < settings.cycles; repetition += 1) {
    for (let position = 0; position < cycle.length; position += 1) {
      const stepIndex = repetition * cycle.length + position;
      events.push({
        midi: indexToMidi(cycle[position][0], settings.baseMidis),
        onsetSeconds: stepIndex * stepSeconds + (jitterRatio > 0 ? nextJitter() : 0),
        durationSeconds: stepSeconds * 0.8,
      });
    }
  }

  return events;
}
