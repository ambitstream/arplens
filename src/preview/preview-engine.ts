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

  constructor(config: PreviewConfig = DEFAULT_PREVIEW_CONFIG) {
    this.config = config;
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  async start(sequence: PreviewSequence): Promise<void> {
    if (sequence.midis.length === 0 || sequence.stepDurationSeconds <= 0) {
      return;
    }
    await Tone.start();
    this.build(sequence);
    Tone.getTransport().start();
  }

  pause(): void {
    Tone.getTransport().pause();
  }

  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
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
      note: midiToNoteName(midi),
    }));

    this.part = new Tone.Part((time, value) => {
      this.synth?.triggerAttackRelease(value.note, gateSeconds, time);
    }, events);
    this.part.loop = true;
    this.part.loopEnd = sequence.midis.length * step;
    this.part.start(0);

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
  }
}
