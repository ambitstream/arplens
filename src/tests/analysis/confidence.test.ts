import { describe, expect, it } from 'vitest';
import {
  buildConfidenceComponents,
  toConfidenceBand,
  weakestComponent,
} from '../../analysis/engine/confidence';
import { DEFAULT_ANALYSIS_CONFIG } from '../../config/analysis';

describe('confidence', () => {
  it('overall confidence is the weakest component', () => {
    const components = buildConfidenceComponents({
      transcriptionQuality: 1,
      gridResidualRatio: 0.1,
      patternScore: 0.95,
      ambiguity: 0.4,
    });

    expect(weakestComponent(components)).toBeCloseTo(0.4, 9);
  });

  it('clamps every component into [0, 1]', () => {
    const components = buildConfidenceComponents({
      transcriptionQuality: 1.7,
      gridResidualRatio: 1.4,
      patternScore: -0.2,
      ambiguity: 2,
    });

    expect(components).toEqual({ transcription: 1, grid: 0, pattern: 0, ambiguity: 1 });
  });

  it('maps overall scores to bands at the configured floors', () => {
    expect(toConfidenceBand(0.45, DEFAULT_ANALYSIS_CONFIG)).toBe('high');
    expect(toConfidenceBand(0.44, DEFAULT_ANALYSIS_CONFIG)).toBe('medium');
    expect(toConfidenceBand(0.35, DEFAULT_ANALYSIS_CONFIG)).toBe('medium');
    expect(toConfidenceBand(0.34, DEFAULT_ANALYSIS_CONFIG)).toBe('low');
  });
});
