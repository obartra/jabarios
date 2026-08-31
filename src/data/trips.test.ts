import { describe, expect, it } from 'vitest';
import { trips, tripBySlug } from './trips.ts';
import { durationDays, formatRange, parseDay } from '../lib/trips.ts';

describe('trip data', () => {
  it('loads and validates every trip at import time', () => {
    expect(trips.length).toBeGreaterThan(0);
  });

  it('derives the date label from the dates, so they cannot disagree', () => {
    for (const trip of trips) {
      expect(trip.dateLabel).toBe(formatRange(trip.start, trip.end));
      expect(trip.title).toContain(trip.name);
      expect(trip.href).toBe(`/${trip.slug}/`);
    }
  });

  it('has a unique, URL-safe slug per trip', () => {
    const slugs = trips.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('never ends a trip before it starts', () => {
    for (const trip of trips) {
      expect(parseDay(trip.end)).toBeGreaterThanOrEqual(parseDay(trip.start));
      expect(durationDays(trip)).toBeGreaterThan(0);
    }
  });

  it('keeps meta descriptions within what search results show', () => {
    for (const trip of trips) expect(trip.description.length).toBeLessThanOrEqual(160);
  });

  it('points cover images at an absolute path and describes them', () => {
    for (const trip of trips) {
      expect(trip.cover.startsWith('/')).toBe(true);
      expect(trip.coverAlt.trim().length).toBeGreaterThan(0);
    }
  });

  it('writes copy without em dashes, per CLAUDE.md', () => {
    for (const trip of trips) {
      const copy = [trip.lede, trip.blurb, trip.description, ...trip.places, ...trip.notes];
      for (const text of copy) expect(text).not.toContain('—');
    }
  });

  it('looks trips up by slug and is loud about a miss', () => {
    expect(tripBySlug(trips[0]!.slug).name).toBe(trips[0]!.name);
    expect(() => tripBySlug('nope')).toThrow(/no trip with slug/);
  });
});
