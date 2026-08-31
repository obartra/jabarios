import { describe, expect, it } from 'vitest';
import {
  countdown,
  durationDays,
  formatRange,
  nextTrip,
  parseDay,
  shortMonth,
  sortTrips,
  statusOf,
} from './trips.ts';

const thai = { start: '2026-10-15', end: '2026-11-01' };
const at = (iso: string) => Date.parse(iso);

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
});

describe('nextTrip', () => {
  const past = { slug: 'a', start: '2025-01-01', end: '2025-01-10' };
  const soon = { slug: 'b', start: '2026-10-15', end: '2026-11-01' };
  const later = { slug: 'c', start: '2027-03-04', end: '2027-03-18' };
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
});

describe('sortTrips', () => {
  it('puts upcoming first soonest-first, then past most-recent-first', () => {
    const trips = [
      { slug: 'old', start: '2024-01-01', end: '2024-01-10' },
      { slug: 'later', start: '2027-03-04', end: '2027-03-18' },
      { slug: 'recent', start: '2025-06-01', end: '2025-06-10' },
      { slug: 'soon', start: '2026-10-15', end: '2026-11-01' },
    ];
    expect(sortTrips(trips, at('2026-08-31T00:00:00Z')).map((t) => t.slug)).toEqual([
      'soon',
      'later',
      'recent',
      'old',
    ]);
  });

  it('does not mutate its input', () => {
    const trips = [
      { slug: 'b', start: '2027-01-01', end: '2027-01-02' },
      { slug: 'a', start: '2026-01-01', end: '2026-01-02' },
    ];
    sortTrips(trips, at('2025-01-01T00:00:00Z'));
    expect(trips.map((t) => t.slug)).toEqual(['b', 'a']);
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
