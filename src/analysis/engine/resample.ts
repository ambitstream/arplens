/**
 * Stage 1 (engine side) — deterministic resampling.
 *
 * Browser resamplers differ between engines, which would break the
 * PCM-onward determinism guarantee (D-107), so the engine owns its
 * own resampler. Linear interpolation is sufficient for the
 * transcription model's 22.05 kHz input and uses plain arithmetic
 * only.
 */
export function linearResample(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate || input.length === 0) {
    return input;
  }

  const ratio = fromRate / toRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;

    const current = input[Math.min(index, input.length - 1)];
    const next = input[Math.min(index + 1, input.length - 1)];
    output[i] = current + (next - current) * fraction;
  }

  return output;
}
