import { z } from 'zod';
import { activitiesFor } from './activities.ts';
import { formatRange, parseDay } from '../lib/trips.ts';

/**
 * One entry per trip, validated at build time. This is the single source of
 * truth: the homepage cards, the stats, the countdown, and each trip page's
 * title, dates and social tags are all derived from here, so they cannot drift
 * apart. Adding a trip means adding an entry and a page at src/pages/<slug>/.
 */
const TripSchema = z
  .object({
    /** URL segment. The trip is served at /<slug>/. */
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
    name: z.string().min(1),
    /** Calendar days, inclusive of both ends. */
    start: z.iso.date(),
    end: z.iso.date(),
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
    /** Card and social image, resolved from public/. */
    cover: z.string().startsWith('/'),
    coverAlt: z.string().min(1),
    /**
     * Per-photo attribution. Creative Commons requires it, so it is required
     * here too, and scripts/check-dist.mjs fails the build if a bundled photo
     * has no credit.
     */
    credits: z
      .array(
        z.object({
          subject: z.string().min(1),
          author: z.string().min(1),
          licence: z
            .string()
            .regex(/^(CC|Public domain)/, 'licence should read like "CC BY-SA 4.0"'),
          url: z.url(),
        }),
      )
      .default([]),
  })
  .refine((t) => parseDay(t.end) >= parseDay(t.start), {
    message: 'end must not be before start',
    path: ['end'],
  });

export type Trip = z.infer<typeof TripSchema> & {
  /** Derived, never authored, so the label can never disagree with the dates. */
  dateLabel: string;
  title: string;
  href: string;
};

const raw: unknown[] = [
  {
    slug: 'thai',
    name: 'Thailand',
    start: '2026-10-15',
    end: '2026-11-01',
    countries: 1,
    lede: 'Five nights in Bangkok with Jabari, working nights and out from midday. Then north to Chiang Mai alone, and two days on the water out of Khao Lak before Manila.',
    blurb:
      'Five nights in Bangkok with Jabari, then north to Chiang Mai alone, and two days on the water out of Khao Lak before Manila.',
    description:
      'Bangkok with Jabari, then Chiang Mai and the Similans alone. The days, the dives, and what to book first.',
    places: ['Bangkok', 'Chiang Mai', 'Khao Lak'],
    notes: ['4 dives'],
    cover: '/thai/img/similan.jpg',
    coverAlt:
      'Granite boulders and turquoise shallows on Similan Island 8, seen from the ridge above the bay',
    credits: [
      {
        subject: 'Wat Arun',
        author: 'miketnorton',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Wat_Arun_Sunset.jpg',
      },
      {
        subject: 'Grand Palace roofline',
        author: 'Bjørn Erik Pedersen',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:A_roof_of_a_building_at_the_Grand_Palace,_Bangkok,_sunrise,_2017.jpg',
      },
      {
        subject: 'Amphawa Floating Market',
        author: 'Rangan Datta',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Amphawa_Floating_Market_16a.jpg',
      },
      {
        subject: 'Wat Chaiwatthanaram',
        author: 'Average trinmo',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Wat_Chaiwatthanaram_by_drone.jpg',
      },
      {
        subject: 'Wat Phra That Doi Suthep',
        author: 'Arts of Chet',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Wat_Phra_That_Doi_Suthep_in_Chiang_Mai_02.jpg',
      },
      {
        subject: 'Similan Island 8',
        author: 'Mathias Krumbholz',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Similan_Island_01_(MK).jpg',
      },
      {
        subject: 'Richelieu Rock',
        author: 'Mr.CMBurns',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Richelieu_Rock.jpg',
      },
      {
        subject: 'Khao Lak Beach',
        author: 'Vyacheslav Argenberg',
        licence: 'CC BY 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Khao_Lak_Beach,_Thailand.jpg',
      },
    ],
  },
  {
    slug: 'vegas',
    name: 'Las Vegas',
    start: '2026-12-18',
    end: '2026-12-27',
    countries: 1,
    lede: 'We thought Christmas in Vegas would be fun. Four of us, nine nights, and a long list of things we could do: skydiving, a tank, the Grand Canyon from the air, and the desert on the days the Strip wears thin. None of it is booked.',
    blurb:
      'Four of us over Christmas. Ideas rather than a plan: what things cost, how long they take, and no obligation to do any of them.',
    description:
      'Four of us in Vegas over Christmas 2026. Skydiving, tanks, the Grand Canyon by helicopter, odd museums and the desert. Ideas, not a plan.',
    places: ['The Strip', 'Boulder City', 'Grand Canyon West'],
    notes: ['9 nights', 'Nothing booked'],
    cover: '/vegas/img/strip.jpg',
    coverAlt: 'The Las Vegas Strip at night from the air, lit along its whole length',
    credits: [
      {
        subject: 'Las Vegas Strip at night',
        author: 'Carol M. Highsmith',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Night_aerial_view,_Las_Vegas,_Nevada,_04649u.jpg',
      },
    ],
  },
  // <new-trip> scripts/new-trip.mjs inserts above this line.
];

function load(): Trip[] {
  const parsed = raw.map((entry, i) => {
    const result = TripSchema.safeParse(entry);
    if (!result.success) {
      const where = (entry as { slug?: string })?.slug ?? `trips[${i}]`;
      throw new Error(
        `invalid trip "${where}":\n` +
          result.error.issues
            .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('\n'),
      );
    }
    return result.data;
  });

  const seen = new Set<string>();
  for (const trip of parsed) {
    if (seen.has(trip.slug)) throw new Error(`duplicate trip slug "${trip.slug}"`);
    seen.add(trip.slug);
  }

  return parsed.map((trip) => ({
    ...trip,
    // Activity photos carry their own credit; merge them in so the footer and
    // scripts/check-dist.mjs both see one complete list per trip.
    credits: [...trip.credits, ...activitiesFor(trip.slug).map((a) => a.credit)],
    dateLabel: formatRange(trip.start, trip.end),
    title: `${trip.name} · ${formatRange(trip.start, trip.end)}`,
    href: `/${trip.slug}/`,
  }));
}

export const trips: Trip[] = load();

export function tripBySlug(slug: string): Trip {
  const trip = trips.find((t) => t.slug === slug);
  if (!trip) throw new Error(`no trip with slug "${slug}"`);
  return trip;
}
