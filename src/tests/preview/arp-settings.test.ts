import { describe, expect, it } from 'vitest';
import {
  generateSequenceNames,
  isComplete,
  pitchClassesToBaseMidis,
  stepDurationSeconds,
  type ArpSettings,
} from '../../preview/arp-settings';

const COMPLETE: ArpSettings = {
  inputNotes: ['C', 'E', 'G'],
  octaves: 2,
  styleId: 'up',
  bpm: 120,
  rate: '1/16',
};

describe('pitchClassesToBaseMidis', () => {
  it('places notes ascending from the base octave', () => {
    expect(pitchClassesToBaseMidis(['C', 'E', 'G'])).toEqual([48, 52, 55]);
  });

  it('wraps later notes above earlier ones', () => {
    // G then C then E must ascend: G2, C3, E3.
    expect(pitchClassesToBaseMidis(['G', 'C', 'E'])).toEqual([55, 60, 64]);
  });
});

describe('isComplete', () => {
  it('is true only when every generating field is set', () => {
    expect(isComplete(COMPLETE)).toBe(true);
    expect(isComplete({ ...COMPLETE, styleId: null })).toBe(false);
    expect(isComplete({ ...COMPLETE, bpm: null })).toBe(false);
    expect(isComplete({ ...COMPLETE, inputNotes: [] })).toBe(false);
  });
});

describe('generateSequenceNames', () => {
  it('generates the Up cycle through the registry (middle C = C3)', () => {
    expect(generateSequenceNames(COMPLETE)).toEqual(['C2', 'E2', 'G2', 'C3', 'E3', 'G3']);
  });

  it('regenerates when the style changes to UpDown', () => {
    expect(generateSequenceNames({ ...COMPLETE, styleId: 'up-down' })).toEqual([
      'C2',
      'E2',
      'G2',
      'C3',
      'E3',
      'G3',
      'E3',
      'C3',
      'G2',
      'E2',
    ]);
  });

  it('is empty without a style', () => {
    expect(generateSequenceNames({ ...COMPLETE, styleId: null })).toEqual([]);
  });
});

describe('stepDurationSeconds', () => {
  it('derives seconds per step from BPM and Rate', () => {
    expect(stepDurationSeconds(COMPLETE)).toBeCloseTo(0.125, 9);
  });

  it('is undefined when BPM or Rate is unset', () => {
    expect(stepDurationSeconds({ ...COMPLETE, rate: null })).toBeUndefined();
  });
});
