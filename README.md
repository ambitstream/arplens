# ArpLens

Recreate synthesizer arpeggiator settings from audio.

**Live (beta):** https://ambitstream.github.io/arplens/

Upload a short audio fragment with an arpeggio, and ArpLens reconstructs how the
arpeggiator was programmed: input notes, style, rate, octaves and BPM. The result
is editable and can be previewed immediately. ArpLens reconstructs settings, not
the original sound.

## Features

- Runs entirely in the browser. No backend, audio never leaves your device.
- Formats: WAV, MP3, M4A (browser-supported codecs).
- Focus Region and Loop Selection to pick the exact phrase to analyze.
- Detects input notes, style, rate, octaves and BPM.
- Styles: Up, Down, UpDown, DownUp.
- Rates: 1/4, 1/8, 1/16, 1/32 and triplets.
- Honest results: a parameter that cannot be determined reliably is shown as
  _Not detected_, with a confidence badge instead of a guess.
- Manual editing with instant Tone.js preview.
- Arpeggio Sandbox: experiment with arpeggiator settings without uploading audio.
- Deterministic: the same input always produces the same result.

## Beta limitations

- Works best on clean, isolated arpeggios.
- Fragments from full mixes are less reliable: delay, reverb, ghost notes and
  other instruments can reduce accuracy.
- Monophonic arpeggiators only. No chord trigger, MIDI export or sound recreation.

## How it works

1. **Transcription:** [Basic Pitch](https://github.com/spotify/basic-pitch) (TensorFlow.js,
   WASM backend) runs in a Web Worker and turns audio into noisy pitch events.
2. **Analysis engine:** a deterministic pipeline cleans the events, estimates the
   step grid, quantizes, then enumerates joint hypotheses (input notes × octaves ×
   style) from a typed Style Registry and scores them with rotation-invariant edit
   distance.
3. **Result:** BPM and rate are resolved, confidence is calibrated, and partial
   results are reported honestly.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS, Tone.js, Basic Pitch / TensorFlow.js (WASM),
Vitest, Playwright, GitHub Actions, GitHub Pages.

## Testing

- Unit tests for every engine stage and the Style Registry (Tier 0).
- End-to-end tests in a real browser on rendered audio fixtures:
  clean audio (Tier 1), robustness: reverb, delay, detuning, background pads (Tier 2),
  and failure cases (Tier 3).
- A Golden Dataset manifest used to calibrate confidence thresholds.

CI runs format, lint, typecheck, unit and e2e tests on every PR. Every push to
`main` deploys to GitHub Pages after all checks pass.

## Development

Requires Node.js (see `.nvmrc`).

```bash
npm install          # also copies the Basic Pitch model and WASM binaries into public/
npm run dev          # dev server
npm run test:run     # unit tests
npm run test:e2e     # end-to-end tests
npm run build        # production build
```

## Documentation

The full specification (PRD, architecture, analysis engine, Style Registry, UI spec,
test strategy, decisions log) is in [`docs/`](docs/). Start with
[`docs/00_READ_ME.md`](docs/00_READ_ME.md).

## License

[MIT](LICENSE)
