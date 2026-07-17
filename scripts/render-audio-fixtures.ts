/**
 * Renders the Tier 1 audio fixtures (D-602): known arpeggiator
 * settings -> Style Registry -> note events -> clean sine synth ->
 * 16-bit WAV. The WAVs are committed so CI decodes byte-identical
 * input everywhere; regenerate with `npm run fixtures:render` only
 * when the fixture set intentionally changes.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SupportedRate } from '../src/config/rates';
import { renderEventsToPcm } from '../src/utils/render-events-to-pcm';
import { synthesizeNoteEvents } from '../src/utils/synthesize-note-events';
import { encodeWavPcm16Mono } from '../src/utils/wav-encoder';

const SAMPLE_RATE = 44100;

interface Fixture {
  readonly name: string;
  readonly styleId: string;
  readonly baseMidis: readonly number[];
  readonly octaves: number;
  readonly bpm: number;
  readonly rate: SupportedRate;
  readonly cycles: number;
}

// C4/E4/G4 and A3/C4/E4 (220-780 Hz fundamentals) sit in the range
// where Basic Pitch onset detection is most reliable — Tier 1 is
// the clean happy path; low-register robustness belongs to Tier 2.
// Cycle counts keep every clip in the 4-6 second band.
const FIXTURES: readonly Fixture[] = [
  {
    name: 'up-c-major-3n-2o-120bpm-16th',
    styleId: 'up',
    baseMidis: [60, 64, 67],
    octaves: 2,
    bpm: 120,
    rate: '1/16',
    cycles: 6,
  },
  {
    name: 'down-c-major-3n-2o-120bpm-16th',
    styleId: 'down',
    baseMidis: [60, 64, 67],
    octaves: 2,
    bpm: 120,
    rate: '1/16',
    cycles: 6,
  },
  // Turnaround styles re-strike the same pitch two steps apart; at
  // 1/16 the transcription model merges those re-onsets. 1/8 keeps
  // the fixture clean — 1/16 coverage comes from the up/down pair.
  {
    name: 'up-down-a-minor-3n-1o-124bpm-8th',
    styleId: 'up-down',
    baseMidis: [57, 60, 64],
    octaves: 1,
    bpm: 124,
    rate: '1/8',
    cycles: 5,
  },
  {
    name: 'down-up-a-minor-3n-1o-124bpm-8th',
    styleId: 'down-up',
    baseMidis: [57, 60, 64],
    octaves: 1,
    bpm: 124,
    rate: '1/8',
    cycles: 5,
  },
];

const targetDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'e2e', 'fixtures');
mkdirSync(targetDir, { recursive: true });
for (const stale of readdirSync(targetDir)) {
  if (stale.endsWith('.wav')) {
    rmSync(join(targetDir, stale));
  }
}

for (const fixture of FIXTURES) {
  const events = synthesizeNoteEvents({
    styleId: fixture.styleId,
    baseMidis: fixture.baseMidis,
    octaves: fixture.octaves,
    bpm: fixture.bpm,
    rate: fixture.rate,
    cycles: fixture.cycles,
    // Staccato gate: repeated pitches (UpDown's turnarounds) need
    // clear silence between re-onsets or the transcription model
    // merges them into one sustained note.
    gateRatio: 0.5,
  });

  const pcm = renderEventsToPcm(events, { sampleRate: SAMPLE_RATE });
  const wav = encodeWavPcm16Mono(pcm, SAMPLE_RATE);

  const path = join(targetDir, `${fixture.name}.wav`);
  writeFileSync(path, wav);
  console.log(`${fixture.name}.wav — ${(wav.length / 1024).toFixed(0)} KiB`);
}
