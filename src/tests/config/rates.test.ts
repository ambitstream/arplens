import { describe, expect, it } from 'vitest';
import { SUPPORTED_RATES } from '../../config/rates';

describe('SUPPORTED_RATES', () => {
  it('matches the PRD Supported Rates (MVP) list, in order', () => {
    expect(SUPPORTED_RATES).toEqual([
      '1/4',
      '1/8',
      '1/16',
      '1/32',
      '1/4T',
      '1/8T',
      '1/16T',
      '1/32T',
    ]);
  });
});
