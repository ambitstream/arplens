# User Interface Specification

**Project:** ArpLens

**Version:** 2.2 (Frozen)

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

The Arpeggio Sandbox (Section 8) is an in-page mode switch, not
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

```
+-----------------------------------------------------------+

                    ArpLens

Recreate standard arpeggios from audio.

------------------------------------------------------------

Upload Audio

------------------------------------------------------------

Waveform

------------------------------------------------------------

Analysis

------------------------------------------------------------

Results

------------------------------------------------------------

Preview

+-----------------------------------------------------------+
```

Everything fits on one page.

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

Selecting it switches the page into Sandbox mode (Section 8).

It does not navigate to a new page.

---

# Section 3 — Waveform

Displays:

audio waveform

Playback cursor

Selection overlays

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

---

# Section 7 — Preview

One control:

```
Play Modulation
```

A single Play ↔ Pause toggle, matching the naming and pattern
of Play Source (Section 3). There is no separate Loop button.

---

Playback always loops.

There is no one-shot playback mode.

---

Preview playback and original-audio playback are mutually
exclusive.

Starting one pauses the other.

Exclusivity is enforced by the app-level Playback Controller,
which groups Play Source and Play Modulation together.

A/B comparison is performed by toggling between the two.

In Arpeggio Sandbox mode there is no Play Source, since there
is no source audio.

---

Preview plays:

Level 4

↓

Registry-generated sequence.

Partial results

↓

Quantized detected sequence.

Arpeggio Sandbox

↓

Registry-generated sequence, from the seeded editable model.

---

# Section 8 — Arpeggio Sandbox

Reachable from the Sandbox Link in Section 2.

An in-page mode. No routing, no new page.

---

## Entry

Switches the visible sections from Upload / Waveform / Analysis
to a ResultPanel and Preview seeded with default values, using
the same components as the normal Results flow.

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

↓

Editing

↓

Preview

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
 │      ├── BPMCard
 │      ├── NotesEditor
 │      ├── StyleEditor
 │      ├── RateEditor
 │      ├── OctavesEditor
 │      ├── SequenceView
 │      └── ConfidenceBadge
 ├── PreviewPlayer
 ├── PlaybackController
 └── Footer

ResultPanel and PreviewPlayer are reused, unmodified, by
Arpeggio Sandbox mode — driven by a seeded editable model
instead of a Result DTO. ConfidenceBadge does not render when
no Result DTO exists.