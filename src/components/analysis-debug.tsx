import { useMemo, useState } from 'react';
import { analyze } from '../analysis/pipeline/analyze';
import { STYLE_REGISTRY } from '../analysis/registry/style-registry';
import { SUPPORTED_RATES, type SupportedRate } from '../config/rates';
import { pitchClassToSemitone } from '../utils/note-names';
import { synthesizeNoteEvents } from '../utils/synthesize-note-events';

const OCTAVE_OPTIONS = [1, 2, 3, 4];
const JITTER_OPTIONS = [0, 2, 4, 8];

/** Pitch classes anchored at octave 2, matching the design examples. */
function parseNotes(input: string): number[] {
  const midis = input
    .split(/[\s,]+/)
    .filter((token) => token.length > 0)
    .map((token) => pitchClassToSemitone(token.trim()))
    .filter((semitone): semitone is number => semitone !== undefined)
    .map((semitone) => 36 + semitone);
  return [...new Set(midis)].sort((a, b) => a - b);
}

/**
 * Temporary M3 debug view: synthesizes note events from user-chosen
 * arpeggiator settings and runs them through the real analysis
 * pipeline — a live registry -> events -> engine round-trip.
 * Replaced by the full workflow UI in M5.
 */
export function AnalysisDebug() {
  const [styleId, setStyleId] = useState(STYLE_REGISTRY[0].id);
  const [notesInput, setNotesInput] = useState('C E G');
  const [octaves, setOctaves] = useState(2);
  const [bpm, setBpm] = useState(120);
  const [rate, setRate] = useState<SupportedRate>('1/16');
  const [jitterPercent, setJitterPercent] = useState(0);

  const result = useMemo(() => {
    const baseMidis = parseNotes(notesInput);
    if (baseMidis.length === 0 || !Number.isFinite(bpm) || bpm < 20 || bpm > 300) {
      return undefined;
    }
    const events = synthesizeNoteEvents({
      styleId,
      baseMidis,
      octaves,
      bpm,
      rate,
      cycles: 3,
      jitterRatio: jitterPercent / 100,
      seed: 7,
    });
    return analyze(events);
  }, [styleId, notesInput, octaves, bpm, rate, jitterPercent]);

  const selectClasses =
    'rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-100';

  return (
    <section
      aria-label="Analysis core debug"
      className="mx-auto mt-8 w-full max-w-xl rounded-lg border border-neutral-800 p-6 text-left"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Analysis core debug
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        synthesize → analyze round-trip — temporary M3 view, replaced by the full UI in M5
      </p>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Style
          <select
            className={selectClasses}
            value={styleId}
            onChange={(event) => setStyleId(event.target.value)}
          >
            {STYLE_REGISTRY.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Input notes
          <input
            className={selectClasses}
            value={notesInput}
            onChange={(event) => setNotesInput(event.target.value)}
            size={10}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Octaves
          <select
            className={selectClasses}
            value={octaves}
            onChange={(event) => setOctaves(Number(event.target.value))}
          >
            {OCTAVE_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          BPM
          <input
            className={selectClasses}
            type="number"
            min={20}
            max={300}
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Rate
          <select
            className={selectClasses}
            value={rate}
            onChange={(event) => setRate(event.target.value as SupportedRate)}
          >
            {SUPPORTED_RATES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Jitter %
          <select
            className={selectClasses}
            value={jitterPercent}
            onChange={(event) => setJitterPercent(Number(event.target.value))}
          >
            {JITTER_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <pre
        aria-label="Analysis result"
        className="mt-5 max-h-96 overflow-auto rounded bg-neutral-900 px-3 py-2 font-mono text-xs leading-relaxed text-cyan-300"
      >
        {result === undefined
          ? 'Enter valid notes (sharp names, e.g. "C D# G") and a BPM between 20 and 300.'
          : JSON.stringify(result, null, 2)}
      </pre>
    </section>
  );
}
