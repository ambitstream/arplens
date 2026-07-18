import type { AppState } from '../app/state';
import type { SupportedRate } from '../config/rates';
import { generateSequenceNames, isComplete, stepDurationSeconds } from '../preview/arp-settings';
import type { PitchClass } from '../utils/note-names';
import { scaledBpmRate } from '../utils/bpm-rate-edit';
import { Card } from './chrome';
import {
  BpmEditor,
  ConfidenceBadge,
  NotesEditor,
  OctavesEditor,
  RateEditor,
  SequenceView,
  StyleEditor,
} from './editors';

export interface ResultPanelHandlers {
  onNotes: (notes: readonly PitchClass[]) => void;
  onStyle: (id: string) => void;
  onRate: (rate: SupportedRate) => void;
  onOctaves: (octaves: number) => void;
  onBpm: (bpm: number) => void;
  onPlaySource: () => void;
  onPlayModulation: () => void;
  onPause: () => void;
}

function PlayButton({
  label,
  playing,
  onClick,
}: {
  label: string;
  playing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={playing}
      className={`inline-flex items-center gap-2 rounded-md border px-[13px] py-2 font-mono text-[12px] ${
        playing
          ? 'border-accent/45 bg-accent/15 text-accent'
          : 'border-line bg-bg-2 text-text-mid hover:border-text-lo hover:text-text-hi'
      }`}
    >
      <span aria-hidden="true" className="text-[10px] leading-none">
        {playing ? '❚❚' : '▶'}
      </span>
      {label}
    </button>
  );
}

/**
 * Section 5 — Results (and, in sandbox mode, Section 7). One panel,
 * with playback embedded (v2.3): no separate Preview section.
 */
export function ResultPanel({
  state,
  sandbox,
  handlers,
}: {
  state: AppState;
  sandbox: boolean;
  handlers: ResultPanelHandlers;
}) {
  const { settings, result, detectedSequence, playback } = state;
  const complete = isComplete(settings);

  const sequence = complete ? generateSequenceNames(settings) : (detectedSequence ?? []);
  const canScale = (direction: 'double' | 'half'): boolean =>
    settings.bpm !== null && settings.rate !== null
      ? scaledBpmRate(settings.bpm, settings.rate, direction) !== undefined
      : false;

  return (
    <Card num="04" title={sandbox ? 'SANDBOX' : 'RESULTS'}>
      <div className="mb-[14px] flex gap-2">
        {!sandbox && (
          <PlayButton
            label="Play Source"
            playing={playback === 'source'}
            onClick={playback === 'source' ? handlers.onPause : handlers.onPlaySource}
          />
        )}
        <PlayButton
          label="Play Modulation"
          playing={playback === 'modulation'}
          onClick={playback === 'modulation' ? handlers.onPause : handlers.onPlayModulation}
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-[15px] font-semibold">
          {sandbox ? 'Settings' : 'Detected settings'}
        </span>
        {!sandbox && result?.confidence !== undefined && (
          <ConfidenceBadge confidence={result.confidence} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {settings.bpm !== null ? (
          <BpmEditor
            bpm={settings.bpm}
            canDouble={canScale('double')}
            canHalve={canScale('half')}
            onScale={(direction) => {
              const scaled = scaledBpmRate(settings.bpm ?? 0, settings.rate ?? '1/16', direction);
              if (scaled !== undefined) {
                handlers.onBpm(scaled.bpm);
                handlers.onRate(scaled.rate);
              }
            }}
            onStep={(delta) => handlers.onBpm(Math.max(20, Math.round(settings.bpm ?? 0) + delta))}
          />
        ) : (
          <NotDetectedTile label="BPM" />
        )}

        <StyleEditor styleId={settings.styleId} onChange={handlers.onStyle} />
        <RateEditor rate={settings.rate} onChange={handlers.onRate} />
        <OctavesEditor octaves={settings.octaves} onChange={handlers.onOctaves} />
        <NotesEditor notes={settings.inputNotes} onChange={handlers.onNotes} />
        {sequence.length > 0 && <SequenceView sequence={sequence} />}
      </div>

      {stepDurationSeconds(settings) === undefined && state.detectedStepDuration === undefined && (
        <p className="mt-3 font-mono text-[11px] text-text-lo">
          Set BPM and Rate to enable preview timing.
        </p>
      )}
    </Card>
  );
}

function NotDetectedTile({ label }: { label: string }) {
  return (
    <div className="relative rounded-md border border-line bg-bg-2 px-[14px] py-[13px]">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-lo">
        {label}
      </div>
      <div className="text-[14px] text-text-lo">Not detected</div>
    </div>
  );
}
