import { describe, expect, it } from 'vitest';
import { FEED_KEYS, FEED_VERSION, tripsFeed } from './feed.ts';
import { trips } from './trips.ts';

const feed = tripsFeed(trips, 'https://jabarios.com');

describe('trips feed', () => {
  it('lists exactly the trip folders, once each, by slug', () => {
    const slugs = feed.trips.map((t) => t.slug);
    expect(slugs).toEqual(trips.map((t) => t.slug).sort());
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(feed.version).toBe(FEED_VERSION);
  });

  it('carries only the public fields, in a fixed order', () => {
    for (const entry of feed.trips) expect(Object.keys(entry)).toEqual(FEED_KEYS);
  });

  it('derives every field from the trip data', () => {
    for (const entry of feed.trips) {
      const trip = trips.find((t) => t.slug === entry.slug)!;
      expect(entry.name).toBe(trip.name);
      expect(entry.places).toEqual(trip.places);
      expect(entry.countries).toBe(trip.countries);
      expect(entry.start).toBe(trip.dates?.start ?? null);
      expect(entry.end).toBe(trip.dates?.end ?? null);
      expect(entry.url).toBe(`https://jabarios.com/${trip.slug}/`);
    }
  });

  it('gives an undated trip null for both days, never one', () => {
    const undated = {
      ...trips[0]!,
      slug: 'someday',
      href: '/someday/',
      start: undefined,
      end: undefined,
      dates: null,
    };
    const [entry] = tripsFeed([undated], 'https://jabarios.com').trips;
    expect(entry!.start).toBeNull();
    expect(entry!.end).toBeNull();
  });
});
