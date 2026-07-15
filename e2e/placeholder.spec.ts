import { expect, test } from '@playwright/test';

test('placeholder page renders the header', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'ArpLens' })).toBeVisible();
  await expect(page.getByText('Recreate standard arpeggios from audio.')).toBeVisible();
});
