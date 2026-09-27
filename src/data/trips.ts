import { z } from 'zod';
import { activitiesFor } from './activities.ts';
import { formatRange, parseDay, UNDATED_LABEL, type DateRange } from '../lib/trips.ts';

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
          licence: z.string().min(2),
          url: z.url(),
        }),
      )
      .default([]),
  })
  .refine((t) => (t.start === undefined) === (t.end === undefined), {
    message: 'a trip needs both start and end, or neither',
    path: ['end'],
  })
  .refine((t) => !t.start || !t.end || parseDay(t.end) >= parseDay(t.start), {
    message: 'end must not be before start',
    path: ['end'],
  });

export type Trip = z.infer<typeof TripSchema> & {
  /** Both days or neither, resolved once so consumers test one thing. */
  dates: DateRange | null;
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
    countries: 1,
    lede: 'Four of us, whenever we get to it, and a long list of things we could do: skydiving, a tank, the Grand Canyon from the air, and the desert on the days the Strip wears thin. No dates yet, and none of it is booked.',
    blurb:
      'Four of us, dates still open. Ideas rather than a plan: what things cost, how long they take, and no obligation to do any of them.',
    description:
      'Four of us in Vegas, dates still open. Skydiving, tanks, the Grand Canyon by helicopter, odd museums and the desert. Ideas, not a plan.',
    places: ['The Strip', 'Boulder City', 'Grand Canyon West'],
    notes: ['Nothing booked'],
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
  {
    slug: 'palm-springs',
    name: 'Palm Springs',
    countries: 1,
    lede: 'Some time in the desert, dates still open. Everything here is within two hours of Palm Springs: a cable car to 8,516 ft, a national park, a painted mountain, and a lot of time doing nothing by a pool. None of it is booked.',
    blurb:
      'Some time in the desert, dates still open. Ideas rather than a plan: what things cost, how long they take, and no obligation to do any of them.',
    description:
      'Palm Springs, dates still open. Joshua Tree, the tram up Chino Canyon, the Salton Sea and a lot of pool. Ideas, not a plan.',
    places: ['Palm Springs', 'Joshua Tree', 'Pioneertown', 'The Salton Sea'],
    notes: ['Nothing booked'],
    cover: '/palm-springs/img/cover.jpg',
    coverAlt:
      'A Palm Springs aerial tram car on its cables high above the rock walls of Chino Canyon',
    credits: [
      {
        subject: 'Palm Springs Aerial Tramway over Chino Canyon',
        author: 'Matthew Field',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Palm_springs_aerial_tramway.jpg',
      },
    ],
  },
  {
    slug: 'philly',
    name: 'Philadelphia',
    start: '2026-12-20',
    end: '2026-12-27',
    countries: 1,
    lede: 'Christmas at Jabari’s in West Philly, with him and his mom. Seven nights, nothing scheduled in them, and a flight south on the 27th. The cards below are for the days that are not Christmas.',
    blurb:
      'Christmas week at Jabari’s in West Philly, with him and his mom. Seven nights with nothing in them, then a flight south on the 27th.',
    description:
      'Christmas 2026 in West Philly with Jabari and his mom. Seven nights, no schedule, and what stays open over the holiday.',
    places: ['West Philly', 'Center City'],
    notes: ['7 nights', 'Christmas Day'],
    // Credited on the activity that uses it, so it is not repeated here.
    cover: '/philly/img/magicgardens.jpg',
    coverAlt: 'A wall covered in mosaic made from bottles, mirrors, tiles and a bicycle wheel',
    credits: [],
  },
  {
    slug: 'brasil',
    name: 'Brasil',
    start: '2027-01-15',
    end: '2027-01-29',
    countries: 1,
    lede: 'Still open: Brasil, or somewhere else in South America. If it is Brasil, two weeks north, most of it in Maranhão. The lagoons that made Lençóis famous are rain-fed and fill between January and June, so in the middle of January there are dunes and not much water. That is the trade for having the place close to empty.',
    blurb:
      'Brasil or elsewhere in South America, still undecided. If it is Brasil: fourteen nights in Maranhão, white dunes and an almost empty park.',
    description:
      'Fourteen nights in Maranhão in January 2027. Lençóis Maranhenses out of season, São Luís and the Rio Preguiças, and what is actually there in January.',
    places: ['São Luís', 'Barreirinhas', 'Lençóis Maranhenses'],
    notes: ['14 nights', 'Destination open'],
    cover: '/brasil/img/cover.jpg',
    coverAlt:
      'Two people walking a sandbar between a lagoon and white dunes at sunset in Lençóis Maranhenses',
    credits: [
      {
        subject: 'Lençóis Maranhenses at sunset',
        author: 'Julio Cesar Goncalves Corrêa, edited by Aristeas',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Casal_de_turistas_caminha_em_uma_duna,_enquanto_o_dia_morre_nos_Len%C3%A7%C3%B3is_Maranhenses_(edited).jpg',
      },
    ],
  },
  {
    slug: 'kona',
    name: 'Kona',
    start: '2026-12-06',
    end: '2026-12-13',
    countries: 1,
    lede: 'A week on the dry side of the Big Island. Mantas under the boat lights on Tuesday, Jabari’s first dive on Wednesday, and Mauna Kea on Thursday, in a new-moon week, with dinner at 9,000 ft and a telescope after dark. The rest of the week is ours to fill, or not.',
    blurb:
      'Seven nights on the Kona coast. Mantas at night, Jabari’s first dive, and sunset at the summit of Mauna Kea before a telescope under a new moon.',
    description:
      'A week in Kona in December 2026. The manta night dive, a first scuba dive, and Mauna Kea under a new moon with a telescope. The days and the order.',
    places: ['Kailua-Kona', 'Keauhou', 'Mauna Kea', 'Volcanoes'],
    notes: ['7 nights', 'New moon'],
    cover: '/kona/img/manta.jpg',
    coverAlt: 'A manta ray gliding over a sandy reef floor beside a scuba diver',
    // The cover is credited on the manta activity. This one is the Mauna Kea
    // section's photo, which is page copy rather than an activity card.
    credits: [
      {
        subject: 'The Milky Way over Maunakea',
        author: 'NOIRLab/AURA/NSF',
        licence: 'CC BY 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:The_Milky_Way_and_Jupiter_over_Maunakea_(02102014-040-Keck-and-Subaru-Observing-Runs-CC2).jpg',
      },
    ],
  },
  {
    slug: 'vietnam',
    name: 'Vietnam',
    start: '2026-10-02',
    end: '2026-10-15',
    countries: 1,
    lede: 'Thirteen nights with Os’s parents, Hanoi as the base and three trips out into the limestone: the rice fields of Ninh Binh, a night on a boat in Lan Ha Bay, and the Ha Giang loop to the Chinese border. Jabari joins in Hanoi for the last two days, then the two of us fly on to Bangkok.',
    blurb:
      'Thirteen nights with Os’s parents out of Hanoi: Ninh Binh, a night in Lan Ha Bay and the Ha Giang loop. Jabari joins for the last two days in Hanoi, then Bangkok.',
    description:
      'Vietnam in October 2026 with family. Hanoi, Ninh Binh, Lan Ha Bay and the Ha Giang loop, and Jabari for the last two days before Thailand.',
    places: ['Hanoi', 'Ninh Binh', 'Lan Ha Bay', 'Ha Giang'],
    notes: ['13 nights', 'All booked'],
    // Credited on the activity that uses it, so it is not repeated here.
    cover: '/vietnam/img/lanha.jpg',
    coverAlt: 'Two wooden junks with red sails among the limestone islands of Lan Ha Bay',
    credits: [],
  },
  {
    slug: 'miami',
    name: 'Miami Beach',
    start: '2026-12-14',
    end: '2026-12-19',
    countries: 1,
    lede: 'The week between Kona and Philadelphia, in South Beach, with the place already ours when the red-eye lands. The Art Deco blocks on foot, a reef or two, Little Havana across the causeway, and stone crab season. Ideas rather than a plan.',
    blurb:
      'Five nights in South Beach between Kona and Christmas. Art Deco on foot, a reef or two, Little Havana, and stone crab season. Ideas rather than a plan.',
    description:
      'Five nights in Miami Beach in December 2026. Art Deco on foot, snorkelling and diving without a car, Little Havana, Wynwood and the Everglades.',
    places: ['South Beach', 'Key Biscayne', 'Little Havana', 'Wynwood'],
    notes: ['5 nights', 'Stay booked'],
    // Credited on the activity that uses it, so it is not repeated here.
    cover: '/miami/img/oceandrive.jpg',
    coverAlt:
      'Art Deco hotels on Ocean Drive lit orange and purple at night, with palms along the street',
    credits: [],
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

  return parsed.map((trip) => {
    // The schema guarantees both or neither, so one check settles both.
    const dates = trip.start && trip.end ? { start: trip.start, end: trip.end } : null;
    return {
      ...trip,
      // Activity photos carry their own credit; merge them in so the footer and
      // scripts/check-dist.mjs both see one complete list per trip.
      credits: [...trip.credits, ...activitiesFor(trip.slug).map((a) => a.credit)],
      dates,
      dateLabel: dates ? formatRange(dates.start, dates.end) : UNDATED_LABEL,
      // An undated trip's title is just its name: "Las Vegas · Dates not set"
      // reads as broken in a browser tab and a social card.
      title: dates ? `${trip.name} · ${formatRange(dates.start, dates.end)}` : trip.name,
      href: `/${trip.slug}/`,
    };
  });
}

export const trips: Trip[] = load();

export function tripBySlug(slug: string): Trip {
  const trip = trips.find((t) => t.slug === slug);
  if (!trip) throw new Error(`no trip with slug "${slug}"`);
  return trip;
}
