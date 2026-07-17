import type { AnalysisConfig } from '../../config/analysis';
import { indexToMidi } from '../../utils/index-to-midi';
import type { Hypothesis, HypothesisMatch } from '../engine/types';
import { getStyleById, STYLE_REGISTRY } from '../registry/style-registry';
import { editDistanceToPrefix } from './edit-distance';

/**
 * Stage 9 — Style Matching (D-201, D-202, D-206).
 *
 * Generates the candidate cycle for every hypothesis through the
 * Style Registry, TILES it across the full observed sequence, and
 * scores it with rotation-invariant edit distance. Tiling uses every
 * observed repetition as evidence: a clean multi-cycle take still
 * scores distance 0, while an isolated transcription dropout costs
 * only its edit — instead of destroying exact periodicity and with
 * it the whole match. A truncated final repetition falls out of the
 * tiling for free. The winner is selected with the deterministic
 * tie-break chain.
 *
 * For the ambiguity component, hypotheses are grouped by OBSERVABLE
 * OUTPUT: two hypotheses whose generated cycles are rotations of
 * each other describe the same audible pattern and count as one.
 * This covers D-206's rotation-equivalent styles (UpDown/DownUp)
 * and also structural twins — e.g. Up over {C,E,G} x 2 octaves
 * generates the identical cycle as Up over the six distinct notes
 * x 1 octave. Twins are resolved by the parsimony tie-breaks
 * (fewest notes, fewest octaves), not treated as genuine ambiguity;
 * genuine ambiguity means DIFFERENT outputs scoring similarly.
 */

export interface MatchSelection {
  /** Best match after the full D-202 ordering, if any hypothesis exists. */
  readonly best?: HypothesisMatch;
  /** Whether the best match is inside the edit-distance budget. */
  readonly withinBudget: boolean;
  /** Ambiguity confidence component in [0, 1]; 1 = unambiguous. */
  readonly ambiguity: number;
  /**
   * Input notes + octaves shared by every competitive group's best
   * member (the D-208 Level 3 consensus rule); undefined when
   * competitive groups disagree or nothing matched.
   */
  readonly consensus?: { baseMidis: readonly number[]; octaves: number };
  /** Number of output-distinct competitive groups. */
  readonly competitiveGroupCount: number;
}

export function matchHypotheses(
  observed: readonly number[],
  hypotheses: readonly Hypothesis[],
): readonly HypothesisMatch[] {
  return hypotheses.map((hypothesis) => {
    const style = getStyleById(hypothesis.styleId);
    if (style === undefined) {
      throw new Error(`Unknown style id: ${hypothesis.styleId}`);
    }

    const generated = style
      .generate({ noteCount: hypothesis.baseMidis.length, octaves: hypothesis.octaves })
      .map((step) => indexToMidi(step[0], hypothesis.baseMidis));

    let distance = Number.POSITIVE_INFINITY;
    let bestRotation = 0;
    for (let rotation = 0; rotation < Math.max(1, generated.length); rotation += 1) {
      // Rotate the base cycle (the loop may start mid-cycle), then
      // tile ONE repetition past the observed length: transcription
      // dropouts shift the alignment, and the surplus keeps pattern
      // available at the tail. Prefix scoring makes the unused
      // surplus free — it lies beyond the loop's end.
      const tiled = tileTo(rotate(generated, rotation), observed.length + generated.length);
      const d = editDistanceToPrefix(tiled, observed);
      // Strict < keeps the SMALLEST rotation achieving the minimum,
      // which is what phase preference (D-202 rule 3) tests against.
      if (d < distance) {
        distance = d;
        bestRotation = rotation;
      }
    }

    // A candidate longer than the observation was truncated by the
    // tiling: its unheard remainder is unverified, not confirmed.
    // Without this penalty, UpDown truncated to its ascending half
    // would "exactly match" a single Up cycle it never disproved.
    distance += Math.max(0, generated.length - observed.length);

    const longest = Math.max(observed.length, generated.length, 1);

    return {
      hypothesis,
      generatedMidis: generated,
      distance,
      score: 1 - distance / longest,
      bestRotation,
    };
  });
}

