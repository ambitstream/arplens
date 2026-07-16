import { useState } from 'react';
import {
  REGISTRY_VERSION,
  STYLE_REGISTRY,
  getStyleById,
} from '../analysis/registry/style-registry';

const NOTE_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const OCTAVE_OPTIONS = [1, 2, 3, 4];

/**
 * Temporary M2 debug view: generates a cycle from user-selected
 * parameters straight through the Style Registry. Replaced by the
 * full workflow UI in M5.
 */
export function RegistryDebug() {
  const [styleId, setStyleId] = useState(STYLE_REGISTRY[0].id);
  const [noteCount, setNoteCount] = useState(3);
  const [octaves, setOctaves] = useState(1);

  const style = getStyleById(styleId) ?? STYLE_REGISTRY[0];
  const cycle = style.generate({ noteCount, octaves });
  const sequence = cycle.map((step) => step.join('+')).join(' ');

  const selectClasses =
    'rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-100';

  return (
    <section
      aria-label="Style Registry debug"
      className="mx-auto mt-16 w-full max-w-xl rounded-lg border border-neutral-800 p-6 text-left"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Style Registry debug
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        registry v{REGISTRY_VERSION} — temporary M2 view, replaced by the full UI in M5
      </p>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Style
          <select
            className={selectClasses}
            value={style.id}
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
          <select
            className={selectClasses}
            value={noteCount}
            onChange={(event) => setNoteCount(Number(event.target.value))}
          >
            {NOTE_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
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
      </div>

      <output
        aria-label="Generated sequence"
        className="mt-5 block rounded bg-neutral-900 px-3 py-2 font-mono text-sm text-cyan-300"
      >
        {sequence}
      </output>
      <p className="mt-2 text-xs text-neutral-500">
        {cycle.length} steps · abstract note indices (0 = lowest pitch)
      </p>
    </section>
  );
}
