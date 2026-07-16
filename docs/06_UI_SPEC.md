# User Interface Specification

**Project:** ArpLens

**Version:** 2.3 (Frozen)

---

# Purpose

This document defines the complete user interface of ArpLens.

It specifies:

- application layout
- user workflow
- component behavior
- loading states
- error states
- editing behavior
- responsive behavior

Visual styling is intentionally minimal.

---

# Design Principles

## Single Page Application

The entire MVP consists of one page.

No routing.

No navigation.

No modal workflows.

The Arpeggio Sandbox (Section 7) is an in-page mode switch, not
a second page or route.

---

## Minimal Interface

Only controls required to complete the workflow should be visible.

Avoid unnecessary buttons, dialogs and settings.

---

## Progressive Disclosure

Show information only when it becomes relevant.

Example:

Results are hidden until analysis finishes.

---

## Immediate Feedback

Every user action should produce immediate visual feedback.

Long-running operations must always display progress.

---

## Honest UI

Never pretend analysis succeeded.

Never display guessed values.

Unknown values remain unknown.

---

# Layout

The page has a fixed shell — Header above, Footer below — and
one active panel between them:

```
+-----------------------------------------------------------+

                    ArpLens

Recreate standard arpeggios from audio.

------------------------------------------------------------

                    [ active panel ]

------------------------------------------------------------

                       Footer

+-----------------------------------------------------------+
```

Only one panel is visible at a time. Completing a step
replaces the active panel with the next one; it does not
append a new section below the previous one.

Panel sequence:

```
01 · Input       (Upload)

↓

02 · Waveform    (Focus Region, then Loop Selection —
                  same panel, two sub-steps)

↓

03 · Analysis    (Idle / Loading / Completed / Failed)

↓

04 · Results     (settings + Playback, editable)
```

Preview is not its own panel. Playback (Play Source, Play
Modulation) lives inside the Results panel — see Section 5.

Arpeggio Sandbox reuses the same "04" panel slot as Results,
reached directly from Input without passing through Waveform
or Analysis (Section 7).

