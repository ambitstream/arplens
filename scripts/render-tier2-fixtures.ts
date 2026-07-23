/**
 * Renders the Tier 2 robustness fixtures (docs/08_TEST_STRATEGY.md):
 * a known-good arpeggio (the same shape as the Tier 1
 * up-c-major-3n-2o-120bpm-16th fixture) with exactly one real-world
 * imperfection applied per fixture. Each should still reconstruct
 * correctly (confidence may drop) or degrade to an honest Partial
 * Result — never an incorrect Complete Result. Regenerate with
 * `npm run fixtures:render:tier2` only when the fixture set
 * intentionally changes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NoteEvent } from '../src/analysis/engine/types';
import { renderEventsToPcm } from '../src/utils/render-events-to-pcm';
import { synthesizeNoteEvents } from '../src/utils/synthesize-note-events';
import { encodeWavPcm16Mono } from '../src/utils/wav-encoder';

const SAMPLE_RATE = 44100;
const targetDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'e2e', 'fixtures');
mkdirSync(targetDir, { recursive: true });

const BASE = {
  styleId: 'up',
  baseMidis: [60, 64, 67],
  octaves: 2,
  bpm: 120,
  rate: '1/16' as const,
  cycles: 6,
};

function cleanEvents(): NoteEvent[] {
  return synthesizeNoteEvents({ ...BASE, gateRatio: 0.5 });
}

function write(name: string, pcm: Float32Array): void {
  const wav = encodeWavPcm16Mono(pcm, SAMPLE_RATE);
  writeFileSync(join(targetDir, name), wav);
  console.log(`${name} — ${(wav.length / 1024).toFixed(0)} KiB`);
}

/** Sums same-length-or-shorter buffers into a new one sized to the longest. */
function mix(...layers: readonly Float32Array[]): Float32Array {
  const length = Math.max(...layers.map((l) => l.length));
  const output = new Float32Array(length);
  for (const layer of layers) {
    for (let i = 0; i < layer.length; i += 1) {
      output[i] += layer[i];
    }
  }
  return output;
}

/** A single attenuated, delayed echo of the input. */
function withDelay(pcm: Float32Array, delaySeconds: number, feedbackGain: number): Float32Array {
  const delaySamples = Math.round(delaySeconds * SAMPLE_RATE);
  const echo = new Float32Array(pcm.length + delaySamples);
  for (let i = 0; i < pcm.length; i += 1) {
    echo[i + delaySamples] = pcm[i] * feedbackGain;
  }
  return mix(pcm, echo);
}

/** Several decaying delayed copies — a cheap deterministic reverb proxy. */
function withReverb(pcm: Float32Array): Float32Array {
  const taps = [0.03, 0.07, 0.12, 0.19, 0.28];
  let output = pcm;
  for (const [index, tapSeconds] of taps.entries()) {
    output = withDelay(output, tapSeconds, 0.35 * Math.pow(0.6, index));
  }
  return output;
}

/** A held low-gain chord under the whole clip. */
function backgroundPad(totalSeconds: number, midis: readonly number[], gain: number): Float32Array {
  const events: NoteEvent[] = midis.map((midi) => ({
    midi,
    onsetSeconds: 0,
    durationSeconds: totalSeconds,
  }));
  return renderEventsToPcm(events, {
    sampleRate: SAMPLE_RATE,
    attackSeconds: 0.3,
    releaseSeconds: 0.3,
    gain,
  });
}

/** Deterministic low-level broadband noise floor. */
function noiseFloor(samples: number, gain: number, seed = 42): Float32Array {
  const output = new Float32Array(samples);
  let s = seed >>> 0;
  for (let i = 0; i < samples; i += 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    output[i] = gain * ((s / 0x100000000) * 2 - 1);
  }
  return output;
}

// --- Timing Jitter -----------------------------------------------------
// Expected: correct style; confidence may decrease.
{
  const events = synthesizeNoteEvents({ ...BASE, gateRatio: 0.5, jitterRatio: 0.15, seed: 1 });
  write('tier2-timing-jitter.wav', renderEventsToPcm(events, { sampleRate: SAMPLE_RATE }));
}

// --- Global Detuning -----------------------------------------------------
// Expected: correct notes after pitch normalization. 35 cents was
// tried first and overshot: combined with Basic Pitch's own
// estimation noise it pushed enough notes past the 50-cent snap
// boundary to round to the wrong semitone entirely.
{
  write(
    'tier2-global-detuning.wav',
    renderEventsToPcm(cleanEvents(), { sampleRate: SAMPLE_RATE, detuneCents: 18 }),
  );
}

// --- Rich Harmonics -----------------------------------------------------
// Expected: cleanup removes harmonic artifacts; correct result.
{
  write(
    'tier2-rich-harmonics.wav',
    renderEventsToPcm(cleanEvents(), {
      sampleRate: SAMPLE_RATE,
      harmonics: [
        { ratio: 2, gain: 0.4 },
        { ratio: 3, gain: 0.2 },
      ],
    }),
  );
}

// --- Single Octave Error -----------------------------------------------
// One note (not the first or last, so both neighbors stay clean) is
// shifted an octave. Expected: style remains correct; confidence
// decreases.
{
  const events = cleanEvents();
  const target = Math.floor(events.length / 2);
  const shifted = events.map((event, index) =>
    index === target ? { ...event, midi: event.midi + 12 } : event,
  );
  write('tier2-single-octave-error.wav', renderEventsToPcm(shifted, { sampleRate: SAMPLE_RATE }));
}

// --- Delay ---------------------------------------------------------------
// Expected: correct result or Partial Result; never confidently wrong.
{
  const dry = renderEventsToPcm(cleanEvents(), { sampleRate: SAMPLE_RATE });
  write('tier2-delay.wav', withDelay(dry, 0.18, 0.4));
}

// --- Reverb ---------------------------------------------------------------
// Expected: graceful degradation.
{
  const dry = renderEventsToPcm(cleanEvents(), { sampleRate: SAMPLE_RATE });
  write('tier2-reverb.wav', withReverb(dry));
}

// --- Background Pad -------------------------------------------------------
// Expected: pad filter removes the sustained notes; arpeggio survives.
// A first attempt placed the pad only a fifth below the arpeggio's
// lowest note (MIDI 48/55 vs. the arp's 60-79 range); Basic Pitch
// detected the pad notes as their own onsets instead of one long
// sustained tone, and they leaked into the observed sequence. Moved
// a full two octaves further down and quieter for clear separation.
{
  const dry = renderEventsToPcm(cleanEvents(), { sampleRate: SAMPLE_RATE });
  const pad = backgroundPad(dry.length / SAMPLE_RATE, [36, 43], 0.08);
  write('tier2-background-pad.wav', mix(dry, pad));
}

// --- Dense Mix -------------------------------------------------------------
// Pad + reverb + a noise floor stacked together. Expected: Partial
// Result is acceptable; an incorrect Complete Result is not.
{
  const dry = renderEventsToPcm(cleanEvents(), { sampleRate: SAMPLE_RATE });
  const withTail = withReverb(dry);
  const pad = backgroundPad(withTail.length / SAMPLE_RATE, [36, 43, 46], 0.1);
  const noise = noiseFloor(withTail.length, 0.03);
  write('tier2-dense-mix.wav', mix(withTail, pad, noise));
}
