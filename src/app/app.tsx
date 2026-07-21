import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { decodeAudioFile, extractLoop } from '../audio/audio-decode-service';
import { AnalysisService } from '../services/analysis-service';
import { generateSequenceMidis, isComplete, stepDurationSeconds } from '../preview/arp-settings';
import type { PreviewSequence } from '../preview/preview-engine';
import { noteNameToMidi, type PitchClass } from '../utils/note-names';
import type { SupportedRate } from '../config/rates';
import { usePlayback } from '../hooks/use-playback';
import type { ResultPanelHandlers } from '../components/result-panel';
import { INITIAL_STATE, reducer, type ErrorKind } from './state';
import { Footer, Hero, TopBar } from '../components/chrome';
import { UploadCard } from '../components/upload-card';
import { WaveformPanel } from '../components/waveform-panel';
import { AnalysisPanel } from '../components/analysis-panel';
import { ResultPanel } from '../components/result-panel';

const HERO_DEFAULT = {
  headline: 'Recreate standard arpeggios from audio.',
  subtitle: 'Get ready-to-use arpeggiator settings for your favorite synth, plugin or DAW.',
};
const HERO_SANDBOX = {
  headline: 'Arpeggio Sandbox',
  subtitle: 'Experiment with arpeggiator settings — no audio required.',
};

const browserSupported = typeof AudioContext !== 'undefined' && typeof Worker !== 'undefined';

export function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const serviceRef = useRef<AnalysisService>(undefined);
  const playback = usePlayback();

  // Keep the DOM playback state and the reducer in sync.
  useEffect(() => {
    if (playback.active !== state.playback) {
      dispatch({ type: 'set-playback', source: playback.active });
    }
  }, [playback.active, state.playback]);

  const handleFile = useCallback(async (file: File) => {
    if (!browserSupported) {
      dispatch({ type: 'decode-error', error: 'unsupported-browser' });
      return;
    }
    try {
      const decoded = await decodeAudioFile(file);
      dispatch({ type: 'decoded', fileName: file.name, decoded });
    } catch {
      dispatch({ type: 'decode-error', error: 'decode-failed' });
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (state.decoded === undefined) {
      return;
    }
    playback.stop();
    dispatch({ type: 'analyze-start' });
    try {
      serviceRef.current ??= new AnalysisService();
      const pcm = extractLoop(state.decoded, state.loopStart, state.loopLength);
      const result = await serviceRef.current.analyze(pcm, state.decoded.sampleRate);
      dispatch({ type: 'analyze-result', result });
    } catch (cause) {
      const error: ErrorKind =
        cause instanceof Error && /worker/i.test(cause.message)
          ? 'engine-unavailable'
          : 'unexpected';
      dispatch({ type: 'analyze-error', error });
    }
  }, [state.decoded, state.loopStart, state.loopLength, playback]);

  const previewSequence = useMemo((): PreviewSequence | undefined => {
    const { settings, detectedSequence, detectedStepDuration } = state;
    if (isComplete(settings)) {
      const step = stepDurationSeconds(settings);
      if (step !== undefined) {
        return { midis: generateSequenceMidis(settings), stepDurationSeconds: step };
      }
    }
    if (detectedSequence !== undefined && detectedStepDuration !== undefined) {
      const midis = detectedSequence
        .map(noteNameToMidi)
        .filter((midi): midi is number => midi !== undefined);
      return { midis, stepDurationSeconds: detectedStepDuration };
    }
    return undefined;
    // Deliberately narrow: depending on `state` would give a new
    // reference on every dispatch (e.g. playback syncing), defeating
    // the identity check the live-update effect below relies on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings, state.detectedSequence, state.detectedStepDuration]);

  // While Play Modulation is active, apply edits live instead of
  // requiring a manual stop/restart. Skips the sequence that
  // onPlayModulation just started (tracked via the ref) so starting
  // playback doesn't immediately re-trigger a redundant rebuild.
  const modulationSequenceRef = useRef<PreviewSequence>(undefined);
  useEffect(() => {
    if (
      playback.active === 'modulation' &&
      previewSequence !== undefined &&
      previewSequence !== modulationSequenceRef.current
    ) {
      modulationSequenceRef.current = previewSequence;
      void playback.updateModulation(previewSequence);
    }
    // `playback` is a new object every render; depend on its stable
    // fields only, or this would fire on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewSequence, playback.active, playback.updateModulation]);

  const resultHandlers: ResultPanelHandlers = {
    onNotes: (inputNotes: readonly PitchClass[]) => dispatch({ type: 'edit-notes', inputNotes }),
    onStyle: (styleId: string) => dispatch({ type: 'edit-style', styleId }),
    onRate: (rate: SupportedRate) => dispatch({ type: 'edit-rate', rate }),
    onOctaves: (octaves: number) => dispatch({ type: 'edit-octaves', octaves }),
    onBpm: (bpm: number) => dispatch({ type: 'edit-bpm', bpm }),
    onPlaySource: () => {
      if (state.decoded !== undefined) {
        playback.playSource(
          extractLoop(state.decoded, state.loopStart, state.loopLength),
          state.decoded.sampleRate,
        );
      }
    },
    onPlayModulation: () => {
      if (previewSequence !== undefined) {
        modulationSequenceRef.current = previewSequence;
        void playback.playModulation(previewSequence);
      }
    },
    onPause: () => playback.stop(),
  };

  const hero = state.phase === 'sandbox' ? HERO_SANDBOX : HERO_DEFAULT;

  const resetToUpload = () => {
    playback.stop();
    dispatch({ type: 'reset-to-upload' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-0 text-text-hi">
      <TopBar onUpload={state.phase === 'upload' ? undefined : resetToUpload} />
      <main className="flex flex-1 flex-col items-center gap-7 px-6 pb-12 pt-10">
        <Hero headline={hero.headline} subtitle={hero.subtitle} />

        {state.phase === 'upload' && (
          <>
            <UploadCard
              onFile={(f) => void handleFile(f)}
              onSandbox={() => dispatch({ type: 'enter-sandbox' })}
            />
            {state.errorKind !== undefined && (
              <AnalysisPanel loading={false} errorKind={state.errorKind} onRetry={resetToUpload} />
            )}
          </>
        )}

        {state.phase === 'waveform' && (
          <WaveformPanel
            state={state}
            handlers={{
              onFocus: (start, length) => dispatch({ type: 'set-focus', start, length }),
              onLoop: (start, length) => dispatch({ type: 'set-loop', start, length }),
              onCrop: () => dispatch({ type: 'confirm-focus' }),
              onBack: () => {
                playback.stop();
                dispatch({ type: 'back-to-focus' });
              },
              onClose: resetToUpload,
              onAnalyze: () => void handleAnalyze(),
              onPlaySource: resultHandlers.onPlaySource,
              onPause: resultHandlers.onPause,
              getSourceProgress: playback.getSourceProgress,
            }}
          />
        )}

        {state.phase === 'analysis' && (
          <AnalysisPanel
            loading={state.analyzeStatus === 'loading'}
            errorKind={state.errorKind}
            onRetry={resetToUpload}
          />
        )}

        {(state.phase === 'results' || state.phase === 'sandbox') && (
          <ResultPanel
            state={state}
            sandbox={state.phase === 'sandbox'}
            handlers={resultHandlers}
            playingIndex={playback.playingIndex}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
