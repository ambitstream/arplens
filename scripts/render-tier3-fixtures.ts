/**
 * Renders the Tier 3 failure fixtures (docs/08_TEST_STRATEGY.md).
 * Unlike Tier 1/2, these are not built from the Style Registry —
 * each one is a deliberately pathological signal constructed to
 * exercise one documented honest-failure path end to end (real
 * decode -> worker -> Basic Pitch -> engine -> UI), the same way
 * Tier 1 exercises the happy path. Regenerate with
 * `npm run fixtures:render:tier3` only when the fixture set
 * intentionally changes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomFillSync } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NoteEvent } from '../src/analysis/engine/types';
import { renderEventsToPcm } from '../src/utils/render-events-to-pcm';
import { encodeWavPcm16Mono } from '../src/utils/wav-encoder';

const SAMPLE_RATE = 44100;
const targetDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'e2e', 'fixtures');
mkdirSync(targetDir, { recursive: true });

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function write(name: string, bytes: Uint8Array): void {
  const path = join(targetDir, name);
  writeFileSync(path, bytes);
  console.log(`${name} — ${(bytes.length / 1024).toFixed(0)} KiB`);
}

function writeWav(name: string, pcm: Float32Array): void {
  write(name, encodeWavPcm16Mono(pcm, SAMPLE_RATE));
}

// --- Silence ---------------------------------------------------------
// No pitched material at all. Expected: No Pitched Notes Detected.
{
  const pcm = new Float32Array(SAMPLE_RATE * 5);
  writeWav('tier3-silence.wav', pcm);
}

// --- Drum Loop -------------------------------------------------------
// Broadband noise bursts on a steady beat — has rhythm but no pitch.
// Expected: No Pitched Notes Detected.
{
  const bpm = 120;
  const beatSeconds = 60 / bpm;
  const totalSeconds = 4;
  const pcm = new Float32Array(Math.ceil(totalSeconds * SAMPLE_RATE));
  let seed = 7 >>> 0;
  const nextNoise = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed / 0x100000000) * 2 - 1;
  };
  for (let beat = 0; beat * beatSeconds < totalSeconds; beat += 1) {
    const startSample = Math.round(beat * beatSeconds * SAMPLE_RATE);
    const burstSamples = Math.round(0.04 * SAMPLE_RATE);
    for (let i = 0; i < burstSamples; i += 1) {
      const index = startSample + i;
      if (index >= pcm.length) {
        break;
      }
      const envelope = Math.exp(-i / (burstSamples * 0.25));
      pcm[index] += 0.6 * envelope * nextNoise();
    }
  }
  writeWav('tier3-drum-loop.wav', pcm);
}

// --- "Vocal" Melody ----------------------------------------------------
// A continuous, non-monotonic pitch wander with vibrato — a synthetic
// proxy for unquantized vocal pitch (a real vocal recording would
// need actual singing). Deliberately wanders up and down with no net
// direction: an earlier monotonic-glide version was, once quantized,
// indistinguishable from a legitimate "Up" arpeggio and matched it.
// Validates the honest-failure path for audio with no stable step
// grid, not vocal-specific acoustics. Expected: no style on a
// trustworthy grid, i.e. Arpeggiator Style Not Detected.
{
  const totalSeconds = 5;
  const pcm = new Float32Array(Math.ceil(totalSeconds * SAMPLE_RATE));
  const centerMidi = 67;
  for (let i = 0; i < pcm.length; i += 1) {
    const t = i / SAMPLE_RATE;
    const wander = 5 * Math.sin(2 * Math.PI * 0.37 * t) + 2.5 * Math.sin(2 * Math.PI * 0.83 * t);
    const vibrato = 0.15 * Math.sin(2 * Math.PI * 5.5 * t);
    const freq = midiToFreq(centerMidi + wander + vibrato);
    const envelope = Math.min(1, t / 0.05, (totalSeconds - t) / 0.05);
    pcm[i] = 0.4 * envelope * Math.sin(2 * Math.PI * freq * t);
  }
  writeWav('tier3-vocal-melody.wav', pcm);
}

// --- Non-Repeating Melody ----------------------------------------------
// One pass through a deterministically shuffled (non-monotonic) note
// order: a real, evenly-spaced grid but no periodic cycle and no
// ascending/descending run for style matching to lock onto. An
// earlier version used a plain chromatic run, which — once
// quantized — IS a legitimate "Up" arpeggio and matched it. Expected:
// a grid is found but Arpeggiator Style Not Detected.
{
  const bpm = 120;
  const stepSeconds = 60 / bpm / 2; // 1/8 grid
  const order = [4, 9, 1, 7, 0, 11, 3, 8, 5, 10, 2, 6]; // fixed shuffle of 0..11
  const events: NoteEvent[] = order.map((offset, index) => ({
    midi: 60 + offset,
    onsetSeconds: index * stepSeconds,
    durationSeconds: stepSeconds * 0.8,
  }));
  writeWav(
    'tier3-non-repeating-melody.wav',
    renderEventsToPcm(events, { sampleRate: SAMPLE_RATE }),
  );
}

// --- Unsupported Pattern -------------------------------------------------
// An irregular 5-step cycle (not any registry style's output at any
// note count/octave) repeated imperfectly — the grid is usable but
// no complete reconstruction is possible. Expected: Partial Result.
{
  const bpm = 120;
  const stepSeconds = 60 / bpm / 4; // 1/16 grid
  const baseMidis = [60, 64, 67];
  const cycle = [0, 2, 1, 2, 0]; // index into baseMidis; not a registry pattern
  const events: NoteEvent[] = [];
  for (let repetition = 0; repetition < 5; repetition += 1) {
    for (let position = 0; position < cycle.length; position += 1) {
      const stepIndex = repetition * cycle.length + position;
      events.push({
        midi: baseMidis[cycle[position]],
        onsetSeconds: stepIndex * stepSeconds,
        durationSeconds: stepSeconds * 0.8,
      });
    }
  }
  writeWav('tier3-unsupported-pattern.wav', renderEventsToPcm(events, { sampleRate: SAMPLE_RATE }));
}

// --- Unsupported Style ----------------------------------------------------
// A clean, cleanly-repeating "double back" cycle (C G C E) that isn't
// a rotation of Up/Down/UpDown/DownUp for any note-count/octave
// hypothesis (those are all of the shape x,y,z or x,y,z,y — this
// revisits the first note before the cycle closes). An earlier
// version (C E G E) was exactly UpDown and matched it. Expected: a
// trustworthy grid, but Arpeggiator Style Not Detected.
{
  const bpm = 120;
  const stepSeconds = 60 / bpm / 4; // 1/16 grid
  const baseMidis = [60, 64, 67];
  const cycle = [0, 2, 0, 1];
  const events: NoteEvent[] = [];
  for (let repetition = 0; repetition < 6; repetition += 1) {
    for (let position = 0; position < cycle.length; position += 1) {
      const stepIndex = repetition * cycle.length + position;
      events.push({
        midi: baseMidis[cycle[position]],
        onsetSeconds: stepIndex * stepSeconds,
        durationSeconds: stepSeconds * 0.8,
      });
    }
  }
  writeWav('tier3-unsupported-style.wav', renderEventsToPcm(events, { sampleRate: SAMPLE_RATE }));
}

// --- Corrupted Audio -----------------------------------------------------
// Random bytes with a .wav extension: decodeAudioData will reject
// this regardless of browser. Expected: Audio Decode Failed.
{
  const bytes = new Uint8Array(2048);
  randomFillSync(bytes);
  write('tier3-corrupted.wav', bytes);
}

// --- Unsupported Codec -----------------------------------------------------
// Any bytes, wrong extension: rejected by the pre-decode extension
// gate (isSupportedAudioFile) before decodeAudioFile is ever called.
// Expected: Unsupported Audio Format.
{
  const bytes = new Uint8Array(64);
  randomFillSync(bytes);
  write('tier3-unsupported-codec.ogg', bytes);
}
