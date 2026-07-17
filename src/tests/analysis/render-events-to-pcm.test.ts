import { describe, expect, it } from 'vitest';
import { renderEventsToPcm } from '../../utils/render-events-to-pcm';

describe('renderEventsToPcm', () => {
  it('renders silence before the first onset and signal during the note', () => {
    const pcm = renderEventsToPcm([{ midi: 69, onsetSeconds: 0.1, durationSeconds: 0.1 }], {
      sampleRate: 8000,
    });

    const before = pcm.slice(0, Math.floor(0.09 * 8000));
    expect(before.every((sample) => sample === 0)).toBe(true);

    const during = pcm.slice(Math.floor(0.12 * 8000), Math.floor(0.18 * 8000));
    const peak = during.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
    expect(peak).toBeGreaterThan(0.3);
  });

  it('covers the full duration including release tails', () => {
    const pcm = renderEventsToPcm([{ midi: 60, onsetSeconds: 0, durationSeconds: 0.5 }], {
      sampleRate: 8000,
      releaseSeconds: 0.05,
    });

    expect(pcm.length).toBeGreaterThanOrEqual(Math.ceil(0.55 * 8000));
  });

  it('is deterministic', () => {
    const events = [
      { midi: 60, onsetSeconds: 0, durationSeconds: 0.1 },
      { midi: 64, onsetSeconds: 0.125, durationSeconds: 0.1 },
    ];

    expect(renderEventsToPcm(events, { sampleRate: 8000 })).toEqual(
      renderEventsToPcm(events, { sampleRate: 8000 }),
    );
  });
});
