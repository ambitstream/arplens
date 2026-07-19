# ArpLens Documentation

**Version:** 2.4 (Frozen)

---

# Purpose

This documentation defines the complete architecture, product requirements, engineering decisions, and development process for **ArpLens**.

The goal is to provide a single, authoritative source of truth for the project.

Any implementation must follow this documentation unless an explicit decision changes the specification.

---

# What is ArpLens?

ArpLens is a browser-based application that analyzes a short audio fragment containing a standard synthesizer arpeggio and reconstructs the arpeggiator settings required to recreate it.

The application is intended for musicians and producers who want to quickly understand how an arpeggiator pattern was programmed.

ArpLens is **not** a transcription tool.

ArpLens is **not** a MIDI extraction tool.

ArpLens reconstructs **arpeggiator settings**, not performances.

---

# Documentation Structure

Read the documentation in the following order.

## 01_GLOSSARY.md

Defines the shared terminology used by every other document.

---

## 02_PRD.md

Defines the product itself.

Contains:

- product vision
- terminology
- workflow
- user experience
- MVP scope
- supported features
- non-goals

---

## 03_ARCHITECTURE.md

Defines the overall software architecture.

Contains:

- application architecture
- technology stack
- browser architecture
- major components
- data flow
- responsibilities

---

## 04_ANALYSIS_ENGINE.md

Defines the complete audio analysis pipeline.

Contains:

- transcription
- cleanup
- quantization
- cycle detection
- hypothesis generation
- style matching
- confidence
- partial results

This is the most important technical document in the project.

---

## 05_STYLE_REGISTRY.md

Defines the Style Registry.

Contains:

- registry structure
- generator contract
- future extensibility
- supported styles
- adding new styles

The Style Registry is the single source of truth for arpeggiator styles.

---

## 06_UI_SPEC.md

Defines the complete user interface.

Contains:

- screen layout
- component behavior
- user interactions
- loading states
- error states
- responsive behavior

---

## 07_PREVIEW_ENGINE.md

Defines the playback engine.

Contains:

- Tone.js
- preview synthesis
- scheduling
- timing
- deterministic playback

---

## 08_TEST_STRATEGY.md

Defines testing.

Contains:

- Test Corpus
- Tier 0–3 fixtures
- benchmark methodology
- calibration
- acceptance criteria

---

## 09_DECISIONS.md

Lists all approved engineering decisions.

Every important architectural decision should be recorded here together with its rationale.

---

## 10_CODE_STYLE.md

Defines implementation rules.

Contains:

- TypeScript conventions
- folder structure
- naming
- pure functions
- testing philosophy

---

## 11_DEVELOPMENT_PLAN.md

Defines the implementation roadmap.

Contains:

- milestones
- dependencies
- Definition of Done
- implementation order

---

## 12_CLAUDE_RULES.md

Instructions for AI-assisted development.

Defines:

- what AI may change
- what AI must never change
- when user approval is required

---

## 13_CHANGELOG.md

Records every intentional change made after Documentation v2.0.

No specification changes should be made silently.

---

# Source of Truth

The documentation has the following priority.

1. PRD
2. Approved Decisions
3. Architecture
4. Analysis Engine
5. UI Specification
6. Remaining documents

If two documents contradict each other, the higher-priority document wins.

Contradictions should never be resolved by guessing.

---

# Engineering Principles

The project follows several core principles.

## Deterministic

The same input must always produce the same output.

---

## Honest

Never invent information.

When something cannot be determined confidently, report that it is unknown.

---

## Browser First

The MVP runs entirely inside the browser.

No backend is required.

---

## Simplicity First

The simplest architecture that satisfies the product requirements is preferred.

Avoid unnecessary abstractions.

---

## Single Source of Truth

Every concept should have exactly one authoritative definition.

Examples include:

- Style Registry
- Analysis Engine
- Product Requirements

---

## Extensible

Future functionality should be added by extension rather than redesign.

The architecture should allow new arpeggiator styles without changing existing components.

---

# Documentation Status

This documentation represents the frozen specification for ArpLens v2.4.

Implementation should follow this specification.

Changes to the specification should be recorded through the changelog and approved before implementation.

---

# AI Usage

AI assistants may:

- explain the documentation
- generate implementation
- improve code quality
- propose optimizations

AI assistants must not:

- redesign the product
- modify approved architecture
- invent requirements
- expand MVP scope
- silently change engineering decisions

When in doubt, ask the user.

Never guess.

---

# Final Goal

The purpose of this documentation is to allow any experienced software engineer to implement ArpLens without requiring additional product clarification.