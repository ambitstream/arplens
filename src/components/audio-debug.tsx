import { useRef, useState } from 'react';
import { decodeAudioFile, extractLoop, type DecodedAudio } from '../audio/audio-decode-service';
import type { AnalysisResult } from '../analysis/engine/types';
import { AnalysisService } from '../services/analysis-service';

type Status = 'empty' | 'decoding' | 'ready' | 'analyzing' | 'done' | 'failed';

/**
 * Temporary M4 debug view: upload audio, pick a loop, run the full
 * pipeline (decode -> worker -> Basic Pitch -> engine) and inspect
 * the Result DTO. Replaced by the full workflow UI in M5.
 */
export function AudioDebug() {
  const serviceRef = useRef<AnalysisService>(undefined);
  const [status, setStatus] = useState<Status>('empty');
  const [fileName, setFileName] = useState('');
  const [decoded, setDecoded] = useState<DecodedAudio>();
  const [loopStart, setLoopStart] = useState(0);
  const [loopLength, setLoopLength] = useState(5);
  const [result, setResult] = useState<AnalysisResult>();
  const [error, setError] = useState('');

  const onFile = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }
    setStatus('decoding');
    setResult(undefined);
    setError('');
    try {
      const audio = await decodeAudioFile(file);
      setDecoded(audio);
      setFileName(file.name);
      setLoopStart(0);
      setLoopLength(Math.min(20, audio.durationSeconds));
      setStatus('ready');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus('failed');
    }
  };

  const onAnalyze = async () => {
    if (decoded === undefined) {
      return;
    }
    setStatus('analyzing');
    setResult(undefined);
    setError('');
    try {
      serviceRef.current ??= new AnalysisService();
      const pcm = extractLoop(decoded, loopStart, loopLength);
      const analysis = await serviceRef.current.analyze(pcm, decoded.sampleRate);
      setResult(analysis);
      setStatus('done');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setStatus('failed');
    }
  };

  const inputClasses =
    'w-24 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-100';

  return (
    <section
      aria-label="Audio pipeline debug"
      className="mx-auto mt-16 w-full max-w-xl rounded-lg border border-neutral-800 p-6 text-left"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Audio pipeline debug
      </h2>
      <p className="mt-1 text-xs text-neutral-500">
        temporary M4 view — decode → worker → Basic Pitch → engine
      </p>

      <label className="mt-4 block text-sm text-neutral-300">
        Audio file
        <input
          type="file"
          accept="audio/*,.mp3,.wav,.m4a"
          className="mt-1 block w-full text-xs text-neutral-400"
          onChange={(event) => void onFile(event.target.files?.[0] ?? undefined)}
        />
      </label>

      {decoded !== undefined && (
        <p className="mt-2 text-xs text-neutral-400" aria-label="Loaded file">
          {fileName} · {decoded.durationSeconds.toFixed(2)}s · {decoded.sampleRate} Hz
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Loop start (s)
          <input
            type="number"
            className={inputClasses}
            min={0}
            step={0.1}
            value={loopStart}
            onChange={(event) => setLoopStart(Number(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-neutral-300">
          Loop length (s)
          <input
            type="number"
            className={inputClasses}
            min={3}
            max={20}
            step={0.1}
            value={loopLength}
            onChange={(event) => setLoopLength(Number(event.target.value))}
          />
        </label>
        <button
          type="button"
          disabled={decoded === undefined || status === 'analyzing'}
          onClick={() => void onAnalyze()}
          className="rounded bg-cyan-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {status === 'analyzing' ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      <p className="mt-3 text-xs text-neutral-500" aria-label="Audio analysis status">
        status: {status}
        {error !== '' ? ` — ${error}` : ''}
      </p>

      {result !== undefined && (
        <pre
          aria-label="Audio analysis result"
          className="mt-3 overflow-x-auto rounded bg-neutral-900 px-3 py-2 font-mono text-xs text-cyan-300"
        >
          {JSON.stringify(result, undefined, 2)}
        </pre>
      )}
    </section>
  );
}
