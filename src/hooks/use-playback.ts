import { useCallback, useEffect, useRef, useState } from 'react';
import { PreviewEngine, type PreviewSequence } from '../preview/preview-engine';
import type { PlaybackSource } from '../app/state';

/**
 * The app-level Playback Controller (D-501): Play Source (original
 * loop audio) and Play Modulation (reconstructed arpeggio) are
 * mutually exclusive — starting one pauses the other.
 */
export function usePlayback() {
  const engineRef = useRef<PreviewEngine>(undefined);
  const audioCtxRef = useRef<AudioContext>(undefined);
  const sourceNodeRef = useRef<AudioBufferSourceNode>(undefined);
  // AudioContext.currentTime the source started at, and its loop
  // length — enough to compute playhead position without any timer.
  const sourceStartedAtRef = useRef<number>(undefined);
  const sourceLoopSecondsRef = useRef<number>(undefined);
  const [active, setActive] = useState<PlaybackSource>('none');
  const [playingIndex, setPlayingIndex] = useState<number>();

  const stopSource = useCallback(() => {
    if (sourceNodeRef.current !== undefined) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Already stopped.
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = undefined;
    }
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.pause();
    stopSource();
    setActive('none');
  }, [stopSource]);

  const playModulation = useCallback(
    async (sequence: PreviewSequence) => {
      stopSource();
      engineRef.current ??= new PreviewEngine();
      await engineRef.current.start(sequence, setPlayingIndex);
      setActive('modulation');
    },
    [stopSource],
  );

  /** Applies an edited sequence to an already-playing modulation, live. */
  const updateModulation = useCallback(async (sequence: PreviewSequence) => {
    await engineRef.current?.update(sequence);
  }, []);

  const playSource = useCallback(
    (mono: Float32Array, sampleRate: number) => {
      engineRef.current?.pause();
      audioCtxRef.current ??= new AudioContext();
      const ctx = audioCtxRef.current;
      void ctx.resume();

      stopSource();
      const buffer = ctx.createBuffer(1, mono.length, sampleRate);
      buffer.getChannelData(0).set(mono);
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.loop = true;
      node.connect(ctx.destination);
      node.start();
      sourceNodeRef.current = node;
      sourceStartedAtRef.current = ctx.currentTime;
      sourceLoopSecondsRef.current = mono.length / sampleRate;
      setActive('source');
    },
    [stopSource],
  );

  /** Fraction (0..1) through the looping source, or undefined when not playing it. */
  const getSourceProgress = useCallback((): number | undefined => {
    const ctx = audioCtxRef.current;
    const startedAt = sourceStartedAtRef.current;
    const loopSeconds = sourceLoopSecondsRef.current;
    if (
      ctx === undefined ||
      startedAt === undefined ||
      loopSeconds === undefined ||
      loopSeconds <= 0 ||
      sourceNodeRef.current === undefined
    ) {
      return undefined;
    }
    const elapsed = (ctx.currentTime - startedAt) % loopSeconds;
    return elapsed / loopSeconds;
  }, []);

  useEffect(
    () => () => {
      stopSource();
      engineRef.current?.dispose();
      void audioCtxRef.current?.close();
    },
    [stopSource],
  );

  return {
    active,
    playModulation,
    updateModulation,
    playSource,
    stop,
    getSourceProgress,
    playingIndex,
  };
}
