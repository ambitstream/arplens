import { describe, expect, it } from 'vitest';
import { INITIAL_STATE, reducer, type AppState } from '../app/state';
import type { AnalysisResult } from '../analysis/engine/types';
import type { DecodedAudio } from '../audio/audio-decode-service';

function decoded(durationSeconds: number): DecodedAudio {
  return { mono: new Float32Array(0), sampleRate: 44100, durationSeconds, peaks: [] };
}

const META = { engineVersion: '0.1.0', registryVersion: '2.1.0', configurationHash: 'abc' };

describe('workflow reducer', () => {
  it('a short file skips Focus Region and lands on Loop Selection', () => {
    const state = reducer(INITIAL_STATE, {
      type: 'decoded',
      fileName: 'clip.wav',
      decoded: decoded(5),
    });

    expect(state.phase).toBe('waveform');
    expect(state.waveStep).toBe('loop');
    expect(state.loopLength).toBe(5);
  });

  it('a long file starts on Focus Region and crops into Loop Selection', () => {
    const loaded = reducer(INITIAL_STATE, {
      type: 'decoded',
      fileName: 'song.wav',
      decoded: decoded(180),
    });
    expect(loaded.waveStep).toBe('focus');
    expect(loaded.focusLength).toBe(60);

    const cropped = reducer(loaded, { type: 'confirm-focus' });
    expect(cropped.waveStep).toBe('loop');
    expect(cropped.loopStart).toBe(loaded.focusStart);
  });

  it('maps engine failure states to error kinds', () => {
    const base: AppState = { ...INITIAL_STATE, phase: 'analysis', analyzeStatus: 'loading' };
    const noPitch = reducer(base, {
      type: 'analyze-result',
      result: { status: 'no-pitched-material', ...META } as AnalysisResult,
    });
    expect(noPitch.analyzeStatus).toBe('failed');
    expect(noPitch.errorKind).toBe('no-pitched-notes');

    const noCycle = reducer(base, {
      type: 'analyze-result',
      result: { status: 'no-repeating-cycle', ...META } as AnalysisResult,
    });
    expect(noCycle.errorKind).toBe('no-repeating-arpeggio');
  });

  it('seeds the editable model from a complete result', () => {
    const result: AnalysisResult = {
      status: 'complete',
      bpm: 124,
      rate: '1/16',
      inputNotes: ['C', 'E', 'G'],
      octaves: 2,
      style: 'up',
      sequence: ['C2', 'E2', 'G2'],
      sequenceSource: 'registry',
      confidence: 'high',
      ...META,
    };
    const state = reducer(
      { ...INITIAL_STATE, phase: 'analysis' },
      { type: 'analyze-result', result },
    );

    expect(state.phase).toBe('results');
    expect(state.settings.styleId).toBe('up');
    expect(state.settings.inputNotes).toEqual(['C', 'E', 'G']);
    expect(state.settings.bpm).toBe(124);
  });

  it('enters sandbox with seeded defaults and no result', () => {
    const state = reducer(INITIAL_STATE, { type: 'enter-sandbox' });

    expect(state.phase).toBe('sandbox');
    expect(state.result).toBeUndefined();
    expect(state.settings.styleId).toBe('up');
    expect(state.settings.inputNotes).toEqual(['C', 'E', 'G']);
  });

  it('clamps octave edits to 1..4', () => {
    const s1 = reducer(INITIAL_STATE, { type: 'edit-octaves', octaves: 9 });
    expect(s1.settings.octaves).toBe(4);
    const s2 = reducer(INITIAL_STATE, { type: 'edit-octaves', octaves: 0 });
    expect(s2.settings.octaves).toBe(1);
  });
});
