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

  test('keeps the edit button readable, whatever the doc link styles do', async ({ page }) => {
    await page.goto('/date-night/');
    const ratio = await page.getByRole('link', { name: /open the doc/i }).evaluate((el) => {
      const rgb = (c: string) =>
        c
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number);
      const lum = (c: string) => {
        const [r, g, b] = rgb(c).map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const style = getComputedStyle(el);
      const [hi, lo] = [lum(style.color), lum(style.backgroundColor)].sort((a, b) => b - a);
      return (hi! + 0.05) / (lo! + 0.05);
    });
    // WCAG AA for small text.
    expect(ratio).toBeGreaterThanOrEqual(4.5);
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
