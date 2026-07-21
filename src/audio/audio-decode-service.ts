/**
 * Audio Decode Service (D-106): runs on the main thread because
 * `decodeAudioData` is unavailable in workers. Decodes the uploaded
 * file, converts to mono immediately, computes waveform peaks and
 * hands out loop slices. The Analysis Engine only ever sees PCM.
 *
 * Memory strategy (D-108): only the mono Float32Array and the peaks
 * survive this function; the source ArrayBuffer and the multi-
 * channel AudioBuffer go out of scope right away.
 */

export interface DecodedAudio {
  readonly mono: Float32Array;
  readonly sampleRate: number;
  readonly durationSeconds: number;
  /** Max |amplitude| per bucket, for waveform rendering. */
  readonly peaks: readonly number[];
}

/**
 * decodeAudioData resamples to its context's rate, so pinning the
 * context rate makes the decode target deterministic instead of
 * following the user's audio hardware. 44.1 kHz WAV fixtures and
 * typical uploads pass through without resampling.
 */
const DECODE_SAMPLE_RATE = 44100;

export async function decodeAudioFile(file: Blob, peakCount = 100): Promise<DecodedAudio> {
  const sourceBuffer = await file.arrayBuffer();

  // OfflineAudioContext needs no audio output device (works in
  // headless browsers) and never has autoplay-policy interactions.
  const context = new OfflineAudioContext(1, 1, DECODE_SAMPLE_RATE);
  const audioBuffer = await context.decodeAudioData(sourceBuffer);

  const mono = mixToMono(audioBuffer);

  return {
    mono,
    sampleRate: audioBuffer.sampleRate,
    durationSeconds: audioBuffer.duration,
    peaks: computePeaks(mono, peakCount),
  };
}

/** Copies the selected loop out of the decoded audio. */
export function extractLoop(
  audio: DecodedAudio,
  startSeconds: number,
  durationSeconds: number,
): Float32Array {
  const start = Math.max(0, Math.floor(startSeconds * audio.sampleRate));
  const end = Math.min(
    audio.mono.length,
    Math.ceil((startSeconds + durationSeconds) * audio.sampleRate),
  );
  return audio.mono.slice(start, end);
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0).slice();
  }

  const length = buffer.length;
  const mono = new Float32Array(length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      mono[i] += data[i];
    }
  }
  for (let i = 0; i < length; i += 1) {
    mono[i] /= buffer.numberOfChannels;
  }
  return mono;
}

function computePeaks(mono: Float32Array, peakCount: number): number[] {
  const bucketSize = Math.max(1, Math.floor(mono.length / peakCount));
  const peaks: number[] = [];

  for (let bucket = 0; bucket < peakCount; bucket += 1) {
    const start = bucket * bucketSize;
    if (start >= mono.length) {
      break;
    }
    let max = 0;
    const end = Math.min(mono.length, start + bucketSize);
    for (let i = start; i < end; i += 1) {
      const value = Math.abs(mono[i]);
      if (value > max) {
        max = value;
      }
    }
    peaks.push(max);
  }

  return peaks;
}
