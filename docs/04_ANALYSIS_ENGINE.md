# Analysis Engine

**Project:** ArpLens

**Version:** 2.4 (Frozen)

---

# Purpose

The Analysis Engine is responsible for reconstructing standard arpeggiator settings from a short audio fragment.

It receives an audio loop selected by the user and returns the most probable arpeggiator configuration that explains the observed note sequence.

The engine is deterministic.

It never invents information.

Whenever confidence is insufficient, the engine produces a partial result instead of an incorrect complete result.

---

# Scope

The Analysis Engine is responsible for:

- audio transcription
- note cleanup
- pitch normalization
- timing analysis
- step-grid estimation
- quantization
- cycle detection
- hypothesis generation
- style matching
- BPM/rate resolution
- confidence evaluation
- partial-result generation

The engine is NOT responsible for:

- UI
- waveform rendering
- file upload
- playback controls
- Tone.js synthesis

---

# Design Principles

## Deterministic

The same input always produces the same output.

---

## Honest

Never invent missing information.

Unknown is always better than incorrect.

---

## Pure

The engine contains no UI logic.

---

## Stateless

The engine keeps no persistent state between analyses.

Every request is independent.

---

## Configurable

Thresholds are configuration values.

Algorithms are code.

Configuration and implementation must remain separate.

---

# High-Level Pipeline

```
PCM Input (decoded on main thread)

↓

Deterministic Resampling

↓

Basic Pitch Transcription

↓

Cleanup

↓

Pitch Normalization

↓

Step Grid Estimation

↓

Quantization

↓

Cycle Detection

↓

Joint Hypothesis Enumeration

↓

Style Matching

↓

Joint BPM / Rate Resolution

↓

Confidence Evaluation

↓

Partial Result Assembly

↓

Result DTO
```

---

# Stage 1 — PCM Input Contract

Audio decoding happens OUTSIDE the engine.

The Audio Decode Service (main thread) decodes the file,
converts it to mono and extracts the selected loop.

Rationale:

`decodeAudioData` is unavailable inside Web Workers, and the
engine must remain free of browser APIs.

The engine receives:

- mono PCM (Float32Array)
- sample rate
- loop duration (3–20 seconds)

Responsibilities inside the engine:

- validate the PCM contract
- resample to the transcription sample rate using the
  engine's own deterministic resampler

Browser resamplers are never used.

They differ between browsers and would break determinism.

Failure:

Invalid PCM Input

---

# Stage 2 — Basic Pitch

Spotify Basic Pitch (WASM)

Input:

PCM

Output:

Pitch Events

Each event contains:

- pitch
- onset
- offset
- confidence

The engine treats this output as noisy observations.

No product decisions are made here.

---

# Stage 3 — Cleanup

Purpose:

Convert noisy transcription into a clean monophonic event stream.

Operations:

- confidence filtering
- minimum duration filtering
- merge split notes
- remove overlapping duplicates
- remove sustained background notes

Output:

Ordered monophonic pitch events

The cleanup stage must never classify styles.

---

# Stage 4 — Pitch Normalization

Responsibilities:

Estimate global tuning offset.

Snap detected pitches to semitones.

Use sharp note naming only.

Examples:

C#

D#

F#

Flat notation is never produced.

---

# Stage 5 — Step Grid Estimation

Purpose:

Estimate the temporal grid of the arpeggio.

The atomic timing unit is the step.

The engine estimates:

- step duration
- grid phase

The engine does NOT estimate BPM here.

Output:

Step Grid

---

# Stage 6 — Quantization

Responsibilities:

Assign every detected note to the nearest grid step.

Record:

- quantized sequence
- timing residuals

Output:

Ordered quantized sequence

---

# Stage 7 — Cycle Detection

Purpose:

Find one repeating arpeggio cycle.

Two supported cases:

Case A

Selection contains exactly one cycle.

↓

Entire selection becomes the cycle.

Case B

Selection contains multiple cycles.

↓

Detect shortest repeating period.

↓

Evaluate cycle consistency.

Approximate cycle detection is intentionally outside MVP.

---

# Stage 8 — Joint Hypothesis Enumeration

Purpose

Generate candidate arpeggiator configurations.

The following parameters are determined together:

- Input Notes
- Octaves
- Style

These values are never inferred independently.

Every hypothesis represents one complete explanation of the observed sequence.

---

# Stage 9 — Style Matching

The Style Registry generates expected note sequences.

Each generated sequence is compared against the detected cycle.

Comparison is:

- deterministic
- rotation invariant

Exact matches are preferred.

Near matches use edit-distance scoring.

Tie-breaking:

1. Fewest input notes

2. Fewest octaves

3. Phase preference

4. Registry order

The winning hypothesis becomes the reconstructed arpeggiator configuration.

---

## Phase Preference

Some styles generate cycles that are exact rotations of each
other for every input.

Example:

UpDown and DownUp.

Rotation-invariant scoring alone can never distinguish them.

When hypotheses remain tied after rules 1 and 2:

Prefer the hypothesis whose generated cycle matches the
observed cycle at rotation 0.

Rotation 0 means the user's loop starts on the first note of
the generated pattern.

