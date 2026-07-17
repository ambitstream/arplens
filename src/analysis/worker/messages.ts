import type { AnalysisResult } from '../engine/types';

/**
 * Typed messages for main-thread <-> worker communication. Anonymous
 * objects are never posted (docs/10_CODE_STYLE.md).
 */

export interface AnalyzeRequest {
  readonly type: 'analyze';
  readonly id: number;
  /** Mono PCM of the selected loop; the buffer is transferred. */
  readonly pcm: Float32Array;
  readonly sampleRate: number;
}

export interface AnalyzeSuccess {
  readonly type: 'result';
  readonly id: number;
  readonly result: AnalysisResult;
}

export interface AnalyzeFailure {
  readonly type: 'error';
  readonly id: number;
  readonly message: string;
}

export type WorkerRequest = AnalyzeRequest;
export type WorkerResponse = AnalyzeSuccess | AnalyzeFailure;
