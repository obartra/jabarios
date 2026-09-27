import { z } from 'zod';

/**
 * Things to do on a trip, one entry per option. The trip pages render these as
 * a scannable grid rather than an itinerary: the point is to see what is on
 * offer, what it costs and how long it eats, and then choose.
 *
 * Photo credits live on the activity that uses the photo, and trips.ts folds
 * them into the trip's credit list, so a photo can never arrive without its
 * attribution.
 */

export const CreditSchema = z.object({
  subject: z.string().min(1),
  author: z.string().min(1),
  /**
   * How the photo may be used, e.g. "CC BY-SA 4.0", "Public domain", or
   * "© Cirque du Soleil, used with permission". Free text because not every
   * usable photo is Creative Commons, but never blank: an uncredited photo is
   * the thing this field exists to prevent.
   */
  licence: z.string().min(2),
  url: z.url(),
});

export type Credit = z.infer<typeof CreditSchema>;

export interface Category {
  /** Anchor id for the section and the sticky nav. Unique within its trip. */
  id: string;
  label: string;
  /** What the sticky nav shows, where the full label is too long. */
  short: string;
  note: string;
}

/**
 * Categories per trip, in the order the sections appear on the page. They are
 * per trip rather than global because the grouping is part of the writing: a
 * desert fortnight and a week in a cold city do not sort into the same shelves,
 * and a shared list would force one of them into the other's labels.
 */
export const CATEGORIES: Record<string, readonly Category[]> = {
  vegas: [
    {
      id: 'big',
      label: 'The big ones',
      short: 'Big ones',
      note: 'The ones that cost real money and need booking ahead.',
    },
    {
      id: 'cirque',
      label: 'Cirque du Soleil',
      short: 'Cirque',
      note: 'Five resident shows, and they are not much like each other.',
    },
    {
      id: 'night',
      label: 'Shows and nights out',
      short: 'Nights out',
      note: 'A theatre show, a club, and a screen the size of a building.',
    },
    {
      id: 'museum',
      label: 'Museums and oddities',
      short: 'Museums',
      note: 'Indoor options for the cold half of the day.',
    },
    {
      id: 'out',
      label: 'Out of town',
      short: 'Out of town',
      note: 'A car and a morning gets a long way from the Strip.',
    },
    { id: 'free', label: 'Free, and worth it', short: 'Free', note: 'No ticket, no booking.' },
  ],
  'palm-springs': [
    {
      id: 'air',
      label: 'Off the ground',
      short: 'Off the ground',
      note: 'A cable car, a balloon and a warbird, all before the heat.',
    },
    {
      id: 'desert',
      label: 'Out in the desert',
      short: 'Desert',
      note: 'Everything here is within two hours of the front door.',
    },
    {
      id: 'modern',
      label: 'Midcentury Palm Springs',
      short: 'Midcentury',
      note: 'The thing the town is actually known for, and mostly free to look at.',
    },
    {
      id: 'odd',
      label: 'Odd corners',
      short: 'Odd corners',
      note: 'The high desert collects people who build strange things.',
    },
    { id: 'free', label: 'Free, and worth it', short: 'Free', note: 'No ticket, no booking.' },
  ],
  philly: [
    {
      id: 'out',
      label: 'If we leave the house',
      short: 'Out',
      note: 'Home turf for Jabari, so this is not a list to work through.',
    },
  ],
  january: [
    {
      id: 'shortlist',
      label: 'The shortlist',
      short: 'Shortlist',
      note: 'Each one is here for something that is at its best in mid-January.',
    },
  ],
  kona: [
    {
      id: 'water',
      label: 'In the water',
      short: 'Water',
      note: 'The boats leave from Honokōhau, about 4 mi north of the house. None of them pick up.',
    },
    {
      id: 'town',
      label: 'On foot from the house',
      short: 'Town',
      note: 'Downhill to the bay in about 20 minutes, and the Kona Trolley runs the length of Aliʻi Drive.',
    },
    {
      id: 'car',
      label: 'The car day',
      short: 'Car day',
      note: 'Saturday only. Everything here is south of town, and Volcanoes is the far end of it.',
    },
  ],
  vietnam: [
    {
      id: 'out',
      label: 'The three trips out',
      short: 'Trips out',
      note: 'All booked, cars included. The big bags stay in Hanoi each time.',
    },
    {
      id: 'hanoi',
      label: 'Hanoi, together',
      short: 'Hanoi',
      note: 'The 13th and 14th have nothing in them.',
    },
  ],
  miami: [
    {
      id: 'walk',
      label: 'On foot',
      short: 'On foot',
      note: 'South Beach is flat, and the free trolley runs every 20 minutes.',
    },
    {
      id: 'us',
      label: 'Just us two',
      short: 'Dates',
      note: 'Date nights and date days, most of them a short ride from the beach.',
    },
    {
      id: 'water',
      label: 'In the water',
      short: 'Water',
      note: 'Tuesday to Thursday are the dive days. Snorkelling has no flying limit.',
    },
    {
      id: 'mainland',
      label: 'Across the causeway',
      short: 'Mainland',
      note: 'Each of these is a $15 to $25 ride from the beach.',
    },
  ],
};

export function categoriesFor(slug: string): readonly Category[] {
  return CATEGORIES[slug] ?? [];
}

const ActivitySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  /**
   * One of the ids in this activity's own trip's CATEGORIES. The schema cannot
   * see which trip it is being parsed under, so load() checks it against the
   * right list and fails the build naming both the id and the trip.
   */
  category: z.string().regex(/^[a-z0-9-]+$/),
  /** Free text so it can say "per car" or "for two", but always concrete. */
  price: z.string().min(1),
  duration: z.string().min(1),
  blurb: z.string().min(1),
  /** Short constraints and gotchas. Three or four, scannable. */
  facts: z.array(z.string().min(1)).min(1).max(5),
  photo: z.string().startsWith('/'),
  /**
   * Shape of the photo. Every activity in a category must agree, or the cards
   * in a row end up different heights; activities.test.ts checks that.
   */
  aspect: z.enum(['landscape', 'portrait']).default('landscape'),
  photoAlt: z.string().min(1),
  link: z.url().optional(),
  credit: CreditSchema,
});

export type Activity = z.infer<typeof ActivitySchema>;

