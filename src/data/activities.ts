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
  groundhog: [
    {
      id: 'punxsutawney',
      label: 'The Punxsutawney part',
      short: 'Punxsutawney',
      note: 'Two days, and the only stretch of this trip that is actually a plan.',
    },
    {
      id: 'philly',
      label: 'If we leave the house',
      short: 'In Philly',
      note: 'Jabari lives here. This is not a list to work through.',
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
        'Properly cold at 12,500 ft in December',
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
        'Christmas week slots go early',
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
      duration: 'As long as you last',
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
        'The Eagles residency runs 4 to 12 December, before we land, so the immersive screening is what is on. It earns the ticket for the room more than for the film.',
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
        'Outdoors, and cold after dark in December',
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
        author: 'Cl\u00e9ment Bardot',
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
        'Rebuilt five times a year by a team of about a hundred, and the winter display is up for the whole trip. Quietest before ten in the morning or after eleven at night.',
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
        'Ten minutes from 2,643 ft to 8,516 ft, up Chino Canyon. The floor of the car rotates twice on the way, so nobody has to fight for a window. At the top there is pine forest, fifty miles of trail, and often snow in April.',
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
        'They fly at first light because that is the only part of the day the valley air is still. The season runs November to April or May, so the fortnight sits at the end of it.',
      facts: [
        'Pickup around 05:00, airborne near sunrise',
        'Wind cancels flights, and April is the second windiest month',
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
        'April highs are pleasant, but there is no shade anywhere',
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
        'Half zoo and half botanical garden, in Palm Desert, and the animals are the ones that actually live in deserts. April is the end of the good season for it, because the whole place shortens its hours once the heat arrives.',
      facts: [
        'Mornings are when the animals are awake and moving',
        'Roughly 20 minutes from Palm Springs',
        'Summer hours are shorter, so April still gets the full day',
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
        'Closed through the summer, so April is near the end of the season',
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
        'A domed wooden building in Landers, put up by a man who said the design came from Venusians and was meant to reverse ageing. It does neither, but the acoustics are genuinely unusual: you lie on a mat while someone plays twenty-two quartz bowls.',
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
        'Several thousand turbines standing in the gap between two 10,000 ft mountains, which is what makes the pass windy enough to be worth it. In April the ground between them is often yellow with brittlebush.',
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
        'Palm Canyon Drive closes to traffic every Thursday evening and fills with stalls, food and buskers. Two of them fall inside the fortnight, on 15 and 22 April. It is the one reliable evening where the town is out on the street.',
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
  groundhog: [
    {
      id: 'sleep',
      name: 'A bed in Punxsutawney',
      category: 'punxsutawney',
      price: '$150–250 a room',
      duration: 'The night of the 1st',
      blurb:
        'The one thing on this trip that has to be booked, because Philadelphia is Jabari’s spare room and this is not. The town has a handful of Victorian bed and breakfasts and one old hotel, and between them they hold a few dozen rooms against a crowd of tens of thousands.',
      facts: [
        'Winslow House, Barclay and the Plantation are the bed and breakfasts in town',
        'The Pantall Hotel on Mahoning Street is the other option in walking distance',
        'People book a year out, so five months ahead is already late',
        'Indiana and DuBois are 30 to 40 minutes away and hold more rooms',
      ],
      photo: '/groundhog/img/pantall.jpg',
      photoAlt:
        'The four-storey red brick Pantall Hotel on a street corner in downtown Punxsutawney',
      credit: {
        subject: 'The Pantall Hotel, Punxsutawney',
        author: 'Andre Carrotflower',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:26_-_20180728_-_Punxsutawney,_PA.jpg',
      },
    },
    {
      id: 'gobblers-knob',
      name: "Gobbler's Knob, before dawn",
      category: 'punxsutawney',
      price: '$5 pp, under 12 free',
      duration: '03:00 to about 08:00',
      blurb:
        'It happens in a clearing two miles outside town. Gates open at 03:00, the Inner Circle come out in top hats and morning coats around 06:30, and Phil is lifted out of a stump at 07:25. The prediction itself takes about a minute, and the wait is most of the experience.',
      facts: [
        'Ticket booths open 02:00, gates 03:00, prediction around 07:25',
        'Buses run from Barclay Square and three other stops from 03:00',
        'No parking at the Knob, and no bags, alcohol or chairs',
        'Below freezing, in the dark, standing on frozen mud for hours',
      ],
      photo: '/groundhog/img/knob.jpg',
      photoAlt:
        'Men in top hats and overcoats holding a scroll while one of them holds up a groundhog',
      link: 'https://www.groundhog.org/',
      credit: {
        subject: "Groundhog Day at Gobbler's Knob",
        author: 'Anthony Quintano',
        licence: 'CC BY 2.0',
        url: 'https://commons.wikimedia.org/wiki/File:Groundhog_Day,_Punxsutawney,_2013-1.jpg',
      },
    },
    {
      id: 'phil',
      name: 'Phil, and the town afterwards',
      category: 'punxsutawney',
      price: 'Free',
      duration: 'A couple of hours before we drive',
      blurb:
        'Phil spends the other 364 days in a lit enclosure built into the wall of the town library, with a window onto Barclay Square, and costs nothing to visit. The square runs games and street music through the festival, and the community centre screens the film on a loop.',
      facts: [
        "Phil's Burrow is at the library on Barclay Square, visible from the street",
        'Free screenings of the 1993 film run at the community centre',
        'Painted Phil statues are dotted around the town',
        'Every restaurant is swamped on the 2nd, so eat early or wait',
      ],
      photo: '/groundhog/img/phil.jpg',
      photoAlt:
        'A groundhog held up at arm’s length against bare winter trees at dawn, lit by a floodlight',
      credit: {
        subject: 'Punxsutawney Phil',
        author: 'Chris Flook',
        licence: 'CC BY-SA 4.0',
        url: 'https://commons.wikimedia.org/wiki/File:Punxsutawney_Phil_2018.jpg',
      },
    },
    {
      id: 'bartrams',
      name: "Bartram's Garden",
      category: 'philly',
      price: 'Free',
      duration: 'A couple of hours',
      blurb:
        'Fifty acres on the Schuylkill at the bottom of West Philly, laid out by John Bartram from 1728, which makes it the oldest surviving botanic garden in the country. Free, almost empty in February, and a twenty minute walk or a short ride from the house.',
      facts: [
        'Grounds are free and open daily, dawn to dusk',
        'House tours are seasonal and limited, so worth checking before going',
        'On the river, so it is colder and windier than the street',
        'Bare in February, which makes the river and the skyline easier to see',
      ],
      photo: '/groundhog/img/bartrams.jpg',
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
      category: 'philly',
      price: '$15 adults, $12 students',
      duration: 'An hour',
      blurb:
        'Isaiah Zagar spent fourteen years covering half a block of South Street in mosaic made of bottles, bicycle wheels, mirror and broken tile. Half of it is outdoors, so February is cold, but winter light on all that glass is the better version.',
      facts: [
        'Closed Tuesdays, otherwise 11:00 to 18:00',
        'Tickets regularly sell out, so book online rather than turning up',
        'Largely outdoors and unheated',
        'Zagar murals carry on for several blocks around, for free',
      ],
      photo: '/groundhog/img/magicgardens.jpg',
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
