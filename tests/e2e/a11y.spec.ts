import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { trips } from '../../src/data/trips.ts';

/**
 * WCAG 2.1 AA on every page the site serves: contrast, names, landmarks,
 * alt text, headings and the rest of axe's AA rule set. Derived from the trip
 * data, so a new trip is covered without touching this file.
 */
const pages = ['/', '/date-night/', ...trips.map((t) => t.href), '/no-such-page/'];

test.describe('WCAG AA', () => {
  // Scroll-reveal fades cards in; with reduced motion they render at full
  // opacity, so axe measures the real colours rather than a mid-fade frame.
  test.use({ reducedMotion: 'reduce' });

  for (const path of pages) {
    test(`${path} has no AA violations`, async ({ page }) => {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const summary = violations.map(
        (v) =>
          `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
            .map((n) => n.target.join(' '))
            .slice(0, 5)
            .join('\n  ')}`,
      );
      expect(summary, summary.join('\n')).toEqual([]);
    });
  }
});
