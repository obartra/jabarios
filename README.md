# jabarios.com

Trip pages. [Astro](https://astro.build) static build, no client framework, no
runtime. Netlify builds and deploys every push to `main`.

```
src/
  data/trips.ts          one entry per trip, Zod-validated at build time
  data/activities.ts     things to do, per trip, with price, duration and credit
  lib/trips.ts           pure date/status logic, shared by build and browser
  layouts/BaseLayout     <head>, fonts, canonical and social tags
  components/            AppBar, TripNav, TripCard, ActivityCard, SiteFooter
  pages/
    index.astro          homepage, generated from the trip data
    404.astro
    _template/           starter trip page, not routed
    thai/index.astro     Thailand
    vegas/index.astro    Las Vegas
  scripts/               browser code (reveal, homepage filter and countdown)
  styles/global.css      design tokens and the base layer
public/                  favicon and per-trip photos, served as-is
scripts/
  new-trip.mjs           scaffolds a trip
  check-dist.mjs         post-build checks, run as part of `npm run build`
  serve-dist.mjs         Netlify-shaped static server, used by the e2e tests
tests/e2e/               Playwright, desktop and mobile
```

## Adding a trip

```bash
node scripts/new-trip.mjs vegas "Las Vegas" 2026-12-18 2026-12-27
```

That writes the entry in `src/data/trips.ts`, the page at
`src/pages/vegas/index.astro`, and `public/vegas/img/`. Fill in the TODOs in
the data entry, drop a cover photo in with its credit, and write the page.

Everything else follows from the data entry and needs no edit: the homepage
card, the status pill, the day count, the country and days-away totals, the
countdown to the next departure, the Upcoming/Past filter, the page title,
canonical, and the social tags. A trip that becomes the past updates itself.

## Commands

```bash
npm run dev        # local dev server
npm run verify     # everything CI runs, in the same order
npm run build      # astro build, then the post-build checks
npm test           # unit tests
npm run test:e2e   # Playwright, against the real build
```

## What is checked

CI runs formatting, lint, types, unit tests, the build and the end-to-end
suite. Netlify runs the build, which includes `scripts/check-dist.mjs`, so a
broken deploy fails rather than ships.

**Unit** (`src/**/*.test.ts`) covers the date logic: trip duration across a
daylight-saving change, status on the departure and return day, next-trip
selection, sorting, countdown, and date-range formatting. Plus the trip data
itself: unique slugs, dates in order, description length, cover alt text.

**Post-build** (`scripts/check-dist.mjs`) runs against `dist/`, so it inspects
what actually gets served: dead links, missing title/description/lang, images
without alt text, canonicals that disagree with the URL they are served at,
`og:image` that is not in the build, every trip having both a page and a card,
every bundled photo having a credit that renders, and the house style rules
from `CLAUDE.md`.

**End to end** (`tests/e2e/`) covers what only a browser can: cards revealing
on scroll, the filter and its empty state, the live countdown, the back link,
no horizontal scroll, no failing requests including lazy-loaded photos, and a
real 404 status on an unknown path.

## Activities

A trip page can be an itinerary (Thailand) or a scannable menu of options
(Vegas). For the second kind, add entries to `src/data/activities.ts` under the
trip's slug. Each one needs a price, a duration, a photo and its credit, and
renders as a card grouped under its category. `CATEGORIES` sets the section
order and the short labels the sticky nav uses.

## Photos

Mostly Wikimedia Commons, under Creative Commons or public domain terms, in
`public/<slug>/img/`. The `licence` field is free text rather than CC-only,
because not every usable photo is Creative Commons, but it is never blank:
swapping in a photo means updating its credit to say where it came from and on
what terms. The cover credit sits on the trip; activity photo credits
sit on the activity and are folded into the trip's list automatically, so a
photo cannot arrive without attribution. The build fails if a trip bundles more
photos than it credits, or if a declared credit never renders.
