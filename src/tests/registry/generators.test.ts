import { describe, expect, it } from 'vitest';
import {
  generateDown,
  generateDownUp,
  generateUp,
  generateUpDown,
} from '../../analysis/registry/generators';
import type { Cycle, GeneratorContext } from '../../analysis/registry/types';

const NOTE_COUNTS = [2, 3, 4, 5, 6] as const;
const OCTAVES = [1, 2, 3, 4] as const;

const ALL_COMBOS = NOTE_COUNTS.flatMap((noteCount) =>
  OCTAVES.map((octaves) => [noteCount, octaves] as const),
);

const STYLE_GENERATORS = [
  ['Up', generateUp],
  ['Down', generateDown],
  ['UpDown', generateUpDown],
  ['DownUp', generateDownUp],
] as const;

function flatten(cycle: Cycle): number[] {
  return cycle.map((step) => {
    expect(step).toHaveLength(1);
    return step[0];
  });
}

describe('exact fixtures', () => {
  it('Up, 3 notes, 1 octave', () => {
    expect(generateUp({ noteCount: 3, octaves: 1 })).toEqual([[0], [1], [2]]);
  });

  it('Up, 3 notes, 2 octaves', () => {
    expect(generateUp({ noteCount: 3, octaves: 2 })).toEqual([[0], [1], [2], [3], [4], [5]]);
  });

  it('Down, 3 notes, 1 octave', () => {
    expect(generateDown({ noteCount: 3, octaves: 1 })).toEqual([[2], [1], [0]]);
  });

  it('UpDown, 3 notes, 1 octave (no endpoint repeat)', () => {
    expect(generateUpDown({ noteCount: 3, octaves: 1 })).toEqual([[0], [1], [2], [1]]);
  });

  it('DownUp, 3 notes, 1 octave (no endpoint repeat)', () => {
    expect(generateDownUp({ noteCount: 3, octaves: 1 })).toEqual([[2], [1], [0], [1]]);
  });

  it('UpDown, 2 notes, 2 octaves', () => {
    expect(generateUpDown({ noteCount: 2, octaves: 2 })).toEqual([[0], [1], [2], [3], [2], [1]]);
  });

  it('DownUp, 2 notes, 2 octaves', () => {
    expect(generateDownUp({ noteCount: 2, octaves: 2 })).toEqual([[3], [2], [1], [0], [1], [2]]);
  });

  it('single index degenerates to a one-step cycle for every style', () => {
    const context: GeneratorContext = { noteCount: 1, octaves: 1 };

    for (const [, generate] of STYLE_GENERATORS) {
      expect(generate(context)).toEqual([[0]]);
    }
  });
});

describe.each(STYLE_GENERATORS)('%s properties', (styleName, generate) => {
  it.each(ALL_COMBOS)('noteCount=%i, octaves=%i', (noteCount, octaves) => {
    const context = { noteCount, octaves };
    const total = noteCount * octaves;
    const cycle = generate(context);
    const indices = flatten(cycle);

    // Expected cycle length: linear styles traverse every index once;
    // turnaround styles revisit the interior (total <= 2 degenerates).
    const expectedLength =
      styleName === 'Up' || styleName === 'Down' || total <= 2 ? total : 2 * total - 2;
    expect(cycle).toHaveLength(expectedLength);

    // Every index is within bounds and every index appears.
    expect(indices.every((index) => index >= 0 && index < total)).toBe(true);
    expect(new Set(indices).size).toBe(total);

    // Deterministic: identical context yields an identical cycle.
    expect(generate({ noteCount, octaves })).toEqual(cycle);
  });
});

describe('input validation', () => {
  it.each([
    ['zero noteCount', { noteCount: 0, octaves: 1 }],
    ['negative noteCount', { noteCount: -2, octaves: 1 }],
    ['fractional noteCount', { noteCount: 2.5, octaves: 1 }],
    ['zero octaves', { noteCount: 3, octaves: 0 }],
    ['fractional octaves', { noteCount: 3, octaves: 1.5 }],
  ])('rejects %s', (_label, context) => {
    for (const [, generate] of STYLE_GENERATORS) {
      expect(() => generate(context)).toThrow();
    }
  });
});
