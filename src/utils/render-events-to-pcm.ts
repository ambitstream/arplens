import type { NoteEvent } from '../analysis/engine/types';

export interface RenderOptions {
  readonly sampleRate: number;
  /** Linear attack time. */
  readonly attackSeconds?: number;
  /** Linear release time appended after each note's duration. */
  readonly releaseSeconds?: number;
  readonly gain?: number;
}

/**
 * Renders note events to mono PCM with a plain sine oscillator and a
 * linear attack/release envelope — the "clean synthesizer" ground
 * truth for Tier 1 fixtures. Deliberately simple: harmonic-rich
 * material belongs to Tier 2 robustness fixtures, not Tier 1.
 */
export function renderEventsToPcm(
  events: readonly NoteEvent[],
  options: RenderOptions,
): Float32Array {
  const { sampleRate } = options;
  const attack = options.attackSeconds ?? 0.005;
  const release = options.releaseSeconds ?? 0.03;
  const gain = options.gain ?? 0.5;

  const end = events.reduce(
    (latest, event) =>
      Math.max(latest, event.onsetSeconds + (event.durationSeconds ?? 0.1) + release),
    0,
  );
  const output = new Float32Array(Math.ceil(end * sampleRate) + 1);

  for (const event of events) {
    const frequency = 440 * Math.pow(2, (event.midi - 69) / 12);
    const duration = event.durationSeconds ?? 0.1;
    const startSample = Math.round(event.onsetSeconds * sampleRate);
    const totalSamples = Math.round((duration + release) * sampleRate);

    for (let i = 0; i < totalSamples; i += 1) {
      const t = i / sampleRate;

      let envelope: number;
      if (t < attack) {
        envelope = t / attack;
      } else if (t < duration) {
        envelope = 1;
      } else {
        envelope = Math.max(0, 1 - (t - duration) / release);
      }

      const index = startSample + i;
      if (index < output.length) {
        output[index] += gain * envelope * Math.sin(2 * Math.PI * frequency * t);
      }
    }
  }

  return output;
}
