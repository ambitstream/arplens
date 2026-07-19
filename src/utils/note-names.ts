/**
 * MIDI <-> note-name conversion. Sharp notation only (D-004):
 * flats are never produced.
 *
 * Octave numbering uses middle C = C3 (MIDI 60 = "C3"), matching the
 * DAWs our audience uses — Ableton, Cubase, Bitwig, FL — rather than
 * scientific/Logic C4. Confirmed against a real-audio test where the
 * user's "A#2" was our detected pitch; see the v2.4 changelog.
 */

export const PITCH_CLASSES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export type PitchClass = (typeof PITCH_CLASSES)[number];

export function midiToPitchClass(midi: number): PitchClass {
  return PITCH_CLASSES[((midi % 12) + 12) % 12];
}

/** e.g. 60 -> "C3", 61 -> "C#3", 48 -> "C2". */
export function midiToNoteName(midi: number): string {
  return `${midiToPitchClass(midi)}${Math.floor(midi / 12) - 2}`;
}

/** e.g. "D#" -> 3. Returns undefined for anything but a sharp-notation pitch class. */
export function pitchClassToSemitone(name: string): number | undefined {
  const index = PITCH_CLASSES.indexOf(name as PitchClass);
  return index === -1 ? undefined : index;
}

/** Inverse of midiToNoteName, e.g. "C#3" -> 61 (middle C = C3). */
export function noteNameToMidi(name: string): number | undefined {
  const match = /^([A-G]#?)(-?\d+)$/.exec(name);
  if (match === null) {
    return undefined;
  }
  const semitone = pitchClassToSemitone(match[1]);
  if (semitone === undefined) {
    return undefined;
  }
  return (Number(match[2]) + 2) * 12 + semitone;
}
