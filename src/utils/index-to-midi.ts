/**
 * Maps an abstract registry note index (0 = lowest pitch) to a
 * concrete MIDI note, given the held input notes. Index i selects
 * base note i % n transposed up by floor(i / n) octaves.
 *
 * Lives outside the registry on purpose: the Style Registry operates
 * on abstract indices only and must never know about MIDI (D-301).
 */
export function indexToMidi(index: number, baseMidis: readonly number[]): number {
  const noteCount = baseMidis.length;
  return baseMidis[index % noteCount] + 12 * Math.floor(index / noteCount);
}
