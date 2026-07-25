import { expect, test } from '@playwright/test';

/**
 * Tier 3 — Failure Tests (docs/08_TEST_STRATEGY.md, D-602).
 *
 * Each fixture is a deliberately pathological signal exercising one
 * documented honest-failure path end to end: real decode -> worker
 * -> Basic Pitch -> engine -> UI. See scripts/render-tier3-fixtures.ts
 * for how each one is constructed and why.
 */

async function uploadAndAnalyze(page: import('@playwright/test').Page, file: string) {
  await page.goto('/');
  await page.getByLabel('Audio file').setInputFiles(`e2e/fixtures/${file}`);
  // These fixtures are all short and skip Focus Region, landing
  // directly on Loop Selection.
  await page.getByRole('button', { name: 'Analyze' }).click();
}

test('silence produces No Pitched Notes Detected', async ({ page }) => {
  test.setTimeout(240_000);
  await uploadAndAnalyze(page, 'tier3-silence.wav');
  await expect(page.getByRole('alert')).toContainText('No Pitched Notes Detected', {
    timeout: 210_000,
  });
});

test('a drum loop (unpitched noise bursts) produces No Pitched Notes Detected', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await uploadAndAnalyze(page, 'tier3-drum-loop.wav');
  await expect(page.getByRole('alert')).toContainText('No Pitched Notes Detected', {
    timeout: 210_000,
  });
});

test('corrupted audio produces Audio Decode Failed', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Audio file').setInputFiles('e2e/fixtures/tier3-corrupted.wav');
  await expect(page.getByRole('alert')).toContainText('Audio Decode Failed');
});

test('an unsupported codec extension produces Unsupported Audio Format', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Audio file').setInputFiles('e2e/fixtures/tier3-unsupported-codec.ogg');
  await expect(page.getByRole('alert')).toContainText('Unsupported Audio Format');
});

const NO_STYLE_FIXTURES = [
  // A non-monotonic pitch wander with no stable grid for a style to
  // match — a synthetic proxy for unquantized vocal pitch.
  'tier3-vocal-melody.wav',
  // A deterministically shuffled one-pass note order: a real grid,
  // but no ascending/descending run and no repetition.
  'tier3-non-repeating-melody.wav',
  // A clean, cleanly-repeating cycle that isn't a rotation of any
  // registry style (Up/Down/UpDown/DownUp) at any note count/octave.
  'tier3-unsupported-pattern.wav',
  'tier3-unsupported-style.wav',
];

for (const file of NO_STYLE_FIXTURES) {
  test(`${file}: reaches Results with confidence never High and Style Not Detected`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await uploadAndAnalyze(page, file);

    const style = page.getByRole('button', { name: 'Style', exact: true });
    await expect(style).toHaveText('Not detected', { timeout: 210_000 });

    // D-003: a confidently wrong result is worse than an incomplete
    // one. An undetected style must never be paired with High
    // confidence — assert the badge is either absent or non-High.
    const badge = page.getByText('confidence', { exact: false });
    if (await badge.count()) {
      await expect(badge).not.toContainText('High confidence');
    }
  });
}
