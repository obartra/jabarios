import type { Trip } from './trips.ts';

/**
 * The public trips feed, served at /trips.json and read by other things we
 * build (the telephone reads it to find each trip's music). It is derived from
 * the trip folders at build, like the homepage cards, so it lists exactly the
 * trips the site does and cannot disagree with them.
 *
 * Only these fields, and only because every one of them is already on the
 * trip's page or card. Nothing else from trip.json goes in: a new field here
 * is a decision about what is public, not a convenience.
 */
export const FEED_PATH = '/trips.json';
export const FEED_VERSION = 1;

export interface FeedTrip {
  /** The trip folder's name, stable for the life of the trip. */
  slug: string;
  name: string;
  /** Calendar days, inclusive, or both null for a trip with no dates yet. */
  start: string | null;
  end: string | null;
  /** In order of travel, as on the card. */
  places: string[];
  /** How many countries the trip covers, as counted on the homepage. */
  countries: number;
  /** The trip page, absolute. */
  url: string;
}

export interface Feed {
  version: number;
  trips: FeedTrip[];
}

/** The keys a feed entry carries, in order. check-dist holds the output to these. */
export const FEED_KEYS: readonly (keyof FeedTrip)[] = [
  'slug',
  'name',
  'start',
  'end',
  'places',
  'countries',
  'url',
];

export function tripsFeed(trips: readonly Trip[], site: URL | string): Feed {
  return {
    version: FEED_VERSION,
    trips: [...trips]
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((trip) => ({
        slug: trip.slug,
        name: trip.name,
        start: trip.dates?.start ?? null,
        end: trip.dates?.end ?? null,
        places: [...trip.places],
        countries: trip.countries,
        url: new URL(trip.href, site).href,
      })),
  };
}