const raw: Record<string, unknown[]> = {
  vegas: [
    {
      id: 'skydive',
      name: 'Tandem skydive',
      category: 'big',
      price: '$220–350 pp',
      duration: '3–4 hours, door to door',
      blurb:
        'The Boulder City drop zones jump over Lake Mead and the Hoover Dam rather than flat desert, which is the whole difference. Morning slots are the calm ones; the wind gets up by afternoon.',
      facts: [
        '18+, photo ID at the door',
        'Under 240 lb, height and weight proportionate',
        'Most operators run a free Strip pickup',
        'Properly cold at 12,500 ft in winter',
      ],
      photo: '/vegas/img/skydive.jpg',
      photoAlt: 'A skydiver in freefall against a blue sky, arms spread',
      link: 'https://skydivelasvegas.com/',
      credit: {
        subject: 'Tandem skydive',
        author: 'Rstpch',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Skydiver_Balancing_in_Freestyle_Freefall_Pose.jpg',
      },
    },
    {
      id: 'tank',
      name: 'Drive an armoured vehicle, and shoot',
      category: 'big',
      price: '$2,495 for two',
      duration: 'Half a day',
      blurb:
        'Battlefield Vegas. Twenty minutes at the controls of an M113A2, which is an armoured personnel carrier rather than a turreted tank, plus a run through a Glock, an MP5, an M16, a Barrett .50 and a flamethrower.',
      facts: [
        'Drivers 16+, over 5 ft, under 275 lb',
        'No driving licence needed',
        'Free Humvee pickup from Strip hotels',
        'Only the two-person package is published; a call would clarify four',
      ],
      photo: '/vegas/img/tank.jpg',
      photoAlt: 'M113 armoured personnel carriers lined up in desert scrub',
      link: 'https://www.battlefieldvegas.com/',
      credit: {
        subject: 'M113 armoured personnel carriers',
        author: 'Tech. Sgt. H. H. Deffner',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Egyptian_M113_APCs_during_Operation_Desert_Shield.JPEG',
      },
    },
    {
      id: 'helicopter',
      name: 'Helicopter to the Grand Canyon',
      category: 'big',
      price: '$450–750 pp',
      duration: '4–5 hours',
      blurb:
        'Only the West Rim allows a landing below the rim, on Hualapai land. South Rim flights stay above it the whole way. Afternoon departures come back over the Strip after dark, so the skyline flight arrives in the same booking.',
      facts: [
        'Fuel surcharge of $15–35 is usually extra',
        'West Rim entry fee often extra, $99+',
        'Winter weather cancels flights, so a spare day helps',
        'Front seat upgrade runs $50–60',
      ],
      photo: '/vegas/img/helicopter.jpg',
      photoAlt: 'The Grand Canyon seen from the air, buttes and side canyons in low sun',
      link: 'https://www.papillon.com/',
      credit: {
        subject: 'Grand Canyon from the air',
        author: 'Unknown',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Grand_Canyon_Aerial_Kwagunt_Butte,_Malgosa_Crest,_Nankoweap_Mesa.jpg',
      },
    },
    {
      id: 'o',
      name: '"O"',
      category: 'cirque',
      price: '$110–250 pp',
      duration: '90 minutes',
      blurb:
        'The water one. A pool holding a million and a half gallons, twenty-five feet deep, with sixteen hydraulic platforms that lift the stage out of it and drop it away again mid-scene. Synchronised swimmers, sixty-foot dives, and scuba divers working under the surface for the whole show.',
      facts: [
        'Bellagio, middle Strip',
        'Eight Olympians in the cast',
        'No performances two nights a week',
        'The first few rows get wet',
      ],
      photo: '/vegas/img/o.avif',
      aspect: 'portrait',
      photoAlt:
        'Two performers in mirrored black and white face paint, reflected in the water in “O”',
      link: 'https://www.bellagio.com/en/entertainment/o-cirque-du-soleil.html',
      credit: {
        subject: '"O"',
        author: 'Cirque du Soleil',
        licence: '© Cirque du Soleil',
        url: 'https://www.cirquedusoleil.com/o',
      },
    },
    {
      id: 'mystere',
      name: 'Mystère',
      category: 'cirque',
      price: '$70–160 pp',
      duration: '90 minutes',
      blurb:
        'The oldest of the five, running since 1993, and the most straightforwardly circus of them: acrobatics, clowning and a very large taiko drum. Usually the cheapest ticket of the lot.',
      facts: [
        'Treasure Island, north Strip',
        'No age restriction',
        'The least expensive of the five',
      ],
      photo: '/vegas/img/mystere.avif',
      aspect: 'portrait',
      photoAlt: 'Two aerialists intertwined in mid-air against a black stage in Mystère',
      link: 'https://www.cirquedusoleil.com/mystere',
      credit: {
        subject: 'Mystère',
        author: 'Cirque du Soleil',
        licence: '© Cirque du Soleil',
        url: 'https://www.cirquedusoleil.com/mystere',
      },
    },
    {
      id: 'ka',
      name: 'KÀ',
      category: 'cirque',
      price: '$85–220 pp',
      duration: '90 minutes',
      blurb:
        'A martial-arts story told on a stage that tilts to vertical and moves through the room, which is more of the spectacle than the acrobatics are. The most plot-driven of the five.',
      facts: [
        'MGM Grand, south Strip',
        'Under 18s need an adult',
        'Loud, dark, and heavy on pyrotechnics',
      ],
      photo: '/vegas/img/ka.avif',
      aspect: 'portrait',
      photoAlt: 'Costumed performers carrying banners across the stage in KÀ',
      link: 'https://www.cirquedusoleil.com/ka',
      credit: {
        subject: 'KÀ',
        author: 'Cirque du Soleil',
        licence: '© Cirque du Soleil',
        url: 'https://www.cirquedusoleil.com/ka',
      },
    },
    {
      id: 'one',
      name: 'Michael Jackson ONE',
      category: 'cirque',
      price: '$80–200 pp',
      duration: '90 minutes',
      blurb:
        'Built around the catalogue rather than a story, so it lands as a gig with acrobatics in it as much as a Cirque show. The easiest of the five to enjoy without concentrating.',
      facts: [
        'Mandalay Bay, far south Strip',
        'Under 16s need an adult',
        'Familiar music the whole way through',
      ],
      photo: '/vegas/img/one.avif',
      aspect: 'portrait',
      photoAlt: 'Dancers in bright costumes under purple stage light in Michael Jackson ONE',
      link: 'https://www.cirquedusoleil.com/michael-jackson-one',
      credit: {
        subject: 'Michael Jackson ONE',
        author: 'Cirque du Soleil',
        licence: '© Cirque du Soleil',
        url: 'https://www.cirquedusoleil.com/michael-jackson-one',
      },
    },
    {
      id: 'mad-apple',
      name: 'Mad Apple',
      category: 'cirque',
      price: '$70–180 pp',
      duration: '75 minutes',
      blurb:
        'A New York themed variety night: stand-up, magic, a live band, and acrobatics in between. Later, looser and more adult than the rest, and the shortest of the five.',
      facts: [
        'New York-New York, middle Strip',
        '18+, for adult language in the comedy',
        'Bar on the stage before it starts',
      ],
      photo: '/vegas/img/mad-apple.avif',
      aspect: 'portrait',
      photoAlt:
        'A performer holding a handstand on a pedestal in front of a neon New York set in Mad Apple',
      link: 'https://www.cirquedusoleil.com/mad-apple',
      credit: {
        subject: 'Mad Apple',
        author: 'Cirque du Soleil',
        licence: '© Cirque du Soleil',
        url: 'https://www.cirquedusoleil.com/mad-apple',
      },
    },
    {
      id: 'flamingo',
      name: "RuPaul's Drag Race Live",
      category: 'night',
      price: '$60–150 pp',
      duration: '75 minutes',
      blurb:
        'At the Flamingo, with a rotating cast of Drag Race alumni. A seated theatre show with a running time and an interval, rather than a club night.',
      facts: [
        'Seated theatre show, not a club',
        "Hamburger Mary's does a drag brunch, for a daytime version",
        'Holiday week slots go early',
      ],
      photo: '/vegas/img/flamingo.jpg',
      photoAlt: 'The Flamingo Las Vegas hotel and its sign reflected in water',
      link: 'https://www.caesars.com/flamingo-las-vegas/shows/rupauls-drag-race-live',
      credit: {
        subject: 'Flamingo Las Vegas',
        author: 'Julian Lupyan',
        licence: 'CC0',
        url: 'https://commons.wikimedia.org/wiki/File:Reflection_of_the_Flamingo_Hotel_in_front_of_the_Bellagio.jpg',
      },
    },
    {
      id: 'club',
      name: 'Piranha',
      category: 'night',
      price: 'Free to $20 cover',
      duration: 'As long as we last',
      blurb:
        'The Fruit Loop on Paradise Road, a mile off the Strip. Resident queens, guest Drag Race alumni, and it runs until dawn.',
      facts: [
        'Busiest after midnight',
        'Free entry most weeknights',
        'Ten minutes by car from the middle Strip',
      ],
      photo: '/vegas/img/club.jpg',
      photoAlt: 'A performer in an elaborate costume and moustache at a pride parade',
      link: 'https://piranhavegas.com/',
      credit: {
        subject: 'Drag performer, Brighton Pride',
        author: 'vic_burton',
        licence: 'CC BY-SA 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:A_Freddie_Mercury,_Brighton_Pride_2013_(9431918112).jpg',
      },
    },
    {
      id: 'sphere',
      name: 'Sphere',
      category: 'night',
      price: '$99–199 pp',
      duration: '75 minutes',
      blurb:
        'Residencies and the immersive screening alternate, so what is on depends entirely on the week we pick. The screening earns the ticket for the room more than for the film.',
      facts: [
        'Programme changes, so the calendar is worth a look',
        'Upper bowl is fine and much cheaper',
        'Not great for anyone prone to motion sickness',
      ],
      photo: '/vegas/img/sphere.jpg',
      photoAlt: 'The Sphere in daylight, its curved LED exterior above the Strip',
      link: 'https://www.thesphere.com/',
      credit: {
        subject: 'Sphere',
        author: 'Y2kcrazyjoker4',
        licence: 'CC BY 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Sphere-exosphere-in-daytime-on-Jan-27-2024.jpg',
      },
    },
    {
      id: 'neon',
      name: 'The Neon Museum',
      category: 'museum',
      price: '$28–38 pp',
      duration: '1 to 1.5 hours',
      blurb:
        'Two hundred-odd dead casino signs laid out in a yard. The dusk slot is the good one, with the daylight going and the restored signs coming on; the daytime ticket is a different and lesser thing.',
      facts: [
        'Dusk slots sell out first',
        'Outdoors, and cold after dark in winter',
        'Twenty minutes from the middle Strip',
      ],
      photo: '/vegas/img/neon.jpg',
      photoAlt: 'Old neon casino signs standing in the Neon Museum boneyard at dusk',
      link: 'https://www.neonmuseum.org/',
      credit: {
        subject: 'The Neon Museum',
        author: 'Jeremy Thompson from Los Angeles, California',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:The_Neon_Museum_(35729213455).jpg',
      },
    },
    {
      id: 'atomic',
      name: 'Atomic Museum',
      category: 'museum',
      price: '$29 pp',
      duration: '1.5 to 2 hours',
      blurb:
        'Nevada tested over 900 nuclear devices an hour north of here, and for a while the mushroom clouds were a tourist draw that hotels advertised. Straighter and stranger than that makes it sound.',
      facts: [
        'Smithsonian affiliate, on Flamingo Road',
        'Quiet on weekday mornings',
        'Ninety minutes covers it comfortably',
      ],
      photo: '/vegas/img/atomic.jpg',
      photoAlt: 'A nuclear test mushroom cloud rising over the desert',
      link: 'https://www.atomicmuseum.vegas/',
      credit: {
        subject: 'Nuclear test, Nevada',
        author: 'National Museum of the U.S. Navy',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:330-PS-3256_(A_6320AC)_(17185012927).jpg',
      },
    },
    {
      id: 'pinball',
      name: 'Pinball Hall of Fame',
      category: 'museum',
      price: 'Free in, coins per game',
      duration: '45 minutes to 3 hours',
      blurb:
        'A warehouse of several hundred playable machines from the fifties onward. Free to walk into, a quarter or two a game, which makes it both the cheapest hour in the city and the hardest to leave.',
      facts: [
        'Change machines queue, so singles help',
        'On Las Vegas Boulevard south, near the welcome sign',
        'Nonprofit, proceeds go to charity',
      ],
      photo: '/vegas/img/pinball.jpg',
      photoAlt: 'The illuminated backglass artwork of a vintage pinball machine',
      link: 'https://pinballmuseum.org/',
      credit: {
        subject: 'Pinball backglass',
        author: 'Polylerus',
        licence: 'CC0',
        url: 'https://commons.wikimedia.org/wiki/File:Striker_pinball_backglass_-Glen_Burnie_MD.jpg',
      },
    },
    {
      id: 'mob',
      name: 'The Mob Museum',
      category: 'museum',
      price: '$34–60 pp',
      duration: '2 to 3 hours',
      blurb:
        'Set in the old federal courthouse where the Kefauver hearings actually sat, which does more work than any exhibit in it. There is a working speakeasy in the basement.',
      facts: [
        'Downtown, walkable from Fremont Street',
        'Speakeasy is a separate add-on ticket',
        'Most people spend longer here than they planned',
      ],
      photo: '/vegas/img/mob.jpg',
      photoAlt: 'A display of confiscated weapons in a case at the Mob Museum',
      link: 'https://themobmuseum.org/',
      credit: {
        subject: 'The Mob Museum',
        author: 'Alberto-g-rovi',
        licence: 'CC BY 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:The_Mob_Museum_-2022_(14).jpg',
      },
    },
    {
      id: 'omega',
      name: 'Omega Mart at Area15',
      category: 'museum',
      price: '$59 pp',
      duration: '2 to 3 hours',
      blurb:
        "Meow Wolf's fake supermarket, where the shelves open into something much larger behind them. The oddest thing in the city by a distance, and the one people tend to keep talking about.",
      facts: ['Area15 itself is free to enter', 'Timed entry', 'Two miles west of the Strip'],
      photo: '/vegas/img/omega.jpg',
      photoAlt: 'The brightly lit surreal interior of the Omega Mart installation',
      link: 'https://meowwolf.com/visit/las-vegas',
      credit: {
        subject: 'Omega Mart',
        author: 'Yelderberry',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Omega_Mart_2026-05-14_1.jpg',
      },
    },
    {
      id: 'valleyfire',
      name: 'Valley of Fire',
      category: 'out',
      price: '$15 per car',
      duration: 'Half a day',
      blurb:
        'An hour northeast. Red Aztec sandstone, petroglyphs, and short marked walks rather than hikes, most of them under a mile.',
      facts: [
        'White Domes and Fire Wave are the two most people do',
        'No food inside the park',
        'December highs around 15°C, which is the right month for it',
      ],
      photo: '/vegas/img/valleyfire.jpg',
      photoAlt: 'Red sandstone formations in Valley of Fire State Park',
      link: 'https://parks.nv.gov/parks/valley-of-fire',
      credit: {
        subject: 'Valley of Fire',
        author: 'Clément Bardot',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Valley_of_fire_State_Park.jpg',
      },
    },
    {
      id: 'redrock',
      name: 'Red Rock Canyon',
      category: 'out',
      price: '$20 per car',
      duration: '2 to 3 hours',
      blurb:
        'Twenty minutes west, and a thirteen-mile scenic loop that works almost entirely from the car with a few short stops. The half-day version of a desert day.',
      facts: [
        'Timed entry reservation required October to May',
        'Cliffs face west, so the afternoon light is better',
        'The loop is one-way',
      ],
      photo: '/vegas/img/redrock.jpg',
      photoAlt: 'Layered red and cream cliffs at Red Rock Canyon',
      link: 'https://www.redrockcanyonlv.org/',
      credit: {
        subject: 'Red Rock Canyon',
        author: 'Hermann Luyken',
        licence: 'CC0',
        url: 'https://commons.wikimedia.org/wiki/File:2012.09.09.102454_Scenic_drive_Red_Rock_Canyon_Nevada.jpg',
      },
    },
    {
      id: 'hoover',
      name: 'Hoover Dam',
      category: 'out',
      price: '$10–30 pp',
      duration: 'Half a day',
      blurb:
        'Forty minutes out, and on the road back from the Boulder City drop zone, so it bolts onto a skydive morning for almost nothing. The dam tour goes inside; the powerplant tour is the shorter one.',
      facts: [
        'Parking garage $10',
        'Dam tour is walk-up only, no advance booking',
        'The bridge walkway has the view, and it is free',
      ],
      photo: '/vegas/img/hoover.jpg',
      photoAlt: 'Hoover Dam and Black Canyon seen from above',
      link: 'https://www.usbr.gov/lc/hooverdam/',
      credit: {
        subject: 'Hoover Dam',
        author: 'Christian David',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Hoover_Dam_and_Black_Canyon_seen_from_the_Mike_O%27Callaghan%E2%80%93Pat_Tillman_Memorial_Bridge,_panorama,_Arizona%E2%80%93Nevada.jpg',
      },
    },
    {
      id: 'deathvalley',
      name: 'Death Valley',
      category: 'out',
      price: '$30 per car',
      duration: 'Full day',
      blurb:
        'Two hours each way, so it takes a whole day rather than part of one. December is the right month for it and July is emphatically not.',
      facts: [
        "Badwater, Zabriskie Point and Dante's View make one loop",
        'Last cheap fuel is in Nevada',
        'December daylight is short',
      ],
      photo: '/vegas/img/deathvalley.jpg',
      photoAlt: 'Salt flats at Badwater Basin in Death Valley',
      link: 'https://www.nps.gov/deva/',
      credit: {
        subject: 'Badwater Basin, Death Valley',
        author: 'Christian David',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Salt_pool_at_Badwater_Basin,_Death_Valley_National_Park,_California.jpg',
      },
    },
    {
      id: 'conservatory',
      name: 'Bellagio Conservatory',
      category: 'free',
      price: 'Free',
      duration: '30 minutes',
      blurb:
        'Rebuilt five times a year by a team of about a hundred, so which display is up depends on when we go. Quietest before ten in the morning or after eleven at night.',
      facts: [
        'Open 24 hours',
        'Winter display runs to early January',
        'The fountains are outside the door, also free',
      ],
      photo: '/vegas/img/conservatory.jpg',
      photoAlt: 'A decorated Christmas tree in the Bellagio Conservatory',
      link: 'https://www.bellagio.com/en/entertainment/conservatory-botanical-garden.html',
      credit: {
        subject: 'Bellagio Conservatory',
        author: 'Jim G from Silicon Valley, CA, USA',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Botanical_Gardens,_Bellagio_Hotel_and_Casino,_Las_Vegas,_Nevada,_USA_(27169648603).jpg',
      },
    },
    {
      id: 'fremont',
      name: 'Fremont Street',
      category: 'free',
      price: 'Free',
      duration: '2 hours',
      blurb:
        'Downtown, under a screen five blocks long. Older, cheaper and stranger than the Strip, and the part of town that still looks like the postcards.',
      facts: [
        'Zip line and bands nightly',
        'Ten minutes by car from the middle Strip',
        'Two blocks from the Mob Museum',
      ],
      photo: '/vegas/img/fremont.jpg',
      photoAlt: 'The Fremont Street Experience canopy lit up over the crowd',
      link: 'https://vegasexperience.com/',
      credit: {
        subject: 'Fremont Street',
        author: 'Jean-Christophe BENOIST',
        licence: 'CC BY 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:LasVegas-FremontStreet.jpg',
      },
    },
  ],
  'palm-springs': [
    {
      id: 'tram',
      name: 'Palm Springs Aerial Tramway',
      category: 'air',
      price: '$36.95 pp',
      duration: 'Half a day, longer if we walk at the top',
      blurb:
        'Ten minutes from 2,643 ft to 8,516 ft, up Chino Canyon. The floor of the car rotates twice on the way, so nobody has to fight for a window. At the top there is pine forest, fifty miles of trail, and often snow from winter into spring.',
      facts: [
        'First car up 10:00 on weekdays, 08:00 at weekends',
        'Last car up 20:00, last down 21:30',
        'Roughly 20°C colder at the top than the valley floor',
        'Parking is free and fills from mid morning',
      ],
      photo: '/palm-springs/img/tram.jpg',
      photoAlt: 'Two aerial tram cars passing each other on the cables above a rocky desert canyon',
      link: 'https://pstramway.com/',
      credit: {
        subject: 'Palm Springs Aerial Tramway',
        author: 'Don Graham',
        licence: 'CC BY-SA 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:We%27ve_got_to_stop_meeting_like_this,_Palm_Springs_Aerial_Tramway,_CA_2015_(26151516883).jpg',
      },
    },
    {
      id: 'balloon',
      name: 'A balloon at sunrise',
      category: 'air',
      price: '$275–325 pp',
      duration: '3–4 hours door to door, 45–60 minutes in the air',
      blurb:
        'They fly at first light because that is the only part of the day the valley air is still. The season runs November to April or May.',
      facts: [
        'Pickup around 05:00, airborne near sunrise',
        'Wind cancels flights, and spring is the windy season',
        'Champagne on landing is part of the standard package',
        'Several operators fly the valley, and prices are close',
      ],
      photo: '/palm-springs/img/balloon.jpg',
      photoAlt: 'A striped hot air balloon low over desert scrub and a Joshua tree',
      link: 'https://www.palmspringsballoons.com/',
      credit: {
        subject: 'Balloon over the desert',
        author: 'Rennett Stowe',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Balloon_and_Joshua_Tree_(2407296947).jpg',
      },
    },
    {
      id: 'warbird',
      name: 'Twenty minutes in a warbird',
      category: 'air',
      price: '$195–4,995 pp, museum entry $24',
      duration: '20 minutes flying, half a day with the museum',
      blurb:
        'The Air Museum keeps most of its collection flying rather than roped off, and sells seats. The bottom of the range is a WWII transport, the top is a T-33 jet. The hangars on their own are worth the entry.',
      facts: [
        'Ride certificates are bought at the museum shop and booked separately',
        'Weather and maintenance move flight dates, so it is not a fixed slot',
        'Museum entry $24 adults, under 12 free',
        'Aircraft available varies by day',
      ],
      photo: '/palm-springs/img/airmuseum.jpg',
      photoAlt:
        'The polished aluminium nose and gun turret of a Second World War bomber inside a hangar',
      link: 'https://palmspringsairmuseum.org/',
      credit: {
        subject: 'Palm Springs Air Museum',
        author: 'David Ensor',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Palm_Springs_Air_Museum_(50087464021).jpg',
      },
    },
    {
      id: 'joshua',
      name: 'Joshua Tree National Park',
      category: 'desert',
      price: '$30 per car, valid 7 days',
      duration: 'A full day, or a long evening',
      blurb:
        'An hour from the house, and the one thing out here that everybody agrees on. Two deserts meet inside the park, which is why the Joshua trees stop halfway across it. No timed entry, so the day can start whenever it starts.',
      facts: [
        'West entrance is closest, roughly an hour from Palm Springs',
        'One pass covers everyone in the car for a week',
        'No food or fuel inside the park, and patchy phone signal',
        'Spring and autumn highs are pleasant, but there is no shade anywhere',
      ],
      photo: '/palm-springs/img/joshua.jpg',
      photoAlt: 'Joshua trees and piled granite boulders under a wide blue desert sky',
      link: 'https://www.nps.gov/jotr/',
      credit: {
        subject: 'Joshua Tree National Park',
        author: 'Tuxyso',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Joshua_Tree_National_Park_2013.jpg',
      },
    },
    {
      id: 'indiancanyons',
      name: 'Indian Canyons',
      category: 'desert',
      price: '$12 adults, $7 seniors and students',
      duration: '2 hours to most of a day',
      blurb:
        'Palm Canyon holds the largest California fan palm oasis in the world, and it starts fifteen minutes from downtown. Andreas Canyon is an easy mile loop; Murray is four miles and about 600 ft of climb.',
      facts: [
        'Agua Caliente land, so it is a separate ticket from the national park',
        'Tahquitz Canyon is a separate $12.50 gate, with a 60 ft seasonal waterfall',
        'Open 07:30 to 17:00, last hiker on the trail at 15:30',
        'Shade in the oases, none at all on the ridges',
      ],
      photo: '/palm-springs/img/palmcanyon.jpg',
      photoAlt: 'A dense grove of fan palms filling the floor of a rocky desert canyon',
      link: 'https://www.indian-canyons.com/',
      credit: {
        subject: 'Palm Canyon',
        author: 'Jerrye and Roy Klotz MD',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:PALM_CANYON_NEAR_PALM_SPRINGS_IN_RIVERSIDE_COUNTY,_CALIFORNIA.jpg',
      },
    },
    {
      id: 'fault',
      name: 'The San Andreas Fault by jeep',
      category: 'desert',
      price: 'About $150 pp shared, $1,200 per 7-seat jeep',
      duration: '3–4 hours',
      blurb:
        'The fault runs along the north side of the valley, and the tour goes into a private preserve on top of it. The interesting part is the palm oases: the fault crushes rock finely enough to push groundwater to the surface in a place with no water.',
      facts: [
        'Open-sided jeeps, hotel pickup included',
        'Short easy walks rather than a hike',
        'A private jeep works out cheaper than shared seats for a group of seven',
        'The Coachella Valley Preserve at Thousand Palms is the free version',
      ],
      photo: '/palm-springs/img/preserve.jpg',
      photoAlt:
        'Eroded sandstone ridges in the Coachella Valley Preserve with a snow-capped peak behind',
      link: 'https://www.red-jeep.com/san-andreas-fault/',
      credit: {
        subject: 'Coachella Valley Preserve',
        author: 'blmcalifornia',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Coachella_Valley_Preserve_System_(26389614434).jpg',
      },
    },
    {
      id: 'saltonsea',
      name: 'The Salton Sea',
      category: 'desert',
      price: 'Free, about $30 of fuel',
      duration: 'Most of a day with stops',
      blurb:
        'An accident from 1905 that never drained, now saltier than the Pacific and shrinking. Bombay Beach is a few hundred people living on the shoreline of it, and has turned itself into an outdoor art site. Not a swimming lake.',
      facts: [
        'Bombay Beach is about 90 minutes from Palm Springs',
        'The smell is real on still days and depends on the wind',
        'Almost nothing is open, so food and water travel with us',
        'Sunset over the water is the reason to time it late',
      ],
      photo: '/palm-springs/img/bombay.jpg',
      photoAlt: 'The Salton Sea at sunset, still water under an orange and grey sky',
      credit: {
        subject: 'Bombay Beach at sunset',
        author: 'Matthew Dillon',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Bombay_Beach_at_Sunset_-_Flickr_-_RuggyBearLA.jpg',
      },
    },
    {
      id: 'salvation',
      name: 'Salvation Mountain',
      category: 'desert',
      price: 'Free',
      duration: 'An hour there, two hours each way',
      blurb:
        'Leonard Knight spent about thirty years painting a hill outside Niland with adobe, straw and half a million litres of donated paint. He finished around 2011 and died in 2014. Slab City, an off-grid settlement on an abandoned marine base, is just past it.',
      facts: [
        'Open dawn to dusk, every day, no gate and no fee',
        'Roughly two hours from Palm Springs, past the south end of the Salton Sea',
        'Volunteers maintain it and donated paint is the usual gift',
        'Pairs naturally with Bombay Beach on the same loop',
      ],
      photo: '/palm-springs/img/salvation.jpg',
      photoAlt:
        'A painted adobe hillside covered in bright stripes, flowers and lettering under a blue sky',
      credit: {
        subject: 'Salvation Mountain',
        author: 'Aculp',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Salvation_Mountain,_Niland,_CA.jpg',
      },
    },
    {
      id: 'livingdesert',
      name: 'The Living Desert',
      category: 'desert',
      price: 'About $35 pp',
      duration: 'Half a day',
      blurb:
        'Half zoo and half botanical garden, in Palm Desert, and the animals are the ones that actually live in deserts. It shortens its hours once the heat arrives, so outside summer is the time for it.',
      facts: [
        'Mornings are when the animals are awake and moving',
        'Roughly 20 minutes from Palm Springs',
        'Summer hours are shorter',
        'Mostly outdoors and mostly flat',
      ],
      photo: '/palm-springs/img/livingdesert.jpg',
      photoAlt: 'Cholla cactus and yellow brittlebush flowering in a desert garden',
      link: 'https://www.livingdesert.org/',
      credit: {
        subject: 'The Living Desert',
        author: 'inkknife_2000',
        licence: 'CC BY-SA 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Cactus_Garden,_Living_Desert_3-15h_(16137041433).jpg',
      },
    },
    {
      id: 'sunnylands',
      name: 'Sunnylands',
      category: 'modern',
      price: 'Gardens free, house tour $55 pp',
      duration: '90 minutes for the house, as long as we like in the gardens',
      blurb:
        'The Annenberg estate in Rancho Mirage, where eight presidents were entertained and a fair amount of foreign policy got discussed by a pool. The nine-acre garden and the visitor centre cost nothing and need no booking. The house is the part that sells out.',
      facts: [
        'House tickets go on sale at 09:00 Pacific on the 15th of the preceding month',
        'They sell out in minutes, so it is a diary entry rather than a decision',
        'Gardens and parking are free and open without a ticket',
        'Closed through the summer',
      ],
      photo: '/palm-springs/img/sunnylands.jpg',
      photoAlt: 'The low pink roof and glass walls of the Sunnylands house behind desert planting',
      link: 'https://sunnylands.org/',
      credit: {
        subject: 'Sunnylands',
        author: 'Emily Gadek',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Sunnylands_historic_house.jpg',
      },
    },
    {
      id: 'architecture',
      name: 'The midcentury houses',
      category: 'modern',
      price: 'Free self-guided, $25 extra for the Frey House',
      duration: 'An afternoon',
      blurb:
        'Six architects built most of what the town is known for between about 1945 and 1970. Nearly all of it is private and lived in, so this is a drive and a look over walls rather than a visit. The visitor centre is itself a 1965 Albert Frey petrol station.',
      facts: [
        'Kaufmann House, Frey House II and Sinatra Twin Palms are the usual loop',
        'The Frey House needs 48 hours notice and a booked slot',
        'Modernism Week runs in February, so it misses us',
        'The free self-guided map covers most of it',
      ],
      photo: '/palm-springs/img/kaufmann.jpg',
      photoAlt:
        'A low flat-roofed desert house behind a gate, with boulders and cactus in the front garden',
      link: 'https://visitpalmsprings.com/mid-century-architecture-self-guided-tour/',
      credit: {
        subject: 'A Palm Springs desert house',
        author: 'Carol M. Highsmith',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:The_Kaufmann_House,_Palm_Springs,_California_LCCN2013631255.tif',
      },
    },
    {
      id: 'moorten',
      name: 'Moorten Botanical Garden',
      category: 'modern',
      price: 'About $5 pp',
      duration: 'An hour',
      blurb:
        'A family cactus garden on South Palm Canyon since 1938, on one acre, with a greenhouse they call the Cactarium. Small, cheap, and about a hundred years older in feel than everything around it.',
      facts: [
        'Roughly an acre, so an hour covers it properly',
        'Closed Wednesdays, and shuts by mid afternoon',
        'Cash and card, but no advance booking',
        'Ten minutes from downtown',
      ],
      photo: '/palm-springs/img/moorten.jpg',
      photoAlt: 'Tall columnar cacti and desert shrubs crowded along a narrow sandy garden path',
      credit: {
        subject: 'Moorten Botanical Garden',
        author: 'YuriVict',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Moorten_Botanical_Garden_and_Cactarium.jpg',
      },
    },
    {
      id: 'integratron',
      name: 'The Integratron sound bath',
      category: 'odd',
      price: 'About $63 pp',
      duration: '60 minutes, plus an hour each way',
      blurb:
        'A domed wooden building in Landers, put up by a man who said the design came from Venusians and was meant to reverse ageing. It does neither, but the acoustics are genuinely unusual: everyone lies on a mat while someone plays twenty-two quartz bowls.',
      facts: [
        'Public sessions sell out weeks to months ahead',
        'Built without a single nail, which is the reason it sounds like that',
        'About an hour and a quarter from Palm Springs, past Joshua Tree',
        'There is a standby list when sessions are full',
      ],
      photo: '/palm-springs/img/integratron.jpg',
      photoAlt: 'A white domed wooden building standing alone on flat open desert',
      link: 'https://www.integratron.com/',
      credit: {
        subject: 'The Integratron',
        author: 'Jessie Eastland',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Integratron-2.jpg',
      },
    },
    {
      id: 'pioneertown',
      name: "Pioneertown and Pappy & Harriet's",
      category: 'odd',
      price: 'Free to wander, dinner about $30 pp',
      duration: 'An evening',
      blurb:
        'A film set built in 1946 as a working western town, which people then moved into and never left. Mane Street is still there. Pappy & Harriet’s at the end of it is a barbecue place that books bands well above its size.',
      facts: [
        'About an hour from Palm Springs, up into the high desert',
        'No reservations in the restaurant, first come first served',
        'Gig tickets are separate and sell independently of the food',
        'Last dinner seating around 21:30',
      ],
      photo: '/palm-springs/img/pioneertown.jpg',
      photoAlt: 'A wooden false-fronted saloon and bath house on a dirt street in Pioneertown',
      link: 'https://pappyandharriets.com/',
      credit: {
        subject: 'Pioneertown',
        author: 'Matthew Field',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Pioneertown_california_saloon_and_bath_house.jpg',
      },
    },
    {
      id: 'cabazon',
      name: 'The Cabazon dinosaurs',
      category: 'odd',
      price: 'Free to look at, small charge to go inside',
      duration: '30 minutes',
      blurb:
        'A 45 ft brontosaurus and a 65 ft tyrannosaurus beside the I-10, built by a man who ran the diner next door and wanted people to stop. They did. Twenty minutes from town, and right next to the outlet mall if anyone wants that too.',
      facts: [
        'Visible from the motorway, and the car park costs nothing',
        'Dinny the brontosaurus has a gift shop inside him',
        'Desert Hills outlets are in the same junction',
        'Twenty minutes west of Palm Springs',
      ],
      photo: '/palm-springs/img/cabazon.jpg',
      photoAlt: 'A huge green concrete brontosaurus standing beside a desert road',
      credit: {
        subject: 'Cabazon Dinosaurs',
        author: 'Jllm06',
        licence: 'CC0',
        url: 'https://commons.wikimedia.org/wiki/File:Cabazon-Dinosaurs-2.jpg',
      },
    },
    {
      id: 'windmills',
      name: 'The San Gorgonio Pass wind farm',
      category: 'free',
      price: 'Free to drive through, tours about $50 pp',
      duration: '30 minutes on the way past',
      blurb:
        'Several thousand turbines standing in the gap between two 10,000 ft mountains, which is what makes the pass windy enough to be worth it. In spring the ground between them is often yellow with brittlebush.',
      facts: [
        'Right beside the I-10 on the way in from the airport or Los Angeles',
        'Indian Canyon Drive and 20th Avenue get closest for free',
        'Guided driving tours run from Palm Springs if anyone wants the detail',
        'Windiest in the afternoon, which is also when it looks best',
      ],
      photo: '/palm-springs/img/windmills.jpg',
      photoAlt:
        'Rows of white wind turbines across desert scrub with a snow-capped mountain behind',
      credit: {
        subject: 'San Gorgonio Pass wind farm',
        author: 'Spiglanin',
        licence: 'CC BY 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:San_Gorgonio_Pass_wind_farm_March_2023.jpg',
      },
    },
    {
      id: 'villagefest',
      name: 'VillageFest',
      category: 'free',
      price: 'Free',
      duration: 'An evening',
      blurb:
        'Palm Canyon Drive closes to traffic every Thursday evening and fills with stalls, food and buskers. It is the one reliable evening where the town is out on the street.',
      facts: [
        'Thursday evenings, on the main street downtown',
        'Nothing to book and nothing to pay',
        'Parking downtown gets difficult once it starts',
        'Hours shift with the season, so worth checking the week of',
      ],
      photo: '/palm-springs/img/downtown.jpg',
      photoAlt: 'Palm Canyon Drive in downtown Palm Springs, lined with palms and low shopfronts',
      link: 'https://www.villagefest.org/',
      credit: {
        subject: 'Palm Canyon Drive',
        author: 'R. Haupt',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Palm_Springs_Palm_Canyon_Dr.jpeg',
      },
    },
  ],
  philly: [
    {
      id: 'bartrams',
      name: "Bartram's Garden",
      category: 'out',
      price: 'Free',
      duration: 'A couple of hours',
      blurb:
        'Fifty acres on the Schuylkill at the bottom of West Philly, laid out by John Bartram from 1728, which makes it the oldest surviving botanic garden in the country. Free, almost empty in December, and a twenty minute walk or a short ride from the house.',
      facts: [
        'Grounds are free and open daily, dawn to dusk',
        'House tours are seasonal and limited, so worth checking before going',
        'On the river, so it is colder and windier than the street',
        'Bare in December, which makes the river and the skyline easier to see',
      ],
      photo: '/philly/img/bartrams.jpg',
      photoAlt:
        'The stone front of John Bartram’s 18th century house behind a path lined with flower beds',
      link: 'https://bartramsgarden.org/',
      credit: {
        subject: "Bartram's Garden",
        author: 'Muran.Fox',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Front_of_John_Bartram%27s_historic_stone_house_and_garden_in_Philadelphia,_PA.jpg',
      },
    },
    {
      id: 'magic-gardens',
      name: "Philadelphia's Magic Gardens",
      category: 'out',
      price: '$15 adults, $12 students',
      duration: 'An hour',
      blurb:
        'Isaiah Zagar spent fourteen years covering half a block of South Street in mosaic made of bottles, bicycle wheels, mirror and broken tile. Half of it is outdoors, so December is cold, but winter light on all that glass is the better version.',
      facts: [
        'Closed Tuesdays, otherwise 11:00 to 18:00',
        'Tickets regularly sell out, so book online rather than turning up',
        'Largely outdoors and unheated',
        'Zagar murals carry on for several blocks around, for free',
      ],
      photo: '/philly/img/magicgardens.jpg',
      photoAlt: 'A wall covered in mosaic made from bottles, mirrors, tiles and a bicycle wheel',
      link: 'https://www.phillymagicgardens.org/',
      credit: {
        subject: "Philadelphia's Magic Gardens",
        author: 'Cassiopeia321',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Magic_Garden_in_Philadelphia.jpg',
      },
    },
  ],
  january: [
    {
      id: 'silver-bank',
      name: 'Humpbacks at the Silver Bank',
      category: 'shortlist',
      price: '$4,495–4,895 each, plus about $950 in fees',
      duration: 'A week on a boat, 16 to 23 January',
      blurb:
        'The humpbacks come to a sanctuary north of the Dominican Republic to calve, and this is one of the only places anyone can get in the water with them. Scuba is banned there, so every encounter is on snorkel, which puts both of us on the same footing, and it is the obvious next thing after the mantas. Five days on the bank in small tenders.',
      facts: [
        'Aquatic Adventures’ 16 to 23 January is the only January departure still listed',
        'Conscious Breath’s January trips are already sold out',
        'First week of the season, so fewer whales than in February',
        'Leaves from Puerto Plata; fees are paid in cash',
      ],
      photo: '/january/img/humpbackcalf.jpg',
      photoAlt: 'A humpback whale calf swimming beside its mother just under the surface',
      link: 'https://www.aquaticadventures.com/schedule-rates/category/2027',
      credit: {
        subject: 'Humpback whale and calf',
        author: 'National Marine Sanctuaries',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:HIHWNMS_-_humpback_and_calf_(28206860216).jpg',
      },
    },
    {
      id: 'bonaire',
      name: 'Bonaire',
      category: 'shortlist',
      price: 'Diver nature fee about $40 each',
      duration: 'A week, or two',
      blurb:
        'Dry season: 25 to 29°C in the air, 26 to 28°C in the water, and the clearest of the year. The diving is from the shore, off the back of a truck, as much as anyone wants. The best place on the list for Jabari to get certified, then dive the rest of the trip together.',
      facts: [
        'No single January event; it is here for being reliably good',
        'Dutch law: marriage equality since 2012',
        'Jabari flies with one stop from Philadelphia; Os via Panama and Curaçao',
      ],
      photo: '/january/img/bonaire.jpg',
      photoAlt: 'A diver swimming over coral past an old anchor on a Bonaire reef',
      link: 'https://bonaire.com/en/blog/bonaire-dry-season-january-february-perfect-weather/',
      credit: {
        subject: 'Shore diving, Bonaire',
        author: 'Kris Mikael Krister',
        licence: 'CC BY 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Shore_Diving_Bonaire_(223112289).jpeg',
      },
    },
    {
      id: 'baja',
      name: 'Baja California Sur',
      category: 'shortlist',
      price: 'Whale shark snorkel $80–165 each',
      duration: 'A week',
      blurb:
        'Mid-January is when the gray whales arrive in the Magdalena Bay lagoons, and the friendly ones come up to the boats close enough to touch. Whale sharks off La Paz, sea lions at Espíritu Santo, and clear desert skies early in the window.',
      facts: [
        'Magdalena Bay trips start around 15 January, 2.5 hours from La Paz',
        'Water is at its coldest, 21 to 22°C',
        'Winter wind cancels some boats',
        'Moderate cost; marriage equality nationwide',
      ],
      photo: '/january/img/baja.jpg',
      photoAlt: 'A whale shark swimming through green-blue water off La Paz',
      link: 'https://www.seakayakadventures.com/blog/guide-to-magdalena-bay-gray-whale-season',
      credit: {
        subject: 'Whale shark off La Paz',
        author: 'Diego Delso',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Tibur%C3%B3n_ballena_(Rhincodon_typus),_La_Paz,_Baja_California,_M%C3%A9xico,_2024-12-20,_DD_01.jpg',
      },
    },
  ],
  kona: [
    {
      id: 'manta',
      name: 'The manta night dive',
      category: 'water',
      price: '$220 diving · $165 snorkelling',
      duration: 'About 5 hours, from late afternoon',
      blurb:
        'The most reliable manta encounter anywhere. Divers kneel on sand at about 10 m with lights pointed up, snorkellers float above holding a lit board, and the mantas come in for the plankton the light pulls in, barrel-rolling inches away. Manta Ray Dives of Hawaii puts a diver and a snorkeller on the same boat in one booking. Kona Diving Company does the same for $230 and $160, with 10% off if a morning trip is booked too.',
      facts: [
        'Honokōhau Harbor, about 4 mi away, no pickup',
        'Start time follows sunset and arrives by email',
        'Full refund up to 48 hours before',
        'Back around 21:00, so the ride home is worth booking ahead',
      ],
      photo: '/kona/img/manta.jpg',
      photoAlt: 'A manta ray gliding over a sandy reef floor beside a scuba diver',
      link: 'https://www.mantaraydiveshawaii.com/manta-ray-snorkel-and-dive',
      credit: {
        subject: 'Manta ray off Kona',
        author: 'Steve Dunleavy',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Female_scuba_diver_swims_with_a_young_male_Manta_ray_-_Kona_district,_Hawaii.jpg',
      },
    },
    {
      id: 'discover-scuba',
      name: 'Jabari’s first dive',
      category: 'water',
      price: '$329–350',
      duration: 'A morning, about 8:00 to 13:00',
      blurb:
        'Discover Scuba: no certification, a briefing on the boat, then two reef dives with an instructor alongside. Kona Diving Company publishes its limit, 40 ft, and is the same shop as its manta trip. Big Island Divers runs it for $329 on its regular morning boat. Either way Os can dive the same boat as an ordinary diver.',
      facts: [
        'PADI medical form first; any yes needs a doctor’s sign-off',
        'Ages 10 and up',
        'Back by about 13:00, a full day before Mauna Kea',
        'Does not qualify for the manta dive, which needs certification',
      ],
      photo: '/kona/img/scuba.jpg',
      photoAlt: 'A scuba diver swimming over a wide coral reef in clear blue Hawaiian water',
      link: 'https://konadivingcompany.com/courses/discover-scuba-introductory-dive/',
      credit: {
        subject: 'Diver over a Hawaiian reef',
        author: 'National Marine Sanctuaries',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:HIHWNMS_-_Shannon_Lyday_Photographing_(27878885162).jpg',
      },
    },
    {
      id: 'kahaluu',
      name: 'Kahalu‘u',
      category: 'water',
      price: 'Free',
      duration: 'An hour or two',
      blurb:
        'The gentle one. A shallow bay behind an old breakwater, about 5 mi south on the trolley, where turtles graze in water shallow enough to stand in. The easiest shore snorkel on the coast.',
      facts: [
        'Gates 7:00 to 19:00, lifeguards 9:30 to 16:30',
        'Calmest early, busiest late morning',
        'Turtles are protected: about 3 m back',
        'Reef-safe sunscreen only',
      ],
      photo: '/kona/img/kahaluu.jpg',
      photoAlt: 'Two snorkellers swimming above a green sea turtle over coral in Kahalu‘u Bay',
      credit: {
        subject: 'Snorkellers with a sea turtle, Kahalu‘u Bay',
        author: 'Vlad & Marina Butsky',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Snorkelers_with_sea_turtle_(Kahaluu_Bay).jpg',
      },
    },
    {
      id: 'downtown',
      name: 'Aliʻi Drive and the old town',
      category: 'town',
      price: 'Free',
      duration: 'A morning, or an evening',
      blurb:
        'About a mile of seawall from the pier to the Royal Kona, with the old town along it. Mokuʻaikaua, from 1837 and the first Christian church in Hawaiʻi, sits opposite the palace. The farmers market is at the Hualālai Road end, and the Kaʻū Coffee Mill café does free tastings for anyone without a car to reach the farms.',
      facts: [
        'Farmers market reportedly Wednesday to Sunday, 7:00 to 16:00',
        'The church is free to walk into',
        'The trolley runs hourly along the drive, 6:00 to 21:00',
      ],
      photo: '/kona/img/mokuaikaua.jpg',
      photoAlt:
        'Kailua-Kona from the air at sunset, the white church steeple beside the curve of the bay',
      credit: {
        subject: 'Kailua-Kona and Mokuʻaikaua Church',
        author: 'Johnkolander',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Mokuaikaua_Church_under_Pele%27s_sky.jpg',
      },
    },
    {
      id: 'hulihee',
      name: 'Huliheʻe Palace',
      category: 'town',
      price: '$16, or $20 guided',
      duration: 'An hour',
      blurb:
        'The royal summer house on the bay, built in 1838 and kept by the Daughters of Hawaiʻi. Small, and the lawn on the water side is the best seat on Aliʻi Drive.',
      facts: [
        'Wednesday to Saturday, 10:00 to 15:00',
        'Closed Sunday to Tuesday, so Wednesday, Friday or Saturday',
        'Guided tour at 11:30',
      ],
      photo: '/kona/img/hulihee.jpg',
      photoAlt: 'The two-storey veranda of Huliheʻe Palace behind a lawn and palms',
      link: 'https://daughtersofhawaii.org/hulihee-palace/',
      credit: {
        subject: 'Huliheʻe Palace',
        author: 'Calbear22',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Backside_of_the_Hulihee_Palace.JPG',
      },
    },
    {
      id: 'kamakahonu',
      name: 'Kamakahonu and the pier',
      category: 'town',
      price: 'Free',
      duration: 'Half an hour, or a swim',
      blurb:
        'Where Kamehameha I spent his last years. The thatched Ahuʻena Heiau is rebuilt on the point, and beside it is the only calm little beach in town, sheltered by the pier.',
      facts: [
        'The heiau is seen from outside, not entered',
        'The beach is small and fills at weekends',
        'Right at the bottom of the hill',
      ],
      photo: '/kona/img/pier.jpg',
      photoAlt: 'The thatched Ahuʻena Heiau on a stone platform in the water beside Kailua Pier',
      credit: {
        subject: 'Kamakahonu and Ahuʻena Heiau',
        author: 'Eric Marshall',
        licence: 'CC BY 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Kamakahonu_Kailua_Pier_-_panoramio.jpg',
      },
    },
    {
      id: 'sunset',
      name: 'Sunset from the seawall',
      category: 'town',
      price: 'Free, beer extra',
      duration: 'Around 17:40 in December',
      blurb:
        'The whole town faces west, so every evening ends the same way. Kona Brewing is at the bottom of the hill for after, and does a tour with four tasters.',
      facts: [
        'Kona Brewing: Sunday to Thursday 11:00 to 20:00, to 21:00 on Friday and Saturday',
        'Brewery tour $25, by appointment, 12:00 to 17:00',
        'A lūʻau at the King Kamehameha runs about $190 each, and the seawall is free',
      ],
      photo: '/kona/img/sunset.jpg',
      photoAlt: 'The sun setting into a flat sea off Kailua-Kona under a band of cloud',
      link: 'https://konabrewinghawaii.com/locations/kona-pub',
      credit: {
        subject: 'Sunset off Kailua-Kona',
        author: 'Maplemoths',
        licence: 'CC BY 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Kailua_Kona_Sunset.jpg',
      },
    },
    {
      id: 'shave-ice',
      name: 'Shave ice and poke',
      category: 'town',
      price: 'Roughly $6–20',
      duration: 'Whenever',
      blurb:
        'The two cheap things to eat here. Shave ice is snow-fine and soaked in syrup, nothing like a snow cone. Poke is raw fish from that morning, sold by the pound in supermarkets as much as in restaurants, which is where the good value is.',
      facts: [
        'Supermarket poke counters are the cheap version',
        'Shave ice with ice cream underneath is the local order',
        'Prices here are rough, not checked',
      ],
      photo: '/kona/img/shaveice.jpg',
      photoAlt: 'A shave ice stand with a row of bright syrup bottles on the counter',
      credit: {
        subject: 'Shave ice stand',
        author: 'Kim',
        licence: 'CC BY-SA 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Fumi%27s_Shave_Ice_(3848642715).jpg',
      },
    },
    {
      id: 'magic-sands',
      name: 'Magic Sands',
      category: 'town',
      price: 'Free',
      duration: 'An afternoon',
      blurb:
        'Laʻaloa, about 4 mi south on the trolley. Named because the sand comes and goes: winter surf often strips it to rock, then it comes back. Worth a look before a swim.',
      facts: [
        'Open 7:00 to 20:00',
        'December surf can take the sand and bring a strong shore break',
        'Bodyboarding when the sand is in',
      ],
      photo: '/kona/img/magicsands.jpg',
      photoAlt: 'Waves washing onto a small sand beach framed by black lava rock and palms',
      credit: {
        subject: 'Laʻaloa Bay Beach Park',
        author: 'W Nowicki',
        licence: 'CC BY 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:La%27aloa_Bay_Beach_Park.jpg',
      },
    },
    {
      id: 'kaloko',
      name: 'Kaloko-Honokōhau',
      category: 'town',
      price: 'Free',
      duration: 'An hour or two',
      blurb:
        'Old Hawaiian fishponds, petroglyphs and a quiet beach where turtles haul out, right next to the dive harbour. It fits into the afternoon before the manta boat.',
      facts: [
        'Open daily, visitor centre 8:30 to 16:00',
        'Shadeless lava paths, so early or late',
        'Next to Honokōhau Harbor',
      ],
      photo: '/kona/img/kaloko.jpg',
      photoAlt: 'Lava shoreline at Kaloko-Honokōhau under a low evening sky',
      link: 'https://www.nps.gov/kaho/planyourvisit/hours.htm',
      credit: {
        subject: 'Kaloko-Honokōhau National Historical Park',
        author: 'Thomas Tunsch',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Kaloko-Honok%C5%8Dhau_National_Historical_Park_-_panoramio.jpg',
      },
    },
    {
      id: 'honaunau',
      name: 'Puʻuhonua o Hōnaunau',
      category: 'car',
      price: '$20 per car',
      duration: 'An hour or two',
      blurb:
        'The place of refuge: a walled lava point where anyone who broke a kapu could be absolved if they reached it. Carved kiʻi, a rebuilt temple, and turtles on the rocks. About 22 mi south, and Two Step is next door.',
      facts: [
        'Cards only at the gate',
        'Easy to pair with Two Step and the coffee farms',
        'On the road south towards Volcanoes',
      ],
      photo: '/kona/img/honaunau.jpg',
      photoAlt:
        'Carved wooden kiʻi and a thatched temple on the lava point at Puʻuhonua o Hōnaunau',
      link: 'https://www.nps.gov/puho/planyourvisit/fees.htm',
      credit: {
        subject: 'Puʻuhonua o Hōnaunau',
        author: 'Carol M. Highsmith',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Pu%CA%BBuhonua_o_H%C5%8Dnaunau.jpg',
      },
    },
    {
      id: 'two-step',
      name: 'Two Step',
      category: 'car',
      price: 'Free to swim',
      duration: 'A morning or an afternoon',
      blurb:
        'The best shore snorkel on the coast. Two natural lava steps drop straight into clear water over coral, and spinner dolphins often rest in the bay. Next to the place of refuge.',
      facts: [
        'No sand, just the two steps',
        'Dolphins rest here by day, so watching rather than chasing',
        'Parking fills by mid-morning',
      ],
      photo: '/kona/img/twostep.jpg',
      photoAlt: 'Clear blue water over dark lava rock at Hōnaunau Bay under a bright sky',
      credit: {
        subject: 'Hōnaunau Bay',
        author: 'Robert Linsdell',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Honaunau_Bay,_Captain_Cook_(504601)_(23770997900).jpg',
      },
    },
    {
      id: 'coffee',
      name: 'Greenwell Farms',
      category: 'car',
      price: 'Free tour',
      duration: 'Under an hour',
      blurb:
        'Kona coffee comes from this slope, and Greenwell in Kealakekua has been farming it since the 1850s. The walking tour is free and ends with a tasting. December is the end of the harvest, so the trees still have red cherries on them.',
      facts: ['Tours daily, 8:30 to 15:00', 'On the way south to Hōnaunau', 'Nothing to book'],
      photo: '/kona/img/coffee.jpg',
      photoAlt: 'Red and green coffee cherries along the branches of a Kona coffee tree',
      credit: {
        subject: 'Kona coffee cherries',
        author: 'Ekrem Canli',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Kona_Coffee_fruits(2).jpg',
      },
    },
    {
      id: 'volcanoes',
      name: 'Volcanoes National Park',
      category: 'car',
      price: '$30 per car',
      duration: 'About 2.5 hours each way',
      blurb:
        'The long option. Steam vents, a lava tube, and the rim of Kīlauea’s summit caldera. The summit has been erupting in short episodes since December 2024, a few hours of fountaining every couple of weeks, so lava on the day we go is luck.',
      facts: [
        'Entry covers seven days, cards only',
        'Around 1,200 m, noticeably cooler than the coast',
        'Five hours of driving, so it is this or the south coast stops, not both',
        'Hurricane Nolo closed the park briefly in September, worth checking in November',
      ],
      photo: '/kona/img/volcano.jpg',
      photoAlt: 'Orange lava glow rising from a crater at night',
      link: 'https://www.nps.gov/havo/planyourvisit/fees.htm',
      credit: {
        subject: 'Glow from lava within Halemaʻumaʻu',
        author: 'National Park Service',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Glow_from_lava_within_Halema%CA%BBuma%CA%BBu_(9b2a2aaf-08a6-4b78-9486-38936ffb3432).JPG',
      },
    },
    {
      id: 'punaluu',
      name: 'Punalu‘u, and the green sand',
      category: 'car',
      price: 'Free',
      duration: 'On the way to Volcanoes',
      blurb:
        'Black sand with green sea turtles asleep on it, about 1 hour 45 from Kona on the road to the park. Further south, Papakōlea is one of a handful of green sand beaches on earth, and a 4 km walk each way.',
      facts: [
        'Turtles are protected: about 3 m back',
        'Black sand gets very hot by midday',
        'Taking sand from either beach is illegal',
      ],
      photo: '/kona/img/punaluu.jpg',
      photoAlt: 'Green sea turtles resting in a row on the black sand at Punalu‘u',
      credit: {
        subject: 'Green sea turtles at Punalu‘u',
        author: 'Wmpearl',
        licence: 'CC0',
        url: 'https://commons.wikimedia.org/wiki/File:Green_sea_turtles_on_Punaluu_Black_Sand_Beach.JPG',
      },
    },
  ],
  vietnam: [
    {
      id: 'ninh-binh',
      name: 'Ninh Binh',
      category: 'out',
      price: 'Booked',
      duration: '4 to 5 Oct, one night',
      blurb:
        'Two hours south by private car. A rowed boat through three cave tunnels at Trang An, the old capital at Hoa Lu, then Mua Cave at sunset for anyone with the legs for it. One night at a lodge with a pool under the cliffs.',
      facts: [
        'The rowers often work the oars with their feet',
        'Mua Cave is about 500 steps, and optional',
        'A UNESCO site, so busy at midday',
      ],
      photo: '/vietnam/img/trangan.jpg',
      photoAlt: 'A rowed boat on a green river between limestone cliffs at Trang An',
      credit: {
        subject: 'Trang An Landscape Complex',
        author: 'Jakub Hałun',
        licence: 'CC BY 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Trang_An_Landscape_Complex,_Ninh_Binh_Province,_Vietnam,_20240202_1456_5313.jpg',
      },
    },
    {
      id: 'lan-ha',
      name: 'Lan Ha Bay',
      category: 'out',
      price: 'Booked',
      duration: '5 to 6 Oct, one night',
      blurb:
        'Three and a half hours to the coast, then a night on a small ship anchored among the islands. Kayaking into the lagoons, swimming off a beach, a cooking class and squid fishing after dark.',
      facts: [
        'Boards around 13:30',
        'Tai chi on the top deck at sunrise, for anyone awake',
        'Back in the Old Quarter by about 16:00',
      ],
      photo: '/vietnam/img/lanha.jpg',
      photoAlt: 'Two wooden junks with red sails among the limestone islands of Lan Ha Bay',
      credit: {
        subject: 'Lan Ha Bay',
        author: 'Velvet',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Lan_Ha_bay_jonques.jpg',
      },
    },
    {
      id: 'ha-giang',
      name: 'The Ha Giang loop',
      category: 'out',
      price: 'Booked',
      duration: '7 to 12 Oct, five nights',
      blurb:
        'Six hours north by car, then four days to the Chinese border and back. Easy riders for two of the days and an SUV following all four, so anyone can swap between bike and car whenever they like. Ma Pi Leng on the 10th is the high point, around 1,500 m.',
      facts: [
        'Lung Cu flagpole on the border on the 9th',
        'A boat through the Nho Que gorge on the 10th',
        'The Meo Vac Sunday market from first light on the 11th',
        'The two six-hour drives are half the travel time of the trip',
      ],
      photo: '/vietnam/img/mapileng.jpg',
      photoAlt: 'Terraced green mountainsides falling away from the road at Ma Pi Leng Pass',
      credit: {
        subject: 'Mountain road at Mã Pí Lèng Pass',
        author: 'Khánh Hmoong',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Mountain_road_at_M%C3%A3_P%C3%AD_L%C3%A8ng_Pass,_H%C3%A0_Giang_Province,_Vietnam.jpg',
      },
    },
    {
      id: 'hanoi',
      name: 'The Old Quarter',
      category: 'hanoi',
      price: 'Free to wander',
      duration: '13 and 14 Oct',
      blurb:
        'Our two days, both free. Hoan Kiem Lake and the red bridge to Ngoc Son Temple, the Temple of Literature, egg coffee at Café Giảng, Train Street if it is open that week, and the water puppets by the lake.',
      facts: [
        'Water puppets sell out, so a day ahead',
        'Train Street access comes and goes, worth asking the hotel',
        'The lake streets close to traffic at weekends, not on these weekdays',
        'Everyone flies out on the 15th, late afternoon',
      ],
      photo: '/vietnam/img/hoankiem.jpg',
      photoAlt: 'The carved stone gate to Ngoc Son Temple on Hoan Kiem Lake',
      credit: {
        subject: 'Ngoc Son Temple, Hoan Kiem Lake',
        author: 'Gary Todd',
        licence: 'CC0',
        url: 'https://commons.wikimedia.org/wiki/File:Ngoc_Son_Temple_on_Hoan_Kiem_Lake_(9753339805).jpg',
      },
    },
  ],
  miami: [
    {
      id: 'art-deco',
      name: 'The Art Deco walking tour',
      category: 'walk',
      price: 'About $40',
      duration: 'About 2 hours, from 10:30',
      blurb:
        'The Miami Design Preservation League runs it daily from the welcome centre on Ocean Drive. The district is the largest collection of Art Deco buildings in the world, and the tour is how the pastel fronts turn into a story. The Wolfsonian, on Washington Avenue, is design and propaganda from the same decades.',
      facts: [
        'Tickets are limited, so a day ahead',
        'The Wolfsonian is free on Friday from 18:00 to 21:00',
        'The Wolfsonian and the Bass are both closed Monday and Tuesday',
        'Ocean Drive after dark is the neon version, for free',
      ],
      photo: '/miami/img/oceandrive.jpg',
      photoAlt:
        'Art Deco hotels on Ocean Drive lit orange and purple at night, with palms along the street',
      link: 'https://mdpl.org/tours/',
      credit: {
        subject: 'Ocean Drive by night',
        author: 'Gzzz',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Ocean_Drive_by_night_1.jpg',
      },
    },
    {
      id: 'south-pointe',
      name: 'South Pointe and the pier',
      category: 'walk',
      price: 'Free',
      duration: 'An evening',
      blurb:
        'Fifteen minutes south along the beach. The pier runs out beside Government Cut, where the cruise ships leave at dusk close enough to wave at. Sunset is around 17:35 that week, and Smith & Wollensky’s outdoor bar is next door for a drink.',
      facts: [
        'Lummus Park and the beach the whole way there',
        'Lincoln Road and Española Way for the other direction',
        'Sunrise just before 7:00, for anyone up for calls',
      ],
      photo: '/miami/img/southpointe.jpg',
      photoAlt: 'Waves breaking on the rocks beside the concrete pilings of South Pointe pier',
      credit: {
        subject: 'South Pointe Park Pier',
        author: 'Visitor7',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:South_Pointe_Park_Pier.jpg',
      },
    },
    {
      id: 'stone-crab',
      name: 'Joe’s Stone Crab',
      category: 'walk',
      price: 'Market price, $25 pp no-show fee',
      duration: 'Dinner, or the take-away counter',
      blurb:
        'Open since 1913 at the south end of the beach, and stone crab season runs through December. It takes reservations now, which it famously did not. Joe’s Take Away next door is the same claws at a counter with no wait. Puerto Sagua on Collins, a Cuban diner since 1962, is the everyday version.',
      facts: [
        'Dinner nightly from 17:00',
        'Lunch Wednesday to Sunday, 11:30 to 14:30',
        'Walk-ins still wait, reservations on OpenTable',
      ],
      photo: '/miami/img/stonecrab.jpg',
      photoAlt: 'A plate of cracked stone crab claws with mustard sauce and lemon',
      link: 'https://www.joesstonecrab.com/location/joes-stone-crab/',
      credit: {
        subject: 'Stone crab claws at Joe’s',
        author: 'FoodOfMiami',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:JoesStoneCrabs.JPG',
      },
    },
    {
      id: 'ice-cream',
      name: 'The Museum of Ice Cream',
      category: 'us',
      price: 'From $24',
      duration: 'About 90 minutes',
      blurb:
        'Pink rooms, a sprinkle pool, and unlimited ice cream on the way round. Silly on purpose, and the right kind of silly for a date. Downtown, a short ride over the MacArthur Causeway.',
      facts: [
        'Timed tickets online; the price moves with the date',
        'Monday to Thursday 10:00 to 20:00, to 20:30 at weekends',
        'Last entry 90 minutes before closing',
        'About 15 to 20 minutes by rideshare',
      ],
      photo: '/miami/img/icecream.jpg',
      photoAlt: 'The pink shopfront of the Museum of Ice Cream in downtown Miami',
      link: 'https://www.museumoficecream.com/miami/',
      credit: {
        subject: 'Museum of Ice Cream, Miami',
        author: 'Phillip Pessar',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Museum_of_Ice_Cream,_Miami,_Florida_Sept_2024.jpg',
      },
    },
    {
      id: 'havana-night',
      name: 'Little Havana after dark',
      category: 'us',
      price: 'Free entry, most nights',
      duration: 'An evening',
      blurb:
        'Ball & Chain has played live Cuban music on Calle Ocho since 1935, all day and late into the night, and the dance floor is the point. Azucar next door does ice cream in Cuban flavours; the Abuela María is the one to order. Cubaocho, a few doors down, is a free museum of Cuban art with a bar in it.',
      facts: [
        'Free salsa lessons, reportedly Thursday at 21:00',
        'Azucar is open to 23:00 Thursday to Saturday',
        'Cubaocho is closed Mondays',
        'About $20 to $25 by rideshare',
      ],
      photo: '/miami/img/ballchain.jpg',
      photoAlt:
        'The green-striped awning of Ball & Chain on Calle Ocho, with a giant ice cream cone on the building next door',
      link: 'https://ballandchainmiami.com/',
      credit: {
        subject: 'Ball & Chain and Azucar, Calle Ocho',
        author: 'osseous',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:April_7,_2015_-_Little_Havana,_Miami,_Florida_-_Ball_%26_Chain_%26_Ice_Cream.jpg',
      },
    },
    {
      id: 'bay-sunset',
      name: 'Sunset on the bay side',
      category: 'us',
      price: 'Free, or $35 on the water',
      duration: 'An evening',
      blurb:
        'South Beach faces the wrong way for sunset; the bay side does not. The Mondrian’s terrace on West Avenue looks straight across Biscayne Bay at the skyline as the sun goes down around 17:35. For a boat, the Island Queen leaves Bayside at 19:00, so it is a skyline cruise with the city lit up rather than a sunset one.',
      facts: [
        'Island Queen: $35, 90 minutes, from Bayside',
        'O Cinema, in the 1927 old City Hall on Washington Avenue, for after',
        'Biscayne Paddle rents kayaks and boards at Sunset Harbour until 19:30',
      ],
      photo: '/miami/img/baysunset.jpg',
      photoAlt: 'The sun going down behind cloud over the flat water of Biscayne Bay',
      link: 'https://islandqueencruises.com/cruises/sunset-cruise-tours/',
      credit: {
        subject: 'Sunset over Biscayne Bay',
        author: 'Rodolfo L. Hernandez',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:SUNSET_AT_BISCAYNE_BAY,_MIAMI,_FLORIDA._-_panoramio.jpg',
      },
    },
    {
      id: 'biscayne',
      name: 'Biscayne National Park',
      category: 'water',
      price: '$115 snorkel',
      duration: '3.5 hours',
      blurb:
        'Ninety-five percent of the national park is water, and the Institute’s boats leave from Coconut Grove to wrecks, patch reefs or mangroves depending on the day. The national park day that needs no car.',
      facts: [
        'Dinner Key Marina, about $25 to $30 by rideshare',
        'A 6-hour version with an island stop is $209',
        'Sea around 77°F in December, so a thin wetsuit',
      ],
      photo: '/miami/img/biscayne.jpg',
      photoAlt: 'Two grey angelfish swimming past soft corals on a Biscayne reef',
      link: 'https://www.biscaynenationalparkinstitute.org/snorkeling/',
      credit: {
        subject: 'Grey angelfish on a Biscayne reef',
        author: 'National Park Service',
        licence: 'Public domain',
        url: 'https://commons.wikimedia.org/wiki/File:Biscayne_National_Park_H-two_gray_angels_on_reef.jpg',
      },
    },
    {
      id: 'key-biscayne',
      name: 'Key Biscayne: a dive, and the lighthouse',
      category: 'water',
      price: '$105 two tanks · $119 snorkel',
      duration: 'Half a day, or all of one',
      blurb:
        'The easiest real dive without a car. Diver’s Paradise runs two-tank reef trips and snorkel trips from Crandon Marina, half an hour away, and Bill Baggs park at the tip of the key has the 1825 Cape Florida lighthouse and a quiet beach for after.',
      facts: [
        'Gear extra on the dive, included on the snorkel',
        'Check in an hour before, 24-hour cancellation',
        'Lighthouse tours Thursday to Monday, 10:00 and 13:00',
        'About $25 to $35 each way by rideshare',
      ],
      photo: '/miami/img/lighthouse.jpg',
      photoAlt: 'Looking up the spiral iron staircase inside the Cape Florida lighthouse',
      link: 'https://diversparadise.miami/dive-snorkel-general-info/',
      credit: {
        subject: 'Inside the Cape Florida Lighthouse',
        author: 'Tamanoeconomico',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Cape_Florida_Lighthouse_(7).jpg',
      },
    },
    {
      id: 'key-largo',
      name: 'Key Largo and Christ of the Abyss',
      category: 'water',
      price: '$99 two tanks · $60 snorkel',
      duration: 'A full day, 75 to 90 minutes each way',
      blurb:
        'The best reef of the lot. A bronze Christ stands in 24 ft of water at Key Largo Dry Rocks, arms up towards the boats, and John Pennekamp was the first undersea park in the country. It only works with a car for the day.',
      facts: [
        'Rainbow Reef prices; full dive gear $35 extra',
        'The park’s own snorkel boat is $49.95, five departures a day',
        'Better seen as a diver; snorkellers see it from the surface',
        'No realistic bus, and a rideshare is $90 or more each way',
      ],
      photo: '/miami/img/abyss.jpg',
      photoAlt: 'A diver swimming above the bronze Christ of the Abyss statue in blue water',
      link: 'https://www.rainbowreef.com/dive-prices-in-key-largo/',
      credit: {
        subject: 'Christ of the Abyss, Key Largo',
        author: 'Sebastian Carlosena',
        licence: 'CC BY-SA 3.0',
        url: 'https://commons.wikimedia.org/wiki/File:Christ_of_the_Abyss,_Key_Largo,_FL_-_panoramio.jpg',
      },
    },
    {
      id: 'little-havana',
      name: 'Little Havana in the morning',
      category: 'mainland',
      price: 'Free, coffee about $2',
      duration: 'A morning',
      blurb:
        'Calle Ocho in the morning: the old men at Domino Park and a cafecito from the ventanita window at Versailles. The evening version is its own card.',
      facts: [
        'Domino Park is busiest in the morning',
        'Versailles is open from 8:00 until late',
        'About $20 to $25 by rideshare, 25 minutes',
      ],
      photo: '/miami/img/domino.jpg',
      photoAlt: 'Men playing dominoes under a tiled pavilion at Domino Park on Calle Ocho',
      credit: {
        subject: 'Domino Park, Little Havana',
        author: 'Phillip Pessar',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Domino_Park_Little_Havana,_Miami_FL,_Feb_2024.jpg',
      },
    },
    {
      id: 'wynwood',
      name: 'Wynwood',
      category: 'mainland',
      price: 'About $12 for the Walls',
      duration: 'An afternoon',
      blurb:
        'Warehouses painted end to end. The Wynwood Walls is the ticketed courtyard of big-name murals; the streets around it are the rest of the collection, free. The Design District is next door for public art and expensive shops.',
      facts: [
        'Walls open 10:30 to 18:30, last entry 18:00',
        'Sometimes closed for private events',
        'About $15 to $20 by rideshare',
      ],
      photo: '/miami/img/wynwood.jpg',
      photoAlt: 'A warehouse painted in bold black and white stripes under a blue sky in Wynwood',
      link: 'https://thewynwoodwalls.com/faqs/',
      credit: {
        subject: 'Wynwood mural',
        author: 'Phillip Pessar',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Wynwood_Mural_(16811746490).jpg',
      },
    },
    {
      id: 'vizcaya',
      name: 'Vizcaya',
      category: 'mainland',
      price: 'About $25',
      duration: 'Two or three hours',
      blurb:
        'A 1916 Italian-style villa and gardens on Biscayne Bay, with a stone barge moored in front of it as a breakwater. Last year’s evening holiday event was on 17 December and sold out, so worth watching for this year’s date.',
      facts: ['Open 9:30 to 16:30', 'Closed Tuesdays', 'About $20 by rideshare'],
      photo: '/miami/img/vizcaya.jpg',
      photoAlt: 'The curved seawall and stone barge in front of Vizcaya on Biscayne Bay',
      link: 'https://vizcaya.org/visit-2/planning-your-visit/',
      credit: {
        subject: 'Vizcaya Museum and Gardens',
        author: 'Leslie Platt',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Vizcaya_Museum_and_Gardens_,_Miami_060524_DSC6655.jpg',
      },
    },
    {
      id: 'everglades',
      name: 'The Everglades at Shark Valley',
      category: 'mainland',
      price: '$34 tram · $20 park entry',
      duration: 'Half a day, an hour each way',
      blurb:
        'A two-hour open-air tram along a 15-mile loop, with alligators on the verge and an observation tower at the far end. Dry season, which is when the animals gather near the water and the path.',
      facts: [
        'Park entry is $20 each on foot, cards only',
        'The December timetable may be thinner before the 20th',
        'No transit, and weak signal for a ride back, so a return pickup is worth booking',
      ],
      photo: '/miami/img/everglades.jpg',
      photoAlt: 'A paved path beside a waterway lined with sawgrass at Shark Valley',
      link: 'https://www.sharkvalleytramtours.com/tram-tours/hours-and-rates-for-shark-valley-everglades-tram-tours/',
      credit: {
        subject: 'Shark Valley Loop Road',
        author: 'Daderot',
        licence: 'CC0',
        url: 'https://commons.wikimedia.org/wiki/File:Shark_Valley_Loop_Road_-_Shark_Valley_-_Everglades_National_Park_-_DSC09507.jpg',
      },
    },
  ],
};

