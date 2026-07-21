import type { AnalysisResult } from '../analysis/engine/types';
import type { DecodedAudio } from '../audio/audio-decode-service';
import { SANDBOX_DEFAULTS } from '../config/sandbox-defaults';
import type { SupportedRate } from '../config/rates';
import type { ArpSettings } from '../preview/arp-settings';
import type { PitchClass } from '../utils/note-names';

/** Which single panel is active (docs/06_UI_SPEC.md Layout). */
export type Phase = 'upload' | 'waveform' | 'analysis' | 'results' | 'sandbox';

/** Waveform sub-steps within the one Waveform panel. */
export type WaveStep = 'focus' | 'loop';

export type AnalyzeStatus = 'idle' | 'loading' | 'completed' | 'failed';

/** The eight UI error states (docs/06_UI_SPEC.md Error States). */
export type ErrorKind =
  | 'unsupported-browser'
  | 'unsupported-format'
  | 'decode-failed'
  | 'no-pitched-notes'
  | 'no-repeating-arpeggio'
  | 'style-not-detected'
  | 'engine-unavailable'
  | 'unexpected';

/** Which playback source is active; the two are mutually exclusive (D-501). */
export type PlaybackSource = 'none' | 'source' | 'modulation';

export interface AppState {
  readonly phase: Phase;
  readonly fileName: string;
  readonly decoded?: DecodedAudio;
  readonly waveStep: WaveStep;
  /** Focus region, in seconds within the whole file. */
  readonly focusStart: number;
  readonly focusLength: number;
  /** Loop selection, in seconds within the whole file. */
  readonly loopStart: number;
  readonly loopLength: number;
  readonly analyzeStatus: AnalyzeStatus;
  readonly errorKind?: ErrorKind;
  readonly result?: AnalysisResult;
  readonly settings: ArpSettings;
  /** Quantized detected sequence (partial-result preview source). */
  readonly detectedSequence?: readonly string[];
  readonly detectedStepDuration?: number;
  readonly playback: PlaybackSource;
  /**
   * True once the user has changed any setting away from what
   * analysis detected (or, in Sandbox, away from the seeded
   * defaults). The Confidence badge only describes the original
   * detection, so it is hidden once this is true.
   */
  readonly settingsEdited: boolean;
}

export const FOCUS_MAX_SECONDS = 60;
export const LOOP_MIN_SECONDS = 3;
export const LOOP_MAX_SECONDS = 20;

const EMPTY_SETTINGS: ArpSettings = {
  inputNotes: [],
  octaves: 1,
  styleId: null,
  bpm: null,
  rate: null,
};

export const INITIAL_STATE: AppState = {
  phase: 'upload',
  fileName: '',
  waveStep: 'focus',
  focusStart: 0,
  focusLength: 0,
  loopStart: 0,
  loopLength: 0,
  analyzeStatus: 'idle',
  settings: EMPTY_SETTINGS,
  playback: 'none',
  settingsEdited: false,
};

