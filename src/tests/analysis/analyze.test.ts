import { describe, expect, it } from 'vitest';
import { analyze } from '../../analysis/pipeline/analyze';
import { STYLE_REGISTRY } from '../../analysis/registry/style-registry';
import { DEFAULT_ANALYSIS_CONFIG } from '../../config/analysis';
import { synthesizeNoteEvents } from '../../utils/synthesize-note-events';

// A minor-ish spread of held notes; sliced per note count.
const BASE_POOL = [36, 39, 43, 46, 50] as const;

const NOTE_COUNTS = [2, 3, 4, 5] as const;
const OCTAVES = [1, 2, 3] as const;

describe('analyze: synthesize -> analyze round-trip (registry ground truth)', () => {
  const combos = STYLE_REGISTRY.flatMap((style) =>
    NOTE_COUNTS.flatMap((noteCount) =>
      OCTAVES.map((octaves) => [style.id, noteCount, octaves] as const),
    ),
  );

  it.each(combos)('%s, %i notes, %i octaves', (styleId, noteCount, octaves) => {
    const baseMidis = BASE_POOL.slice(0, noteCount);
    const events = synthesizeNoteEvents({
      styleId,
      baseMidis,
      octaves,
      bpm: 120,
      rate: '1/16',
      cycles: 3,
    });

    const result = analyze(events);

    // With two total indices, all four styles are rotation-equivalent
    // (proven by the M2 fixtures); phase preference plus registry
    // order resolves UpDown -> Up and DownUp -> Down.
    const degenerate = noteCount * octaves === 2;
    const expectedStyle = degenerate
      ? styleId === 'up-down'
        ? 'up'
        : styleId === 'down-up'
          ? 'down'
          : styleId
      : styleId;

    expect(result.status).toBe('complete');
    expect(result.style).toBe(expectedStyle);
    expect(result.octaves).toBe(octaves);
    expect(result.bpm).toBeCloseTo(120, 6);
    expect(result.rate).toBe('1/16');
    expect(result.sequenceSource).toBe('registry');
    expect(result.confidence).toBe('high');
  });
});

describe('analyze: robustness and honesty', () => {
  it('recovers settings from jittered timing', () => {
    const events = synthesizeNoteEvents({
      styleId: 'up',
      baseMidis: [36, 40, 43],
      octaves: 2,
      bpm: 124,
      rate: '1/16',
      cycles: 3,
      jitterRatio: 0.04,
      seed: 7,
    });

    const result = analyze(events);

    expect(result.status).toBe('complete');
    expect(result.style).toBe('up');
    expect(result.rate).toBe('1/16');
    expect(Math.abs((result.bpm ?? 0) - 124)).toBeLessThan(6);
  });

  it('returns a partial result (style undefined) for a non-repeating melody', () => {
    const midis = [60, 62, 65, 69, 68, 63, 61, 70];
    const events = midis.map((midi, k) => ({ midi, onsetSeconds: k * 0.125 }));

    const result = analyze(events);

    expect(result.status).toBe('partial');
    expect(result.style).toBeUndefined();
    expect(result.inputNotes).toBeUndefined();
    expect(result.bpm).toBeCloseTo(120, 6);
    expect(result.sequenceSource).toBe('quantized');
  });

  it('reports notes + octaves without style when competitive styles disagree (Level 3)', () => {
    // [C,E,G,C] is one edit from Up([C,E,G]) and one edit from
    // UpDown([C,E,G,E]) — different outputs, equal scores. With a
    // relaxed budget both stay credible: consensus on notes/octaves,
    // no style claim, and ambiguity collapses confidence to low.
    const midis = [36, 40, 43, 36, 36, 40, 43, 36];
    const events = midis.map((midi, k) => ({ midi, onsetSeconds: k * 0.125 }));

    const result = analyze(events, {
      config: { ...DEFAULT_ANALYSIS_CONFIG, editDistanceBudgetRatio: 0.3 },
    });

    expect(result.status).toBe('partial');
    expect(result.style).toBeUndefined();
    expect(result.inputNotes).toEqual(['C', 'E', 'G']);
    expect(result.octaves).toBe(1);
    expect(result.confidence).toBe('low');
  });

  it('fails honestly with no events', () => {
    const result = analyze([]);

    expect(result.status).toBe('no-pitched-material');
    expect(result.sequence).toBeUndefined();
  });

  it('fails honestly with too few events to establish a grid', () => {
    const result = analyze([
      { midi: 60, onsetSeconds: 0 },
      { midi: 64, onsetSeconds: 0.5 },
    ]);

    expect(result.status).toBe('no-repeating-cycle');
  });
});

describe('analyze: determinism and reproducibility metadata', () => {
  const events = synthesizeNoteEvents({
    styleId: 'down-up',
    baseMidis: [36, 40, 43],
    octaves: 2,
    bpm: 128,
    rate: '1/8',
    cycles: 2,
  });

  it('identical input yields an identical Result DTO', () => {
    expect(analyze(events)).toEqual(analyze(events));
  });

  it('is independent of caller event ordering', () => {
    const shuffled = [...events].reverse();

    expect(analyze(shuffled)).toEqual(analyze(events));
  });

  it('stamps engine version, registry version and configuration hash', () => {
    const result = analyze(events);

    expect(result.engineVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(result.registryVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(result.configurationHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('sequence uses sharp note names with octave numbers', () => {
    const result = analyze(
      synthesizeNoteEvents({
        styleId: 'up',
        baseMidis: [36, 39, 43],
        octaves: 2,
        bpm: 120,
        rate: '1/16',
        cycles: 3,
      }),
    );

    expect(result.inputNotes).toEqual(['C', 'D#', 'G']);
    expect(result.sequence).toEqual(['C2', 'D#2', 'G2', 'C3', 'D#3', 'G3']);
  });
});
