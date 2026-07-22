import type { NoteEvent } from '../analysis/engine/types';

export interface RenderOptions {
  readonly sampleRate: number;
  /** Linear attack time. */
  readonly attackSeconds?: number;
  /** Linear release time appended after each note's duration. */
  readonly releaseSeconds?: number;
  readonly gain?: number;
  /**
   * Constant global detune applied to every note (Tier 2: Global
   * Detuning). Positive sharpens, negative flattens.
   */
  readonly detuneCents?: number;
  /**
   * Overtones added on top of the fundamental (Tier 2: Rich
   * Harmonics), as {ratio, gain} relative to the fundamental's own
   * gain — e.g. `[{ratio: 2, gain: 0.4}]` adds a quieter octave
   * above each note.
   */
  readonly harmonics?: readonly { readonly ratio: number; readonly gain: number }[];
}

/**
 * Renders note events to mono PCM with a sine oscillator (optionally
 * detuned and/or layered with harmonics) and a linear attack/release
 * envelope. Tier 1 fixtures use none of the optional degradations —
 * the "clean synthesizer" ground truth; Tier 2 fixtures use them to
 * approximate real-world imperfections.
 */
export function renderEventsToPcm(
  events: readonly NoteEvent[],
  options: RenderOptions,
): Float32Array {
  const { sampleRate } = options;
  const attack = options.attackSeconds ?? 0.005;
  const release = options.releaseSeconds ?? 0.03;
  const gain = options.gain ?? 0.5;
  const detune = Math.pow(2, (options.detuneCents ?? 0) / 1200);
  const harmonics = options.harmonics ?? [];

  const end = events.reduce(
    (latest, event) =>
      Math.max(latest, event.onsetSeconds + (event.durationSeconds ?? 0.1) + release),
    0,
  );
  const output = new Float32Array(Math.ceil(end * sampleRate) + 1);

  for (const event of events) {
    const frequency = 440 * Math.pow(2, (event.midi - 69) / 12) * detune;
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
        let sample = Math.sin(2 * Math.PI * frequency * t);
        for (const harmonic of harmonics) {
          sample += harmonic.gain * Math.sin(2 * Math.PI * frequency * harmonic.ratio * t);
        }
        output[index] += gain * envelope * sample;
      }
    }
  }

  return output;
}
