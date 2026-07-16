import type { Cycle, GeneratorContext } from './types';

/**
 * Pure generators for the MVP styles.
 *
 * Generators operate exclusively on abstract note indices (D-301):
 * with `noteCount` notes over `octaves` octaves there are
 * `noteCount * octaves` indices, 0 = lowest pitch. Mapping indices to
 * concrete pitches happens outside the registry.
 */

function assertValidContext(context: GeneratorContext): void {
  const { noteCount, octaves } = context;

  if (!Number.isInteger(noteCount) || noteCount < 1) {
    throw new Error(`Invalid noteCount: ${String(noteCount)}. Expected an integer >= 1.`);
  }

  if (!Number.isInteger(octaves) || octaves < 1) {
    throw new Error(`Invalid octaves: ${String(octaves)}. Expected an integer >= 1.`);
  }
}

function totalIndexCount(context: GeneratorContext): number {
  assertValidContext(context);
  return context.noteCount * context.octaves;
}

function ascendingIndices(total: number): number[] {
  return Array.from({ length: total }, (_, index) => index);
}

/** Wraps a monophonic index sequence into one-index steps (D-302). */
function toMonophonicCycle(indices: readonly number[]): Cycle {
  return indices.map((index) => [index]);
}

export function generateUp(context: GeneratorContext): Cycle {
  const total = totalIndexCount(context);

  return toMonophonicCycle(ascendingIndices(total));
}

export function generateDown(context: GeneratorContext): Cycle {
  const total = totalIndexCount(context);

  return toMonophonicCycle(ascendingIndices(total).reverse());
}

export function generateUpDown(context: GeneratorContext): Cycle {
  const total = totalIndexCount(context);

  // Turnaround excludes both endpoints (endpointRepeat: false), so the
  // descending half runs total-2 .. 1. For total <= 2 it is empty and
  // the style degenerates into Up.
  const descendingInterior: number[] = [];
  for (let index = total - 2; index >= 1; index -= 1) {
    descendingInterior.push(index);
  }

  return toMonophonicCycle([...ascendingIndices(total), ...descendingInterior]);
}

export function generateDownUp(context: GeneratorContext): Cycle {
  const total = totalIndexCount(context);

  // Mirror of UpDown: descend from the top, then ascend the interior
  // 1 .. total-2 without repeating either endpoint.
  const ascendingInterior: number[] = [];
  for (let index = 1; index <= total - 2; index += 1) {
    ascendingInterior.push(index);
  }

  return toMonophonicCycle([...ascendingIndices(total).reverse(), ...ascendingInterior]);
}
