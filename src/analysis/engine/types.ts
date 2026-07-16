import type { SupportedRate } from '../../config/rates';

/**
 * A cleaned, monophonic note event — the input contract of the
 * deterministic core (output of pipeline stages 1-4, which live in
 * the audio layer / M4). Pitch is a MIDI note number; names are
 * produced only at the DTO boundary.
 */
export interface NoteEvent {
  readonly midi: number;
  readonly onsetSeconds: number;
  readonly durationSeconds?: number;
}

/** Stage 5 output: the estimated temporal grid. */
export interface StepGrid {
  readonly stepDurationSeconds: number;
  readonly phaseSeconds: number;
  /** Mean |residual| / (step/2), in [0, 1]. 0 = perfect alignment. */
  readonly residualRatio: number;
}

/** Stage 6 output: one note assigned to a grid step. */
export interface QuantizedNote {
  readonly midi: number;
  /** Normalized so the first occupied step is 0. */
  readonly stepIndex: number;
  readonly residualSeconds: number;
}

export interface QuantizedSequence {
  readonly notes: readonly QuantizedNote[];
  readonly grid: StepGrid;
  /** Steps inside the occupied range with no note (rests). */
  readonly holeCount: number;
}

/** Stage 7 output: one detected cycle. */
export interface DetectedCycle {
  readonly midis: readonly number[];
  readonly periodSteps: number;
  readonly repetitions: number;
}

/**
 * Stage 8: one candidate explanation of the observed cycle (D-200:
 * Input Notes, Octaves and Style are always solved together).
 */
export interface Hypothesis {
  /** Sorted MIDI values of the held input notes. */
  readonly baseMidis: readonly number[];
  readonly octaves: number;
  readonly styleId: string;
}

/** Stage 9 output: a scored hypothesis. */
export interface HypothesisMatch {
  readonly hypothesis: Hypothesis;
  /** Concrete MIDI sequence generated through the Style Registry. */
  readonly generatedMidis: readonly number[];
  /** Minimum edit distance over all rotations. */
  readonly distance: number;
  /** 1 - distance / max(lengths), in [0, 1]. 1 = exact match. */
  readonly score: number;
  /** Smallest rotation offset achieving the minimum distance. */
  readonly bestRotation: number;
}

/** Stage 10 output. */
export interface BpmRateResolution {
  readonly bpm: number;
  readonly rate: SupportedRate;
}

/**
 * Stage 11: the four internal components (implementation details,
 * never displayed). Overall confidence is the weakest component.
 */
export interface ConfidenceComponents {
  readonly transcription: number;
  readonly grid: number;
  readonly pattern: number;
  readonly ambiguity: number;
}

export type ConfidenceBand = 'high' | 'medium' | 'low';

export type AnalysisStatus = 'complete' | 'partial' | 'no-pitched-material' | 'no-repeating-cycle';

/**
 * The immutable Result DTO (D-209). Undetected parameters are
 * undefined — never guessed. "Style Not Detected" is represented as
 * status 'partial' with style undefined; how that is presented is a
 * UI concern.
 */
export interface AnalysisResult {
  readonly status: AnalysisStatus;
  readonly bpm?: number;
  readonly rate?: SupportedRate;
  readonly stepDuration?: number;
  /** Pitch-class names, sharp notation only (D-004). */
  readonly inputNotes?: readonly string[];
  readonly octaves?: number;
  /** Style Registry id, e.g. "up". Display names come from the registry. */
  readonly style?: string;
  /** Concrete note names with octaves, e.g. "C2". */
  readonly sequence?: readonly string[];
  readonly sequenceSource?: 'registry' | 'quantized';
  readonly confidence?: ConfidenceBand;
  readonly engineVersion: string;
  readonly registryVersion: string;
  readonly configurationHash: string;
}
