import type { SupportedRate } from './rates';

/**
 * Default settings for Arpeggio Sandbox mode
 * (docs/06_UI_SPEC.md Section 7).
 *
 * Seeds the editable model directly; no Result DTO is ever
 * produced in Sandbox mode.
 */
export interface SandboxDefaults {
  readonly bpm: number;
  readonly inputNotes: readonly string[];
  readonly styleId: string;
  readonly rate: SupportedRate;
  readonly octaves: number;
}

export const SANDBOX_DEFAULTS: SandboxDefaults = {
  bpm: 120,
  inputNotes: ['C', 'E', 'G'],
  styleId: 'up',
  rate: '1/16',
  octaves: 2,
};
