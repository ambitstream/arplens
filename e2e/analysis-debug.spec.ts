import { expect, test } from '@playwright/test';

test('analysis debug page round-trips settings through the pipeline', async ({ page }) => {
  await page.goto('/');

  const section = page.getByRole('region', { name: 'Analysis core debug' });
  const result = section.getByLabel('Analysis result');

  // Default: Up, C E G, 2 octaves, 120 BPM, 1/16 — complete result.
  await expect(result).toContainText('"status": "complete"');
  await expect(result).toContainText('"style": "up"');

  await section.getByRole('combobox', { name: 'Style' }).selectOption('down-up');
  await expect(result).toContainText('"style": "down-up"');

  await section.getByRole('spinbutton', { name: 'BPM' }).fill('96');
  await expect(result).toContainText('"bpm": 96');
});
