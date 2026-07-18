import { BEATS_PER_STEP } from '../config/analysis';
import type { SupportedRate } from '../config/rates';
import { getStyleById } from '../analysis/registry/style-registry';
import { indexToMidi } from '../utils/index-to-midi';
import { midiToNoteName, pitchClassToSemitone, type PitchClass } from '../utils/note-names';

/**
 * The editable arpeggiator settings the user manipulates in the
 * Results and Sandbox panels — a separate mutable model, never the
 * immutable Result DTO (docs/06_UI_SPEC.md Section 6). Fields are
 * nullable so a partial result can leave some undetected.
 */
export interface ArpSettings {
  readonly inputNotes: readonly PitchClass[];
  readonly octaves: number;
  readonly styleId: string | null;
  readonly bpm: number | null;
  readonly rate: SupportedRate | null;
}

/** MIDI octave placed at the lowest displayed octave that reads well. */
const BASE_MIDI = 48; // C2 with middle C = C3

/**
 * Places pitch classes into ascending MIDI notes: the first at or
 * above the base octave, each subsequent note the next occurrence of
 * its pitch class above the previous — the ascending held chord an
 * arpeggiator sorts its input into.
 */
export function pitchClassesToBaseMidis(
  notes: readonly PitchClass[],
  baseMidi = BASE_MIDI,
): number[] {
  const result: number[] = [];
  let previous = Number.NEGATIVE_INFINITY;

  for (const note of notes) {
    const semitone = pitchClassToSemitone(note);
    if (semitone === undefined) {
      continue;
    }
    let midi = baseMidi - (baseMidi % 12) + semitone;
    while (midi <= previous || midi < baseMidi) {
      midi += 12;
    }
    result.push(midi);
    previous = midi;
  }

  return result;
}

/** True when every field needed to generate a sequence is set. */
export function isComplete(settings: ArpSettings): settings is ArpSettings & {
  styleId: string;
  bpm: number;
  rate: SupportedRate;
} {
  return (
    settings.inputNotes.length > 0 &&
    settings.styleId !== null &&
    settings.bpm !== null &&
    settings.rate !== null &&
    getStyleById(settings.styleId) !== undefined
  );
}

/** Concrete MIDI sequence generated through the Style Registry. */
export function generateSequenceMidis(settings: ArpSettings): number[] {
  if (settings.styleId === null || settings.inputNotes.length === 0) {
    return [];
  }
  const style = getStyleById(settings.styleId);
  if (style === undefined) {
    return [];
  }

  const baseMidis = pitchClassesToBaseMidis(settings.inputNotes);
  return style
    .generate({ noteCount: baseMidis.length, octaves: Math.max(1, settings.octaves) })
    .map((step) => indexToMidi(step[0], baseMidis));
}

/** Sequence as displayed note names, e.g. ["C2", "D#2", "G2"]. */
export function generateSequenceNames(settings: ArpSettings): string[] {
  return generateSequenceMidis(settings).map(midiToNoteName);
}

/** Seconds per step from BPM and Rate; undefined when either is unset. */
export function stepDurationSeconds(settings: ArpSettings): number | undefined {
  if (settings.bpm === null || settings.rate === null || settings.bpm <= 0) {
    return undefined;
  }
  return (60 * BEATS_PER_STEP[settings.rate]) / settings.bpm;
}
