# Engineering Decisions

**Project:** ArpLens

**Version:** 2.0 (Frozen)

---

# Purpose

This document records all approved engineering decisions made during the design of ArpLens.

The purpose is to preserve architectural intent.

Every decision includes:

- the decision itself
- rationale
- consequences

Future contributors should understand *why* a decision exists before proposing changes.

---

# Decision Status

Each decision has one of the following statuses.

## Approved

Frozen for MVP.

Cannot be changed without explicit approval.

---

## Future

Not part of MVP.

May be implemented later.

---

## Rejected

Explicitly considered and rejected.

Should not be reintroduced without a new discussion.

---

# Product Decisions

## D-001

### Browser-only MVP

Status

Approved

Decision

The MVP runs entirely inside the browser.

No backend services are required.

Rationale

- Zero infrastructure cost
- Better privacy
- Simpler deployment
- Faster iteration

Consequence

All analysis must execute locally.

---

## D-002

### Analyze arpeggiator settings, not synthesizer sound

Status

Approved

Decision

ArpLens reconstructs arpeggiator settings only.

Oscillator, filter, ADSR and effects are intentionally ignored.

Rationale

This keeps the MVP focused.

---

## D-003

### Honest results over complete results

Status

Approved

Decision

The engine must prefer partial results over incorrect complete results.

Rationale

Wrong musical information is worse than missing information.

---

## D-004

### Sharp note naming only

Status

Approved

Decision

Display:

C#

D#

F#

Never:

Db

Eb

Gb

Rationale

Consistency.

Avoid enharmonic ambiguity.

---

## D-005

### Chord detection removed

Status

Approved

Decision

Chord detection is not part of the MVP.

Rationale

Input notes are sufficient.

Many arpeggios are not traditional chords.

---

# Architecture Decisions

## D-100

### React + Vite + TypeScript

Status

Approved

Rationale

Simple.

Modern.

Fast.

---

## D-101

### Tailwind CSS

Status

Approved

Rationale

Rapid UI development.

Minimal CSS maintenance.

---

## D-102

### Browser-only Analysis Engine

Status

Approved

Decision

The Analysis Engine runs entirely inside a Web Worker.

Rationale

UI responsiveness.

No backend.

---

## D-103

### Spotify Basic Pitch

Status

Approved

Decision

Spotify Basic Pitch is the transcription engine.

Rationale

Best browser-compatible solution.

Open source.

Mature.

---

## D-104

### WASM Backend

Status

Approved

Decision

Use the WASM backend instead of GPU/WebGL.

Rationale

Improved determinism across browsers and operating systems.

---

## D-105

### Web Worker

Status

Approved

Decision

Run all analysis inside a dedicated Web Worker.

Rationale

Prevent UI blocking.

Improve responsiveness.

---

# Analysis Engine Decisions

## D-200

### Joint Hypothesis Enumeration

Status

Approved

Decision

Input Notes, Octaves and Style are solved together.

Rationale

They are mathematically dependent.

Sequential inference introduces unnecessary errors.

---

## D-201

### Style Matching

Status

Approved

Decision

Use:

Generative Style Registry

+

Rotation-invariant Edit Distance

Rationale

One registry powers:

- matcher
- preview
- editor
- tests

Single Source of Truth.

---

## D-202

### Deterministic Tie-Break

Status

Approved

Decision

When multiple hypotheses score equally:

1. Fewest Input Notes
2. Fewest Octaves
3. Registry Order

Rationale

Stable reproducible results.

---

## D-203

### BPM / Rate Resolution

Status

Approved

Decision

Resolve BPM and Rate together.

Neither parameter is primary.

Rationale

The same note timing can represent multiple BPM/Rate combinations.

---

## D-204

### Confidence

Status

Approved

Decision

Display one overall confidence band:

- High
- Medium
- Low

Rationale

Avoid overwhelming the user.

Internal scoring remains hidden.

