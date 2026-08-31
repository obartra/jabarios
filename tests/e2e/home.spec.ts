import { expect, test } from '@playwright/test';

test.describe('homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows a card per trip and links through to it', async ({ page }) => {
    const cards = page.locator('[data-trip]');
    await expect(cards).toHaveCount(2);

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
