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

# v2.1 (Frozen)

Date:

2026-07-15

Status:

Frozen (2026-07-15)

---

### Summary

Resolution of every finding from the final v2.0 architecture
review.

No product features were added or removed.

---

### Changes

1. **Style matching.** Added the Phase Preference tie-break.
   UpDown and DownUp cycles are exact rotations of each other
   and cannot be distinguished by rotation-invariant scoring
   alone. Rotation-equivalent aliases count as one hypothesis
   for the ambiguity confidence component. (D-202 amended,
   D-206)

2. **Audio decoding** moved out of the Analysis Engine into a
   main-thread Audio Decode Service; the engine receives mono
   PCM and performs its own deterministic resampling, because
   `decodeAudioData` is unavailable in Web Workers. (D-106)

3. **Determinism scoped.** Bit-exact reproducibility is
   guaranteed from PCM input onward; lossy codec decoding
   (MP3, M4A) is deterministic only per environment. (D-107)

4. **Partial results.** Level 1 now includes Step Duration;
   preview is available from Level 1; Level 3 (Input Notes +
   Octaves without Style) is defined via hypothesis consensus;
   the PRD partial-result example was corrected to a reachable
   combination. (D-208)

5. **Result DTO** extended with `stepDuration`,
   `sequenceSource`, `registryVersion` and
   `configurationHash`. (D-209)

6. **Editing partial results** defined: registry regeneration
   activates only when Input Notes, Style, Octaves, BPM and
   Rate are all set; until then the preview plays the
   quantized sequence. (D-404)

7. **BPM/Rate preference rule** made concrete (preferred BPM
   range, deterministic rate order); BPM ×2/÷2 buttons disable
   at the supported-rate boundary. (D-207)

8. **A/B comparison.** Preview and original audio playback are
   mutually exclusive, enforced by an app-level Playback
   Controller; synchronized simultaneous playback is out of
   scope. (D-501)

9. **Style Registry generators** receive a single
   GeneratorContext object; future optional fields allow
   Play Order without breaking changes; Random is blocked on a
   seeded-randomness decision. (D-303)

10. **Audio memory strategy** documented (mono conversion,
    buffer release, Focus-Region-only retention); the
    200 MB / 10 minute limits are kept. (D-108)

11. **Tier 1 tests** use pre-rendered WAV fixtures committed
    to the repository and run in a real browser via
    Playwright. (D-602)

12. **Consistency fixes.** README document index renumbered
    (including the Glossary); error-state taxonomies aligned
    across PRD, engine and UI (added "No Repeating Arpeggio
    Detected", unified "Analysis Engine Unavailable"); preview
    controls unified to Play / Pause / Loop; Step Duration
    added to the Glossary.

---

### Changed Documents

All documents received a version bump to 2.1.

Substantive changes:

- 00_READ_ME.md
- 01_GLOSSARY.md
- 02_PRD.md
- 03_ARCHITECTURE.md
- 04_ANALYSIS_ENGINE.md
- 05_STYLE_REGISTRY.md
- 06_UI_SPEC.md
- 07_PREVIEW_ENGINE.md
- 08_TEST_STRATEGY.md
- 09_DECISIONS.md
- 11_DEVELOPMENT_PLAN.md

---

### Breaking Changes

None.

No implementation existed before v2.1.

---

### Migration Notes

None.

---

### Approval

Approved by:

User

Date:

2026-07-15

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

- 02_PRD.md
- 04_ANALYSIS_ENGINE.md

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