A compact summary of the completed step (e.g. the uploaded
file's name and status) carries forward into the next panel's
header row; it is not kept as a separate visible section.

Everything fits on one page: this is a panel switch driven by
Application State, not routing or navigation (see Single Page
Application, above).

---

# Workflow

```
Upload

↓

Focus Region (if needed)

↓

Loop Selection

↓

Analyze

↓

Review

↓

Edit

↓

Preview
```

---

# Section 1 — Header

Contains:

Logo

Headline

Subtitle

Headline:

```
Recreate standard arpeggios from audio.
```

Subtitle:

```
Get ready-to-use arpeggiator settings
for your favorite synth, plugin or DAW.
```

---

# Section 2 — Upload

Supports:

- drag & drop
- click to browse

Supported formats:

- MP3
- WAV
- M4A (browser-supported codecs)

Validation:

- unsupported format
- maximum size
- browser decode errors

Warnings:

Files over:

- 100 MB
- 6 minutes

display a warning before analysis.

---

## Sandbox Link

Below the upload card, display a text link:

```
Go to Arpeggio Sandbox
```

Selecting it switches the page into Sandbox mode (Section 7).

It does not navigate to a new page.

---

# Section 3 — Waveform

Displays:

audio waveform

Playback cursor

Selection overlays

---

## File Summary

A compact row above the waveform shows the loaded file: name,
a Ready status indicator, duration, sample rate, and file
size.

A control on this row lets the user remove the file and return
to Section 2 (Upload).

---

## Focus Region

If audio duration exceeds one minute:

User first selects a Focus Region.

Maximum:

1 minute

Only this region is used afterwards.

If audio is shorter:

Focus Region is skipped.

---

## Loop Selection

The second selection happens inside the Focus Region.

Minimum:

3 seconds

Maximum:

20 seconds

The left and right handles are draggable.

The control itself prevents invalid lengths.

Users cannot create selections outside the allowed range.

A control lets the user step back from Loop Selection to
Focus Region.

---

## Playback

One control:

```
Play Source
```

A single Play ↔ Pause toggle. There is no separate Loop button:
playback of the selected fragment always loops, so looping is
not an optional, separately-controlled behavior.

Playback loops only the selected fragment.

---

## Instruction

Display:

```
Select one complete arpeggio phrase that loops seamlessly.

The better the loop,
the more accurate the analysis.
```

---

# Section 4 — Analysis

Contains one primary button.

```
Analyze
```

Button states:

Idle

↓

Loading

↓

Completed

↓

Failed

---

During analysis:

Disable editing.

Show spinner.

Display current status:

```
Analyzing...
```

---

# Section 5 — Results

Results appear only after analysis.

Preview is not a separate panel: playback controls live inside
this panel, alongside the editable settings.

---

## Playback

Two controls at the top of the panel:

```
Play Source

Play Modulation
```

Each is a single Play ↔ Pause toggle. There is no separate
Loop button: playback always loops, so looping is not an
optional, separately-controlled behavior.

Play Source plays the original audio (the selected loop from
Section 3). Play Modulation plays the reconstructed arpeggio.

Play Source and Play Modulation are mutually exclusive.
Starting one pauses the other. Exclusivity is enforced by the
app-level Playback Controller, which groups the two together.
A/B comparison is performed by toggling between them.

Play Modulation plays:

```
Level 4

↓

Registry-generated sequence.

Partial results

↓

Quantized detected sequence.

Arpeggio Sandbox

↓

Registry-generated sequence, from the seeded editable model.
```

In Arpeggio Sandbox mode (Section 7) there is no Play Source,
since there is no source audio.

---

Layout

```
BPM

124

----------------

Input Notes

C

D#

G

----------------

Style

Up

----------------

Rate

1/16

----------------

Octaves

2

----------------

Detected Sequence

C2

D#2

G2

C3

D#3

G3

----------------

Confidence

High
```

---

# Partial Results

Unavailable values display:

```
Not detected
```

Example:

```
Style

Not detected
```

The UI never invents placeholders.

---

# Confidence

Display only:

High

Medium

Low

With color:

Green

Yellow

Red

The text label must always be visible.

Color is never the only indicator.

---

# Section 6 — Manual Editing

Editable fields:

Input Notes

Style

Rate

Octaves

BPM

---

## Input Notes

Display:

```
[C]

[D#]

[G]

[+ Add Note]
```

Selecting a note opens:

```
C

C#

D

D#

...

Delete
```

---

## Style

Dropdown.

Initially:

Up

Down

UpDown

DownUp

Future styles are loaded automatically from the Style Registry.

---

## Rate

Dropdown.

Supported values:

1/4

1/8

1/16

1/32

1/4T

1/8T

1/16T

1/32T

---

## Octaves

Stepper.

```
[-] 2 [+]
```

Range: 1–4.

---

## BPM

Display:

```
124

[- ÷2]

[×2]

[-] [+]
```

`[- ÷2]` and `[×2]` halve/double BPM and update Rate
accordingly, since doubling/halving preserves a clean
mathematical relationship to Rate.

If halving or doubling would push Rate outside the supported
range, the corresponding button is disabled.

`[-]` and `[+]` adjust BPM by 1, independently of Rate.

Arbitrary BPM values have no clean Rate relationship, so the
±1 stepper never changes Rate.

Manual editing never re-runs transcription.

It regenerates only:

Detected Sequence

↓

Preview

---

## Editing Partial Results

All fields remain editable when the analysis returns a
partial result.

The sequence is regenerated through the Style Registry only
when ALL of the following are defined (detected or user-set):

- Input Notes
- Style
- Octaves
- BPM and Rate

Until then, the preview keeps playing the quantized detected
sequence.

As soon as the last missing field is set, the preview switches
to the registry-generated sequence.

Playback always loops; there is no one-shot playback mode
(see Playback, above).

`[- ÷2]` and `[×2]` are shown whenever BPM and Rate are both
defined (detected or user-set), regardless of whether Style is
detected. They depend only on BPM and Rate, not on Style or
Confidence.

---

# Section 7 — Arpeggio Sandbox

Reachable from the Sandbox Link in Section 2.

An in-page mode. No routing, no new page.

---

## Entry

Replaces the active panel (Upload) directly with the Results
panel (Section 5), seeded with default values, skipping
Waveform and Analysis entirely. Uses the same ResultPanel
component — including its embedded Playback controls — as the
normal Results flow.

No Result DTO exists in this mode: the editable model is
seeded directly, exactly as Manual Editing already does.

---

## Header override

While in Sandbox mode, the Header headline and subtitle change
to:

```
Arpeggio Sandbox
```

```
Experiment with arpeggiator settings — no audio required.
```

---

## Differences from the normal Results flow

- No Confidence badge (no analysis was performed)
- No Play Source control (no source audio)
- Only Play Modulation is available

All fields (Input Notes, Style, Rate, Octaves, BPM) are
editable, using the same editors as Section 6.

---

## Defaults

Default seed values are a configuration concern, not hardcoded
in components.

---

# Loading States

Upload

↓

Ready

↓

Analyzing

↓

Displaying Results

Editing and Playback are both available once results are
displayed. They are concurrent capabilities of the same panel,
not sequential states — the user may edit, listen, edit again,
and listen again in any order.

---

# Error States

The UI distinguishes:

Unsupported Browser

Unsupported Audio Format

Audio Decode Failed

No Pitched Notes Detected

No Repeating Arpeggio Detected

Arpeggiator Style Not Detected

Analysis Engine Unavailable

Unexpected Error

Each error has its own message.

---

# Responsive Design

Desktop is the primary experience.

The application is mobile-friendly.

Responsive behavior:

Desktop

Two-column results if space allows.

Tablet

Single column.

Mobile

Everything stacks vertically.

No functionality is removed.

---

# Accessibility

Keyboard accessible.

Visible focus states.

Semantic HTML.

Color is never the only communication channel.

Buttons have accessible labels.

---

# Animations

Animations should be subtle.

Allowed:

Fade

Opacity

Small transitions

Avoid:

Large motion

Complex page transitions

Decorative animations

---

# Empty State

Before upload:

Display:

```
Drop an audio file here

or

Click to browse
```

---

# Definition of Done

The UI is complete when:

- the entire workflow fits on one page
- every state is represented
- every interaction is deterministic
- editing never re-runs analysis
- preview updates immediately after edits
- unsupported values display "Not detected"
- the interface remains usable on desktop and mobile


# Component tree

<App>

 ├── Header
 ├── UploadCard
 │      └── SandboxLink
 ├── Waveform
 │      ├── FocusRegion
 │      ├── LoopSelection
 │      └── PlaybackControls
 ├── AnalyzeButton
 ├── ResultPanel
 │      ├── PreviewPlayer
 │      ├── BPMCard
 │      ├── NotesEditor
 │      ├── StyleEditor
 │      ├── RateEditor
 │      ├── OctavesEditor
 │      ├── SequenceView
 │      └── ConfidenceBadge
 ├── PlaybackController
 └── Footer

Only one of {UploadCard, Waveform, AnalyzeButton, ResultPanel}
is rendered at a time — see Layout.

PreviewPlayer moved inside ResultPanel: Playback (Play Source,
Play Modulation) is part of the Results panel, not a standalone
section. PlaybackController remains a cross-cutting concern
(App-level) since it also mediates Waveform's Play Source.

ResultPanel (including PreviewPlayer) is reused, unmodified, by
Arpeggio Sandbox mode — driven by a seeded editable model
instead of a Result DTO. ConfidenceBadge does not render when
no Result DTO exists.