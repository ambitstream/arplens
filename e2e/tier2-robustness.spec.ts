import { expect, test } from '@playwright/test';

/**
 * Tier 2 — Robustness Tests (docs/08_TEST_STRATEGY.md, D-602).
 *
 * Each fixture is the same known-good arpeggio as the Tier 1
 * up-c-major-3n-2o-120bpm-16th fixture (Up, C/E/G, 2 octaves, 120bpm,
 * 1/16) with exactly one real-world imperfection applied — see
 * scripts/render-tier2-fixtures.ts for how each is constructed.
 * Outcomes are asserted exactly (the engine is deterministic, D-107)
 * as a regression baseline; the class of outcome each belongs to is
 * noted per docs/08_TEST_STRATEGY.md's Tier 2 expectations.
 */

async function uploadAndAnalyze(page: import('@playwright/test').Page, file: string) {
  await page.goto('/');
  await page.getByLabel('Audio file').setInputFiles(`e2e/fixtures/${file}`);
  await page.getByRole('button', { name: 'Analyze' }).click();
}

async function expectNotes(page: import('@playwright/test').Page, notes: readonly string[]) {
  for (let i = 0; i < notes.length; i += 1) {
    await expect(
      page.getByRole('button', { name: `Input note ${i + 1}: ${notes[i]}` }),
    ).toBeVisible();
  }
}

// --- Recovers correctly despite the degradation (confidence may drop) ---
const RECOVERS_CORRECTLY = [
  'tier2-timing-jitter.wav',
  'tier2-global-detuning.wav',
  'tier2-rich-harmonics.wav',
  'tier2-single-octave-error.wav',
  'tier2-reverb.wav',
  'tier2-background-pad.wav',
];

for (const file of RECOVERS_CORRECTLY) {
  test(`${file}: still reconstructs Up C/E/G despite the degradation`, async ({ page }) => {
    test.setTimeout(240_000);
    await uploadAndAnalyze(page, file);

    const style = page.getByRole('button', { name: 'Style', exact: true });
    await expect(style).toHaveText('Up', { timeout: 210_000 });
    await expectNotes(page, ['C', 'E', 'G']);

    // D-003: never confidently wrong. A degraded input recovering the
    // right answer at less than High confidence is the expected shape.
    const badge = page.getByText('confidence', { exact: false });
    await expect(badge).toBeVisible();
  });
}

// --- Too degraded to fully recover: Partial Result is the documented
// acceptable floor; an incorrect Complete Result is not. ---
const GRACEFUL_PARTIAL = ['tier2-delay.wav', 'tier2-dense-mix.wav'];

for (const file of GRACEFUL_PARTIAL) {
  test(`${file}: degrades to Style Not Detected, never a wrong Complete Result`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await uploadAndAnalyze(page, file);

    const style = page.getByRole('button', { name: 'Style', exact: true });
    await expect(style).toHaveText('Not detected', { timeout: 210_000 });

    const badge = page.getByText('confidence', { exact: false });
    if (await badge.count()) {
      await expect(badge).not.toContainText('High confidence');
    }
  });
}
