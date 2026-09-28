# jabarios.com

Trip pages. [Astro](https://astro.build) static build, no client framework, no
runtime. Netlify builds and deploys every push to `main`.

```
src/
  content/trips/<slug>/  one folder per trip:
    trip.json            metadata, the cover, and every photo's alt text and credit
    activities.json      optional: the cards, grouped into categories
    page.json            the page: headline, footer line and a list of sections
    img/                 the photos, resized and re-encoded at build
  data/trips.ts          loads and validates the trip folders
  data/activities.ts     loads and validates the cards
  data/pages.ts          loads and validates page.json, and the section types
  data/date-night.json   snapshot of the shared Google Doc, written by the sync
  lib/trips.ts           pure date/status logic, shared by build and browser
  layouts/BaseLayout     <head>, fonts, canonical and social tags
  components/            AppBar, TripNav, TripCard, ActivityCard, SiteFooter
  pages/
    index.astro          homepage, generated from the trip data
    404.astro
    [slug]/index.astro   every trip page, rendered from its page.json
  components/sections/   the section types a page.json can use
  scripts/               browser code (reveal, homepage filter and countdown)
  styles/global.css      design tokens and the base layer
public/                  the favicon
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

That writes `src/content/trips/vegas/` with `trip.json`, `page.json` and an empty
`img/`. Add `img/cover.jpg`, fill in its alt text and credit and the other TODOs,
and write the page by adding sections to `page.json`.

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
npm run lighthouse # Lighthouse on every built page, with score floors
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

**Lighthouse** (`lighthouserc.cjs`) runs mobile Lighthouse once on every built
page. Accessibility has to be 100, best practices 95 and SEO 95 (except the two
pages that are `noindex` on purpose). Performance has a floor of 80, a margin
below today's 85–100, because a single run is noisy.

## Page sections

`page.json` is a headline (with the key phrase in `*asterisks*`), a footer line
(`{nights}` is filled in from the dates), and an ordered list of sections. Each
has a `type`:

- `shape`: the opening paragraphs and the constraint notes beside them
- `timeline`: dated days, `when` / `what` / `detail`
- `places`: named places with a where line and an optional link, in one or more lists
- `activities`: the cards from `activities.json`, all categories or a chosen few
- `detail`: labelled rows and a rough shape of the days, for comparing options
- `feature`: a dark block for the one evening a trip is built around
- `booking`: what needs booking first, and a caveat about the prices

Sections with an `id` and a `nav` label appear in the sticky nav, in page order.
`src/data/pages.ts` validates all of it at build and fails loudly on an unknown
type, a missing photo or an unknown category.

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
`src/content/trips/<slug>/img/`. Each one is described once, in `trip.json`'s
`photos`, with its alt text and credit; cards, covers and page sections refer to
it by file name. The `licence` field is free text rather than CC-only, but never
blank.

Originals can be any size. At build, Astro resizes each one to 480, 800, 1200
and 1600px WebP, and pages ask for the size the screen needs, so a phone never
downloads the original. `scripts/check-dist.mjs` fails the build if a photo has
no registry entry, an entry has no photo, or a credit never renders.
