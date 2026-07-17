/**
 * Minimum Levenshtein distance between the target and ANY prefix of
 * the pattern. Style matching tiles a candidate cycle one repetition
 * past the observed length and scores with this: pattern left unused
 * beyond the loop's end is not evidence against the candidate, while
 * every edit inside the observed span still counts.
 */
export function editDistanceToPrefix(
  pattern: readonly number[],
  target: readonly number[],
): number {
  if (pattern.length === 0) {
    return target.length;
  }

  // Rows iterate the pattern; the answer is the cheapest cost of
  // producing the FULL target from any pattern prefix, i.e. the
  // minimum of the last column across all rows.
  let previous = Array.from({ length: target.length + 1 }, (_, j) => j);
  let best = previous[target.length];
  let current = new Array<number>(target.length + 1);

  for (let i = 1; i <= pattern.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= target.length; j += 1) {
      const substitution = previous[j - 1] + (pattern[i - 1] === target[j - 1] ? 0 : 1);
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
    }
    if (current[target.length] < best) {
      best = current[target.length];
    }
    [previous, current] = [current, previous];
  }

  return best;
}

/**
 * Levenshtein distance between two note sequences. Used for
 * near-match scoring in style matching (D-201); exact matches score
 * distance 0.
 */
export function editDistance(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }

  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
    }
    [previous, current] = [current, previous];
  }

  return previous[b.length];
}
