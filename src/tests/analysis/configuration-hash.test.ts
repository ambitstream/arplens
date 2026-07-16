import { describe, expect, it } from 'vitest';
import { hashConfiguration } from '../../analysis/pipeline/configuration-hash';
import { DEFAULT_ANALYSIS_CONFIG } from '../../config/analysis';

describe('hashConfiguration', () => {
  it('is independent of property insertion order', () => {
    expect(hashConfiguration({ a: 1, b: [2, 3] })).toBe(hashConfiguration({ b: [2, 3], a: 1 }));
  });

  it('changes when any value changes', () => {
    const base = hashConfiguration(DEFAULT_ANALYSIS_CONFIG);
    const changed = hashConfiguration({ ...DEFAULT_ANALYSIS_CONFIG, ambiguityEpsilon: 0.2 });

    expect(changed).not.toBe(base);
  });

  it('is stable across calls', () => {
    expect(hashConfiguration(DEFAULT_ANALYSIS_CONFIG)).toBe(
      hashConfiguration(DEFAULT_ANALYSIS_CONFIG),
    );
  });
});
