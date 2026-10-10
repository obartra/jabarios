/**
 * Pure trip logic. Shared by the build (which renders cards and stats) and by
 * the browser (which keeps the countdown and status pills live). Keeping it in
 * one place is the point: a trip that has started should look started in the
 * generated HTML and after hydration, without two implementations agreeing by
 * luck.
 */

export const DAY_MS = 86_400_000;

export type TripStatus = 'past' | 'now' | 'upcoming' | 'undated' | 'pivoted';

/** Everything here needs only the two calendar days, so that is all it asks for. */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * A trip we want to take but have not put a date on. The dates are absent
 * rather than empty or zeroed, so nothing downstream can accidentally treat an
 * unplanned trip as one departing on the epoch. Everything date-derived (the
 * day count, the countdown, the next-departure stat) has to skip it rather
 * than guess.
 */
export interface MaybeDated {
  dates: DateRange | null;
  /**
   * A trip we planned and then replaced with something else. It keeps its
   * dates, because the plan had them, but it is not a trip we are taking: it
   * never counts down, never adds to the totals and never becomes "past".
   * trip.json carries the line saying what happened, a card carries a flag;
   * either one being set is what counts.
   */
  pivoted?: boolean | string;
}

/**
 * Calendar days carry no time zone, so anchor them at midday UTC. Parsing at
 * midnight lets a negative UTC offset roll the date back a day for anyone west
 * of Greenwich, which would show the wrong day count and, on the departure
 * date itself, the wrong status.
 */
export function parseDay(iso: string): number {
  const ms = Date.parse(`${iso}T12:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`not an ISO calendar day: ${iso}`);
  return ms;
}

/**
 * For a page written about a trip that has dates. If the dates ever go missing
 * that is a mistake in trips.ts, not a case for the page to paper over, so this
 * fails the build loudly rather than rendering "null nights".
 */
export function requireDates(trip: MaybeDated, slug: string): DateRange {
  if (!trip.dates) throw new Error(`trip "${slug}" needs dates: this page reads them`);
  return trip.dates;
}

/** Inclusive of both the departure and return day, which is how people count trips. */
export function durationDays(dates: DateRange): number {
  return Math.round((parseDay(dates.end) - parseDay(dates.start)) / DAY_MS) + 1;
}

export function statusOf(dates: DateRange | null, now: number): TripStatus {
  if (!dates) return 'undated';
  // The end day counts as still travelling right up to its own midnight.
  if (now >= parseDay(dates.end) + DAY_MS / 2) return 'past';
  if (now >= parseDay(dates.start) - DAY_MS / 2) return 'now';
  return 'upcoming';
}

/**
 * The status of a whole trip. A pivot wins over whatever its dates say, so a
 * called-off trip does not turn into "Happening now" on the day it would have
 * left. Use this for anything that has the trip; statusOf is the date half.
 */
export function statusOfTrip(trip: MaybeDated, now: number): TripStatus {
  return trip.pivoted ? 'pivoted' : statusOf(trip.dates, now);
}

/**
 * The one place this sentence is written. The card pill and the trip page's
 * date line both read it, so an undated trip cannot say two different things
 * about itself in two places.
 */
export const UNDATED_LABEL = 'Dates not set';

export const STATUS_LABEL: Record<TripStatus, string> = {
  past: 'Past',
  now: 'Happening now',
  upcoming: 'Upcoming',
  undated: UNDATED_LABEL,
  pivoted: 'Pivoted',
};

/**
 * Soonest departure first among trips that have not finished; null if none.
 * An undated trip can never be the next one: there is nothing to count down to.
 * Nor can a pivoted one: we are not going.
 * The return type carries that narrowing so callers can read the dates without
 * a second check.
 */
export function nextTrip<T extends MaybeDated>(
  trips: T[],
  now: number,
): (T & { dates: DateRange }) | null {
  const ahead = trips
    .filter(
      (t): t is T & { dates: DateRange } =>
        t.dates !== null && !t.pivoted && statusOf(t.dates, now) !== 'past',
    )
    .sort((a, b) => parseDay(a.dates.start) - parseDay(b.dates.start));
  return ahead[0] ?? null;
}

/**
 * Trips we are taking, then trips we mean to take, then trips we took: upcoming
 * soonest-first, undated in the order they were written, past most-recent-first.
 * Undated sits in the middle because it has not happened, so burying it under
 * finished trips would read as though it had. Pivots go last, most recent
 * first: they are the record of what we did not do.
 */
const SORT_RANK: Record<TripStatus, number> = {
  now: 0,
  upcoming: 0,
  undated: 1,
  past: 2,
  pivoted: 3,
};

export function sortTrips<T extends MaybeDated>(trips: T[], now: number): T[] {
  return [...trips].sort((a, b) => {
    const rankA = SORT_RANK[statusOfTrip(a, now)];
    const rankB = SORT_RANK[statusOfTrip(b, now)];
    if (rankA !== rankB) return rankA - rankB;
    if (!a.dates || !b.dates) return 0;
    const delta = parseDay(a.dates.start) - parseDay(b.dates.start);
    return rankA >= SORT_RANK.past ? -delta : delta;
  });
}

export type TripFilter = 'all' | 'upcoming' | 'past' | 'pivots';

/**
 * Which cards a homepage tab shows. "Upcoming" keeps trips in progress and
 * undated ones as well as those still ahead. A pivot shows only under its own
 * tab, so "All" is every trip we are taking or took, not every plan we made.
 */
export function matchesFilter(status: TripStatus, filter: TripFilter): boolean {
  if (status === 'pivoted') return filter === 'pivots';
  if (filter === 'pivots') return false;
  if (filter === 'all') return true;
  return filter === 'past' ? status === 'past' : status !== 'past';
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
}

/** Time until departure, floored. All zeroes once the moment has passed. */
export function countdown(target: number, now: number): Countdown {
  const left = Math.max(0, target - now);
  return {
    days: Math.floor(left / DAY_MS),
    hours: Math.floor((left % DAY_MS) / 3_600_000),
    minutes: Math.floor((left % 3_600_000) / 60_000),
  };
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parts(iso: string) {
  const d = new Date(parseDay(iso));
  return { day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()]!, year: d.getUTCFullYear() };
}

/**
 * "15 October – 1 November 2026", dropping whatever the two ends share so the
 * label stays short. En dashes are correct inside a range; see CLAUDE.md.
 */
export function formatRange(start: string, end: string): string {
  const a = parts(start);
  const b = parts(end);
  if (a.year !== b.year) return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  if (a.month !== b.month) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${a.day}–${b.day} ${b.month} ${b.year}`;
}

/** Short month for the "next departure" stat, e.g. "Oct". */
export function shortMonth(iso: string): string {
  return parts(iso).month.slice(0, 3);
}
