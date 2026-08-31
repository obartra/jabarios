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

/** Order here is the order the sections appear on the page. */
export const CATEGORIES = [
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
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

const ActivitySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  category: z.enum(CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]]),
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
        'Acrobatics in, on and above a pool holding a million and a half gallons, and the one most people mean when they say they saw a Cirque show. Running since 1998.',
      facts: [
        'Bellagio, middle Strip',
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
      return result.data;
    });
  }
  return out;
}

const byTrip = load();

export function activitiesFor(slug: string): Activity[] {
  return byTrip[slug] ?? [];
}

/** Categories that actually have something in them, in CATEGORIES order. */
export function groupedFor(slug: string) {
  const list = activitiesFor(slug);
  return CATEGORIES.map((category) => ({
    ...category,
    items: list.filter((a) => a.category === category.id),
  })).filter((group) => group.items.length > 0);
}
