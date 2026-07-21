import { useEffect, useRef, useState } from 'react';
import { LOOP_MAX_SECONDS, LOOP_MIN_SECONDS, type AppState } from '../app/state';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export interface WaveformHandlers {
  onFocus: (start: number, length: number) => void;
  onLoop: (start: number, length: number) => void;
  onCrop: () => void;
  onBack: () => void;
  onClose: () => void;
  onAnalyze: () => void;
  onPlaySource: () => void;
  onPause: () => void;
  /** Fraction (0..1) through the currently playing source loop, if any. */
  getSourceProgress: () => number | undefined;
}

/** Polls playback progress via rAF while Play Source is active. */
function useSourcePlayhead(
  playing: boolean,
  getSourceProgress: () => number | undefined,
): number | undefined {
  const [progress, setProgress] = useState<number>();

  useEffect(() => {
    if (!playing) {
      return;
    }
    let frame: number;
    const tick = () => {
      setProgress(getSourceProgress());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      setProgress(undefined);
    };
  }, [playing, getSourceProgress]);

  return progress;
}

type DragKind = 'move' | 'left' | 'right';

/** Section 3 — Waveform: Focus Region then Loop Selection (one panel). */
export function WaveformPanel({
  state,
  handlers,
}: {
  state: AppState;
  handlers: WaveformHandlers;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ kind: DragKind; grabOffset: number } | null>(null);
  const decoded = state.decoded;
  const duration = decoded?.durationSeconds ?? 1;
  const isLoop = state.waveStep === 'loop';

  const regionStart = isLoop ? state.loopStart : state.focusStart;
  const regionLength = isLoop ? state.loopLength : state.focusLength;

  const focusEnd = state.focusStart + state.focusLength;

  const playing = state.playback === 'source';
  const sourceProgress = useSourcePlayhead(playing, handlers.getSourceProgress);

  // Ref reads live inside the event handlers below (never in render),
  // so the pointer geometry is computed from the track rect passed in.
  const secondsFromX = (clientX: number, rect: DOMRect): number =>
    Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;

  const onPointerDown = (kind: DragKind) => (event: React.PointerEvent) => {
    event.stopPropagation();
    const track = trackRef.current;
    if (track === null) {
      return;
    }
    (event.target as Element).setPointerCapture?.(event.pointerId);
    dragRef.current = {
      kind,
      grabOffset: secondsFromX(event.clientX, track.getBoundingClientRect()) - regionStart,
    };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (drag === null || track === null) {
      return;
    }
    const at = secondsFromX(event.clientX, track.getBoundingClientRect());

    if (!isLoop) {
      // Focus region: fixed length, movable across the whole file.
      const start = Math.max(0, Math.min(duration - regionLength, at - drag.grabOffset));
      handlers.onFocus(start, regionLength);
      return;
    }

    if (drag.kind === 'move') {
      const start = Math.max(
        state.focusStart,
        Math.min(focusEnd - state.loopLength, at - drag.grabOffset),
      );
      handlers.onLoop(start, state.loopLength);
    } else if (drag.kind === 'left') {
      const end = state.loopStart + state.loopLength;
      const start = Math.max(
        state.focusStart,
        Math.min(end - LOOP_MIN_SECONDS, Math.max(end - LOOP_MAX_SECONDS, at)),
      );
      handlers.onLoop(start, end - start);
    } else {
      const length = Math.max(
        LOOP_MIN_SECONDS,
        Math.min(LOOP_MAX_SECONDS, Math.min(focusEnd, at) - state.loopStart),
      );
      handlers.onLoop(state.loopStart, length);
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const peaks = decoded?.peaks ?? [];
  const leftPct = (regionStart / duration) * 100;
  const widthPct = (regionLength / duration) * 100;

  return (
    <section className="w-full max-w-[620px] overflow-hidden rounded-lg border border-line bg-bg-1">
      <div className="flex items-center justify-between border-b border-line px-4 py-[11px]">
        <div className="flex items-center gap-[9px]">
          <span className="rounded-[3px] bg-accent px-[6px] py-[2px] font-mono text-[10px] font-semibold tracking-[0.14em] text-bg-0">
            02
          </span>
          <span className="font-mono text-[12px] font-semibold tracking-[0.08em] text-text-hi">
            {isLoop ? 'LOOP SELECTION' : 'FOCUS REGION'}
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.06em] text-text-lo">
          {isLoop ? `${formatTime(state.focusLength)} CROPPED` : `${formatTime(duration)} TOTAL`}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-[14px] flex items-center gap-[13px]">
          <button
            type="button"
            aria-label={state.playback === 'source' ? 'Pause' : 'Play Source'}
            onClick={state.playback === 'source' ? handlers.onPause : handlers.onPlaySource}
            className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-sm border border-accent/40 bg-accent/15 text-accent hover:brightness-110"
          >
            <span className="text-[14px]">{state.playback === 'source' ? '❚❚' : '▶'}</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium">{state.fileName}</div>
            <div className="mt-[3px] flex items-center gap-2 font-mono text-[11px] text-text-lo">
              <span className="inline-flex items-center gap-[5px] text-sem-green">
                <span className="h-[6px] w-[6px] rounded-full bg-sem-green" />
                Ready
              </span>
              · {formatTime(duration)} · {decoded?.sampleRate ?? 0} Hz
            </div>
          </div>
          <button
            type="button"
            aria-label={isLoop ? 'Back to Focus Region' : 'Remove file'}
            onClick={isLoop ? handlers.onBack : handlers.onClose}
            className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-sm border border-line text-[14px] text-text-mid hover:border-text-lo hover:text-text-hi"
          >
            {isLoop ? '←' : '✕'}
          </button>
        </div>

        <div
          ref={trackRef}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          className="relative h-[120px] touch-none select-none overflow-hidden rounded-sm border border-line bg-bg-2"
        >
          <div className="absolute inset-0 flex items-center gap-px px-3">
            {peaks.map((peak, index) => {
              // Each bar's own time position decides its color — no
              // clipping or transform math, correct for any region.
              const barTime = (index / Math.max(1, peaks.length - 1)) * duration;
              const inRegion = barTime >= regionStart && barTime <= regionStart + regionLength;
              return (
                <i
                  key={index}
                  className={`flex-1 rounded-[1px] ${inRegion ? 'bg-accent' : 'bg-text-lo opacity-40'}`}
                  style={{ height: `${Math.max(4, peak * 100)}%` }}
                />
              );
            })}
          </div>
          <div
            role="slider"
            aria-label={isLoop ? 'Loop selection' : 'Focus region'}
            aria-valuenow={Math.round(regionStart)}
            tabIndex={0}
            onPointerDown={onPointerDown('move')}
            className="absolute inset-y-0 cursor-grab border-x-[1.5px] border-accent bg-accent/10 active:cursor-grabbing"
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          >
            {isLoop && (
              <>
                <span
                  onPointerDown={onPointerDown('left')}
                  className="absolute inset-y-0 left-[-6px] flex w-3 cursor-ew-resize items-center justify-center rounded-l bg-accent"
                >
                  <span className="h-[22px] w-[2px] rounded-[1px] bg-bg-0" />
                </span>
                <span
                  onPointerDown={onPointerDown('right')}
                  className="absolute inset-y-0 right-[-6px] flex w-3 cursor-ew-resize items-center justify-center rounded-r bg-accent"
                >
                  <span className="h-[22px] w-[2px] rounded-[1px] bg-bg-0" />
                </span>
              </>
            )}
          </div>
          {sourceProgress !== undefined && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 w-px bg-text-hi shadow-[0_0_6px_1px_rgba(246,242,236,0.6)]"
              style={{ left: `${leftPct + sourceProgress * widthPct}%` }}
            />
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-text-lo">
          <span>
            {isLoop ? 'Loop · ' : 'Focus Region · '}
            <b className="font-semibold text-accent">{formatTime(regionLength)}</b>
            {isLoop ? ' · 3–20s' : ' selected'}
          </span>
          <span>{isLoop ? 'drag edges to resize · body to move' : 'drag to reposition'}</span>
        </div>

        <p className="mt-4 text-center text-[14px] text-text-mid">
          {isLoop ? (
            <>
              Select one complete arpeggio phrase that loops seamlessly.
              <br />
              <b className="font-medium text-text-hi">
                The better the loop, the more accurate the analysis.
              </b>
            </>
          ) : (
            'Select a one-minute section containing the arpeggio.'
          )}
        </p>

        <button
          type="button"
          onClick={isLoop ? handlers.onAnalyze : handlers.onCrop}
          className="mt-3 w-full rounded-md bg-accent px-4 py-[13px] font-mono text-[13px] font-semibold tracking-[0.04em] text-bg-0 hover:brightness-110"
        >
          {isLoop ? 'Analyze' : 'Crop'}
        </button>
      </div>
    </section>
  );
}
