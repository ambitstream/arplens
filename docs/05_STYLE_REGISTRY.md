# Style Registry

**Project:** ArpLens

**Version:** 2.4 (Frozen)

---

# Purpose

The Style Registry defines every supported arpeggiator style.

It is the single source of truth for all style behavior.

Every component in ArpLens relies on this registry.

No component may implement its own interpretation of a style.

---

# Design Principles

## Single Source of Truth

Every arpeggiator style is defined exactly once.

The registry is used by:

- Analysis Engine
- Preview Engine
- Manual Editor
- Unit Tests

No duplicated logic is allowed.

---

## Pure

Every style is implemented as a pure generator.

The same input always produces the same output.

---

## Data-Driven

The engine iterates over registry entries.

It never contains hardcoded knowledge about individual styles.

Adding a new style must not require changing the matcher.

---

## Extensible

Future Ableton-style patterns must be added by extending the registry.

The architecture must never require redesign.

---

# Registry Responsibilities

The Style Registry is responsible for:

- generating note sequences
- defining style metadata
- exposing supported styles
- versioning style behavior

The registry is NOT responsible for:

- transcription
- note detection
- playback
- timing analysis
- confidence calculation

---

# Core Concept

Every style receives abstract note indices.

The registry never works with:

- note names
- MIDI notes
- frequencies
- BPM
- Tone.js

Instead it works only with ordered note indices.

Example:

Input Notes:

```
C
Eb
G
```

Internal indices:

```
0
1
2
```

The registry never knows that index **0** is C.

It only knows:

```
lowest note

↓

middle note

↓

highest note
```

---

# Input

Every generator receives one immutable context object:

```typescript
GeneratorContext {

    noteCount

    octaves

}
```

Example:

```
noteCount = 3

octaves = 2
```

Future styles may require additional information.

New OPTIONAL fields may be added to the context without
breaking existing generators.

Example:

Play Order will require the order in which the notes were
played, supplied as an optional context field.

---

# Output

Every generator returns exactly one cycle.

A cycle consists of ordered steps.

Each step contains one or more abstract note indices.

Example:

```
[
    {0},
    {1},
    {2},
    {3},
    {4},
    {5}
]
```

Using sets instead of scalar values allows future support for:

- Chord Trigger
- Polyphonic steps

without redesigning the registry.

---

# Style Entry

Every registry entry has the same structure.

Example:

```typescript
Style {

    id

    displayName

    sinceVersion

    polyphonic

    endpointRepeat

    generate()

}
```

---

# Fields

## id

Unique identifier.

Example:

```
up
```

---

## displayName

Human readable name.

Example:

```
Up
```

---

## sinceVersion

Documents when the style became available.

Example:

```
2.0
```

---

## polyphonic

Whether the style generates multiple notes per step.

MVP:

```
false
```

---

## endpointRepeat

Describes turnaround behavior.

Example:

```
UpDown

↓

false

Up & Down

↓

true
```

This metadata distinguishes future styles without changing generator logic.

---

## generate()

Pure generator function.

Input:

```
GeneratorContext
```

Output:

One ordered cycle.

---

# Supported Styles (MVP)

The MVP includes:

```
Up

Down

UpDown

DownUp
```

---

# Future Styles

The architecture intentionally supports future styles.

Examples:

```
Converge

Diverge

Play Order

Pinky Up

Pinky UpDown

Thumb Up

Thumb UpDown

Random

Chord Trigger
```

No architecture changes should be required.

Only new registry entries.

Two known caveats:

`Play Order` requires the performed note order.

It will be supplied through an optional GeneratorContext field
(a non-breaking extension).

`Random` conflicts with the determinism rules.

It requires an explicit seeded-randomness decision before it
can be added.

---

# Registry Consumers

## Analysis Engine

Generates candidate sequences.

Compares them with the observed sequence.

---

## Preview Engine

Generates playback directly from the winning style.

The preview never has custom playback logic.

---

## Manual Editor

Whenever the user edits:

- Style
- Input Notes
- Octaves

the editor regenerates the sequence using the registry.

---

## Unit Tests

Tests verify registry generators directly.

No audio is required.

---

# Rotation Invariance

Generated sequences may begin at any point.

The matcher is responsible for comparing all cyclic rotations.

The registry itself never performs matching.

---

## Rotation-Equivalent Styles

Some registry styles generate cycles that are exact rotations
of each other for every input.

Example:

UpDown and DownUp.

The matcher resolves this ambiguity using the phase-preference
tie-break defined in the Analysis Engine document.

The registry itself does not need to know about equivalence.

Generator output order defines rotation 0 (the pattern start),
which is what phase preference relies on.

---

# Determinism

Generators:

- contain no randomness
- have no internal state
- produce identical output for identical input

---

# Registry Order

Registry order is significant.

When all previous tie-break rules produce identical scores, registry order becomes the final deterministic tie-break.

Changing registry order changes deterministic behavior.

It should therefore be treated as a breaking change.

---

# Versioning

Every registry entry contains:

```
sinceVersion
```

The registry itself has:

```
registryVersion
```

Every analysis result stores:

```
engineVersion

registryVersion

configurationHash
```

This guarantees reproducibility.

---

# Configuration

The registry is loaded once during application startup.

It remains immutable during runtime.

The application never creates styles dynamically.

---

# Design Rules

Every new style must satisfy:

- deterministic
- pure
- stateless
- generator-based
- compatible with existing matcher
- compatible with Preview Engine
- compatible with Manual Editor

If adding a style requires modifying the matcher, the registry design should be reconsidered.

---

# Explicit Non-Goals

The registry must never contain:

- UI code
- React
- Tone.js
- MIDI
- Browser APIs
- Timing analysis
- Audio processing

It defines structure only.

---

# Definition of Done

The Style Registry is considered complete when:

- every supported style is represented by exactly one registry entry
- all generators are deterministic
- the matcher consumes the registry generically
- the Preview Engine consumes the registry generically
- the Manual Editor consumes the registry generically
- Unit Tests validate every registry entry independently
- adding a new style requires only a new registry entry