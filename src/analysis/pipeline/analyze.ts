import { DEFAULT_ANALYSIS_CONFIG, type AnalysisConfig } from '../../config/analysis';
import { midiToNoteName, midiToPitchClass } from '../../utils/note-names';
import { resolveBpmRate } from '../engine/bpm-rate';
import {
  buildConfidenceComponents,
  toConfidenceBand,
  weakestComponent,
} from '../engine/confidence';
import { detectCycle } from '../engine/cycle-detection';
import { enumerateHypotheses } from '../engine/hypothesis-enumeration';
import { quantize } from '../engine/quantization';
import { estimateStepGrid } from '../engine/step-grid';
import type { AnalysisResult, NoteEvent } from '../engine/types';
import { ENGINE_VERSION } from '../engine/version';
import { matchHypotheses, selectMatch } from '../matcher/style-matching';
import { REGISTRY_VERSION } from '../registry/style-registry';
import { hashConfiguration } from './configuration-hash';

export interface AnalyzeOptions {
  readonly config?: AnalysisConfig;
  /**
   * Transcription-quality component in [0, 1], supplied by the audio
   * pipeline (M4). Defaults to the configured value (1 for the pure
   * core, where input events are exact).
   */
  readonly transcriptionQuality?: number;
}

/**
 * Stages 5-12 of the analysis pipeline: the pure deterministic core.
 *
 * Input is the cleaned, monophonic note-event stream produced by the
 * audio stages (M4); output is the immutable Result DTO. Partial
 * results follow the D-208 ladder — the engine never claims a level
 * whose prerequisites failed, and never invents values.
 */
export function analyze(
  events: readonly NoteEvent[],
  options: AnalyzeOptions = {},
): AnalysisResult {
  const config = options.config ?? DEFAULT_ANALYSIS_CONFIG;

  const meta = {
    engineVersion: ENGINE_VERSION,
    registryVersion: REGISTRY_VERSION,
    configurationHash: hashConfiguration(config),
  };

  if (events.length === 0) {
    return { status: 'no-pitched-material', ...meta };
  }
  if (events.length < config.minEvents) {
    // Too few events to establish a grid, let alone a repetition.
    return { status: 'no-repeating-cycle', ...meta };
  }

  // Deterministic processing order regardless of caller ordering.
  const ordered = [...events].sort((a, b) => a.onsetSeconds - b.onsetSeconds || a.midi - b.midi);

  const grid = estimateStepGrid(ordered, config);
  const quantized = quantize(ordered, grid);
  const cycle = detectCycle(quantized);
  const matches = matchHypotheses(cycle, enumerateHypotheses(cycle));
  const selection = selectMatch(matches, config);
  const bpmRate = resolveBpmRate(grid.stepDurationSeconds, config);

  const gridOk = grid.residualRatio <= config.maxResidualRatio;

  const components = buildConfidenceComponents({
    transcriptionQuality: options.transcriptionQuality ?? config.defaultTranscriptionQuality,
    gridResidualRatio: grid.residualRatio,
    patternScore: selection.best?.score ?? 0,
    ambiguity: selection.ambiguity,
  });
  const confidence = toConfidenceBand(weakestComponent(components), config);

  const stepDuration = round(grid.stepDurationSeconds);
  const quantizedNames = quantized.notes.map((note) => midiToNoteName(note.midi));

  // Level 4 — complete reconstruction: a single output-distinct
  // competitive group, within the edit budget, on a trustworthy grid.
  if (
    gridOk &&
    selection.best !== undefined &&
    selection.withinBudget &&
    selection.competitiveGroupCount === 1
  ) {
    const { hypothesis, generatedMidis } = selection.best;
    return {
      status: 'complete',
      bpm: round(bpmRate.bpm),
      rate: bpmRate.rate,
      stepDuration,
      inputNotes: hypothesis.baseMidis.map(midiToPitchClass),
      octaves: hypothesis.octaves,
      style: hypothesis.styleId,
      sequence: generatedMidis.map(midiToNoteName),
      sequenceSource: 'registry',
      confidence,
      ...meta,
    };
  }

  // Level 3 — competitive groups disagree on style but agree on
  // notes + octaves (still produced by joint enumeration, D-200).
  if (
    gridOk &&
    selection.withinBudget &&
    selection.consensus !== undefined &&
    selection.competitiveGroupCount > 1
  ) {
    return {
      status: 'partial',
      bpm: round(bpmRate.bpm),
      rate: bpmRate.rate,
      stepDuration,
      inputNotes: selection.consensus.baseMidis.map(midiToPitchClass),
      octaves: selection.consensus.octaves,
      sequence: quantizedNames,
      sequenceSource: 'quantized',
      confidence,
      ...meta,
    };
  }

  // Level 2 — grid is trustworthy: BPM and Rate are reportable.
  if (gridOk) {
    return {
      status: 'partial',
      bpm: round(bpmRate.bpm),
      rate: bpmRate.rate,
      stepDuration,
      sequence: quantizedNames,
      sequenceSource: 'quantized',
      confidence,
      ...meta,
    };
  }

  // Level 1 — the quantized sequence and its step duration only.
  return {
    status: 'partial',
    stepDuration,
    sequence: quantizedNames,
    sequenceSource: 'quantized',
    confidence,
    ...meta,
  };
}

/** Trim float noise so DTO values compare cleanly in golden tests. */
function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
