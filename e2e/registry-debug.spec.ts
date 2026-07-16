import { expect, test } from '@playwright/test';

test('registry debug page generates sequences from selected parameters', async ({ page }) => {
  await page.goto('/');

  const sequence = page.getByRole('status', { name: 'Generated sequence' });

  // Default: Up, 3 notes, 1 octave.
  await expect(sequence).toHaveText('0 1 2');

  await page.getByRole('combobox', { name: 'Style' }).selectOption('down-up');
  await expect(sequence).toHaveText('2 1 0 1');

  await page.getByRole('combobox', { name: 'Octaves' }).selectOption('2');
  await expect(sequence).toHaveText('5 4 3 2 1 0 1 2 3 4');
});
