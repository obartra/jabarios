# jabarios.com

Trip pages. Astro static build, no client framework. See `README.md` for the
structure, the commands, and what CI checks.

## Working here

**Trip metadata lives in `src/data/trips.ts` and nowhere else.** Dates, names,
blurbs, places and photo credits all come from there. The homepage card, the
day counts, the countdown, the page title and the social tags are derived. If
you find yourself typing a date into a page, stop: derive it instead, or the
two will disagree eventually.

**Scaffold a new trip, do not copy an old one.** `node scripts/new-trip.mjs
<slug> "<Name>" <start> <end>` gets the chrome, meta tags and nav right.
Copying a page carries over the previous trip's canonical and og tags.

**Shared chrome is a component.** `AppBar`, `TripNav`, `TripCard` and
`SiteFooter` exist so trips look alike. Page-specific styling belongs in the
page; anything a second trip would want belongs in `src/styles/global.css` or
a component.

**Date logic goes in `src/lib/trips.ts` with a test.** It is imported by both
the build and the browser, so there is one implementation and it is covered.

**Run `npm run verify` before pushing.** It is exactly what CI runs.

## Voice

This is the voice of the **site**, for anything a visitor reads: headings,
ledes, card blurbs, day descriptions, meta descriptions. It is not the voice
for commit messages, PR bodies or code comments, and it is separate from the
"writing in my voice" rules in the global config, which are for things I send
to people.

The register already exists on the Thailand page. Match it. Every example
below is real copy from `thai/index.html`.

**Write to whoever is going.** Second person, direct.

> a room you can take calls in at three in the morning without waking the other person

> The risk lands on you at the front desk, not on the host.

**Verdict first, then the reason.** Lead with the judgement so it can be
skimmed. Justify after.

> The default. Two-bedroom units, kitchen, laundry, desks, and the interchange that makes both day trips easy.

> The one thing a first-time visitor should not skip. Gold, mirrored glass, and the Emerald Buddha, then the enormous reclining Buddha next door.

**Numbers instead of adjectives.** A price, a duration, a distance, a year.
Never "cheap", "quick", "huge", "ancient".

> 5 THB ferry from Tha Tien · best 17:00–19:00

> Fifteen thousand stalls, roughly a square kilometre of them.

> The capital the Burmese burned in 1767

**Name the constraint plainly.** The useful part is usually the thing that
will ruin the day if it is missed.

> Hard deadline: the palace stops selling tickets at 15:30, so this only works if you leave on time.

> Covered shoulders and knees, enforced at the gate.

> Start early: it is flat, shadeless and hot by eleven

**Give permission to skip things.** These are options, not a schedule.

> Pick two sections and abandon the rest.

> Everything below is an option rather than a plan. Pick what appeals and ignore the rest.

**Fragments are fine.** They carry the verdict.

> Not Airbnb.

> Different city from the night version.

**Evaluate flat, never enthusiastic.** Where something is good, say why in a
way that sounds like a person who has been there.

> Strange, ambitious, and the opposite of a crowd.

> Liveliest on weekends, half-asleep midweek, which may be the point.

**Say when you are not sure.** Hedge on the fact, not on the recommendation.

> sources put it around 10–18 October

### Do not

**Do not describe the website.** The page is a plan someone is going to use,
not a product with features. "One page per trip", "kept up to date as things
change", "everything you need in one place" are all wrong. Write about the
travel instead.

**No brochure language.** No "must-see", "breathtaking", "hidden gem",
"stunning", "nestled", "vibrant", "bucket list". `scripts/check.mjs` fails the
build on a list of these. Extend the list rather than working around it.

**No em dashes.** Use a comma, a full stop, or `·`, which is the separator the
site already uses everywhere. En dashes are fine inside numeric ranges
(`15–20 Oct`, `17:00–19:00`) and nowhere else. Also enforced by the check.

**Sentence case.** Not Title Case, in headings or anywhere else.

**No exclamation marks, no rhetorical questions, no throat-clearing.** Start
with the thing.
