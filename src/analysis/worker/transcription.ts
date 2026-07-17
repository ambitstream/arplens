import {
  addPitchBendsToNoteEvents,
  BasicPitch,
  noteFramesToTime,
  outputToNotesPoly,
} from '@spotify/basic-pitch';
import * as tf from '@tensorflow/tfjs';
import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import type { AnalysisConfig } from '../../config/analysis';
import type { RawPitchEvent } from '../engine/cleanup';

/** Basic Pitch contour resolution: 3 bins per semitone. */
const CONTOUR_BINS_PER_SEMITONE = 3;

const MODEL_URL = '/models/basic-pitch/model.json';
const TFJS_WASM_DIR = '/tfjs-wasm/';

let basicPitchPromise: Promise<BasicPitch> | undefined;

/**
 * Lazily initializes the WASM backend (D-104) and loads the model.
 * Model caching is not per-analysis state: identical requests still
 * produce identical results.
 */
function getBasicPitch(): Promise<BasicPitch> {
  basicPitchPromise ??= (async () => {
    setWasmPaths(TFJS_WASM_DIR);
    await tf.setBackend('wasm');
    await tf.ready();
    return new BasicPitch(MODEL_URL);
  })();
  return basicPitchPromise;
}

/**
 * Stage 2 — Basic Pitch transcription. Input PCM must already be at
 * the transcription sample rate. Output is treated as noisy
 * observations; no product decisions are made here.
 */
export async function transcribe(
  pcm: Float32Array,
  config: AnalysisConfig,
): Promise<RawPitchEvent[]> {
  const basicPitch = await getBasicPitch();

  const frames: number[][] = [];
  const onsets: number[][] = [];
  const contours: number[][] = [];

  await basicPitch.evaluateModel(
    pcm,
    (chunkFrames, chunkOnsets, chunkContours) => {
      frames.push(...chunkFrames);
      onsets.push(...chunkOnsets);
      contours.push(...chunkContours);
    },
    () => undefined,
  );

  const notes = noteFramesToTime(
    addPitchBendsToNoteEvents(
      contours,
      outputToNotesPoly(
        frames,
        onsets,
        config.onsetThreshold,
        config.frameThreshold,
        config.minNoteLengthFrames,
      ),
    ),
  );

  return notes.map((note) => ({
    midiFloat: note.pitchMidi + meanBendSemitones(note.pitchBends),
    onsetSeconds: note.startTimeSeconds,
    durationSeconds: note.durationSeconds,
    confidence: note.amplitude,
  }));
}

/** Mean pitch bend converted from contour bins to semitones. */
function meanBendSemitones(bends: readonly number[] | undefined): number {
  if (bends === undefined || bends.length === 0) {
    return 0;
  }
  const mean = bends.reduce((sum, bend) => sum + bend, 0) / bends.length;
  const semitones = mean / CONTOUR_BINS_PER_SEMITONE;
  return Math.max(-0.5, Math.min(0.5, semitones));
}
