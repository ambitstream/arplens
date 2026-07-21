import * as Tone from 'tone';
import { DEFAULT_PREVIEW_CONFIG, type PreviewConfig } from '../config/preview';
import { midiToNoteName } from '../utils/note-names';

/**
 * The Preview Engine (docs/07_PREVIEW_ENGINE.md): plays a note
 * sequence on a single Tone.MonoSynth, looping, deterministically,
 * scheduled off Tone.Transport from the step duration. It knows
 * nothing about analysis — it takes a concrete sequence and a step
 * duration and nothing else.
 */
export interface PreviewSequence {
  /** Concrete MIDI notes, one per step. */
  readonly midis: readonly number[];
  readonly stepDurationSeconds: number;
}

export class PreviewEngine {
  private synth: Tone.MonoSynth | undefined;
  private part: Tone.Part | undefined;
  private readonly config: PreviewConfig;
  private onStepChange: ((index: number | undefined) => void) | undefined;

  constructor(config: PreviewConfig = DEFAULT_PREVIEW_CONFIG) {
    this.config = config;
  }

  /**
   * Must be called from a user gesture (browser autoplay policy).
   * `onStepChange` fires (via Tone.Draw, sample-accurate with the
   * audio callback) with the index currently sounding, for UI
   * highlighting; undefined when nothing is playing.
   */
  async start(
    sequence: PreviewSequence,
    onStepChange?: (index: number | undefined) => void,
  ): Promise<void> {
    if (sequence.midis.length === 0 || sequence.stepDurationSeconds <= 0) {
      return;
    }
    this.onStepChange = onStepChange;
    await Tone.start();
    this.build(sequence);
    Tone.getTransport().start();
  }

  /**
   * Applies a new sequence to an already-playing preview. Per the
   * Preview Engine spec, an edit restarts playback from the
   * beginning of the reconstructed cycle — there is no way to
   * splice a differently-shaped pattern into an in-flight loop
   * without that reset.
   */
  async update(sequence: PreviewSequence): Promise<void> {
    await this.start(sequence, this.onStepChange);
  }

  pause(): void {
    Tone.getTransport().pause();
    Tone.getDraw().schedule(() => this.onStepChange?.(undefined), Tone.now());
  }

  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.onStepChange?.(undefined);
  }

  dispose(): void {
    this.stop();
    this.part?.dispose();
    this.synth?.dispose();
    this.part = undefined;
    this.synth = undefined;
  }

  private build(sequence: PreviewSequence): void {
    this.part?.dispose();
    this.synth?.dispose();

    this.synth = new Tone.MonoSynth({
      oscillator: { type: this.config.oscillator },
      filter: { type: 'lowpass' },
      filterEnvelope: { baseFrequency: this.config.filterFrequency, octaves: 0 },
      envelope: this.config.envelope,
    }).toDestination();
    this.synth.volume.value = this.config.volumeDb;

    const step = sequence.stepDurationSeconds;
    const gateSeconds = step * this.config.gate;
    const events = sequence.midis.map((midi, index) => ({
      time: index * step,
      index,
      note: midiToNoteName(midi),
    }));

    this.part = new Tone.Part((time, value) => {
      this.synth?.triggerAttackRelease(value.note, gateSeconds, time);
      const onStepChange = this.onStepChange;
      if (onStepChange !== undefined) {
        Tone.getDraw().schedule(() => onStepChange(value.index), time);
      }
    }, events);
    this.part.loop = true;
    this.part.loopEnd = sequence.midis.length * step;
    this.part.start(0);

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
  }
}
