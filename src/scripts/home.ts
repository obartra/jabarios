/**
 * Homepage behaviour: keeps the status pills and countdown honest against the
 * real clock, and runs the filter. The page is static, so a visitor could be
 * looking at HTML generated weeks ago; everything time-dependent is recomputed
 * here from the same functions the build used.
 */
import {
  countdown,
  nextTrip,
  parseDay,
  STATUS_LABEL,
  statusOf,
  type DateRange,
  type TripStatus,
} from '../lib/trips.ts';

type Filter = 'all' | 'upcoming' | 'past';

interface CardTrip extends DateRange {
  el: HTMLElement;
  name: string;
}

const PILL_CLASS: Record<TripStatus, string> = {
  past: 'pill done',
  now: 'pill live',
  upcoming: 'pill',
};

function readCards(): CardTrip[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-trip]')).flatMap((el) => {
    const { start, end, name } = el.dataset;
    if (!start || !end || !name) return [];
    return [{ el, start, end, name }];
  });
}

function paintStatus(cards: CardTrip[], now: number): void {
  for (const card of cards) {
    const status = statusOf(card, now);
    card.el.dataset.status = status;
    const pill = card.el.querySelector<HTMLElement>('[data-status-pill]');
    if (pill) {
      pill.textContent = STATUS_LABEL[status];
      pill.className = PILL_CLASS[status];
    }
  }
}

function startCountdown(cards: CardTrip[]): void {
  const strip = document.getElementById('nextup');
  const clock = document.getElementById('clock');
  const nameEl = document.getElementById('nextup-name');
  const whenEl = document.getElementById('nextup-when');
  if (!strip || !clock || !nameEl || !whenEl) return;

  const next = nextTrip(cards, Date.now());
  if (!next) {
    strip.hidden = true;
    return;
  }

  strip.hidden = false;
  nameEl.textContent = next.name;
  const departure = parseDay(next.start);

  const tick = (): boolean => {
    const now = Date.now();
    if (statusOf(next, now) !== 'upcoming') {
      clock.hidden = true;
      whenEl.textContent = 'is happening now.';
      return false;
    }
    const { days, hours, minutes } = countdown(departure, now);
    const values: Record<string, number> = { d: days, h: hours, m: minutes };
    for (const slot of clock.querySelectorAll<HTMLElement>('[data-c]')) {
      const key = slot.dataset.c;
      if (key && key in values) slot.textContent = String(values[key]);
    }
    clock.setAttribute(
      'aria-label',
      `${days} days, ${hours} hours and ${minutes} minutes until departure`,
    );
    whenEl.textContent = 'departs in';
    return true;
  };

  if (tick()) {
    const timer = window.setInterval(() => {
      if (!tick()) window.clearInterval(timer);
    }, 30_000);
  }
}

function wireFilter(cards: CardTrip[]): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.seg button'));
  const empty = document.getElementById('empty');
  if (tabs.length === 0) return;

  const apply = (want: Filter): void => {
    let shown = 0;
    for (const card of cards) {
      const status = card.el.dataset.status as TripStatus | undefined;
      // "Upcoming" keeps trips in progress as well as ones still ahead.
      const keep =
        want === 'all' ||
        (want === 'past' && status === 'past') ||
        (want === 'upcoming' && status !== 'past');
      card.el.style.display = keep ? '' : 'none';
      if (keep) shown++;
    }
    empty?.classList.toggle('on', shown === 0);
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      for (const other of tabs) other.setAttribute('aria-selected', String(other === tab));
      apply((tab.dataset.filter as Filter | undefined) ?? 'all');
    });
  }
}

export function initHome(): void {
  const cards = readCards();
  if (cards.length === 0) return;
  paintStatus(cards, Date.now());
  startCountdown(cards);
  wireFilter(cards);
}
