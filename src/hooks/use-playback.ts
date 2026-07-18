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
  const [active, setActive] = useState<PlaybackSource>('none');

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
      await engineRef.current.start(sequence);
      setActive('modulation');
    },
    [stopSource],
  );

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
      setActive('source');
    },
    [stopSource],
  );

  useEffect(
    () => () => {
      stopSource();
      engineRef.current?.dispose();
      void audioCtxRef.current?.close();
    },
    [stopSource],
  );

  return { active, playModulation, playSource, stop };
}
