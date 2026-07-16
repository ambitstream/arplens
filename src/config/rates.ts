/**
 * Supported arpeggiator playback rates (PRD "Supported Rates (MVP)").
 *
 * Centralized per docs/10_CODE_STYLE.md ("Never hardcode... supported
 * rates. These belong in configuration.").
 */
export const SUPPORTED_RATES = [
  '1/4',
  '1/8',
  '1/16',
  '1/32',
  '1/4T',
  '1/8T',
  '1/16T',
  '1/32T',
] as const;

export type SupportedRate = (typeof SUPPORTED_RATES)[number];
