# Development Plan

**Project:** ArpLens

**Version:** 2.5 (Frozen)

---

# Purpose

This document defines the implementation roadmap for ArpLens.

The goal is to break the project into small, independent milestones that can be completed, tested and reviewed individually.

Each milestone should produce a working, testable increment.

No milestone should introduce unfinished architecture.

---

# Development Principles

## Vertical Progress

Every milestone should produce visible progress.

Avoid implementing large amounts of invisible infrastructure before something can be demonstrated.

---

## Test First

The deterministic core should always be tested before connecting it to the UI.

---

## Keep Main Branch Stable

The application should remain buildable after every milestone.

Broken intermediate states should not be merged.

---

## Small Pull Requests

Each milestone should consist of multiple small commits.

Large "everything changed" commits should be avoided.

---

# Milestone Overview

```
M1
↓

M2 ──→ M2.5
↓

M3
↓

M4
↓

M5
↓

M6
```

Each milestone depends only on the previous one.

M2.5 is a side branch: it depends only on M2 and nothing later
depends on it. It does not shift the M3–M6 numbering.

---

# Milestone 1

## Project Foundation

### Goal

Create the project skeleton.

### Deliverables

- Vite project
- React
- TypeScript
- Tailwind
- ESLint
- Prettier
- Vitest
- Playwright
- Folder structure
- Configuration files
- Build pipeline

### UI

Static placeholder page.

### Engine

None.

### Tests

Project builds.

Test runner works.

### Definition of Done

- Project compiles
- Tests run
- CI passes
- Folder structure follows documentation

---

# Milestone 2

## Style Registry

### Goal

Implement the registry and generators.

### Deliverables

- Registry
- Generator interface
- MVP styles
- Rotation utilities
- Registry versioning

### UI

Simple debug page.

Generate sequence from user-selected parameters.

### Tests

Tier 0.

Test:

- every style
- every octave
- every note count
- every rotation

### Definition of Done

- Registry is deterministic
- Generators pass all Tier 0 tests
- No audio involved

---

# Milestone 2.5

## Arpeggio Sandbox

### Goal

Let users experiment with arpeggiator settings without
uploading audio.

### Depends On

Milestone 2 only. Does not require the Analysis Engine or
audio pipeline (M3/M4).

### Deliverables

- Sandbox Link (UploadCard)
- In-page Sandbox mode switch (Application State)
- Seeded editable model (default Input Notes, Style, Rate,
  Octaves, BPM)
- ResultPanel reused, with ConfidenceBadge and Play Source
  omitted
- PreviewPlayer reused (Play Modulation only)
- Footer component

### UI

Full Sandbox flow: Sandbox Link → seeded ResultPanel → editing
→ Play Modulation preview.

### Tests

Component tests for the seeded editable model and for
ResultPanel/PreviewPlayer rendering without a Result DTO.

### Definition of Done

- Reachable from the Upload section without leaving the page
- No Result DTO is ever constructed
- Confidence badge and Play Source are absent
- Editing and Play Modulation work exactly as in the normal
  Results flow

---

# Milestone 3

## Deterministic Analysis Core

### Goal

Implement the mathematical core.

### Deliverables

- Step Grid Estimation
- Quantization
- Cycle Detection
- Joint Hypothesis Enumeration
- Style Matching
- BPM / Rate Resolution
- Result DTO

### UI

Debug visualization only.

### Tests

Pure fixtures.

No audio.

### Definition of Done

- Pure deterministic pipeline
- All fixture tests pass
- Registry drives matching

---

# Milestone 4

## Audio Pipeline

### Goal

Connect real audio.

### Deliverables

- Web Worker
- Audio Decode Service (main thread)
- Deterministic resampler
- Basic Pitch (WASM)
- Cleanup
- Pitch normalization
- Analysis Service

### UI

Upload audio.

Loop selection.

Analyze button.

### Tests

Tier 1.

Clean synthetic recordings.

### Definition of Done

- End-to-end analysis works
- UI remains responsive
- Worker isolation verified

---

# Milestone 5

## User Experience

### Goal

Build the complete MVP interface.

### Deliverables

- Header
- Upload
- Waveform
- Focus Region
- Loop Selection
- Results
- Editing
- Preview
- Error handling
- Responsive layout

### Preview

Tone.js

MonoSynth

Loop playback

### Tests

Tier 2.

Robustness fixtures.

### Definition of Done

- Complete user workflow
- Manual editing works
- Preview regenerates immediately
- Mobile layout functional

---

# Milestone 6

## Quality & Release

### Goal

Prepare the first public release.

### Deliverables

- Confidence calibration
- Threshold tuning
- Tier 3 tests
- Golden Dataset
- Cross-browser testing
- Performance profiling
- Engine versioning
- Documentation review

### Tests

Entire test suite.

### Definition of Done

- All tests pass
- Performance acceptable
- Documentation matches implementation
- Release candidate ready

---

# Continuous Tasks

These tasks continue throughout the project.

## Documentation

Update documentation whenever implementation changes.

---

## Refactoring

Refactor only when it improves clarity.

Avoid speculative refactoring.

---

## Regression Tests

Every bug fix must introduce at least one regression test.

---

## Code Review

Every Pull Request should verify:

- architecture
- typing
- determinism
- documentation
- tests

---

# Suggested Git Workflow

```
main

↓

feature/m1-project

↓

feature/m2-registry

↓

feature/m2.5-sandbox

↓

feature/m3-analysis-core

↓

feature/m4-audio

↓

feature/m5-ui

↓

feature/m6-release
```

Merge only after a milestone (or a coherent part of it) is complete.

---

# Benchmark Schedule

Benchmarks are intentionally postponed.

Run them after:

- Milestone 4
- Milestone 5
- Milestone 6

Never optimize before real measurements exist.

---

# Release Strategy

## Alpha

Internal testing.

Developer only.

---

## Beta

Public testing.

Collect feedback.

Fix critical issues.

---

## v1.0

Stable public release.

---

# Definition of Project Completion

The MVP is complete when:

- the full workflow is functional
- all six milestones are finished
- all documented features are implemented
- all documented non-goals remain excluded
- the application is deterministic
- the Golden Dataset passes
- the documentation reflects the implementation

At this point, development transitions from building the MVP to iterative product improvement.


---

# Milestone Dependencies

M1
↓
M2 (requires M1)
↓
M2.5 (requires M2 — side branch, nothing later depends on it)
↓
M3 (requires M2)
↓
M4 (requires M3)
↓
M5 (requires M4)
↓
M6 (requires M5)

---

# AI Development Workflow

For every milestone:

1. Read all documentation.
2. Implement only the current milestone.
3. Do not implement future milestones.
4. Run all tests.
5. Refactor only inside the current milestone.
6. Wait for user review before continuing.