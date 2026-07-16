import { describe, expect, it } from 'vitest';
import { midiToNoteName, midiToPitchClass, pitchClassToSemitone } from '../../utils/note-names';

describe('note names (D-004: sharp notation only)', () => {
  it('maps MIDI to pitch classes', () => {
    expect(midiToPitchClass(36)).toBe('C');
    expect(midiToPitchClass(39)).toBe('D#');
    expect(midiToPitchClass(61)).toBe('C#');
  });

  it('maps MIDI to names with octave numbers (C4 = 60)', () => {
    expect(midiToNoteName(36)).toBe('C2');
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToNoteName(61)).toBe('C#4');
  });

  it('parses sharp pitch classes only', () => {
    expect(pitchClassToSemitone('D#')).toBe(3);
    expect(pitchClassToSemitone('Eb')).toBeUndefined();
    expect(pitchClassToSemitone('H')).toBeUndefined();
  });
});
