import { expect, test } from '@playwright/test';
import { trips } from '../../src/data/trips.ts';

const pivots = trips.filter((trip) => trip.pivoted !== undefined);
const taken = trips.filter((trip) => trip.pivoted === undefined);

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

    // Any dated trip we are taking will do; found in the data so that this
    // keeps working when the trip it happened to pick is over or called off.
    const trip = taken.find((t) => t.dates !== null)!;
    const card = page.locator(`[data-slug="${trip.slug}"]`);
    await expect(card.getByRole('heading', { name: trip.name })).toBeVisible();
    await expect(card).toContainText(trip.dateLabel);

    await card.click();
    await expect(page).toHaveURL(new RegExp(`/${trip.slug}/$`));
    await expect(page).toHaveTitle(new RegExp(trip.name));
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

test.describe('a trip we pivoted away from', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(pivots.length === 0, 'no pivoted trip in the data');
    await page.goto('/');
  });

  test('shows only under Pivots, with the pill to match', async ({ page }) => {
    // Before any tab is touched: the page opens on "All", which leaves them out.
    for (const trip of pivots) {
      await expect(page.locator(`[data-slug="${trip.slug}"]`)).toBeHidden();
    }
    for (const trip of pivots) {
      const card = page.locator(`[data-slug="${trip.slug}"]`);
      for (const tab of ['All', 'Upcoming', 'Past']) {
        await page.getByRole('tab', { name: tab }).click();
        await expect(card).toBeHidden();
      }
      await page.getByRole('tab', { name: 'Pivots' }).click();
      await expect(card).toBeVisible();
      // It was display:none when the reveal observer started, so this is the
      // proof that a card shown later still fades in.
      await card.scrollIntoViewIfNeeded();
      await expect(card).toHaveCSS('opacity', '1');
      await expect(card).toHaveAttribute('data-status', 'pivoted');
      await expect(card.locator('[data-status-pill]')).toHaveText('Pivoted');
    }
  });

  test('leaves the Pivots tab holding nothing else', async ({ page }) => {
    await page.getByRole('tab', { name: 'Pivots' }).click();
    await expect(page.locator('[data-trip]:visible')).toHaveCount(pivots.length);
    await expect(page.locator('#empty')).toBeHidden();
  });

  test('is never the trip the countdown points at, and adds nothing to the totals', async ({
    page,
  }) => {
    for (const trip of pivots) {
      await expect(page.locator('#nextup-name')).not.toHaveText(trip.name);
    }
    await expect(page.locator('.stat b').first()).toHaveText(String(taken.length));
  });

  test('says what happened at the top of its own page', async ({ page }) => {
    for (const trip of pivots) {
      await page.goto(trip.href);
      await expect(page.locator('.hero .pivot')).toHaveText(trip.pivoted!);
    }
  });
});

test.describe('a trip with no dates', () => {
  // Found in the data rather than hard-coded, so this keeps testing the right
  // card once Vegas gets its dates and some other trip becomes the undated one.
  const undated = taken.find((trip) => trip.dates === null);

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
