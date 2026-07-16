import type { AnalysisConfig } from '../../config/analysis';
import type { NoteEvent, StepGrid } from './types';

/**
 * Stage 5 — Step Grid Estimation.
 *
 * Estimates step duration and grid phase from note onsets alone.
 * BPM is intentionally NOT estimated here (that is Stage 10).
 *
 * Deterministic by construction: candidate step durations come from
 * clustering inter-onset intervals, phase candidates are the onsets
 * themselves, and every tie is broken by a fixed rule. No trig, no
 * randomness — plain arithmetic only, so results are bit-stable
 * across engines (D-107).
 */
export function estimateStepGrid(events: readonly NoteEvent[], config: AnalysisConfig): StepGrid {
  const onsets = events.map((event) => event.onsetSeconds);

  const iois: number[] = [];
  for (let i = 1; i < onsets.length; i += 1) {
    const ioi = onsets[i] - onsets[i - 1];
    if (ioi > 0) {
      iois.push(ioi);
    }
  }

  if (iois.length === 0) {
    throw new Error('Step grid estimation requires at least two distinct onsets.');
  }

  const candidates = clusterCenters(iois, config.ioiClusterTolerance);

  let best: StepGrid | undefined;
  for (const stepDuration of candidates) {
    const grid = bestPhaseForStep(onsets, stepDuration);
    // Prefer lower residual; on ties (within float noise) prefer the
    // LARGER step: fewer steps is the simpler explanation.
    if (
      best === undefined ||
      grid.residualRatio < best.residualRatio - 1e-9 ||
      (Math.abs(grid.residualRatio - best.residualRatio) <= 1e-9 &&
        grid.stepDurationSeconds > best.stepDurationSeconds)
    ) {
      best = grid;
    }
  }

  if (best === undefined) {
    throw new Error('Step grid estimation produced no candidates.');
  }

  return best;
}

/**
 * Groups sorted IOIs into clusters whose members lie within the
 * relative tolerance of the running cluster mean, and returns each
 * cluster's mean as a candidate step duration.
 */
function clusterCenters(iois: readonly number[], tolerance: number): number[] {
  const sorted = [...iois].sort((a, b) => a - b);
  const centers: number[] = [];

  let clusterSum = sorted[0];
  let clusterCount = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const mean = clusterSum / clusterCount;
    if (Math.abs(sorted[i] - mean) <= mean * tolerance) {
      clusterSum += sorted[i];
      clusterCount += 1;
    } else {
      centers.push(clusterSum / clusterCount);
      clusterSum = sorted[i];
      clusterCount = 1;
    }
  }
  centers.push(clusterSum / clusterCount);

  return centers;
}

/**
 * For a fixed step duration, tries each onset as the phase anchor and
 * keeps the phase with the lowest mean |residual|. Ties prefer the
 * earliest anchor.
 */
function bestPhaseForStep(onsets: readonly number[], stepDuration: number): StepGrid {
  const half = stepDuration / 2;

  let bestPhase = 0;
  let bestMeanResidual = Number.POSITIVE_INFINITY;

  for (const anchor of onsets) {
    const phase = ((anchor % stepDuration) + stepDuration) % stepDuration;

    let total = 0;
    for (const onset of onsets) {
      const offset = (((onset - phase) % stepDuration) + stepDuration) % stepDuration;
      // Distance to the nearest grid line, wrapped into [-half, half].
      total += Math.abs(offset > half ? offset - stepDuration : offset);
    }
    const mean = total / onsets.length;

    if (mean < bestMeanResidual - 1e-12) {
      bestMeanResidual = mean;
      bestPhase = phase;
    }
  }

  return {
    stepDurationSeconds: stepDuration,
    phaseSeconds: bestPhase,
    residualRatio: Math.min(1, bestMeanResidual / half),
  };
}
