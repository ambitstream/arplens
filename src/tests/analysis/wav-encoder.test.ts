import { describe, expect, it } from 'vitest';
import { encodeWavPcm16Mono } from '../../utils/wav-encoder';

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

describe('encodeWavPcm16Mono', () => {
  const samples = new Float32Array([0, 0.5, -0.5, 1, -1, 2, -2]);
  const wav = encodeWavPcm16Mono(samples, 44100);
  const view = new DataView(wav.buffer);

  it('writes a valid RIFF/WAVE header', () => {
    expect(ascii(wav, 0, 4)).toBe('RIFF');
    expect(ascii(wav, 8, 4)).toBe('WAVE');
    expect(ascii(wav, 12, 4)).toBe('fmt ');
    expect(ascii(wav, 36, 4)).toBe('data');
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(samples.length * 2);
    expect(wav.length).toBe(44 + samples.length * 2);
  });

  it('scales and clamps samples to int16', () => {
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(Math.round(0.5 * 32767));
    expect(view.getInt16(50, true)).toBe(32767); // 1.0
    expect(view.getInt16(52, true)).toBe(-32767); // -1.0
    expect(view.getInt16(54, true)).toBe(32767); // clamped from 2
    expect(view.getInt16(56, true)).toBe(-32767); // clamped from -2
  });
});
