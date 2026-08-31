import { expect, test } from '@playwright/test';

test.describe('Vegas page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vegas/');
  });

  test('lays out every activity as a card with a photo, price and duration', async ({ page }) => {
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(18);

    for (const card of await cards.all()) {
      await expect(card.locator('img')).toHaveAttribute('src', /^\/vegas\/img\//);
      await expect(card.locator('h3')).not.toBeEmpty();
      await expect(card.locator('.price')).not.toBeEmpty();
      await expect(card.locator('.dur')).not.toBeEmpty();
    }
  });

  test('groups activities under headings the nav can reach', async ({ page }) => {
    for (const id of ['big', 'night', 'museum', 'out', 'free']) {
      await expect(page.locator(`section#${id} h2`)).toBeVisible();
      await expect(page.locator(`section#${id} .card`).first()).toBeVisible();
    }
  });

  test('jumps to a section clear of the sticky nav', async ({ page }) => {
    const navHeight = await page
      .locator('.topnav')
      .evaluate((el) => el.getBoundingClientRect().height);
    for (const id of ['museum', 'free']) {
      await page.locator(`.topnav a[href="#${id}"]`).click();
      const top = await page
        .locator(`section#${id} h2`)
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(top).toBeGreaterThanOrEqual(navHeight);
    }
  });

  test('keeps every card image the same height within a row', async ({ page }) => {
    const heights = await page
      .locator('section#big .card img')
      .evaluateAll((imgs) => imgs.map((i) => Math.round(i.getBoundingClientRect().height)));
    expect(new Set(heights).size).toBe(1);
  });

  test('credits every bundled photo in the footer', async ({ page }) => {
    // 18 activity photos plus the cover.
    await expect(page.locator('footer .fine').getByRole('link', { name: 'source' })).toHaveCount(
      19,
    );
  });

  test('sends outbound operator links off-site safely', async ({ page }) => {
    const links = page.locator('.card a.go');
    expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('never scrolls sideways', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
