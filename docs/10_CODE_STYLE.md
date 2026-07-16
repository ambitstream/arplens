# Code Style Guide

**Project:** ArpLens

**Version:** 2.2 (Frozen)

---

# Purpose

This document defines the coding standards for ArpLens.

The goal is consistency, maintainability and deterministic behavior.

Every implementation should follow these rules unless explicitly approved otherwise.

---

# Core Principles

## Simplicity First

Prefer the simplest implementation that correctly solves the problem.

Avoid unnecessary abstractions.

---

## Readability Over Cleverness

Code is read far more often than it is written.

Prefer explicit code over clever code.

---

## Composition Over Inheritance

Favor composition.

Inheritance should be avoided.

---

## Pure Functions

Whenever possible, business logic should be implemented as pure functions.

Pure functions:

- receive inputs
- return outputs
- have no side effects

---

## Deterministic Behavior

The same input must always produce the same output.

Random behavior is prohibited inside the Analysis Engine.

---

# Project Structure

```
src/

    app/

    components/

    hooks/

    analysis/

        engine/

        matcher/

        registry/

        worker/

        pipeline/

    audio/

    preview/

    services/

    config/

    types/

    utils/

    tests/
```

Every directory has a single responsibility.

---

# Layer Rules

The dependency graph always points downward.

```
UI

↓

Services

↓

Analysis Engine

↓

Registry

↓

Utilities
```

Lower layers must never import upper layers.

Forbidden:

Analysis Engine importing React.

Registry importing Tone.js.

Utilities importing UI.

---

# React

Use:

- Functional Components
- Hooks
- TypeScript

Never use:

- Class Components

---

# State Management

Prefer local component state.

Lift state only when necessary.

Do not introduce Redux, Zustand or other global state libraries for the MVP unless a clear architectural need emerges.

---

# TypeScript

Never use:

```typescript
any
```

Prefer:

```typescript
unknown
```

or proper typing.

All exported APIs must be strongly typed.

---

# Functions

Functions should do one thing.

Prefer:

```typescript
calculateStepGrid()
```

over

```typescript
analyzeEverything()
```

---

Keep functions small.

Target:

20–40 lines.

Large functions should be decomposed.

---

# Classes

Prefer modules with pure functions.

Classes should be rare.

Acceptable examples:

- AudioDecoder
- WorkerClient

The Analysis Engine itself should not be implemented as one large class.

---

# File Size

Target:

150–250 lines.

Maximum:

400 lines.

If a file grows beyond this, consider splitting it.

---

# Naming

Variables

camelCase

Functions

camelCase

Types

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Constants

UPPER_SNAKE_CASE

Files

kebab-case.ts

Examples:

```
step-grid.ts

style-registry.ts

worker-client.ts
```

---

# Imports

Order imports consistently.

1.

Node / Browser

2.

External libraries

3.

Internal modules

4.

Relative imports

---

Avoid circular dependencies.

---

# Comments

Prefer self-documenting code.

Only comment:

- why

Never comment:

- what

Example:

Good

```typescript
// Rotation invariance is required because
// user selections may begin mid-cycle.
```

Bad

```typescript
// Increment i.
i++;
```

---

# Error Handling

Never silently ignore errors.

Prefer:

```typescript
Result

Error
```

over

```typescript
throw
```

for expected failures.

Unexpected failures may throw.

---

# Configuration

Never hardcode:

- thresholds
- supported rates
- synth settings
- registry values

These belong in configuration.

---

# Style Registry

Never hardcode style behavior.

All style logic must come from the Style Registry.

The matcher should iterate the registry.

---

# Analysis Engine

Each stage should exist in its own module.

Example:

```
cleanup.ts

quantization.ts

cycle-detection.ts

style-matching.ts
```

Avoid one monolithic engine file.

---

# Worker Communication

The Web Worker communicates only through typed messages.

Never pass anonymous objects.

Define shared message types.

Example:

```typescript
AnalyzeRequest

AnalyzeResponse
```

---

# Result DTO

The Result DTO is immutable.

User editing creates a separate editable model.

Never mutate the original analysis result.

---

# Testing

Every public function should be testable.

Business logic should not depend on:

- React
- DOM
- Tone.js

Pure functions should be testable without browser APIs.

---

# Logging

Use structured logging during development.

Remove debug logging before release.

Never leave:

```typescript
console.log()
```

inside production code.

---

# Performance

Avoid unnecessary allocations.

Avoid repeated sorting.

Avoid repeated registry generation.

Cache only when profiling demonstrates measurable benefit.

Never optimize prematurely.

---

# AI-Generated Code

AI-generated code is treated exactly like handwritten code.

Every generated file must satisfy:

- project architecture
- naming conventions
- typing rules
- testing requirements

Generated code is never accepted without review.

---

# Pull Request Guidelines

Every Pull Request should:

- compile
- pass all tests
- avoid unrelated refactoring
- keep changes focused
- include regression tests for bug fixes

---

# Forbidden

Do not:

- use `any`
- duplicate business logic
- duplicate style definitions
- bypass the Style Registry
- hardcode magic numbers
- mix UI with engine logic
- introduce global mutable state
- introduce unnecessary dependencies

---

# One Responsibility Per File

Each file should have one primary responsibility.

Good:
step-grid.ts
cycle-detection.ts
quantization.ts

Bad:
analysis-utils.ts
helpers.ts
common.ts
misc.ts

---

# Definition of Done

Code is considered complete when:

- architecture rules are respected
- typing is complete
- tests pass
- no duplicated logic exists
- public APIs are documented
- modules remain small and focused
- deterministic behavior is preserved