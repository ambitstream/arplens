import { STYLE_REGISTRY } from '../registry/style-registry';
import type { Hypothesis } from './types';

/**
 * Stage 8 — Joint Hypothesis Enumeration (D-200).
 *
 * Input Notes, Octaves and Style are enumerated together, never
 * inferred independently. Candidates come from the distinct pitches
 * of the observed sequence: for every octave count that decomposes
 * the pitch set into base notes replicated at +12-semitone
 * intervals, one hypothesis is generated per registry style — in
 * registry order, which is significant for the final tie-break
 * (D-202).
 */
export function enumerateHypotheses(observed: readonly number[]): readonly Hypothesis[] {
  const distinct = [...new Set(observed)].sort((a, b) => a - b);
  const total = distinct.length;

  if (total === 0) {
    return [];
  }

  const hypotheses: Hypothesis[] = [];

  for (let octaves = total; octaves >= 1; octaves -= 1) {
    if (total % octaves !== 0) {
      continue;
    }

    const baseMidis = octaveDecomposition(distinct, octaves);
    if (baseMidis === undefined) {
      continue;
    }

    for (const style of STYLE_REGISTRY) {
      hypotheses.push({ baseMidis, octaves, styleId: style.id });
    }
  }

  return hypotheses;
}

/**
 * Attempts to decompose the sorted distinct pitch set into base
 * notes replicated across `octaves` octaves. Chain-stripping handles
 * held notes that span more than one octave, where replicas
 * interleave with base notes in sorted order: repeatedly take the
 * lowest unconsumed pitch as a base note and consume its +12j
 * replicas. Returns the base notes, or undefined if any replica is
 * missing.
 */
function octaveDecomposition(
  distinct: readonly number[],
  octaves: number,
): readonly number[] | undefined {
  const remaining = new Set(distinct);
  const base: number[] = [];

  for (const pitch of distinct) {
    if (!remaining.has(pitch)) {
      continue; // Already consumed as a replica of a lower base note.
    }
    for (let j = 0; j < octaves; j += 1) {
      if (!remaining.has(pitch + 12 * j)) {
        return undefined;
      }
    }
    for (let j = 0; j < octaves; j += 1) {
      remaining.delete(pitch + 12 * j);
    }
    base.push(pitch);
  }

  return base;
}