Users are instructed to select a phrase with a clean start,
so the loop start is usable evidence.

---

## Rotation-Equivalent Hypotheses and Ambiguity

Hypotheses whose generated cycles are rotations of each other,
with identical Input Notes and Octaves, describe the same
underlying pattern.

They count as ONE hypothesis for the ambiguity component of
confidence.

Without this rule, every UpDown or DownUp result would
permanently receive Low confidence.

---

# Stage 10 — BPM / Rate Resolution

BPM and Rate are resolved together.

Neither parameter is considered primary.

The engine evaluates supported rate values.

Supported rates are defined in the PRD.

If multiple solutions are valid, apply the deterministic
preference rule:

1. Prefer BPM inside the preferred range (default 90–180).

2. If several candidates remain, prefer rates in this order:

```
1/16, 1/8, 1/32, 1/4, 1/16T, 1/8T, 1/32T, 1/4T
```

3. If no candidate lies inside the preferred range, choose
the BPM closest to 120.

The preferred range and the rate order are configuration
values, not hardcoded constants.

Users may later switch BPM using:

×2

÷2

without re-running transcription.

---

# Stage 11 — Confidence Evaluation

Confidence is calculated from four independent components.

## Transcription

Quality of detected pitch events.

---

## Grid

Quality of temporal alignment.

---

## Pattern

Quality of style matching.

---

## Ambiguity

Difference between the best and second-best hypothesis.

---

Overall confidence equals the weakest component.

Displayed values:

- High
- Medium
- Low

Internal scores are implementation details.

---

# Stage 12 — Partial Results

The engine may stop before a complete reconstruction.

Supported levels:

Level 0

No pitched material.

↓

Failure.

---

Level 1

Quantized Sequence

Step Duration

Step Duration is always available whenever a quantized
sequence exists, because quantization requires a Step Grid.

Preview is available from Level 1 upward.

Below Level 4 the preview plays the quantized sequence.

---

Level 2

Sequence

Step Duration

BPM

Rate

---

Level 3

Input Notes

Octaves

Sequence

BPM

Rate

Input Notes and Octaves are reported without Style only when
every competitive hypothesis agrees on them while disagreeing
on Style.

They are still produced by Joint Hypothesis Enumeration.

They are never inferred independently.

---

Level 4

Complete reconstruction.

Includes:

Style

Confidence

Preview plays the registry-generated sequence.

The engine never skips directly to a higher level.

---

# Result DTO

The engine returns one immutable object.

Example:

```typescript
{
    status,
    bpm,
    rate,
    stepDuration,
    inputNotes,
    octaves,
    style,
    sequence,
    sequenceSource,   // "registry" | "quantized"
    confidence,
    engineVersion,
    registryVersion,
    configurationHash
}
```

`stepDuration` keeps partial results playable when BPM and
Rate are not detected.

`sequenceSource` tells consumers whether the sequence was
generated by the Style Registry or reconstructed from
quantization.

User edits never modify this object.

---

# Determinism

The following values are fixed:

- registry
- thresholds
- tie-break order
- algorithms

Randomness is prohibited.

## Determinism Scope

Determinism is guaranteed from PCM input onward.

Identical PCM always produces identical results on every
browser and operating system.

Lossy formats (MP3, M4A) are decoded by browser codecs.

Different browsers may produce slightly different PCM from the
same compressed file.

Cross-browser bit-exact reproducibility is therefore
guaranteed only for PCM/WAV input.

Resampling happens inside the engine with a deterministic
resampler for the same reason.

---

# Performance

Heavy computation runs inside a Web Worker.

Basic Pitch uses the WASM backend.

The UI thread must remain responsive during analysis.

---

# Thresholds

The following values are configurable.

Examples:

- confidence floor
- quantization tolerance
- ambiguity epsilon

Thresholds are NOT hardcoded inside algorithms.

Calibration is performed using the Test Corpus.

---

# Failure States

The engine distinguishes between:

- Invalid PCM Input
- No Pitched Material
- No Repeating Cycle
- Style Not Detected
- Internal Engine Error

Each failure has its own state.

Decode failures (Audio Decode Failed, Unsupported Format) are
raised by the Audio Decode Service before the engine runs.

---

# Future Compatibility

The Analysis Engine is designed to support future extensions without redesign.

Examples:

- additional styles
- polyphonic steps
- Chord Trigger
- GPU acceleration
- alternative transcription engines

These extensions must preserve the public Result DTO.

---

# Out of Scope

The Analysis Engine does not perform:

- sound recreation
- preset reconstruction
- oscillator detection
- filter detection
- ADSR detection
- MIDI export
- plugin integration

---

# Definition of Done

The Analysis Engine is considered complete when:

- all Tier 0–3 tests pass
- deterministic output is verified
- confidence calibration is complete
- no confidently incorrect result exists within the official Test Corpus
- the engine produces partial results instead of incorrect complete reconstructions

## Engine Versioning

Every analysis result must include:

- engineVersion
- registryVersion
- configurationHash

These values are intended for debugging, benchmarking and reproducibility.

They are not required to be displayed in the user interface.