function load(): Record<string, Activity[]> {
  const out: Record<string, Activity[]> = {};
  for (const [slug, list] of Object.entries(raw)) {
    const seen = new Set<string>();
    out[slug] = list.map((entry, i) => {
      const result = ActivitySchema.safeParse(entry);
      if (!result.success) {
        const where = (entry as { id?: string })?.id ?? `${slug}[${i}]`;
        throw new Error(
          `invalid activity "${where}":\n` +
            result.error.issues
              .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
              .join('\n'),
        );
      }
      if (seen.has(result.data.id)) throw new Error(`duplicate activity id "${result.data.id}"`);
      seen.add(result.data.id);

      const known = categoriesFor(slug);
      if (!known.some((c) => c.id === result.data.category)) {
        throw new Error(
          `activity "${result.data.id}" is in category "${result.data.category}", which is not one of ` +
            `${slug}'s categories (${known.map((c) => c.id).join(', ') || 'none defined'}).`,
        );
      }
      return result.data;
    });
  }
  return out;
}

const byTrip = load();

export function activitiesFor(slug: string): Activity[] {
  return byTrip[slug] ?? [];
}

/** The trip's categories that actually have something in them, in order. */
export function groupedFor(slug: string) {
  const list = activitiesFor(slug);
  return categoriesFor(slug)
    .map((category) => ({
      ...category,
      items: list.filter((a) => a.category === category.id),
    }))
    .filter((group) => group.items.length > 0);
}
