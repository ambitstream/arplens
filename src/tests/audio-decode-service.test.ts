import { describe, expect, it } from 'vitest';
import { isSupportedAudioFile } from '../audio/audio-decode-service';

function fileNamed(name: string): File {
  return new File([new Uint8Array(4)], name);
}

describe('isSupportedAudioFile', () => {
  it.each(['.mp3', '.wav', '.m4a'])('accepts %s', (ext) => {
    expect(isSupportedAudioFile(fileNamed(`song${ext}`))).toBe(true);
  });

  it.each(['.mp3', '.wav', '.m4a'])('is case-insensitive for %s', (ext) => {
    expect(isSupportedAudioFile(fileNamed(`SONG${ext.toUpperCase()}`))).toBe(true);
  });

  it.each(['.ogg', '.flac', '.txt', '.aiff', ''])('rejects %s', (ext) => {
    expect(isSupportedAudioFile(fileNamed(`song${ext}`))).toBe(false);
  });
});
