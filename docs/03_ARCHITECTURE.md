# Architecture

**Project:** ArpLens

**Version:** 2.4 (Frozen)

---

# Purpose

This document defines the high-level architecture of ArpLens.

It describes the major system components, their responsibilities, communication flow, and technology choices.

Detailed implementation of the Analysis Engine is intentionally described in **04_ANALYSIS_ENGINE.md**.

---

# Architecture Principles

The architecture follows these principles.

## Browser First

The MVP runs entirely inside the browser.

No backend services are required.

All audio processing happens locally on the user's device.

---

## Deterministic

The same input must always produce the same result.

No randomness is allowed inside the Analysis Engine.

---

## Separation of Responsibilities

Each component has one clearly defined responsibility.

Business logic must never be coupled to UI code.

---

## Pure Core

The Analysis Engine is implemented as a pure computational core.

It knows nothing about:

- React
- DOM
- CSS
- Components
- User Interface

---

## Single Source of Truth

Every important concept has exactly one authoritative definition.

Examples:

- Product requirements → PRD
- Style definitions → Style Registry
- Analysis pipeline → Analysis Engine

---

## Extensible

Future arpeggiator styles should be added without redesigning existing components.

---

# Technology Stack

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

Audio

- Spotify Basic Pitch
- Tone.js

Browser APIs

- Web Audio API
- Web Worker
- WebAssembly (WASM)

Testing

- Vitest
- Playwright

---

# High-Level Architecture

```
                +----------------------+
                |        React         |
                |         UI           |
                +----------+-----------+
                           |
                           |
                           v
                +----------------------+
                |   Application State  |
                +----------+-----------+
                           |
                           |
                           v
                +----------------------+
                |  Audio Decode        |
                |  Service             |
                |  (main thread, PCM)  |
                +----------+-----------+
                           |
                           |
                           v
                +----------------------+
                |  Analysis Service    |
                +----------+-----------+
                           |
                 postMessage()
                           |
                           v
                +----------------------+
                |     Web Worker       |
                +----------+-----------+
                           |
                           |
                           v
                +----------------------+
                |   Analysis Engine    |
                +----------+-----------+
                           |
                           |
          +----------------+----------------+
          |                                 |
          v                                 v
+---------------------+          +----------------------+
|   Style Registry    |          |   Basic Pitch WASM   |
+---------------------+          +----------------------+
                           |
                           |
                           v
                +----------------------+
                |      Result DTO      |
                +----------+-----------+
                           |
                           |
                           v
                +----------------------+
                |      Tone.js         |
                |      Preview         |
                +----------------------+
```

---

# Major Components

## React UI

Responsible for:

- upload
- waveform
- loop selection
- editing
- displaying results
- preview controls

The UI never performs analysis.

---

## Application State

Stores:

- uploaded audio
- focus region
- selected loop
- analysis results
- UI state

It never contains business logic.

---

## Audio Decode Service

Runs on the main thread.

Responsibilities:

- decode uploaded audio using the Web Audio API
- convert to mono immediately after decode
- release the original file buffer
- compute waveform peaks for the UI
- extract the Focus Region / Loop PCM

Decoding cannot run inside the Web Worker because
`decodeAudioData` is unavailable in workers.

The Analysis Engine therefore never decodes audio.

It receives mono PCM only.

---

## Analysis Service

Acts as the communication layer between React and the Web Worker.

Responsibilities:

- create worker
- send requests
- receive responses
- expose a simple API to React

Example:

```
analyze()

↓

Promise<Result>
```

The service performs no analysis.

---

## Web Worker

Runs the Analysis Engine outside the UI thread.

Responsibilities:

- receive requests
- execute analysis
- return results

Benefits:

- UI remains responsive
- heavy CPU work does not freeze React
- future portability

---

## Analysis Engine

Responsible for:

- transcription
- cleanup
- quantization
- hypothesis generation
- matching
- confidence
- partial results

The complete specification is defined in:

