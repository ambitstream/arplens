import { describe, expect, it } from 'vitest';
import { getStyleById } from '../../analysis/registry/style-registry';
import { SUPPORTED_RATES } from '../../config/rates';
import { SANDBOX_DEFAULTS } from '../../config/sandbox-defaults';

describe('SANDBOX_DEFAULTS', () => {
  it('matches the agreed defaults: BPM 120, C/E/G, Up, 1/16, 2 octaves', () => {
    expect(SANDBOX_DEFAULTS).toEqual({
      bpm: 120,
      inputNotes: ['C', 'E', 'G'],
      styleId: 'up',
      rate: '1/16',
      octaves: 2,
    });
  });

  it('references a style that exists in the registry', () => {
    expect(getStyleById(SANDBOX_DEFAULTS.styleId)?.displayName).toBe('Up');
  });

  it('uses a supported rate', () => {
    expect(SUPPORTED_RATES).toContain(SANDBOX_DEFAULTS.rate);
  });

  it('uses octaves within the supported range (PRD: 1-4)', () => {
    expect(SANDBOX_DEFAULTS.octaves).toBeGreaterThanOrEqual(1);
    expect(SANDBOX_DEFAULTS.octaves).toBeLessThanOrEqual(4);
  });
});
