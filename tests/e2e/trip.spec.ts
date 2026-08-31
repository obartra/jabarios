import { expect, test } from '@playwright/test';

test.describe('trip page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/thai/');
  });

  test('leads with the dates from the trip data', async ({ page }) => {
    await expect(page.locator('.hero .eyebrow')).toHaveText(
      'Thailand · 15 October – 1 November 2026',
    );
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('gets back to the trip list', async ({ page }) => {
    await page.getByRole('link', { name: 'All trips' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'The trips' })).toBeVisible();
  });

  test('attributes every bundled photo', async ({ page }) => {
    const credits = page.locator('footer .fine');
    await expect(credits).toContainText('Wikimedia Commons');
    await expect(credits.getByRole('link', { name: 'source' })).toHaveCount(8);
  });

  test('serves every asset it requests, including the lazy ones', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
    });

    await page.goto('/thai/');
    // Walk the whole page so the lazily-loaded photos are actually fetched.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await new Promise((done) => setTimeout(done, 60));
      }
    });
    await page.waitForLoadState('networkidle');

    expect(failed).toEqual([]);
  });
});

test.describe('404', () => {
  test('is served for an unknown path and offers a way back', async ({ page }) => {
    const res = await page.goto('/no-such-trip/');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('No trip');
    await expect(page.getByRole('link', { name: 'All trips' })).toBeVisible();
  });
});
