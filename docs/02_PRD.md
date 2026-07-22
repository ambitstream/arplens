# Product Requirements Document

**Project:** ArpLens

**Version:** 2.6 (Frozen)

---

# Vision

ArpLens allows musicians to recreate standard synthesizer arpeggiator settings from audio.

Instead of manually experimenting with arpeggiator parameters, users can analyze a short audio fragment and receive the settings required to reproduce the same arpeggio inside their favorite synthesizer, plugin, or DAW.

ArpLens focuses on reconstructing **how the arpeggiator was programmed**, not on recreating the original sound.

---

# Problem Statement

Many electronic music tracks contain recognizable arpeggiator patterns.

Although experienced musicians can often identify the notes, reproducing the exact arpeggiator configuration still requires experimentation.

Typical questions include:

- Which notes were held?
- Which arpeggiator style was used?
- What playback rate was used?
- How many octaves were enabled?
- What BPM matches the pattern?

Finding these settings manually is time-consuming.

ArpLens automates this process.

---

# Product Goal

Given a short audio fragment containing a standard arpeggiated synthesizer phrase, reconstruct the most probable arpeggiator settings required to recreate it.

The output should be immediately usable inside a synthesizer or DAW.

---

# Target Audience

Primary users:

- electronic music producers
- synthesizer enthusiasts
- sound designers
- Ableton Live users
- Logic Pro users
- Cubase users
- FL Studio users
- Bitwig users

Secondary users:

- students learning synthesis
- music teachers
- content creators

---

# Core Principles

## Reconstruct settings, not audio

The product reconstructs arpeggiator parameters.

It does not attempt to reproduce the original synthesizer sound.

---

## Honest Results

The application must never invent information.

If a parameter cannot be determined reliably, it should be marked as **Not detected** rather than guessed.

---

## Browser First

The MVP runs entirely in the browser.

No backend is required.

---

## Deterministic

The same input should always produce the same result.

---

## Simplicity First

The interface should remain minimal.

One page.

One workflow.

No unnecessary controls.

---

# Definition of Arpeggio

For the purposes of ArpLens:

> A standard arpeggio is a repeating ordered sequence of pitched notes that can be explained by a deterministic arpeggiator pattern applied to a set of input notes.

Patterns that cannot be explained by a supported arpeggiator style are considered unsupported.

---

# MVP Scope

The MVP supports:

- Browser-based analysis
- Audio upload
- MP3
- WAV
- M4A (browser-supported codecs only)
- Focus Region selection
- Loop selection
- Standard arpeggio detection
- Input note detection
- Style detection
- Rate detection
- Octave detection
- BPM detection
- Tone.js preview
- Manual editing
- Partial results
- Arpeggio Sandbox (experiment with settings without uploading audio)

---

# Out of Scope

The MVP intentionally excludes:

- MIDI export
- Plugin export
- DAW integration
- Preset export
- Source separation
- Polyphonic arpeggiators
- Chord Trigger
- Piano Roll editor
- ADSR detection
- Filter detection
- Oscillator detection
- Sound recreation
- AI-generated recommendations
- User accounts
- Cloud storage
- Collaboration
- Analytics

---

# Supported Audio

Formats:

- MP3
- WAV
- M4A (supported browser codecs)

Maximum duration:

10 minutes

Maximum size:

200 MB

Warning displayed:

- over 6 minutes
- over 100 MB

---

# Workflow

## Step 1

Upload audio.

---

## Step 2

If the audio is longer than one minute:

Select a **Focus Region** (maximum one minute).

Otherwise the whole audio becomes the Focus Region.

---

## Step 3

Select one seamless repeating arpeggio phrase.

Selection length:

Minimum:

3 seconds

Maximum:

20 seconds

The selected phrase should loop seamlessly whenever possible.

Selection quality directly affects analysis quality.

---

## Step 4

Run analysis.

---

## Step 5

Review results.

---

## Step 6

Optionally edit detected values.

---

## Step 7

Preview reconstructed arpeggio.

---

# Arpeggio Sandbox

An alternate entry point, reachable from the Upload section,
that lets the user experiment with arpeggiator settings without
uploading audio.

The Sandbox skips Steps 1–4 entirely and opens directly on
editable settings, seeded with default values.

It is an in-page mode of the same single page, not a separate
page or route.

The Sandbox never has:

- Confidence (no analysis was performed)
- source audio, and therefore no Play Source control

The user may only edit settings and use Play Modulation.

The full behavior is defined in the UI Specification.

---

# Output

The application may return:

- BPM
- Input Notes
- Style
- Rate
- Octaves
- Detected Sequence
- Confidence

Notes are displayed using **sharp notation only**.

Examples:

- C#
- D#
- F#

Flat notation is never used.

Octave numbers use middle C = C3 (MIDI 60), matching the DAWs
the audience uses. See the Glossary "Octave Convention".

---

# Partial Results

The application may return partial results.

Example:

```
BPM

✓ 124

Rate

✓ 1/16

Input Notes

✓ C
✓ E
✓ G

Octaves

✓ 2

Style

Not detected
```

Only confidently determined parameters should be shown.

Partial results always respect the parameter dependency rules
defined in the Analysis Engine document.

---

# Manual Editing

Users may edit:

- Input Notes
- Style
- Rate
- Octaves
- BPM (×2 / ÷2, or a ±1 fine adjustment)

Only ×2 / ÷2 update Rate accordingly, since they preserve a
clean mathematical relationship to the original tempo.

The ±1 fine adjustment changes BPM independently of Rate.

Manual editing never re-runs transcription.

It only regenerates the reconstructed sequence and preview.

---

# Supported Styles (MVP)

- Up
- Down
- UpDown
- DownUp

The architecture must support adding new styles without redesign.

---

# Supported Octaves (MVP)

Range:

1–4

---

# Supported Rates (MVP)

- 1/4
- 1/8
- 1/16
- 1/32
- 1/4T
- 1/8T
- 1/16T
- 1/32T

---

# Confidence

Confidence is displayed as one overall value:

- High
- Medium
- Low

Confidence should reflect the weakest reliable stage of the analysis pipeline.

---

# Error States

The application distinguishes between:

- Unsupported browser
- Unsupported audio format
- Audio decode failed
- No pitched notes detected
- No repeating arpeggio detected
- Arpeggiator style not detected
- Analysis engine unavailable
- Unexpected analysis error

Errors should always be specific.

---

# Known Limitations

The MVP is optimized for:

- clean synthesizer arpeggios
- one instrument
- stable tempo
- minimal delay
- minimal reverb

The MVP may perform poorly on:

- dense mixes
- vocals
- live recordings
- heavy delay
- heavy reverb
- unsupported arpeggiator styles
- non-repeating note patterns

---

# Success Criteria

A successful analysis produces settings that allow a musician to recreate an audibly equivalent arpeggio inside a synthesizer or DAW with minimal manual adjustment.

The product should prefer:

correct partial results

over

confidently incorrect complete results.