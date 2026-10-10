import { describe, expect, it } from 'vitest';
import {
  countdown,
  durationDays,
  formatRange,
  matchesFilter,
  nextTrip,
  parseDay,
  requireDates,
  shortMonth,
  sortTrips,
  statusOf,
  statusOfTrip,
  UNDATED_LABEL,
} from './trips.ts';

const thai = { start: '2026-10-15', end: '2026-11-01' };
const at = (iso: string) => Date.parse(iso);
/** sortTrips and nextTrip take whole trips, so fixtures carry a dates field. */
const dated = (slug: string, start: string, end: string) => ({ slug, dates: { start, end } });
const undated = (slug: string) => ({ slug, dates: null });
const pivoted = (slug: string, start: string, end: string) => ({
  ...dated(slug, start, end),
  pivoted: true,
});

describe('parseDay', () => {
  it('anchors a calendar day at midday UTC', () => {
    expect(new Date(parseDay('2026-10-15')).toISOString()).toBe('2026-10-15T12:00:00.000Z');
  });

  it('rejects anything that is not an ISO day', () => {
    expect(() => parseDay('15/10/2026')).toThrow(/ISO calendar day/);
    expect(() => parseDay('')).toThrow();
  });
});

describe('durationDays', () => {
  it('counts both the departure and return day', () => {
    expect(durationDays(thai)).toBe(18);
    expect(durationDays({ start: '2026-01-01', end: '2026-01-01' })).toBe(1);
  });

  it('is not thrown off by a daylight-saving change inside the range', () => {
    // Europe/London leaves BST on 2026-10-25, inside the Thailand trip.
    expect(durationDays({ start: '2026-10-24', end: '2026-10-26' })).toBe(3);
  });
});

describe('statusOf', () => {
  it('is upcoming well before departure', () => {
    expect(statusOf(thai, at('2026-08-31T00:00:00Z'))).toBe('upcoming');
  });

  it('is happening now on the departure day and the return day', () => {
    expect(statusOf(thai, at('2026-10-15T09:00:00Z'))).toBe('now');
    expect(statusOf(thai, at('2026-11-01T09:00:00Z'))).toBe('now');
  });

  it('is past only after the return day is over', () => {
    expect(statusOf(thai, at('2026-11-01T23:59:00Z'))).toBe('now');
    expect(statusOf(thai, at('2026-11-02T06:00:00Z'))).toBe('past');
  });

  it('treats a single-day trip as happening on that day', () => {
    const day = { start: '2026-05-04', end: '2026-05-04' };
    expect(statusOf(day, at('2026-05-04T08:00:00Z'))).toBe('now');
    expect(statusOf(day, at('2026-05-05T08:00:00Z'))).toBe('past');
  });

  it('calls a trip with no dates undated, whatever the clock says', () => {
    expect(statusOf(null, at('2026-08-31T00:00:00Z'))).toBe('undated');
    expect(statusOf(null, at('2099-01-01T00:00:00Z'))).toBe('undated');
  });
});

describe('statusOfTrip', () => {
  it('follows the dates for a trip we are taking', () => {
    expect(statusOfTrip({ dates: thai }, at('2026-10-20T00:00:00Z'))).toBe('now');
    expect(statusOfTrip({ dates: null }, at('2026-10-20T00:00:00Z'))).toBe('undated');
  });

  it('calls a pivoted trip pivoted before, during and after its dates', () => {
    const trip = { dates: thai, pivoted: true };
    for (const when of ['2026-08-31', '2026-10-20', '2027-01-01']) {
      expect(statusOfTrip(trip, at(`${when}T00:00:00Z`))).toBe('pivoted');
    }
    expect(statusOfTrip({ dates: null, pivoted: true }, at('2026-10-20T00:00:00Z'))).toBe(
      'pivoted',
    );
  });
});

describe('matchesFilter', () => {
  it('shows every trip we are taking or took under "all"', () => {
    for (const status of ['upcoming', 'now', 'undated', 'past'] as const) {
      expect(matchesFilter(status, 'all')).toBe(true);
    }
  });

  it('splits upcoming from past, with in-progress and undated trips as upcoming', () => {
    expect(matchesFilter('now', 'upcoming')).toBe(true);
    expect(matchesFilter('undated', 'upcoming')).toBe(true);
    expect(matchesFilter('past', 'upcoming')).toBe(false);
    expect(matchesFilter('past', 'past')).toBe(true);
    expect(matchesFilter('upcoming', 'past')).toBe(false);
  });

  it('keeps a pivot under its own tab and nowhere else', () => {
    expect(matchesFilter('pivoted', 'pivots')).toBe(true);
    for (const filter of ['all', 'upcoming', 'past'] as const) {
      expect(matchesFilter('pivoted', filter)).toBe(false);
    }
  });

  it('shows nothing but pivots under "pivots"', () => {
    for (const status of ['upcoming', 'now', 'undated', 'past'] as const) {
      expect(matchesFilter(status, 'pivots')).toBe(false);
    }
  });
});

describe('requireDates', () => {
  it('returns the dates when they are there', () => {
    expect(requireDates({ dates: thai }, 'thai')).toEqual(thai);
  });

  it('throws naming the trip, rather than letting a page render nothing', () => {
    expect(() => requireDates({ dates: null }, 'vegas')).toThrow(/"vegas" needs dates/);
  });
});

