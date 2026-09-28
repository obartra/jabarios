import { z } from 'zod';
import { tripFolders } from './content.ts';
import { formatRange, parseDay, UNDATED_LABEL, type DateRange } from '../lib/trips.ts';

/**
 * One folder per trip under src/content/trips, validated at build time. This
 * is the single source of truth: the homepage cards, the stats, the countdown,
 * and each trip page's title, dates and social tags are all derived from each
 * folder's trip.json, so they cannot drift apart.
 */

export const CreditSchema = z.object({
  subject: z.string().min(1),
  author: z.string().min(1),
  /**
   * How the photo may be used, e.g. "CC BY-SA 4.0" or "Public domain". Free
   * text because not every usable photo is Creative Commons, but never blank.
   */
  licence: z.string().min(2),
  url: z.url(),
});

export type Credit = z.infer<typeof CreditSchema>;

/**
 * Every photo in the trip's img/ folder, described once: its alt text and its
 * credit. Cards, covers and page sections refer to photos by file name, and
 * scripts/check-dist.mjs fails the build if a file has no entry here.
 */
const PhotoSchema = z.object({
  alt: z.string().min(1),
  credit: CreditSchema,
});

const TripSchema = z
  .object({
    name: z.string().min(1),
    /**
     * Calendar days, inclusive of both ends. Both are optional together: a trip
     * we want to take but have not scheduled has neither, and the card, the day
     * count and the countdown all skip it rather than invent a date.
     */
    start: z.iso.date().optional(),
    end: z.iso.date().optional(),
    countries: z.number().int().positive().default(1),
    /** Hero line on the trip page. */
    lede: z.string().min(1),
    /** Card blurb on the homepage. Keep it to a couple of sentences. */
    blurb: z.string().min(1),
    /** Meta description. Search results cut off around 160 characters. */
    description: z.string().min(1).max(160),
    /** Shown as chips on the card, in order of travel. */
    places: z.array(z.string().min(1)).min(1),
    /** Extra chips after the places, e.g. "4 dives". */
    notes: z.array(z.string().min(1)).default([]),
    /** Card and social image: a file name in img/, described in photos. */
    cover: z.string().min(1),
    photos: z.record(z.string(), PhotoSchema),
  })
  .refine((t) => (t.start === undefined) === (t.end === undefined), {
    message: 'a trip needs both start and end, or neither',
    path: ['end'],
  })
  .refine((t) => !t.start || !t.end || parseDay(t.end) >= parseDay(t.start), {
    message: 'end must not be before start',
    path: ['end'],
  })
  .refine((t) => t.cover in t.photos, {
    message: 'cover must be one of the photos',
    path: ['cover'],
  });

export type Photo = z.infer<typeof PhotoSchema>;

export type Trip = Omit<z.infer<typeof TripSchema>, 'photos'> & {
  /** URL segment, from the folder name. The trip is served at /<slug>/. */
  slug: string;
  photos: Record<string, Photo>;
  coverAlt: string;
  /** Every photo's credit, in registry order, for the footer. */
  credits: Credit[];
  /** File names actually present in img/, for the checks. */
  images: string[];
  /** Both days or neither, resolved once so consumers test one thing. */
  dates: DateRange | null;
  /** Derived, never authored, so the label can never disagree with the dates. */
  dateLabel: string;
  title: string;
  href: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function load(): Trip[] {
  return tripFolders().map(({ slug, trip: entry, images }) => {
    if (!SLUG.test(slug)) throw new Error(`trip folder "${slug}" must be lowercase kebab-case`);
    const result = TripSchema.safeParse(entry);
    if (!result.success) {
      throw new Error(
        `invalid trip "${slug}":\n` +
          result.error.issues
            .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('\n'),
      );
    }
    const trip = result.data;
    // The schema guarantees both or neither, so one check settles both.
    const dates = trip.start && trip.end ? { start: trip.start, end: trip.end } : null;
    return {
      ...trip,
      slug,
      images,
      coverAlt: trip.photos[trip.cover]!.alt,
      credits: Object.values(trip.photos).map((p) => p.credit),
      dates,
      dateLabel: dates ? formatRange(dates.start, dates.end) : UNDATED_LABEL,
      // An undated trip's title is just its name: "Las Vegas · Dates not set"
      // reads as broken in a browser tab and a social card.
      title: dates ? `${trip.name} · ${formatRange(dates.start, dates.end)}` : trip.name,
      href: `/${slug}/`,
    };
  });
}

export const trips: Trip[] = load();

export function tripBySlug(slug: string): Trip {
  const trip = trips.find((t) => t.slug === slug);
  if (!trip) throw new Error(`no trip with slug "${slug}"`);
  return trip;
}

/** A trip photo's registry entry, loud about a file name that is not in it. */
export function photoOf(trip: Trip, file: string): Photo {
  const photo = trip.photos[file];
  if (!photo) throw new Error(`trip "${trip.slug}" has no photo "${file}" in trip.json`);
  return photo;
}
