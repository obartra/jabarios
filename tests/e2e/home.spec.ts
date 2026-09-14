import { expect, test } from '@playwright/test';
import { trips } from '../../src/data/trips.ts';

test.describe('homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows a card per trip and links through to it', async ({ page }) => {
    const cards = page.locator('[data-trip]');
    // Derived from the trip data, so adding a trip does not fail this test for
    // the wrong reason. check-dist.mjs is what proves the card and the page
    // agree; this proves the homepage actually renders one for every trip.
    await expect(cards).toHaveCount(trips.length);

    const thai = cards.filter({ hasText: 'Thailand' });
    await expect(thai.getByRole('heading', { name: 'Thailand' })).toBeVisible();
    await expect(thai).toContainText('15 October – 1 November 2026');

    await thai.click();
    await expect(page).toHaveURL(/\/thai\/$/);
    await expect(page).toHaveTitle(/Thailand/);
  });

  test('reveals cards once they are scrolled into view', async ({ page }) => {
    // Cards start transparent and fade in. Assert they actually arrive at full
    // opacity, because a broken observer would leave them invisible forever.
    const card = page.locator('[data-trip]').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveCSS('opacity', '1');
  });

  test('filters between upcoming and past, with an empty state', async ({ page }) => {
    const card = page.locator('[data-trip]').first();
    const empty = page.locator('#empty');

    await page.getByRole('tab', { name: 'Past' }).click();
    await expect(card).toBeHidden();
    await expect(empty).toBeVisible();

    await page.getByRole('tab', { name: 'Upcoming' }).click();
    await expect(card).toBeVisible();
    await expect(empty).toBeHidden();

    await page.getByRole('tab', { name: 'All' }).click();
    await expect(card).toBeVisible();
  });

  test('marks exactly one filter tab as selected', async ({ page }) => {
    await page.getByRole('tab', { name: 'Upcoming' }).click();
    await expect(page.locator('.seg button[aria-selected="true"]')).toHaveCount(1);
    await expect(page.getByRole('tab', { name: 'Upcoming' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('counts down to the next departure', async ({ page }) => {
    const clock = page.locator('#clock');
    await expect(clock).toBeVisible();
    for (const unit of ['d', 'h', 'm']) {
      await expect(clock.locator(`[data-c="${unit}"]`)).toHaveText(/^\d+$/);
    }
    await expect(clock).toHaveAttribute('aria-label', /until departure/);
  });

  test('never scrolls sideways', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});

test.describe('a trip with no dates', () => {
  // Found in the data rather than hard-coded, so this keeps testing the right
  // card once Vegas gets its dates and some other trip becomes the undated one.
  const undated = trips.find((trip) => trip.dates === null);

  test.beforeEach(async ({ page }) => {
    test.skip(undated === undefined, 'no undated trip in the data');
    await page.goto('/');
  });

  test('says so instead of showing a range, and drops the day count', async ({ page }) => {
    const card = page.locator(`[data-slug="${undated!.slug}"]`);
    await expect(card).toContainText('Dates not set');
    // The status pill is the only one: there is no day count to show.
    await expect(card.locator('.top .pill')).toHaveCount(1);
  });

  test('marks itself undated and labels the pill to match', async ({ page }) => {
    const card = page.locator(`[data-slug="${undated!.slug}"]`);
    await expect(card).toHaveAttribute('data-status', 'undated');
    await expect(card.locator('[data-status-pill]')).toHaveText('Dates not set');
  });

  // This is the test that proves the client script kept the card. An undated
  // card looks identical before and after hydration, so the filter is the only
  // place the difference shows: a card the script never read is a card it can
  // never hide, and it would sit there under "Past" forever.
  test('filters as upcoming, because it has not happened', async ({ page }) => {
    const card = page.locator(`[data-slug="${undated!.slug}"]`);
    await page.getByRole('tab', { name: 'Upcoming' }).click();
    await expect(card).toBeVisible();
    await page.getByRole('tab', { name: 'Past' }).click();
    await expect(card).toBeHidden();
  });

  test('is never the trip the countdown points at', async ({ page }) => {
    await expect(page.locator('#nextup-name')).not.toHaveText(undated!.name);
  });
});
