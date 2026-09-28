import { describe, expect, it } from 'vitest';
import { trips, tripBySlug } from './trips.ts';
import { durationDays, formatRange, parseDay, UNDATED_LABEL } from '../lib/trips.ts';

describe('trip data', () => {
  it('loads and validates every trip at import time', () => {
    expect(trips.length).toBeGreaterThan(0);
  });

  it('derives the date label from the dates, so they cannot disagree', () => {
    for (const trip of trips) {
      expect(trip.dateLabel).toBe(
        trip.dates ? formatRange(trip.dates.start, trip.dates.end) : UNDATED_LABEL,
      );
      expect(trip.title).toContain(trip.name);
      expect(trip.href).toBe(`/${trip.slug}/`);
    }
  });

  it('carries both dates or neither, never one', () => {
    for (const trip of trips) {
      expect(trip.start === undefined).toBe(trip.end === undefined);
      expect(trip.dates === null).toBe(trip.start === undefined);
    }
  });

  it('keeps an undated trip out of its own title, so the tab reads as a name', () => {
    for (const trip of trips.filter((t) => t.dates === null)) {
      expect(trip.title).toBe(trip.name);
      expect(trip.title).not.toContain(UNDATED_LABEL);
    }
  });

  it('has a unique, URL-safe slug per trip', () => {
    const slugs = trips.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('never ends a trip before it starts', () => {
    for (const { dates } of trips) {
      if (!dates) continue;
      expect(parseDay(dates.end)).toBeGreaterThanOrEqual(parseDay(dates.start));
      expect(durationDays(dates)).toBeGreaterThan(0);
    }
  });

  it('keeps meta descriptions within what search results show', () => {
    for (const trip of trips) expect(trip.description.length).toBeLessThanOrEqual(160);
  });

  it('uses a real, described photo as the cover', () => {
    for (const trip of trips) {
      expect(trip.images, `${trip.slug} cover ${trip.cover}`).toContain(trip.cover);
      expect(trip.coverAlt.trim().length).toBeGreaterThan(0);
    }
  });

  it('describes and credits every photo in each trip folder, and nothing else', () => {
    for (const trip of trips) {
      expect(Object.keys(trip.photos).sort(), trip.slug).toEqual([...trip.images].sort());
      for (const [file, p] of Object.entries(trip.photos)) {
        expect(p.alt.trim().length, `${trip.slug}/${file} alt`).toBeGreaterThan(10);
        expect(p.credit.url, `${trip.slug}/${file} credit`).toMatch(/^https?:\/\//);
      }
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