export type Action =
  | { type: 'decoded'; fileName: string; decoded: DecodedAudio }
  | { type: 'decode-error'; error: ErrorKind }
  | { type: 'set-focus'; start: number; length: number }
  | { type: 'confirm-focus' }
  | { type: 'set-loop'; start: number; length: number }
  | { type: 'back-to-focus' }
  | { type: 'reset-to-upload' }
  | { type: 'analyze-start' }
  | { type: 'analyze-result'; result: AnalysisResult }
  | { type: 'analyze-error'; error: ErrorKind }
  | { type: 'enter-sandbox' }
  | { type: 'edit-notes'; inputNotes: readonly PitchClass[] }
  | { type: 'edit-style'; styleId: string }
  | { type: 'edit-rate'; rate: SupportedRate }
  | { type: 'edit-octaves'; octaves: number }
  | { type: 'edit-bpm'; bpm: number }
  | { type: 'set-playback'; source: PlaybackSource };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'decoded': {
      const wholeIsFocus = action.decoded.durationSeconds <= FOCUS_MAX_SECONDS;
      return {
        ...INITIAL_STATE,
        phase: 'waveform',
        fileName: action.fileName,
        decoded: action.decoded,
        waveStep: 'focus',
        focusStart: 0,
        focusLength: Math.min(FOCUS_MAX_SECONDS, action.decoded.durationSeconds),
        loopStart: 0,
        loopLength: Math.min(LOOP_MAX_SECONDS, action.decoded.durationSeconds),
        // A short file skips Focus Region selection entirely.
        ...(wholeIsFocus ? { waveStep: 'loop' as WaveStep } : {}),
      };
    }

    case 'decode-error':
      return {
        ...INITIAL_STATE,
        phase: 'upload',
        analyzeStatus: 'failed',
        errorKind: action.error,
      };

    case 'set-focus':
      return { ...state, focusStart: action.start, focusLength: action.length };

    case 'confirm-focus':
      return {
        ...state,
        waveStep: 'loop',
        loopStart: state.focusStart,
        loopLength: Math.min(LOOP_MAX_SECONDS, state.focusLength),
      };

    case 'set-loop':
      return { ...state, loopStart: action.start, loopLength: action.length };

    case 'back-to-focus':
      return { ...state, waveStep: 'focus', playback: 'none' };

    case 'reset-to-upload':
      return INITIAL_STATE;

    case 'analyze-start':
      return { ...state, phase: 'analysis', analyzeStatus: 'loading', errorKind: undefined };

    case 'analyze-result':
      return applyResult(state, action.result);

    case 'analyze-error':
      return { ...state, phase: 'analysis', analyzeStatus: 'failed', errorKind: action.error };

    case 'enter-sandbox':
      return {
        ...INITIAL_STATE,
        phase: 'sandbox',
        analyzeStatus: 'completed',
        settings: {
          inputNotes: SANDBOX_DEFAULTS.inputNotes as readonly PitchClass[],
          octaves: SANDBOX_DEFAULTS.octaves,
          styleId: SANDBOX_DEFAULTS.styleId,
          bpm: SANDBOX_DEFAULTS.bpm,
          rate: SANDBOX_DEFAULTS.rate,
        },
      };

    case 'edit-notes':
      return {
        ...state,
        settings: { ...state.settings, inputNotes: action.inputNotes },
        settingsEdited: true,
      };

    case 'edit-style':
      return {
        ...state,
        settings: { ...state.settings, styleId: action.styleId },
        settingsEdited: true,
      };

    case 'edit-rate':
      return {
        ...state,
        settings: { ...state.settings, rate: action.rate },
        settingsEdited: true,
      };

    case 'edit-octaves':
      return {
        ...state,
        settings: { ...state.settings, octaves: clampOctaves(action.octaves) },
        settingsEdited: true,
      };

    case 'edit-bpm':
      return {
        ...state,
        settings: { ...state.settings, bpm: action.bpm },
        settingsEdited: true,
      };

    case 'set-playback':
      return { ...state, playback: action.source };

    default:
      return state;
  }
}

function applyResult(state: AppState, result: AnalysisResult): AppState {
  if (result.status === 'no-pitched-material') {
    return { ...state, phase: 'analysis', analyzeStatus: 'failed', errorKind: 'no-pitched-notes' };
  }
  if (result.status === 'no-repeating-cycle') {
    return {
      ...state,
      phase: 'analysis',
      analyzeStatus: 'failed',
      errorKind: 'no-repeating-arpeggio',
    };
  }

  return {
    ...state,
    phase: 'results',
    analyzeStatus: 'completed',
    errorKind: undefined,
    result,
    settings: {
      inputNotes: (result.inputNotes ?? []) as readonly PitchClass[],
      octaves: result.octaves ?? 1,
      styleId: result.style ?? null,
      bpm: result.bpm ?? null,
      rate: result.rate ?? null,
    },
    detectedSequence: result.sequence,
    detectedStepDuration: result.stepDuration,
    playback: 'none',
    settingsEdited: false,
  };
}

function clampOctaves(octaves: number): number {
  return Math.max(1, Math.min(4, Math.round(octaves)));
}
