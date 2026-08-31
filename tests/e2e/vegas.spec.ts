import { expect, test } from '@playwright/test';

test.describe('Vegas page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vegas/');
  });

  test('lays out every activity as a card with a photo, price and duration', async ({ page }) => {
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(22);

    for (const card of await cards.all()) {
      await expect(card.locator('img')).toHaveAttribute('src', /^\/vegas\/img\//);
      await expect(card.locator('h3')).not.toBeEmpty();
      await expect(card.locator('.price')).not.toBeEmpty();
      await expect(card.locator('.dur')).not.toBeEmpty();
    }
  });

  test('groups activities under headings the nav can reach', async ({ page }) => {
    for (const id of ['big', 'cirque', 'night', 'museum', 'out', 'free']) {
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

  test('keeps every card image the same height within a section', async ({ page }) => {
    for (const id of ['big', 'cirque', 'museum']) {
      const heights = await page
        .locator(`section#${id} .card img`)
        .evaluateAll((imgs) => imgs.map((i) => Math.round(i.getBoundingClientRect().height)));
      expect(new Set(heights).size, `section #${id} has ragged image heights`).toBe(1);
    }
  });

  test('shows the Cirque photos taller than the landscape ones', async ({ page }) => {
    const ratio = (sel: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((img) => {
          const r = img.getBoundingClientRect();
          return r.height / r.width;
        });
    expect(await ratio('section#cirque .card img')).toBeGreaterThan(
      await ratio('section#big .card img'),
    );
  });

  test('credits every bundled photo in the footer', async ({ page }) => {
    // 22 activity photos plus the cover.
    await expect(page.locator('footer .fine').getByRole('link', { name: 'source' })).toHaveCount(
      23,
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

  test('decodes the Cirque photos, which are AVIF', async ({ page }) => {
    await page.locator('section#cirque').scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
    const widths = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLImageElement>('section#cirque img')].map((i) => ({
        src: i.src.split('/').pop(),
        natural: i.naturalWidth,
      })),
    );
    // Catches a missing or corrupt file. It will not catch a wrong content type,
    // since Chromium sniffs image bytes regardless of what the server claims.
    // Guard against the selector matching nothing and the check passing empty.
    expect(widths).toHaveLength(5);
    expect(widths.filter((w) => w.natural === 0)).toEqual([]);
  });

  test('never scrolls sideways', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
