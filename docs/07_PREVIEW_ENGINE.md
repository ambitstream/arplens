# Preview Engine

**Project:** ArpLens

**Version:** 2.4 (Frozen)

---

# Purpose

The Preview Engine reconstructs the detected arpeggio using a simple synthesizer.

Its purpose is **verification**, not sound recreation.

The preview allows users to compare the generated sequence with the original audio fragment.

The Preview Engine never attempts to reproduce the original synthesizer timbre.

---

# Design Principles

## Structural Verification

The preview exists to verify:

- note order
- rhythm
- octaves
- arpeggiator style

It does NOT verify:

- oscillator
- filter
- ADSR
- effects
- sound design

---

## Deterministic

The same analysis result always produces identical playback.

Randomness is prohibited.

---

## Lightweight

The preview should initialize instantly.

No samples.

No external assets.

No effects.

---

## Configurable

The preview synth should be configurable through a single configuration object.

The playback engine must not contain hardcoded synthesis parameters.

---

# Technology

The Preview Engine uses:

- Tone.js
- Tone.Transport
- Tone.MonoSynth

The MVP does not require any additional audio libraries.

---

# Input

The Preview Engine receives a complete Result DTO.

Example:

```typescript
{
    bpm,
    rate,
    stepDuration,
    inputNotes,
    style,
    octaves,
    sequence,
    sequenceSource
}
```

For partial results, `stepDuration` alone is sufficient to
schedule playback.

The Preview Engine never receives raw audio.

---

# Output

The output is:

- synthesized preview audio

Nothing else.

---

# Playback Source

## Complete Result

If Style is detected:

```
Result DTO

↓

Style Registry

↓

Generator

↓

Sequence

↓

Tone.js
```

The preview is generated directly from the Style Registry.

This guarantees that the user hears exactly what the reconstructed settings produce.

---

## Partial Result

If Style is NOT detected:

```
Quantized Sequence

↓

Tone.js
```

The Preview Engine plays the quantized detected sequence.

Timing is derived from `stepDuration`, which is always present
whenever a quantized sequence exists.

This allows the user to verify transcription quality even when no supported style was found.

---

# Tone.js Synth

The MVP uses a single:

```
Tone.MonoSynth
```

Configuration is intentionally simple.

Suggested defaults:

- Oscillator: Sawtooth
- Low-pass filter enabled
- Fast attack
- Short release
- Fixed gate (~80% of step)
- Moderate output gain

The exact values are defined in configuration.

---

# Preview Configuration

All synthesis parameters are stored in one immutable configuration object.

Example:

```typescript
PreviewConfig {

    oscillator

    filter

    envelope

    gain

    gate

}
```

Changing the preview sound must never require changes to playback logic.

---

# Scheduling

Playback uses:

```
Tone.Transport
```

All note timings are derived from:

```
Step Duration
```

The Preview Engine never schedules notes using wall-clock timers.

---

# Playback Controls

One control:

```
Play Modulation
```

A single Play ↔ Pause toggle. There is no separate Loop
button — see the Looping section below.

Pause resumes from the paused position.

After any edit, playback restarts from the beginning of the
reconstructed cycle.

---

# Looping

The preview loops continuously.

Looping is the default behavior.

There is no one-shot playback mode in the MVP.

---

# A/B Comparison

Preview playback and original-audio playback are mutually
exclusive.

The app-level Playback Controller (UI layer) enforces
exclusivity: starting one pauses the other.

A/B comparison is performed by toggling between the two.

Simultaneous synchronized playback is intentionally out of
scope for the MVP.

In Arpeggio Sandbox mode there is no original-audio playback,
so Play Modulation has nothing to be exclusive with.

---

# Arpeggio Sandbox

The Preview Engine's input contract is unchanged: it does not
know whether a Result DTO ever existed.

Arpeggio Sandbox seeds the same editable model that Manual
Editing already produces, directly with default values.

The Preview Engine plays the registry-generated sequence
exactly as it would for any complete, editable result.

---

# User Editing

Whenever the user edits:

- Input Notes
- Style
- Rate
- Octaves
- BPM

the sequence is regenerated through the Style Registry.

The Preview Engine immediately reflects the updated sequence.

Audio transcription is never re-run.

---

# Timing

The Preview Engine derives timing from:

- BPM
- Rate
- Step Duration

No timing values are calculated independently.

---

# Polyphony

The MVP is monophonic.

Each playback step contains exactly one note.

Future versions may support polyphonic steps through the Style Registry.

The Preview Engine should not require redesign.

---

# Browser Audio

The Preview Engine must comply with browser autoplay policies.

The AudioContext is created only after the first user interaction.

---

# Performance

Playback generation should be effectively instantaneous.

The Preview Engine should not introduce any noticeable latency.

It must never block the UI thread.

---

# Error Handling

Possible preview errors include:

- AudioContext unavailable
- Tone.js initialization failed
- Invalid Result DTO
- Invalid generated sequence

Errors should never affect the Analysis Engine.

---

# Future Compatibility

The Preview Engine should support future improvements without changing its public interface.

Examples:

- PolySynth
- Chord Trigger
- Alternative synth engines
- Configurable preview sounds
- MIDI output

The input contract must remain unchanged.

---

# Explicit Non-Goals

The Preview Engine does NOT perform:

- audio analysis
- transcription
- style detection
- sound matching
- preset reconstruction
- effects simulation
- MIDI export

---

# Definition of Done

The Preview Engine is complete when:

- complete results play through the Style Registry
- partial results play the detected sequence
- playback is deterministic
- playback loops correctly
- editing immediately updates playback
- no analysis logic exists inside the Preview Engine
- all synthesis parameters are configurable through a single configuration object