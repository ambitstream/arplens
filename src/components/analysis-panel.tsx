import type { ErrorKind } from '../app/state';
import { Card } from './chrome';

const ERROR_COPY: Record<ErrorKind, { title: string; detail: string }> = {
  'unsupported-browser': {
    title: 'Unsupported Browser',
    detail:
      'This browser cannot decode audio or run the analysis engine. Try a recent Chrome, Edge or Firefox.',
  },
  'unsupported-format': {
    title: 'Unsupported Audio Format',
    detail: 'This file type is not supported. Use MP3, WAV, or M4A.',
  },
  'decode-failed': {
    title: 'Audio Decode Failed',
    detail:
      'The audio could not be decoded. The file may be corrupted or use an unsupported codec.',
  },
  'no-pitched-notes': {
    title: 'No Pitched Notes Detected',
    detail:
      'No pitched material was found in this loop. Pick a section with a clear synth arpeggio.',
  },
  'no-repeating-arpeggio': {
    title: 'No Repeating Arpeggio Detected',
    detail: 'Try a shorter loop that repeats seamlessly.',
  },
  'engine-unavailable': {
    title: 'Analysis Engine Unavailable',
    detail: 'The analysis engine failed to start. Reload the page and try again.',
  },
  unexpected: {
    title: 'Unexpected Error',
    detail: 'Something went wrong during analysis. Reload the page and try again.',
  },
};

export function AnalysisPanel({
  loading,
  errorKind,
  onRetry,
}: {
  loading: boolean;
  errorKind?: ErrorKind;
  onRetry: () => void;
}) {
  const hint = loading ? 'PROCESSING' : errorKind !== undefined ? 'FAILED' : 'READY';
  const hintColor = loading
    ? 'text-accent'
    : errorKind !== undefined
      ? 'text-sem-red'
      : 'text-text-lo';

  return (
    <Card
      num="03"
      title="ANALYSIS"
      hint={<span className={hintColor}>{hint}</span>}
      width="max-w-[460px]"
    >
      <div className="flex flex-col items-center gap-[14px]">
        {loading && (
          <>
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-[10px] rounded-md bg-accent/30 px-4 py-[14px] font-mono text-[13px] font-semibold tracking-[0.04em] text-text-mid"
            >
              <Spinner /> Analyzing…
            </button>
            <div
              className="flex items-center gap-2 font-mono text-[12px] tracking-[0.04em] text-accent"
              aria-live="polite"
            >
              <span className="h-[6px] w-[6px] rounded-full bg-accent shadow-[0_0_6px_-1px_var(--color-accent)]" />
              Analyzing...
            </div>
            <div className="w-full rounded-sm border border-dashed border-line bg-bg-2/70 px-3 py-[10px] text-center text-[12px] text-text-lo">
              Editing is disabled while analysis is in progress
            </div>
          </>
        )}

        {!loading && errorKind !== undefined && (
          <>
            <div
              role="alert"
              className="w-full rounded-sm border px-[14px] py-3 text-[12.5px] leading-[1.5] text-text-mid"
              style={{
                borderColor: 'color-mix(in oklab, var(--color-sem-red) 40%, var(--color-line))',
                background: 'color-mix(in oklab, var(--color-sem-red) 8%, var(--color-bg-2))',
              }}
            >
              <b className="font-semibold text-sem-red">{ERROR_COPY[errorKind].title}.</b>{' '}
              {ERROR_COPY[errorKind].detail}
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="w-full rounded-md bg-accent px-4 py-[14px] font-mono text-[13px] font-semibold tracking-[0.04em] text-bg-0 hover:brightness-110"
            >
              Start over
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

function Spinner() {
  return (
    <span
      className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-bg-0/35 border-t-bg-0"
      aria-hidden="true"
    />
  );
}
