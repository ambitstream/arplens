import { DEFAULT_ANALYSIS_CONFIG } from '../../config/analysis';
import { cleanup } from '../engine/cleanup';
import { normalizePitches } from '../engine/pitch-normalization';
import { linearResample } from '../engine/resample';
import { analyze } from '../pipeline/analyze';
import type { WorkerRequest, WorkerResponse } from './messages';
import { transcribe } from './transcription';

/**
 * The analysis Web Worker (D-105): stages 1-4 (resample,
 * transcription, cleanup, normalization) followed by the pure core
 * (stages 5-12). The UI thread never runs any of this.
 */

// The DOM lib types postMessage with a targetOrigin; inside a worker
// it takes only the message. One narrow cast instead of pulling the
// conflicting WebWorker lib into the whole program.
const respond = postMessage as (message: WorkerResponse) => void;

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type !== 'analyze') {
    return;
  }

  void handleAnalyze(request.id, request.pcm, request.sampleRate);
};

async function handleAnalyze(id: number, pcm: Float32Array, sampleRate: number): Promise<void> {
  try {
    const config = DEFAULT_ANALYSIS_CONFIG;

    const resampled = linearResample(pcm, sampleRate, config.transcriptionSampleRate);
    const raw = await transcribe(resampled, config);
    const { events, transcriptionQuality } = cleanup(raw, config);
    const noteEvents = normalizePitches(events);
    const result = analyze(noteEvents, { config, transcriptionQuality });

    respond({ type: 'result', id, result });
  } catch (error) {
    respond({
      type: 'error',
      id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
