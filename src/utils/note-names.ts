/**
 * MIDI <-> note-name conversion. Sharp notation only (D-004):
 * flats are never produced. Octave numbering follows the C4 = 60
 * convention used by the design mockups (MIDI 36 = "C2").
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

/** e.g. 36 -> "C2", 61 -> "C#4". */
export function midiToNoteName(midi: number): string {
  return `${midiToPitchClass(midi)}${Math.floor(midi / 12) - 1}`;
}

/** e.g. "D#" -> 3. Returns undefined for anything but a sharp-notation pitch class. */
export function pitchClassToSemitone(name: string): number | undefined {
  const index = PITCH_CLASSES.indexOf(name as PitchClass);
  return index === -1 ? undefined : index;
}
