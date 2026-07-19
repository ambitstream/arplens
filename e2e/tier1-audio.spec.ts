import { expect, test } from '@playwright/test';

/**
 * Tier 1 — Clean Audio Tests (docs/08_TEST_STRATEGY.md, D-602).
 *
 * Committed WAV fixtures rendered from the Style Registry, driven
 * through the real MVP UI in a real browser: upload -> loop panel ->
 * Analyze -> decode -> worker -> Basic Pitch WASM -> engine ->
 * ResultPanel. Every fixture must reconstruct completely.
 */

interface Tier1Fixture {
  readonly file: string;
  readonly styleDisplay: string;
  readonly inputNotes: readonly string[];
  readonly rate: string;
}

const FIXTURES: readonly Tier1Fixture[] = [
  {
    file: 'up-c-major-3n-2o-120bpm-16th.wav',
    styleDisplay: 'Up',
    inputNotes: ['C', 'E', 'G'],
    rate: '1/16',
  },
  {
    file: 'down-c-major-3n-2o-120bpm-16th.wav',
    styleDisplay: 'Down',
    inputNotes: ['C', 'E', 'G'],
    rate: '1/16',
  },
  {
    file: 'up-down-a-minor-3n-1o-124bpm-8th.wav',
    styleDisplay: 'UpDown',
    inputNotes: ['A', 'C', 'E'],
    rate: '1/8',
  },
  {
    file: 'down-up-a-minor-3n-1o-124bpm-8th.wav',
    styleDisplay: 'DownUp',
    inputNotes: ['A', 'C', 'E'],
    rate: '1/8',
  },
];

for (const fixture of FIXTURES) {
  test(`tier 1: ${fixture.file} reconstructs completely`, async ({ page }) => {
    test.setTimeout(240_000);

    await page.goto('/');
    await page.getByLabel('Audio file').setInputFiles(`e2e/fixtures/${fixture.file}`);

    // Short fixture skips Focus Region and lands on Loop Selection.
    await page.getByRole('button', { name: 'Analyze' }).click();

    const style = page.getByRole('button', { name: 'Style', exact: true });
    await expect(style).toHaveText(fixture.styleDisplay, { timeout: 210_000 });

    await expect(page.getByRole('button', { name: 'Rate', exact: true })).toHaveText(fixture.rate);
    for (let i = 0; i < fixture.inputNotes.length; i += 1) {
      await expect(
        page.getByRole('button', { name: `Input note ${i + 1}: ${fixture.inputNotes[i]}` }),
      ).toBeVisible();
    }
    await expect(page.getByText('confidence', { exact: false })).toBeVisible();
  });
}
