import { SUPPORTED_RATES, type SupportedRate } from './rates';

/**
 * Analysis Engine thresholds and preference rules.
 *
 * Thresholds are configuration, algorithms are code
 * (docs/04_ANALYSIS_ENGINE.md). Values here are initial estimates;
 * calibration against the benchmark corpus happens in M6.
 */
export interface AnalysisConfig {
  /** Fewer note events than this cannot establish a grid. */
  readonly minEvents: number;

  /** Relative tolerance when clustering inter-onset intervals. */
  readonly ioiClusterTolerance: number;

  /**
   * Grid-quality floor: residualRatio above which BPM/Rate are not
   * reported (analysis stops at partial Level 1).
   */
  readonly maxResidualRatio: number;

  /** Edit-distance budget: max distance / max(length) for a style match. */
  readonly editDistanceBudgetRatio: number;

  /**
   * Score gap below which two distinct hypotheses are considered
   * competitive (too ambiguous to claim a style).
   */
  readonly ambiguityEpsilon: number;

  /** D-207: preferred BPM range (inclusive min, exclusive max). */
  readonly preferredBpmMin: number;
  readonly preferredBpmMax: number;

  /** D-207: fallback anchor when no candidate lies in the range. */
  readonly fallbackBpm: number;

  /** D-207: deterministic rate preference order. */
  readonly ratePreferenceOrder: readonly SupportedRate[];

  /** Confidence band floors (calibrated in M6). */
  readonly confidenceHighFloor: number;
  readonly confidenceMediumFloor: number;

  /**
   * Transcription-quality component supplied by the audio pipeline
   * (M4). The pure core defaults it to 1.
   */
  readonly defaultTranscriptionQuality: number;
}

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  minEvents: 3,
  ioiClusterTolerance: 0.1,
  maxResidualRatio: 0.55,
  editDistanceBudgetRatio: 0.2,
  ambiguityEpsilon: 0.1,
  preferredBpmMin: 90,
  preferredBpmMax: 180,
  fallbackBpm: 120,
  ratePreferenceOrder: ['1/16', '1/8', '1/32', '1/4', '1/16T', '1/8T', '1/32T', '1/4T'],
  confidenceHighFloor: 0.8,
  confidenceMediumFloor: 0.5,
  defaultTranscriptionQuality: 1,
};

/**
 * Beats occupied by one step at each supported rate, relative to a
 * quarter-note beat. Triplet rates are 2/3 of the straight duration.
 */
export const BEATS_PER_STEP: Readonly<Record<SupportedRate, number>> = {
  '1/4': 1,
  '1/8': 1 / 2,
  '1/16': 1 / 4,
  '1/32': 1 / 8,
  '1/4T': 2 / 3,
  '1/8T': 1 / 3,
  '1/16T': 1 / 6,
  '1/32T': 1 / 12,
};

/** All rates carry an entry above; keep the invariant obvious. */
export const ALL_RATES = SUPPORTED_RATES;
