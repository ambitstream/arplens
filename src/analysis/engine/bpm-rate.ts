import { BEATS_PER_STEP, type AnalysisConfig } from '../../config/analysis';
import { SUPPORTED_RATES } from '../../config/rates';
import type { BpmRateResolution } from './types';

/**
 * Stage 10 — Joint BPM / Rate Resolution (D-203, D-207).
 *
 * The step duration alone fixes only the product of BPM and rate;
 * every supported rate yields one candidate pair. The deterministic
 * preference rule picks among them:
 *
 *   1. Prefer BPM inside the configured range.
 *   2. Among those, prefer rates in the configured order.
 *   3. If none is in range, choose the BPM closest to the fallback
 *      anchor (ties broken by rate order).
 */
export function resolveBpmRate(
  stepDurationSeconds: number,
  config: AnalysisConfig,
): BpmRateResolution {
  const candidates = SUPPORTED_RATES.map((rate) => ({
    rate,
    bpm: (60 * BEATS_PER_STEP[rate]) / stepDurationSeconds,
  }));

  const rateRank = (rate: (typeof SUPPORTED_RATES)[number]): number =>
    config.ratePreferenceOrder.indexOf(rate);

  const inRange = candidates.filter(
    (candidate) =>
      candidate.bpm >= config.preferredBpmMin && candidate.bpm < config.preferredBpmMax,
  );

  if (inRange.length > 0) {
    const preferred = [...inRange].sort((a, b) => rateRank(a.rate) - rateRank(b.rate))[0];
    return { bpm: preferred.bpm, rate: preferred.rate };
  }

  const closest = [...candidates].sort((a, b) => {
    const byDistance = Math.abs(a.bpm - config.fallbackBpm) - Math.abs(b.bpm - config.fallbackBpm);
    return byDistance !== 0 ? byDistance : rateRank(a.rate) - rateRank(b.rate);
  })[0];

  return { bpm: closest.bpm, rate: closest.rate };
}
