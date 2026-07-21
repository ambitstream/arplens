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

# v2.5 (Frozen)

Date:

2026-07-21

Status:

Frozen (2026-07-21)

---

### Summary

Minimum Loop Selection duration lowered from 3 seconds to 2 seconds.

---

### Changes

1. **Loop minimum: 3s → 2s (D-402).** `LOOP_MIN_SECONDS` and the
   Loop Selection drag/resize bounds now allow a 2-second minimum
   loop, down from 3s. Allows faster, denser arpeggio phrases to be
   selected as a single loop without truncation. Maximum (20s) is
   unchanged.

---

### Changed Documents

- 09_DECISIONS.md (D-402)
- 01_GLOSSARY.md (Loop)
- 04_ANALYSIS_ENGINE.md (loop duration bound)

All documents received a version bump to 2.5.

---

### Breaking Changes

None.

---

### Migration Notes

None.

---

### Approval

Approved by:

User

Date:

2026-07-21

---

# v2.4 (Frozen)

Date:

2026-07-18

Status:

Frozen (2026-07-18)

---

### Summary

Note-name octave convention fixed to middle C = C3, and the M5
interface implemented.

---

### Changes

1. **Octave convention: middle C = C3.** Displayed note names
   (Result DTO `inputNotes` / `sequence`, and every UI readout) now
   number octaves so that MIDI 60 = "C3", matching the DAWs the
   audience uses (Ableton, Cubase, Bitwig, FL) rather than
   scientific / Logic "C4". Surfaced by a real-audio test where the
   user's "A#2" was exactly the pitch the engine had been labelling
   "A#3". Pitch detection was always correct; only the display
   numbering changed. The v2.0–v2.3 UI Specification's illustrative
   sequence example (`C2 D#2 G2 …`) is unaffected in spirit — those
   were sample values, not a convention statement.

2. **Milestone 5 implemented**: the complete Amber Rack MVP
   interface — single-panel workflow, Waveform focus/loop selection,
   Analysis states, ResultPanel with all editors, the Tone.MonoSynth
   Preview Engine (D-500), exclusive Play Source / Play Modulation
   (D-501), Arpeggio Sandbox, all eight error states, responsive
   mobile layout. No specification changes beyond item 1.

---

### Changed Documents

- 01_GLOSSARY.md (Octave Convention)
- 02_PRD.md (Output note-naming note)

All documents received a version bump to 2.4.

---

### Breaking Changes

None. No implementation displayed note names before v2.4.

---

### Migration Notes

None.

---

### Approval

Approved by:

User

Date:

2026-07-18

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

# v2.2 (Frozen)

Date:

2026-07-16

Status:

Frozen (2026-07-16)

---

### Summary

Adoption of the completed Claude Design mockups as source of
truth, plus resolution of the three design decisions that
needed explicit approval before they could be adopted.

---

### Changes

1. **Arpeggio Sandbox** added as an MVP feature: an in-page
   mode, reachable via a "Go to Arpeggio Sandbox" link below
   the Upload card, that seeds the editable model with default
   values and reuses ResultPanel/PreviewPlayer without ever
   producing a Result DTO. Implemented as an Application State
   mode, not a new page or route — D-400 (Single Page
   Application) remains intact. (D-405)

2. **BPM ±1 fine adjustment** added alongside ×2 / ÷2. Only
   ×2 / ÷2 continue to update Rate; the ±1 stepper adjusts BPM
   independently, since arbitrary BPM values have no clean
   relationship to Rate. (D-406)

3. **Playback controls unified.** The "Play / Pause / Loop"
   three-button list (Waveform, Preview) becomes one Play ↔
   Pause toggle per source: "Play Source" (original audio) and
   "Play Modulation" (reconstructed sequence). No literal Loop
   button exists anywhere — playback of the relevant fragment
   was already always-looping, so a separate toggle had nothing
   to control. (D-502)

4. **Footer component** added to the component tree.