---

## D-205

### Partial Results

Status

Approved

Decision

The engine may stop at any supported Partial Result level.

Rationale

Avoid incorrect complete reconstructions.

---

# Style Registry Decisions

## D-300

### Generator-based Registry

Status

Approved

Decision

Each style is implemented as a pure generator.

Rationale

Supports:

- matcher
- preview
- editor
- tests

using one implementation.

---

## D-301

### Abstract Note Indices

Status

Approved

Decision

Registry generators operate on abstract indices.

Never on:

- note names
- MIDI
- frequencies

Rationale

Maximum reuse.

---

## D-302

### Step = Set of Indices

Status

Approved

Decision

Each generated step contains a set of note indices.

Even though MVP is monophonic.

Rationale

Future support for:

- Chord Trigger
- Polyphonic Styles

without redesign.

---

# UI Decisions

## D-400

### Single Page Application

Status

Approved

Decision

Entire MVP lives on one page.

Rationale

Fast workflow.

Minimal navigation.

---

## D-401

### Focus Region

Status

Approved

Decision

Audio longer than one minute requires selecting a Focus Region.

Maximum:

1 minute.

Rationale

Improves usability.

Reduces browser memory usage.

---

## D-402

### Loop Selection

Status

Approved

Decision

Users analyze only a seamless loop.

Allowed duration:

3–20 seconds.

Rationale

Improves cycle detection accuracy.

---

## D-403

### Manual Editing

Status

Approved

Decision

Editing never re-runs transcription.

It regenerates only:

- sequence
- preview

Rationale

Instant feedback.

---

# Preview Decisions

## D-500

### Tone.js MonoSynth

Status

Approved

Decision

Use one Tone.MonoSynth with a configurable sawtooth preset.

Rationale

Simple.

Fast.

Deterministic.

Enough for structural verification.

---

# Testing Decisions

## D-600

### Tiered Testing

Status

Approved

Decision

Testing is divided into:

Tier 0

Tier 1

Tier 2

Tier 3

Rationale

Separates deterministic logic from noisy audio analysis.

---

## D-601

### Golden Dataset

Status

Approved

Decision

Maintain a Golden Dataset for regression testing.

Rationale

Every engine version should be compared against the same reference data.

---

# Rejected Decisions

## R-001

Backend required for MVP

Status

Rejected

Reason

Unnecessary infrastructure.

Higher cost.

---

## R-002

SSR / Next.js

Status

Rejected

Reason

Provides no meaningful value for this application.

---

## R-003

Piano Roll Editor

Status

Rejected

Reason

Adds significant complexity.

Simple note editing is sufficient.

---

## R-004

Custom Pattern Mode

Status

Rejected

Reason

MVP focuses exclusively on standard arpeggiators.

---

## R-005

Synth Parameter Detection

Status

Rejected

Reason

Outside product scope.

---

# Future Decisions

## F-001

Backend Analysis

Status

Future

Potential technology:

FastAPI.

Purpose:

Heavy models.

Batch analysis.

---

## F-002

Polyphonic Styles

Status

Future

Requires:

Chord Trigger.

---

## F-003

MIDI Export

Status

Future

Out of MVP.

---

## F-004

Plugin Presets

Status

Future

Ableton

Logic

Bitwig

FL Studio

---

## F-005

Additional Style Registry Entries

Status

Future

Examples:

- Converge
- Diverge
- Pinky Up
- Thumb Up
- Play Order

No architecture redesign expected.

---

# Modification Policy

Approved decisions are considered frozen.

Changing an approved decision requires:

1. A documented rationale.
2. Review of architectural impact.
3. Documentation update.
4. Changelog entry.

No approved decision should be changed implicitly.

---

# Definition of Done

This document is complete when:

- every major engineering decision is recorded
- every rejected alternative is documented
- future contributors can understand the reasoning behind the architecture without consulting previous discussions