/**
 * Preview Engine configuration (D-500, docs/07_PREVIEW_ENGINE.md).
 * One immutable object — changing the preview sound must never
 * require touching playback logic.
 */
export interface PreviewConfig {
  readonly oscillator: 'sawtooth' | 'square' | 'triangle' | 'sine';
  readonly filterFrequency: number;
  readonly envelope: {
    readonly attack: number;
    readonly decay: number;
    readonly sustain: number;
    readonly release: number;
  };
  /** Note length as a fraction of the step. */
  readonly gate: number;
  /** Output level in decibels. */
  readonly volumeDb: number;
}

export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  oscillator: 'sawtooth',
  filterFrequency: 3200,
  envelope: { attack: 0.005, decay: 0.08, sustain: 0.4, release: 0.06 },
  gate: 0.8,
  volumeDb: -8,
};
