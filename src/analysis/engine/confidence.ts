import type { AnalysisConfig } from '../../config/analysis';
import type { ConfidenceBand, ConfidenceComponents } from './types';

/**
 * Stage 11 — Confidence Evaluation.
 *
 * Four independent components; overall confidence is the WEAKEST
 * one. Internal scores are implementation details — only the band
 * is ever displayed.
 */
export function buildConfidenceComponents(input: {
  readonly transcriptionQuality: number;
  readonly gridResidualRatio: number;
  readonly patternScore: number;
  readonly ambiguity: number;
}): ConfidenceComponents {
  return {
    transcription: clamp01(input.transcriptionQuality),
    grid: clamp01(1 - input.gridResidualRatio),
    pattern: clamp01(input.patternScore),
    ambiguity: clamp01(input.ambiguity),
  };
}

export function weakestComponent(components: ConfidenceComponents): number {
  return Math.min(
    components.transcription,
    components.grid,
    components.pattern,
    components.ambiguity,
  );
}

export function toConfidenceBand(overall: number, config: AnalysisConfig): ConfidenceBand {
  if (overall >= config.confidenceHighFloor) {
    return 'high';
  }
  if (overall >= config.confidenceMediumFloor) {
    return 'medium';
  }
  return 'low';
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
