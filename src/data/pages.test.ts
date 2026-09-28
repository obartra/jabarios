import { describe, expect, it } from 'vitest';
import { emphasis, PageSchema, PAGES } from './pages.ts';
import { trips } from './trips.ts';

describe('page.json', () => {
  it('loads and validates every trip page at import time', () => {
    expect(Object.keys(PAGES).length).toBeGreaterThan(0);
  });

  it('only exists for trips that exist', () => {
    for (const slug of Object.keys(PAGES)) {
      expect(trips.map((t) => t.slug)).toContain(slug);
    }
  });

  it('writes copy without em dashes or second person', () => {
    for (const [slug, page] of Object.entries(PAGES)) {
      const copy = JSON.stringify(page);
      expect(copy, slug).not.toContain('—');
      // Bar names are not addressed to anyone; check-dist.mjs exempts the same one.
      const text = copy.toLowerCase().replaceAll('kill your idol', '');
      expect(text, slug).not.toMatch(/\b(you|your)\b/);
    }
  });
});

describe('PageSchema', () => {
  it('rejects a key it does not know, rather than silently dropping it', () => {
    const page = { headline: 'x', footer: 'y', sections: [{ type: 'crossing', text: 'z' }] };
    expect(PageSchema.safeParse(page).success).toBe(true);
    expect(PageSchema.safeParse({ ...page, tgas: [] }).success).toBe(false);
    expect(
      PageSchema.safeParse({ ...page, sections: [{ type: 'crossing', text: 'z', upp: true }] })
        .success,
    ).toBe(false);
  });
});

describe('emphasis', () => {
  it('turns **double** asterisks into <b>', () => {
    expect(emphasis('**Arriving:** by train')).toBe('<b>Arriving:</b> by train');
  });

  it('turns *asterisks* into <em> and nothing else', () => {
    expect(emphasis('Mantas after dark, dinner at *9,000 ft*.')).toBe(
      'Mantas after dark, dinner at <em>9,000 ft</em>.',
    );
  });

  it('escapes anything that looks like markup', () => {
    expect(emphasis('<script>x</script> & "q"')).toBe(
      '&lt;script&gt;x&lt;/script&gt; &amp; &quot;q&quot;',
    );
  });
});