function tileTo(pattern: readonly number[], length: number): number[] {
  if (pattern.length === 0) {
    return [];
  }
  return Array.from({ length }, (_, i) => pattern[i % pattern.length]);
}

export function selectMatch(
  matches: readonly HypothesisMatch[],
  config: AnalysisConfig,
): MatchSelection {
  if (matches.length === 0) {
    return { withinBudget: false, ambiguity: 1, competitiveGroupCount: 0 };
  }

  const ordered = [...matches].sort(compareMatches);
  const best = ordered[0];

  // Normalized distance is 1 - score by construction.
  const withinBudget = 1 - best.score <= config.editDistanceBudgetRatio;

  const groups = groupByOutputEquivalence(ordered);
  const bestGroupScore = groups[0].score;
  const secondGroupScore = groups.length > 1 ? groups[1].score : undefined;

  const ambiguity =
    secondGroupScore === undefined
      ? 1
      : Math.min(1, Math.max(0, (bestGroupScore - secondGroupScore) / config.ambiguityEpsilon));

  const competitive = groups.filter(
    (group) => bestGroupScore - group.score < config.ambiguityEpsilon,
  );

  let consensus: MatchSelection['consensus'];
  if (
    competitive.every(
      (group) =>
        group.octaves === competitive[0].octaves &&
        sameNumbers(group.baseMidis, competitive[0].baseMidis),
    )
  ) {
    consensus = { baseMidis: competitive[0].baseMidis, octaves: competitive[0].octaves };
  }

  return {
    best,
    withinBudget,
    ambiguity,
    consensus,
    competitiveGroupCount: competitive.length,
  };
}

/** D-202: distance, fewest input notes, fewest octaves, phase, registry order. */
function compareMatches(a: HypothesisMatch, b: HypothesisMatch): number {
  if (a.distance !== b.distance) {
    return a.distance - b.distance;
  }
  if (a.hypothesis.baseMidis.length !== b.hypothesis.baseMidis.length) {
    return a.hypothesis.baseMidis.length - b.hypothesis.baseMidis.length;
  }
  if (a.hypothesis.octaves !== b.hypothesis.octaves) {
    return a.hypothesis.octaves - b.hypothesis.octaves;
  }
  const aPhase = a.bestRotation === 0 ? 0 : 1;
  const bPhase = b.bestRotation === 0 ? 0 : 1;
  if (aPhase !== bPhase) {
    return aPhase - bPhase;
  }
  return registryIndex(a.hypothesis.styleId) - registryIndex(b.hypothesis.styleId);
}

function registryIndex(styleId: string): number {
  return STYLE_REGISTRY.findIndex((style) => style.id === styleId);
}

interface OutputGroup {
  /** Best member's parameters (input is ordered best-first). */
  readonly baseMidis: readonly number[];
  readonly octaves: number;
  readonly score: number;
  readonly generatedMidis: readonly number[];
}

function groupByOutputEquivalence(ordered: readonly HypothesisMatch[]): OutputGroup[] {
  const groups: OutputGroup[] = [];

  for (const match of ordered) {
    const existing = groups.find((group) =>
      isRotationOf(group.generatedMidis, match.generatedMidis),
    );
    if (existing === undefined) {
      groups.push({
        baseMidis: match.hypothesis.baseMidis,
        octaves: match.hypothesis.octaves,
        score: match.score,
        generatedMidis: match.generatedMidis,
      });
    }
  }

  return groups;
}

function sameNumbers(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function isRotationOf(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  if (a.length === 0) {
    return true;
  }
  for (let offset = 0; offset < a.length; offset += 1) {
    if (sameNumbers(rotate(a, offset), b)) {
      return true;
    }
  }
  return false;
}

function rotate(values: readonly number[], offset: number): number[] {
  if (values.length === 0) {
    return [];
  }
  const shift = ((offset % values.length) + values.length) % values.length;
  return [...values.slice(shift), ...values.slice(0, shift)];
}
