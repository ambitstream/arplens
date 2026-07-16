# Engineering Decisions

**Project:** ArpLens

**Version:** 2.3 (Frozen)

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

## D-106

### Main-thread Audio Decode

Status

Approved (v2.1)

Decision

Audio decoding runs in a main-thread Audio Decode Service.

The Analysis Engine receives mono PCM only and performs its
own deterministic resampling.

Rationale

`decodeAudioData` is unavailable inside Web Workers.

The engine must remain free of browser APIs.

Consequence

Decode failures are raised before the engine runs.

---

## D-107

### Determinism Scope

Status

Approved (v2.1)

Decision

Bit-exact determinism is guaranteed from PCM input onward,
across browsers and operating systems.

Lossy codec decoding (MP3, M4A) is deterministic only within a
single environment.

Rationale

Browser codecs produce slightly different PCM from the same
compressed file.

Consequence

Cross-environment determinism tests use WAV/PCM fixtures.

---

## D-108

### Audio Memory Strategy

Status

Approved (v2.1)

Decision

Keep the 200 MB / 10 minute product limits.

After decode: convert to mono immediately, release source
buffers, keep waveform peaks, and retain only the Focus Region
PCM.

Rationale

Bounded steady-state memory without changing product limits.

Consequence

The transient decode peak remains high.

Very large files may fail on mobile devices.

This is an accepted, documented constraint.

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
3. Phase Preference (rotation-0 match)
4. Registry Order

Rationale

Stable reproducible results.

Amended in v2.1: Phase Preference was inserted before Registry
Order to resolve rotation-equivalent styles (see D-206).

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

## D-206

### Rotation-Equivalent Style Resolution

Status

Approved (v2.1)

Decision

Styles whose generated cycles are exact rotations of each
other (UpDown / DownUp) are resolved by phase preference:
prefer the hypothesis matching the observed loop at rotation 0.

Rotation-equivalent aliases count as one hypothesis for the
ambiguity confidence component.

Rationale

Rotation-invariant scoring alone cannot mathematically
distinguish these styles.

The loop start is usable evidence because users are instructed
to select a phrase with a clean start.

Consequence

DownUp is detectable when the loop starts on its first note.

UpDown / DownUp results are not permanently penalized to Low
confidence.

---

## D-207

### BPM / Rate Preference Rule

Status

Approved (v2.1)

Decision

Among valid (BPM, Rate) pairs: prefer BPM inside a configured
range (default 90–180); then prefer rates in the order
1/16, 1/8, 1/32, 1/4, 1/16T, 1/8T, 1/32T, 1/4T; otherwise
choose the BPM closest to 120.

Rationale

D-203 requires joint resolution; a concrete deterministic rule
was previously undefined.

Consequence

BPM ×2 / ÷2 buttons are disabled when the resulting Rate would
leave the supported set.

---

## D-208

### Partial Result Dependencies

Status

Approved (v2.1)

Decision

Level 1 includes Step Duration alongside the quantized
sequence; preview is available from Level 1 upward.

Level 3 (Input Notes + Octaves without Style) applies only
when every competitive hypothesis agrees on notes and octaves
while disagreeing on style.

Rationale

Quantization guarantees a step grid, so timing always exists
when a sequence exists.

The consensus rule reconciles Level 3 with D-200 (joint
enumeration).

Consequence

The v2.0 PRD partial-result example was corrected to a
reachable combination.

---

## D-209

### Result DTO Contract

Status

Approved (v2.1)

Decision

The Result DTO includes stepDuration, sequenceSource
("registry" | "quantized"), registryVersion and
configurationHash in addition to the v2.0 fields.

Rationale

Partial results must remain playable, consumers must know the
sequence origin, and reproducibility metadata is mandatory.

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

## D-303

### Generator Context Object

Status

Approved (v2.1)

Decision

generate() receives a single immutable GeneratorContext
object ({ noteCount, octaves }).

Future styles extend it with optional fields.

Rationale

Play Order requires the performed note order; a positional
argument signature could not absorb new inputs without
breaking existing generators.

Consequence

Random remains blocked on a seeded-randomness decision.

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

Amended in v2.2: Arpeggio Sandbox (D-405) is implemented as an
in-page Application State mode, not a new page or route. This
decision remains intact.

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

## D-404

### Editing Partial Results

Status

Approved (v2.1)

Decision

All fields are editable in partial results.

Registry regeneration activates only when Input Notes, Style,
Octaves, BPM and Rate are all defined (detected or user-set).

