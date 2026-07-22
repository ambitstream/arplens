/**
 * The Golden Dataset (docs/08_TEST_STRATEGY.md, M6 deliverable): one
 * manifest listing every committed audio fixture's expected outcome.
 * The Tier 1/2/3 Playwright specs assert these same facts inline,
 * close to the fixture-specific reasoning; this manifest exists so
 * the whole corpus can be run and compared in one pass — the tool
 * calibration (confidence thresholds, D-208 partial-result floors)
 * is tuned against, via scripts/run-golden-dataset.ts.
 */

export type ExpectedOutcome =
  | {
      readonly kind: 'complete';
      readonly style: string;
      readonly inputNotes: readonly string[];
      readonly octaves: number;
      readonly rate: string;
    }
  | { readonly kind: 'partial-no-style' }
  | { readonly kind: 'error'; readonly errorTitle: string };

export interface GoldenCase {
  readonly file: string;
  readonly tier: 1 | 2 | 3;
  /** What this case demonstrates, per docs/08_TEST_STRATEGY.md. */
  readonly label: string;
  readonly expected: ExpectedOutcome;
}

const complete = (
  style: string,
  inputNotes: readonly string[],
  octaves: number,
  rate: string,
): ExpectedOutcome => ({ kind: 'complete', style, inputNotes, octaves, rate });

const partialNoStyle: ExpectedOutcome = { kind: 'partial-no-style' };

const error = (errorTitle: string): ExpectedOutcome => ({ kind: 'error', errorTitle });

export const GOLDEN_DATASET: readonly GoldenCase[] = [
  // --- Tier 1: Clean Audio ---------------------------------------------
  {
    file: 'up-c-major-3n-2o-120bpm-16th.wav',
    tier: 1,
    label: 'clean Up arpeggio',
    expected: complete('Up', ['C', 'E', 'G'], 2, '1/16'),
  },
  {
    file: 'down-c-major-3n-2o-120bpm-16th.wav',
    tier: 1,
    label: 'clean Down arpeggio',
    expected: complete('Down', ['C', 'E', 'G'], 2, '1/16'),
  },
  {
    file: 'up-down-a-minor-3n-1o-124bpm-8th.wav',
    tier: 1,
    label: 'clean UpDown arpeggio',
    expected: complete('UpDown', ['A', 'C', 'E'], 1, '1/8'),
  },
  {
    file: 'down-up-a-minor-3n-1o-124bpm-8th.wav',
    tier: 1,
    label: 'clean DownUp arpeggio',
    expected: complete('DownUp', ['A', 'C', 'E'], 1, '1/8'),
  },

  // --- Tier 2: Robustness -----------------------------------------------
  {
    file: 'tier2-timing-jitter.wav',
    tier: 2,
    label: 'timing jitter: correct style, confidence may decrease',
    expected: complete('Up', ['C', 'E', 'G'], 2, '1/16'),
  },
  {
    file: 'tier2-global-detuning.wav',
    tier: 2,
    label: 'global detuning: correct notes after pitch normalization',
    expected: complete('Up', ['C', 'E', 'G'], 2, '1/16'),
  },
  {
    file: 'tier2-rich-harmonics.wav',
    tier: 2,
    label: 'rich harmonics: cleanup removes harmonic artifacts',
    expected: complete('Up', ['C', 'E', 'G'], 2, '1/16'),
  },
  {
    file: 'tier2-single-octave-error.wav',
    tier: 2,
    label: 'single octave error: style remains correct, confidence decreases',
    expected: complete('Up', ['C', 'E', 'G'], 2, '1/16'),
  },
  {
    file: 'tier2-delay.wav',
    tier: 2,
    label: 'delay: correct or Partial Result, never confidently wrong',
    expected: partialNoStyle,
  },
  {
    file: 'tier2-reverb.wav',
    tier: 2,
    label: 'reverb: graceful degradation',
    expected: complete('Up', ['C', 'E', 'G'], 2, '1/16'),
  },
  {
    file: 'tier2-background-pad.wav',
    tier: 2,
    label: 'background pad: pad filter removes sustained notes',
    expected: complete('Up', ['C', 'E', 'G'], 2, '1/16'),
  },
  {
    file: 'tier2-dense-mix.wav',
    tier: 2,
    label: 'dense mix: Partial Result acceptable, wrong Complete Result is not',
    expected: partialNoStyle,
  },

  // --- Tier 3: Failure ----------------------------------------------------
  {
    file: 'tier3-silence.wav',
    tier: 3,
    label: 'silence',
    expected: error('No Pitched Notes Detected'),
  },
  {
    file: 'tier3-drum-loop.wav',
    tier: 3,
    label: 'drum loop (unpitched)',
    expected: error('No Pitched Notes Detected'),
  },
  {
    file: 'tier3-vocal-melody.wav',
    tier: 3,
    label: 'vocal melody proxy (non-monotonic pitch wander)',
    expected: partialNoStyle,
  },
  {
    file: 'tier3-non-repeating-melody.wav',
    tier: 3,
    label: 'non-repeating melody (shuffled one-pass order)',
    expected: partialNoStyle,
  },
  {
    file: 'tier3-unsupported-pattern.wav',
    tier: 3,
    label: 'unsupported pattern (irregular 5-step cycle)',
    expected: partialNoStyle,
  },
  {
    file: 'tier3-unsupported-style.wav',
    tier: 3,
    label: 'unsupported style (clean cycle, no registry match)',
    expected: partialNoStyle,
  },
  {
    file: 'tier3-corrupted.wav',
    tier: 3,
    label: 'corrupted audio (garbage bytes)',
    expected: error('Audio Decode Failed'),
  },
  {
    file: 'tier3-unsupported-codec.ogg',
    tier: 3,
    label: 'unsupported codec extension',
    expected: error('Unsupported Audio Format'),
  },
];
