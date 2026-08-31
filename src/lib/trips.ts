/**
 * Pure trip logic. Shared by the build (which renders cards and stats) and by
 * the browser (which keeps the countdown and status pills live). Keeping it in
 * one place is the point: a trip that has started should look started in the
 * generated HTML and after hydration, without two implementations agreeing by
 * luck.
 */

export const DAY_MS = 86_400_000;

export type TripStatus = 'past' | 'now' | 'upcoming';

/** Everything here needs only the two calendar days, so that is all it asks for. */
export interface DateRange {
  start: string;
  end: string;
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

/** Inclusive of both the departure and return day, which is how people count trips. */
export function durationDays(trip: DateRange): number {
  return Math.round((parseDay(trip.end) - parseDay(trip.start)) / DAY_MS) + 1;
}

export function statusOf(trip: DateRange, now: number): TripStatus {
  // The end day counts as still travelling right up to its own midnight.
  if (now >= parseDay(trip.end) + DAY_MS / 2) return 'past';
  if (now >= parseDay(trip.start) - DAY_MS / 2) return 'now';
  return 'upcoming';
}

export const STATUS_LABEL: Record<TripStatus, string> = {
  past: 'Past',
  now: 'Happening now',
  upcoming: 'Upcoming',
};

/** Soonest departure first among trips that have not finished; null if none. */
export function nextTrip<T extends DateRange>(trips: T[], now: number): T | null {
  const ahead = trips
    .filter((t) => statusOf(t, now) !== 'past')
    .sort((a, b) => parseDay(a.start) - parseDay(b.start));
  return ahead[0] ?? null;
}

/** Upcoming trips soonest-first, then past trips most-recent-first. */
export function sortTrips<T extends DateRange>(trips: T[], now: number): T[] {
  return [...trips].sort((a, b) => {
    const aPast = statusOf(a, now) === 'past';
    const bPast = statusOf(b, now) === 'past';
    if (aPast !== bPast) return aPast ? 1 : -1;
    const delta = parseDay(a.start) - parseDay(b.start);
    return aPast ? -delta : delta;
  });
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
