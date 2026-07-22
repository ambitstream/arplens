import { SUPPORTED_RATES, type SupportedRate } from './rates';

/**
 * Analysis Engine thresholds and preference rules.
 *
 * Thresholds are configuration, algorithms are code
 * (docs/04_ANALYSIS_ENGINE.md). Values here are initial estimates;
 * calibration against the benchmark corpus happens in M6.
 */
export interface AnalysisConfig {
  /** Sample rate Basic Pitch expects; PCM is resampled to this. */
  readonly transcriptionSampleRate: number;

  /** Basic Pitch onset threshold (stage 2; calibrated in M6). */
  readonly onsetThreshold: number;

  /** Basic Pitch frame threshold (stage 2; calibrated in M6). */
  readonly frameThreshold: number;

  /** Minimum note length in model frames (~11.6 ms each). */
  readonly minNoteLengthFrames: number;

  /** Cleanup: events below this confidence are discarded. */
  readonly minEventConfidence: number;

  /** Cleanup: events shorter than this are discarded. */
  readonly minEventDurationSeconds: number;

  /** Cleanup: same-pitch events closer than this gap are merged. */
  readonly mergeGapSeconds: number;

  /**
   * Cleanup: events longer than this factor times the median
   * duration are treated as sustained background (pad filter).
   */
  readonly sustainedDurationFactor: number;

  /**
   * Cleanup: events whose onsets fall within this window are treated
   * as one instant (a fundamental plus its bleed / near-simultaneous
   * harmonics) and collapse to the single most-confident event.
   * Distinct sequential steps have onsets a full step apart, so they
   * are never merged — unlike duration-overlap collapse, which drops
   * a quiet turnaround note whose tail laps into a louder neighbour.
   */
  readonly simultaneityWindowSeconds: number;

  /**
   * Step-grid selection: weight of the empty-step ratio added to the
   * residual when comparing grid candidates. A grid that leaves many
   * steps unoccupied is a worse explanation of the onsets than one
   * that fills them, even at slightly higher residual.
   */
  readonly gridHolePenalty: number;

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

  /**
   * Confidence band floors. Calibrated in M6 against the synthetic
   * corpus (docs/08_TEST_STRATEGY.md's Golden Dataset) — real
   * commercial/self-produced audio was deferred, so these are a
   * first pass, not final. Basic Pitch's own reported per-note
   * confidence (the `transcription` component) is the binding
   * constraint in every observed case, including clean Tier 1 ground
   * truth: it tops out around 0.42-0.67 even for a pristine
   * synthesized arpeggio (real instrument timbre, with harmonics,
   * scored noticeably higher than the pure-sine Tier 1 baseline —
   * the model appears calibrated on more realistic material). The
   * old floors (0.8/0.5) made "High" unreachable by any fixture in
   * the corpus, defeating the band's purpose.
   */
  readonly confidenceHighFloor: number;
  readonly confidenceMediumFloor: number;

  /**
   * Transcription-quality component supplied by the audio pipeline
   * (M4). The pure core defaults it to 1.
   */
  readonly defaultTranscriptionQuality: number;
}

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  transcriptionSampleRate: 22050,
  onsetThreshold: 0.3,
  frameThreshold: 0.3,
  minNoteLengthFrames: 3,
  minEventConfidence: 0.3,
  minEventDurationSeconds: 0.03,
  mergeGapSeconds: 0.04,
  sustainedDurationFactor: 4,
  simultaneityWindowSeconds: 0.03,
  gridHolePenalty: 0.5,
  minEvents: 3,
  ioiClusterTolerance: 0.1,
  maxResidualRatio: 0.55,
  editDistanceBudgetRatio: 0.2,
  ambiguityEpsilon: 0.1,
  preferredBpmMin: 90,
  preferredBpmMax: 180,
  fallbackBpm: 120,
  ratePreferenceOrder: ['1/16', '1/8', '1/32', '1/4', '1/16T', '1/8T', '1/32T', '1/4T'],
  confidenceHighFloor: 0.45,
  confidenceMediumFloor: 0.35,
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
