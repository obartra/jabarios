import { describe, expect, it } from 'vitest';
import { activitiesFor, categoriesFor, CATEGORIES, groupedFor } from './activities.ts';
import { trips } from './trips.ts';

/**
 * Every trip that has activities, so adding a trip extends the coverage rather
 * than quietly leaving it behind. The old version of this file only checked
 * Vegas, which meant a second trip's activities were unvalidated.
 */
const withActivities = trips
  .map((trip) => ({ slug: trip.slug, items: activitiesFor(trip.slug) }))
  .filter((t) => t.items.length > 0);

describe('activities', () => {
  it('loads and validates at import time', () => {
    expect(withActivities.length).toBeGreaterThan(0);
  });

  it('covers every trip that declares categories', () => {
    // A trip with categories but no activities renders an empty page section,
    // which is the failure this catches.
    for (const slug of Object.keys(CATEGORIES)) {
      expect(
        activitiesFor(slug).length,
        `"${slug}" has categories but no activities`,
      ).toBeGreaterThan(0);
    }
  });

  it.each(withActivities)('$slug: gives every activity a price and a duration', ({ items }) => {
    for (const a of items) {
      expect(a.price.trim()).not.toBe('');
      expect(a.duration.trim()).not.toBe('');
      // A price is either free or has a number in it. "Reasonable" is not a price.
      expect(/free/i.test(a.price) || /\d/.test(a.price), `"${a.id}" price: ${a.price}`).toBe(true);
    }
  });

  it.each(withActivities)(
    '$slug: puts every photo under its own trip directory, with alt text',
    ({ slug, items }) => {
      for (const a of items) {
        expect(a.photo.startsWith(`/${slug}/img/`), `"${a.id}" photo: ${a.photo}`).toBe(true);
        expect(a.photoAlt.trim().length).toBeGreaterThan(10);
      }
    },
  );

  it.each(withActivities)('$slug: credits every photo', ({ items }) => {
    for (const a of items) {
      expect(a.credit.author.trim()).not.toBe('');
      expect(a.credit.url).toMatch(/^https?:\/\//);
    }
  });

  it.each(withActivities)('$slug: never reuses a photo between activities', ({ items }) => {
    const photos = items.map((a) => a.photo);
    expect(new Set(photos).size).toBe(photos.length);
  });

  it.each(withActivities)('$slug: keeps facts short enough to scan', ({ items }) => {
    for (const a of items) {
      expect(a.facts.length).toBeGreaterThan(0);
      expect(a.facts.length).toBeLessThanOrEqual(5);
      for (const fact of a.facts)
        expect(fact.length, `"${a.id}": ${fact}`).toBeLessThanOrEqual(110);
    }
  });

  it.each(withActivities)('$slug: writes copy without em dashes, per CLAUDE.md', ({ items }) => {
    for (const a of items) {
      for (const text of [a.name, a.blurb, ...a.facts]) expect(text).not.toContain('—');
    }
  });

  it.each(withActivities)('$slug: keeps one photo aspect per category', ({ items }) => {
    const byCategory = new Map<string, Set<string>>();
    for (const a of items) {
      if (!byCategory.has(a.category)) byCategory.set(a.category, new Set());
      byCategory.get(a.category)!.add(a.aspect);
    }
    for (const [category, aspects] of byCategory) {
      expect(aspects.size, `category "${category}" mixes ${[...aspects].join(' and ')}`).toBe(1);
    }
  });

  it.each(withActivities)(
    '$slug: puts every activity in one of its own categories',
    ({ slug, items }) => {
      const ids = new Set(categoriesFor(slug).map((c) => c.id));
      for (const a of items) {
        expect(ids.has(a.category), `"${a.id}" is in unknown category "${a.category}"`).toBe(true);
      }
    },
  );

  it.each(withActivities)('$slug: groups in category order and drops empty groups', ({ slug }) => {
    const groups = groupedFor(slug);
    const order = categoriesFor(slug).map((c) => c.id);
    const seen = groups.map((g) => g.id);
    expect(seen).toEqual(order.filter((id) => seen.includes(id)));
    for (const g of groups) expect(g.items.length).toBeGreaterThan(0);
  });

  it.each(withActivities)('$slug: folds every activity credit into its trip', ({ slug, items }) => {
    const trip = trips.find((t) => t.slug === slug)!;
    for (const a of items) {
      expect(trip.credits.some((c) => c.url === a.credit.url)).toBe(true);
    }
  });

  it('gives the Cirque cards the portrait crop their photos are shot in', () => {
    const cirque = activitiesFor('vegas').filter((a) => a.category === 'cirque');
    expect(cirque.length).toBe(5);
    for (const a of cirque) expect(a.aspect).toBe('portrait');
  });

  it('keeps category ids unique within a trip, since they are page anchors', () => {
    for (const [slug, categories] of Object.entries(CATEGORIES)) {
      const ids = categories.map((c) => c.id);
      expect(new Set(ids).size, `"${slug}" repeats a category id`).toBe(ids.length);
    }
  });

  it('returns nothing for a trip with no activities, rather than throwing', () => {
    expect(activitiesFor('thai')).toEqual([]);
    expect(groupedFor('nope')).toEqual([]);
    expect(categoriesFor('nope')).toEqual([]);
  });
});
