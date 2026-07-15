# Changelog

**Project:** ArpLens

This document records all intentional changes made to the official project specification.

It is **not** a Git history.

It records only changes that affect:

- product behavior
- architecture
- public interfaces
- engineering decisions
- documentation

Implementation details, refactoring and bug fixes should remain in Git history unless they modify the specification.

---

# Versioning

The project follows semantic documentation versions.

Major

Breaking architectural or product changes.

Example:

```
v2.0 → v3.0
```

---

Minor

New approved functionality.

Example:

```
v2.0 → v2.1
```

---

Patch

Documentation clarifications.

No behavioral changes.

Example:

```
v2.0.0 → v2.0.1
```

---

# v2.0 (Frozen)

Date:

(TBD)

Status:

Frozen

Description:

First complete specification of ArpLens MVP.

Included:

- Browser-only architecture
- React + TypeScript + Vite
- Web Worker
- Spotify Basic Pitch (WASM)
- Tone.js Preview
- Style Registry
- Analysis Engine
- Test Strategy
- Development Plan
- Claude Rules

This version is considered the baseline for implementation.

---

# Future Entries

## Template

### Version

vX.Y

Date

YYYY-MM-DD

Status

Draft / Approved / Frozen

---

### Summary

Short description of the change.

---

### Changed Documents

Example:

- 01_PRD.md
- 03_ANALYSIS_ENGINE.md

---

### Motivation

Explain why the change was necessary.

---

### Breaking Changes

List any breaking changes.

If none:

```
None
```

---

### Migration Notes

Describe how the implementation should adapt.

If not applicable:

```
None
```

---

### Approval

Approved by:

(User)

Date:

YYYY-MM-DD

---

# Change Policy

Every specification change should:

1. Explain the motivation.
2. Identify affected documents.
3. Record breaking changes.
4. Be approved before implementation.
5. Receive a new documentation version.

No silent modifications are allowed.

---

# What Does NOT Belong Here

Do not record:

- Git commits
- Bug fixes
- Refactoring
- Formatting
- Renaming variables
- Internal implementation details

Those belong in version control.

---

# Frozen Documentation Policy

Once a documentation version is marked **Frozen**:

- implementation follows documentation;
- architecture should not change without approval;
- all future specification changes must create a new changelog entry.

The documentation remains stable throughout development.

---

# Definition of Done

The changelog is considered complete when every intentional specification change can be traced from:

Decision

↓

Approval

↓

Documentation Version

↓

Implementation.