```
04_ANALYSIS_ENGINE.md
```

---

## Basic Pitch

Responsible only for pitch transcription.

Input:

audio

Output:

pitch events

Basic Pitch is not responsible for:

- style detection
- BPM
- quantization
- matching

---

## Style Registry

The Style Registry is the single source of truth for arpeggiator styles.

It is shared by:

- matcher
- preview
- editor
- unit tests

It contains no UI logic.

The complete specification is defined in:

```
05_STYLE_REGISTRY.md
```

---

## Preview Engine

Responsible only for audio playback.

Uses:

Tone.js

Input:

Result DTO

Output:

Preview audio

Preview never performs analysis.

---

# Data Flow

```
Upload Audio

↓

Audio Decode (main thread)

↓

Focus Region

↓

Loop Selection

↓

Analysis Service

↓

Web Worker

↓

Analysis Engine

↓

Result DTO

↓

React UI

↓

User edits

↓

Style Registry

↓

Preview Engine

↓

Playback
```

---

# Result DTO

The Analysis Engine returns one immutable Result object.

Example:

```
Result

status

bpm

rate

stepDuration

inputNotes

octaves

style

sequence

sequenceSource

confidence

engineVersion

registryVersion

configurationHash
```

`stepDuration` keeps partial results playable when BPM and Rate
are not detected.

`sequenceSource` tells consumers whether the sequence was
generated by the Style Registry (`registry`) or reconstructed
from quantization (`quantized`).

The UI never modifies this object.

User edits create a separate editable model.

---

# Arpeggio Sandbox

The Sandbox requires no new architecture.

It is an in-page Application State mode: React UI renders
ResultPanel and Preview directly from a manually-seeded
editable model, bypassing Audio Decode, Analysis Service,
Web Worker and Analysis Engine entirely.

No Result DTO ever exists in this mode.

This is the same "separate editable model" already used by
Manual Editing, seeded with defaults instead of derived from
an analysis result.

Because it is a mode of Application State rather than a route,
the Single Page Application principle (no routing, no
navigation) is unaffected.

---

# Component Dependencies

```
React

↓

Application State

↓

Analysis Service

↓

Web Worker

↓

Analysis Engine

↓

Basic Pitch

↓

Style Registry
```

The dependency graph always points downward.

Lower layers never import upper layers.

---

# Engine Isolation

The Analysis Engine must remain platform independent.

It must not import:

- React
- Tailwind
- DOM APIs
- Browser Components

This allows future reuse in:

- Electron
- Tauri
- Backend
- CLI
- VS Code Extension

without redesign.

---

# Configuration

Runtime configuration should be centralized.

Examples:

- Preview Synth
- Supported Styles
- Supported Rates
- Thresholds
- Confidence Rules

Configuration must not be scattered throughout the codebase.

---

# Audio Memory Management

Large files are handled with a fixed strategy.

1. Decode the full file once using the Web Audio API.
2. Convert to mono immediately.
3. Release the original file buffer and the multi-channel buffer.
4. Precompute waveform peaks for rendering.
5. After Focus Region selection, retain only the Focus Region PCM.

Consequence:

Memory usage peaks transiently during decode
(roughly file size plus decoded PCM).

The 200 MB / 10 minute limit is a desktop-oriented limit.

On mobile devices very large files may still fail to decode.

This is an accepted, documented constraint.

---

# Future Extensions

The architecture intentionally allows:

- additional arpeggiator styles
- polyphonic styles
- Chord Trigger
- MIDI export
- plugin presets
- backend analysis
- GPU acceleration

without changing the public architecture.

---

# Explicit Non-Goals

The architecture does not attempt to optimize for:

- microservices
- distributed systems
- cloud processing
- real-time collaboration
- server-side rendering

These concerns are intentionally outside the MVP.

---

# Architecture Status

The architecture described in this document is considered approved.

Future improvements should extend the architecture rather than replace it.

Breaking architectural changes require explicit approval.