5. **Supported Octaves formalized** as an explicit MVP range
   (1–4) in the PRD; previously only implied by Tier 0 fixture
   coverage.

6. **Milestone 2.5: Arpeggio Sandbox** inserted as a side
   branch after M2 — it depends only on the Style Registry, not
   on the Analysis Engine or audio pipeline, and nothing later
   depends on it. M3–M6 numbering is unaffected.

---

### Changed Documents

- 00_READ_ME.md
- 01_GLOSSARY.md
- 02_PRD.md
- 03_ARCHITECTURE.md
- 06_UI_SPEC.md
- 07_PREVIEW_ENGINE.md
- 09_DECISIONS.md
- 11_DEVELOPMENT_PLAN.md

---

### Motivation

The Claude Design mockups (project "ArpLens") were reviewed
against the frozen v2.1 specification end to end. Most
differences were additive UI chrome or simplifications with no
architectural cost and were adopted directly. Three differences
had real product/architecture implications (in-page vs. real
routing for Sandbox, scope of BPM editing, and Rate-sync
behavior for the new BPM control) and were resolved with the
user individually before this entry was written.

---

### Breaking Changes

None.

No implementation of Sandbox, BPM fine adjustment, or the
unified playback controls existed before v2.2.

---

### Migration Notes

None.

---

### Approval

Approved by:

User

Date:

2026-07-16

---

# v2.3 (Frozen)

Date:

2026-07-16

Status:

Frozen (2026-07-16)

---

### Summary

A full re-review of the complete Claude Design "ArpLens"
project (all four page screens, all seven components, the
brand exploration doc) against v2.2, with design explicitly
made the source of truth for UI decisions. The design project
was also mirrored into the repository under `design/` so it is
versioned alongside the code.

---

### Changes

1. **Page layout corrected to a single active panel.** All
   four rendered design screens consistently show exactly one
   panel at a time (Input → Waveform → Analysis → Results/
   Sandbox), each replacing the previous rather than stacking
   below it — contradicting the v2.0–v2.2 Layout diagram, which
   showed five sections stacked and simultaneously visible.
   (D-407)

2. **Preview merged into the Results panel.** Play Source and
   Play Modulation are rendered inside the Results (and
   Sandbox) panel, not as a standalone page section. The former
   "Section 7 — Preview" was folded into Section 5 (Results);
   Arpeggio Sandbox is renumbered to Section 7. The component
   tree moves PreviewPlayer inside ResultPanel. (D-407)

3. **BPM ×2/÷2 visibility clarified**: shown whenever BPM and
   Rate are both defined, independent of Style or Confidence.
   The v2.2 partial-result mockup that omitted them was
   confirmed to be a mockup simplification, not a rule.
   (D-406, amended)

4. **Waveform panel elaborated**: a file summary readout
   (name, Ready status, duration, sample rate, size) and
   controls to remove the file or step back from Loop Selection
   to Focus Region — both additive, non-conflicting detail
   supplied by the design where the spec was previously silent.

5. **Loading States** updated: Editing and Playback are
   concurrent capabilities of the Results panel, not sequential
   named states, consistent with change #2.

6. **Design mirrored into the repository** under `design/` —
   all page screens, components, the brand/foundation
   exploration doc, tokens (`styles.css`) and logo assets — so
   design decisions are versioned with the code, not only
   reachable via claude.ai/design.

---

### Changed Documents

- 06_UI_SPEC.md
- 09_DECISIONS.md

---

### Motivation

The user requested a full re-review with design explicitly
prioritized over documentation for UI decisions, and asked that
any genuine contradiction (not mere missing detail) be
individually confirmed rather than assumed. Two contradictions
were found and confirmed; several additive details with no
competing interpretation were adopted directly, consistent with
design taking priority.

---

### Breaking Changes

None. No implementation of the page layout, Results panel, or
Arpeggio Sandbox existed before v2.3.

---

### Migration Notes

None.

---

### Approval

Approved by:

User

Date:

2026-07-16

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