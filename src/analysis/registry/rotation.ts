import type { Cycle, Step } from './types';

/**
 * Cycle rotation utilities.
 *
 * Rotation invariance is required because user selections may begin
 * mid-cycle: the matcher compares a detected cycle against every
 * rotation of each generated candidate. The registry itself never
 * performs matching.
 */

export function areStepsEqual(a: Step, b: Step): boolean {
  return a.length === b.length && a.every((index, position) => index === b[position]);
}

export function areCyclesEqual(a: Cycle, b: Cycle): boolean {
  return a.length === b.length && a.every((step, position) => areStepsEqual(step, b[position]));
}

/**
 * Returns the cycle shifted left by `offset` steps.
 *
 * Offsets are normalized modulo the cycle length, so negative and
 * oversized offsets are valid.
 */
export function rotateCycle(cycle: Cycle, offset: number): Cycle {
  if (cycle.length === 0) {
    return cycle;
  }

  const shift = ((offset % cycle.length) + cycle.length) % cycle.length;

  if (shift === 0) {
    return cycle;
  }

  return [...cycle.slice(shift), ...cycle.slice(0, shift)];
}

/** Returns every rotation of the cycle, starting with rotation 0. */
export function allRotations(cycle: Cycle): readonly Cycle[] {
  return cycle.map((_, offset) => rotateCycle(cycle, offset));
}

/**
 * Returns the smallest non-negative offset k such that rotating `from`
 * by k yields `to`, or null when the cycles are not rotations of each
 * other. Offset 0 means the cycles are already equal (phase-0 match).
 */
export function rotationOffset(from: Cycle, to: Cycle): number | null {
  if (from.length !== to.length) {
    return null;
  }

  if (from.length === 0) {
    return 0;
  }

  for (let offset = 0; offset < from.length; offset += 1) {
    if (areCyclesEqual(rotateCycle(from, offset), to)) {
      return offset;
    }
  }

  return null;
}
