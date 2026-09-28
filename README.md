# jabarios.com

Trip pages. [Astro](https://astro.build) static build, no client framework, no
runtime. Netlify builds and deploys every push to `main`.

```
src/
  data/trips.ts          one entry per trip, Zod-validated at build time
  data/activities.ts     things to do, per trip, with price, duration and credit
  data/date-night.json   snapshot of the shared Google Doc, written by the sync
  lib/trips.ts           pure date/status logic, shared by build and browser
  layouts/BaseLayout     <head>, fonts, canonical and social tags
  components/            AppBar, TripNav, TripCard, ActivityCard, SiteFooter
  pages/
    index.astro          homepage, generated from the trip data
    404.astro
    _template/           starter trip page, not routed
    <slug>/index.astro   one per trip; the slugs come from data/trips.ts
  scripts/               browser code (reveal, homepage filter and countdown)
  styles/global.css      design tokens and the base layer
public/                  favicon and per-trip photos, served as-is
scripts/
  new-trip.mjs           scaffolds a trip
  check-dist.mjs         post-build checks, run as part of `npm run build`
  serve-dist.mjs         Netlify-shaped static server, used by the e2e tests
  sync-doc.mjs           pulls the date night Google Doc into data/date-night.json
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

`start` and `end` are optional, together. A trip nobody has scheduled leaves
both out and gets a "Dates not set" pill, no day count, and no place in the
countdown or the days-away total. It sorts after the trips that do have dates
and ahead of the finished ones. A page that reads the dates should call
`requireDates`, which fails the build rather than rendering an empty range.

## Merging

`main` requires the three CI jobs to pass, with no bypass, so every change
arrives through a PR. Open one and mark it `gh pr merge --auto --squash`; it
merges itself once CI is green.

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

## Date night

`/date-night/` is not a trip. It renders a shared Google Doc that we both edit
in Google Docs, so the list can grow from a phone without a commit.
`.github/workflows/sync-doc.yml` runs `scripts/sync-doc.mjs` every 15 minutes.
When the doc changed, it commits the new snapshot to the `sync/date-night`
branch, opens a PR, approves the CI run GitHub holds on bot-opened PRs, and
turns on auto-merge, so the edit lands
on `main` (and Netlify deploys it) once the required checks pass. Every sync
leaves a PR behind as a record. The build never touches the network.

The doc has to stay shared as "anyone with the link can view", or the export
comes back as a sign-in page. The parser refuses that rather than wiping the
page, so the workflow goes red and the last good copy stays up. Headings, lists,
paragraphs, links and tables come through; images and formatting do not.

The text is ours, not the site's, so `check-dist.mjs` skips the house style
inside `data-verbatim`. To sync by hand: `node scripts/sync-doc.mjs`.

## Photos

Mostly Wikimedia Commons, under Creative Commons or public domain terms, in
`public/<slug>/img/`. The `licence` field is free text rather than CC-only,
because not every usable photo is Creative Commons, but it is never blank:
swapping in a photo means updating its credit to say where it came from and on
what terms. The cover credit sits on the trip; activity photo credits
sit on the activity and are folded into the trip's list automatically, so a
photo cannot arrive without attribution. The build fails if a trip bundles more
photos than it credits, or if a declared credit never renders.