Until then, the preview plays the quantized detected sequence.

Rationale

Registry regeneration requires a style; the v2.0 spec left
editing in style-less states undefined.

---

## D-405

### Arpeggio Sandbox

Status

Approved (v2.2)

Decision

An in-page mode, reachable via a text link below the Upload
card, that seeds the editable model with default values and
renders ResultPanel + Preview without ever producing a Result
DTO. No routing or new page is introduced. Confidence and Play
Source are omitted, since neither analysis nor source audio
exist in this mode.

Rationale

Sourced from design. Reuses the editable-model pattern already
established by Manual Editing (D-403) instead of inventing a
new data path; the design's own layout independently reused
the same ResultPanel slot for both Results and Sandbox,
confirming this is a mode of one component, not a new screen.

Consequence

ResultPanel and PreviewPlayer require no new component
variants — only an alternate seeding path.

---

## D-406

### BPM ±1 Fine Adjustment

Status

Approved (v2.2)

Decision

BPM editing gains a ±1 stepper alongside ×2 / ÷2. Only ×2 / ÷2
update Rate; the ±1 stepper changes BPM independently of Rate.

Rationale

Sourced from design. Arbitrary BPM values have no clean
mathematical relationship to Rate, unlike doubling/halving, so
extending the "changing BPM updates Rate accordingly" rule to
±1 adjustments would be arbitrary rather than principled.

Amended in v2.3: ×2 / ÷2 are shown whenever BPM and Rate are
both defined, independent of Style or Confidence. The v2.2
partial-result mockup that omitted them was a mockup
simplification, not a rule — nothing about Style being
undetected changes whether doubling/halving a known BPM+Rate
pair is meaningful.

---

## D-407

### Single Active Panel Layout

Status

Approved (v2.3)

Decision

The page renders exactly one active panel at a time (Input →
Waveform → Analysis → Results), each replacing the previous
rather than appending below it. Preview is not a standalone
panel: Play Source and Play Modulation live inside the Results
panel (and, in Arpeggio Sandbox, the Sandbox panel), alongside
the editable settings.

Rationale

Sourced from design: all four rendered screens (Input,
Waveform, Results, Sandbox) consistently show exactly one
panel, and Results embeds the playback controls directly in
its own card rather than treating Preview as a separate
section. This corrects the v2.0–v2.2 UI Specification, whose
Layout diagram depicted five sections stacked and simultaneously
visible — a model no design screen ever showed.

Consequence

The UI Specification's Layout section, Section 5 (Results) and
former Section 7 (Preview) were restructured: Preview's rules
(playback, looping, A/B exclusivity, sequence source by level)
now live inside Section 5. Arpeggio Sandbox is renumbered to
Section 7. The component tree moves PreviewPlayer inside
ResultPanel. D-400 (Single Page Application) is unaffected —
this remains a single DOM, no routing, no navigation; only the
in-page panel-switching model was clarified.

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

## D-501

### Exclusive A/B Playback

Status

Approved (v2.1)

Decision

Preview and original audio never play simultaneously.

An app-level Playback Controller enforces exclusivity:
starting one pauses the other.

Rationale

Synchronizing Tone.Transport with the file player is complex
and drift-prone.

Toggling is sufficient for A/B comparison.

Consequence

Simultaneous synchronized playback is out of scope for the MVP.

---

## D-502

### Unified Play/Pause Controls

Status

Approved (v2.2)

Decision

The three-button "Play / Pause / Loop" control list (Waveform
Section 3, Preview Section 7) becomes one Play ↔ Pause toggle
per source, named "Play Source" (original audio) and "Play
Modulation" (reconstructed sequence). No separate Loop button
exists anywhere in the product.

Rationale

Sourced from design. A literal Loop button never had anything
to toggle: playback of the selected fragment, and preview
playback, already always loop with "no one-shot mode" — a
constraint the v2.0/v2.1 spec stated but never reconciled with
listing Loop as a button. Naming the two toggles by source also
removes the previous ambiguity of two differently-scoped
buttons both called "Play".

Consequence

The Playback Controller (D-501) groups exactly these two named
controls.

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

## D-602

### Tier 1 Test Environment

Status

Approved (v2.1)

Decision

Tier 1 fixtures are pre-rendered WAV files committed to the
repository, generated by a fixture script from the registry.

Tier 1 tests run in a real browser via Playwright with the
production Basic Pitch WASM backend.

Rationale

Tone.js rendering and Basic Pitch require a browser
environment.

Committed fixtures keep CI deterministic.

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