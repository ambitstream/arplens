import { expect, test } from '@playwright/test';

/**
 * Tier 1 — Clean Audio Tests (docs/08_TEST_STRATEGY.md, D-602).
 *
 * Committed WAV fixtures rendered from the Style Registry run
 * through the real production pipeline in a real browser: decode ->
 * worker -> resample -> Basic Pitch WASM -> cleanup -> normalization
 * -> deterministic core. Expected result: complete reconstruction of
 * the exact settings the fixture was rendered from.
 */

interface Tier1Fixture {
  readonly file: string;
  readonly style: string;
  readonly inputNotes: readonly string[];
  readonly octaves: number;
  readonly bpm: number;
  readonly rate: string;
}

const FIXTURES: readonly Tier1Fixture[] = [
  {
    file: 'up-c-major-3n-2o-120bpm-16th.wav',
    style: 'up',
    inputNotes: ['C', 'E', 'G'],
    octaves: 2,
    bpm: 120,
    rate: '1/16',
  },
  {
    file: 'down-c-major-3n-2o-120bpm-16th.wav',
    style: 'down',
    inputNotes: ['C', 'E', 'G'],
    octaves: 2,
    bpm: 120,
    rate: '1/16',
  },
  {
    file: 'up-down-a-minor-3n-1o-124bpm-8th.wav',
    style: 'up-down',
    inputNotes: ['A', 'C', 'E'],
    octaves: 1,
    bpm: 124,
    rate: '1/8',
  },
  {
    file: 'down-up-a-minor-3n-1o-124bpm-8th.wav',
    style: 'down-up',
    inputNotes: ['A', 'C', 'E'],
    octaves: 1,
    bpm: 124,
    rate: '1/8',
  },
];

for (const fixture of FIXTURES) {
  test(`tier 1: ${fixture.file} reconstructs completely`, async ({ page }) => {
    // Model download + WASM init + inference on CPU takes a while,
    // especially on CI runners.
    test.setTimeout(240_000);

    await page.goto('/');
    const section = page.getByRole('region', { name: 'Audio pipeline debug' });

    await section.getByLabel('Audio file').setInputFiles(`e2e/fixtures/${fixture.file}`);
    await expect(section.getByLabel('Loaded file')).toContainText('44100 Hz');

    await section.getByRole('button', { name: 'Analyze' }).click();
    await expect(section.getByLabel('Audio analysis status')).toContainText('done', {
      timeout: 210_000,
    });

    const text = (await section.getByLabel('Audio analysis result').textContent()) ?? '{}';
    const result = JSON.parse(text) as {
      status: string;
      style?: string;
      inputNotes?: string[];
      octaves?: number;
      bpm?: number;
      rate?: string;
      confidence?: string;
      sequenceSource?: string;
    };

    expect(result.status).toBe('complete');
    expect(result.style).toBe(fixture.style);
    expect(result.inputNotes).toEqual(fixture.inputNotes);
    expect(result.octaves).toBe(fixture.octaves);
    expect(result.rate).toBe(fixture.rate);
    expect(Math.abs((result.bpm ?? 0) - fixture.bpm)).toBeLessThan(4);
    expect(result.sequenceSource).toBe('registry');
  });
}
