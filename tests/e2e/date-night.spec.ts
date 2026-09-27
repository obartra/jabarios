import { expect, test } from '@playwright/test';
import { dateNight } from '../../src/data/date-night.ts';
import { DOC_EDIT_URL } from '../../src/data/date-night-source.ts';

test.describe('Date night page', () => {
  test('is reachable from the homepage', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/date-night/"]').click();
    await expect(page).toHaveURL(/\/date-night\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(dateNight.title);
  });

  test('renders the synced doc and links out to edit it', async ({ page }) => {
    await page.goto('/date-night/');
    const edit = page.getByRole('link', { name: /open the doc/i });
    await expect(edit).toHaveAttribute('href', DOC_EDIT_URL);
    await expect(edit).toHaveAttribute('target', '_blank');

    const items = dateNight.blocks.filter((b) => b.kind === 'item');
    await expect(page.locator('article li')).toHaveCount(items.length);
  });

  test('stays out of search results', async ({ page }) => {
    await page.goto('/date-night/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  test('never scrolls sideways', async ({ page }) => {
    await page.goto('/date-night/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
