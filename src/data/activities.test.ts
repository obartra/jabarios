import { describe, expect, it } from 'vitest';
import { activitiesFor, CATEGORIES, groupedFor } from './activities.ts';
import { trips } from './trips.ts';

const vegas = activitiesFor('vegas');

describe('activities', () => {
  it('loads and validates at import time', () => {
    expect(vegas.length).toBeGreaterThan(0);
  });

  it('gives every activity a price and a duration, which is the point of the page', () => {
    for (const a of vegas) {
      expect(a.price.trim()).not.toBe('');
      expect(a.duration.trim()).not.toBe('');
      // A price is either free or has a number in it. "Reasonable" is not a price.
      expect(/free/i.test(a.price) || /\d/.test(a.price)).toBe(true);
    }
  });

  it('gives every activity a photo under its own trip directory, with alt text', () => {
    for (const a of vegas) {
      expect(a.photo.startsWith('/vegas/img/')).toBe(true);
      expect(a.photoAlt.trim().length).toBeGreaterThan(10);
    }
  });

  it('credits every photo', () => {
    for (const a of vegas) {
      expect(a.credit.author.trim()).not.toBe('');
      expect(a.credit.url).toMatch(/^https?:\/\//);
    }
  });

  it('never reuses a photo between activities', () => {
    const photos = vegas.map((a) => a.photo);
    expect(new Set(photos).size).toBe(photos.length);
  });

  it('keeps facts short enough to scan', () => {
    for (const a of vegas) {
      expect(a.facts.length).toBeGreaterThan(0);
      expect(a.facts.length).toBeLessThanOrEqual(5);
      for (const fact of a.facts) expect(fact.length).toBeLessThanOrEqual(110);
    }
  });

  it('writes copy without em dashes, per CLAUDE.md', () => {
    for (const a of vegas) {
      for (const text of [a.name, a.blurb, ...a.facts]) expect(text).not.toContain('—');
    }
  });

  it('keeps one photo aspect per category, or rows end up ragged', () => {
    const byCategory = new Map<string, Set<string>>();
    for (const a of vegas) {
      if (!byCategory.has(a.category)) byCategory.set(a.category, new Set());
      byCategory.get(a.category)!.add(a.aspect);
    }
    for (const [category, aspects] of byCategory) {
      expect(aspects.size, `category "${category}" mixes ${[...aspects].join(' and ')}`).toBe(1);
    }
  });

  it('gives the Cirque cards the portrait crop their photos are shot in', () => {
    const cirque = vegas.filter((a) => a.category === 'cirque');
    expect(cirque.length).toBe(5);
    for (const a of cirque) expect(a.aspect).toBe('portrait');
  });

  it('puts every activity in a known category', () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const a of vegas) expect(ids.has(a.category)).toBe(true);
  });

  it('groups in CATEGORIES order and drops empty groups', () => {
    const groups = groupedFor('vegas');
    const order = CATEGORIES.map((c) => c.id);
    const seen = groups.map((g) => g.id);
    expect(seen).toEqual(order.filter((id) => seen.includes(id)));
    for (const g of groups) expect(g.items.length).toBeGreaterThan(0);
  });

  it('returns nothing for a trip with no activities, rather than throwing', () => {
    expect(activitiesFor('thai')).toEqual([]);
    expect(groupedFor('nope')).toEqual([]);
  });

  it('folds every activity credit into its trip, so the footer lists them all', () => {
    const trip = trips.find((t) => t.slug === 'vegas')!;
    for (const a of vegas) {
      expect(trip.credits.some((c) => c.url === a.credit.url)).toBe(true);
    }
  });
});
