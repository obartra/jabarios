import { expect, test } from '@playwright/test';
import { trips } from '../../src/data/trips.ts';

/**
 * The checks below are true of every trip page, so they run against every trip
 * rather than against whichever one happened to be written first. A new trip
 * gets this coverage by existing, which is the point: the failure these catch
 * is a page that builds, passes check-dist and still shows a broken photo or
 * scrolls sideways on a phone.
 */
for (const trip of trips) {
  test.describe(`${trip.name} page`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(trip.href);
    });

    test('leads with its name and date label from the trip data', async ({ page }) => {
      await expect(page.locator('.hero .eyebrow')).toHaveText(`${trip.name} · ${trip.dateLabel}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('gets back to the trip list', async ({ page }) => {
      await page.getByRole('link', { name: 'All trips' }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('heading', { name: 'The trips' })).toBeVisible();
    });

    test('credits every photo it bundles', async ({ page }) => {
      // Derived from the data, so a photo added without its credit fails here
      // as well as in check-dist.mjs.
      const credits = page.locator('footer .fine');
      await expect(credits.getByRole('link', { name: 'source' })).toHaveCount(trip.credits.length);
    });

    test('serves and decodes every image, including the lazy ones', async ({ page }) => {
      const failed: string[] = [];
      page.on('response', (r) => {
        if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
      });

      await page.goto(trip.href);
      // Walk the whole page so the lazily-loaded photos are actually fetched.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise((done) => setTimeout(done, 60));
        }
      });
      await page.waitForLoadState('networkidle');
      expect(failed).toEqual([]);

      // A 200 with the wrong content type still counts as "served"; this checks
      // the browser could really decode the bytes.
      const broken = await page.evaluate(() =>
        [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
      );
      expect(broken).toEqual([]);
    });

    test('never scrolls sideways', async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow).toBe(false);
    });
  });
}

test.describe('404', () => {
  test('is served for an unknown path and offers a way back', async ({ page }) => {
    const res = await page.goto('/no-such-trip/');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('No trip');
    await expect(page.getByRole('link', { name: 'All trips' })).toBeVisible();
  });
});
