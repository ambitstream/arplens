import type { SupportedRate } from '../config/rates';

/**
 * BPM ×2 / ÷2 with Rate kept in sync (D-406). Doubling BPM while
 * halving the rate subdivision preserves the same note timing, so
 * ×2 moves the rate one step toward 1/4 and ÷2 one step toward 1/32,
 * within the straight or triplet family. Returns undefined when the
 * move would leave the supported set — the button is then disabled.
 */
const STRAIGHT: readonly SupportedRate[] = ['1/4', '1/8', '1/16', '1/32'];
const TRIPLET: readonly SupportedRate[] = ['1/4T', '1/8T', '1/16T', '1/32T'];

export function scaledBpmRate(
  bpm: number,
  rate: SupportedRate,
  direction: 'double' | 'half',
): { bpm: number; rate: SupportedRate } | undefined {
  const family = STRAIGHT.includes(rate) ? STRAIGHT : TRIPLET;
  const index = family.indexOf(rate);
  // ×2 BPM pairs with a coarser subdivision (toward 1/4, lower index).
  const nextIndex = direction === 'double' ? index - 1 : index + 1;

  if (nextIndex < 0 || nextIndex >= family.length) {
    return undefined;
  }
  return {
    bpm: direction === 'double' ? bpm * 2 : bpm / 2,
    rate: family[nextIndex],
  };
}