describe('nextTrip', () => {
  const past = dated('a', '2025-01-01', '2025-01-10');
  const soon = dated('b', '2026-10-15', '2026-11-01');
  const later = dated('c', '2027-03-04', '2027-03-18');
  const now = at('2026-08-31T00:00:00Z');

  it('picks the soonest departure that has not finished', () => {
    expect(nextTrip([later, past, soon], now)?.slug).toBe('b');
  });

  it('prefers a trip in progress over one still ahead', () => {
    expect(nextTrip([later, soon], at('2026-10-20T00:00:00Z'))?.slug).toBe('b');
  });

  it('returns null when everything is finished', () => {
    expect(nextTrip([past], at('2030-01-01T00:00:00Z'))).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(nextTrip([], now)).toBeNull();
  });

  it('never picks an undated trip, because there is nothing to count down to', () => {
    expect(nextTrip([undated('someday'), later], now)?.slug).toBe('c');
    expect(nextTrip([undated('someday')], now)).toBeNull();
  });

  it('never picks a pivoted trip, even one whose dates are the soonest', () => {
    const off = pivoted('off', '2026-10-13', '2026-10-15');
    expect(nextTrip([off, later], now)?.slug).toBe('c');
    expect(nextTrip([off], at('2026-10-14T00:00:00Z'))).toBeNull();
  });
});

describe('sortTrips', () => {
  it('puts upcoming first soonest-first, then past most-recent-first', () => {
    const trips = [
      dated('old', '2024-01-01', '2024-01-10'),
      dated('later', '2027-03-04', '2027-03-18'),
      dated('recent', '2025-06-01', '2025-06-10'),
      dated('soon', '2026-10-15', '2026-11-01'),
    ];
    expect(sortTrips(trips, at('2026-08-31T00:00:00Z')).map((t) => t.slug)).toEqual([
      'soon',
      'later',
      'recent',
      'old',
    ]);
  });

  it('sits undated trips after the upcoming ones but ahead of the finished ones', () => {
    const trips = [
      dated('old', '2024-01-01', '2024-01-10'),
      undated('someday'),
      dated('soon', '2026-10-15', '2026-11-01'),
    ];
    expect(sortTrips(trips, at('2026-08-31T00:00:00Z')).map((t) => t.slug)).toEqual([
      'soon',
      'someday',
      'old',
    ]);
  });

  it('puts pivots last, most recent first, whatever their dates', () => {
    const trips = [
      pivoted('off-early', '2026-10-13', '2026-10-15'),
      dated('old', '2024-01-01', '2024-01-10'),
      pivoted('off-late', '2026-10-15', '2026-11-01'),
      dated('soon', '2026-10-19', '2026-10-25'),
    ];
    expect(sortTrips(trips, at('2026-10-10T00:00:00Z')).map((t) => t.slug)).toEqual([
      'soon',
      'old',
      'off-late',
      'off-early',
    ]);
  });

  it('keeps undated trips in the order they were written', () => {
    const trips = [undated('b'), undated('a')];
    expect(sortTrips(trips, at('2026-08-31T00:00:00Z')).map((t) => t.slug)).toEqual(['b', 'a']);
  });

  it('does not mutate its input', () => {
    const trips = [dated('b', '2027-01-01', '2027-01-02'), dated('a', '2026-01-01', '2026-01-02')];
    sortTrips(trips, at('2025-01-01T00:00:00Z'));
    expect(trips.map((t) => t.slug)).toEqual(['b', 'a']);
  });
});

describe('UNDATED_LABEL', () => {
  it('is the one sentence an undated trip says about itself', () => {
    expect(UNDATED_LABEL).toBe('Dates not set');
  });
});

describe('countdown', () => {
  it('breaks the remaining time into days, hours and minutes', () => {
    const now = at('2026-10-14T10:30:00Z');
    expect(countdown(parseDay('2026-10-15'), now)).toEqual({ days: 1, hours: 1, minutes: 30 });
  });

  it('floors to zero once the target has passed', () => {
    expect(countdown(parseDay('2026-10-15'), at('2026-12-01T00:00:00Z'))).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
    });
  });
});

describe('formatRange', () => {
  it('shows the year once when both ends share it', () => {
    expect(formatRange('2026-10-15', '2026-11-01')).toBe('15 October – 1 November 2026');
  });

  it('collapses the month when both ends share it', () => {
    expect(formatRange('2026-10-15', '2026-10-20')).toBe('15–20 October 2026');
  });

  it('spells both years out when the trip crosses new year', () => {
    expect(formatRange('2026-12-28', '2027-01-04')).toBe('28 December 2026 – 4 January 2027');
  });

  it('never emits an em dash', () => {
    const all = [
      formatRange('2026-10-15', '2026-11-01'),
      formatRange('2026-10-15', '2026-10-20'),
      formatRange('2026-12-28', '2027-01-04'),
    ].join(' ');
    expect(all).not.toContain('—');
  });
});

describe('shortMonth', () => {
  it('abbreviates to three letters', () => {
    expect(shortMonth('2026-10-15')).toBe('Oct');
    expect(shortMonth('2027-03-04')).toBe('Mar');
  });
});
