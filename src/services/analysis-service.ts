import type { AnalysisResult } from '../analysis/engine/types';
import type { AnalyzeRequest, WorkerResponse } from '../analysis/worker/messages';

interface PendingRequest {
  readonly resolve: (result: AnalysisResult) => void;
  readonly reject: (error: Error) => void;
}

/**
 * Main-thread client for the analysis Web Worker. Creates the
 * worker lazily, correlates responses by request id, and exposes
 * one promise-based call. Performs no analysis itself.
 */
export class AnalysisService {
  private worker: Worker | undefined;
  private nextId = 1;
  private readonly pending = new Map<number, PendingRequest>();

  analyze(pcm: Float32Array, sampleRate: number): Promise<AnalysisResult> {
    const worker = this.ensureWorker();
    const id = this.nextId;
    this.nextId += 1;

    return new Promise<AnalysisResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      const request: AnalyzeRequest = { type: 'analyze', id, pcm, sampleRate };
      // Transfer the PCM buffer: the loop slice is a copy, so the
      // caller's decoded audio is unaffected.
      worker.postMessage(request, [pcm.buffer]);
    });
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = undefined;
    for (const request of this.pending.values()) {
      request.reject(new Error('Analysis service disposed.'));
    }
    this.pending.clear();
  }

  private ensureWorker(): Worker {
    if (this.worker !== undefined) {
      return this.worker;
    }

    const worker = new Worker(new URL('../analysis/worker/analysis-worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const request = this.pending.get(response.id);
      if (request === undefined) {
        return;
      }
      this.pending.delete(response.id);

      if (response.type === 'result') {
        request.resolve(response.result);
      } else {
        request.reject(new Error(response.message));
      }
    };

    worker.onerror = (event) => {
      const error = new Error(event.message || 'Analysis worker failed.');
      for (const request of this.pending.values()) {
        request.reject(error);
      }
      this.pending.clear();
    };

    this.worker = worker;
    return worker;
  }
}
