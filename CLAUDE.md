# jabarios.com

Trip pages. Astro static build, no client framework. See `README.md` for the
structure, the commands, and what CI checks.

## Working here

**Trip metadata lives in `src/content/trips/<slug>/trip.json` and nowhere
else.** Dates, names, blurbs, places, and every photo's alt text and credit
come from there. The homepage card, the
day counts, the countdown, the page title and the social tags are derived. If
you find yourself typing a date into a page, stop: derive it instead, or the
two will disagree eventually.

**Scaffold a new trip, do not copy an old one.** `node scripts/new-trip.mjs
<slug> "<Name>" <start> <end>` creates the trip folder with `trip.json`,
`page.json` and `img/`. Every page renders through `src/pages/[slug]/`, so the
chrome, meta tags and nav come for free.

**Every trip folder appears on the homepage.**
A trip page nobody can navigate to is a trip page nobody reads. The homepage
card, and therefore the only route to the page, is generated from the trip
folder; the scaffolder creates it for you, and `scripts/check-dist.mjs` fails the build
both ways, for a trip with no card and for a card with no trip. Never link a
trip only from another trip page.

**Pages are data.** A trip page is its `page.json`: a list of typed sections
(see README). Something a page needs that no section type covers becomes a new
section type in `src/components/sections/` and `src/data/pages.ts`, so the next
trip can use it too. No trip gets a hand-written page.

**Date logic goes in `src/lib/trips.ts` with a test.** It is imported by both
the build and the browser, so there is one implementation and it is covered.

**Run `npm run verify` before pushing.** It is exactly what CI runs.

## Voice

This is the voice of the **site**, for anything a visitor reads: headings,
ledes, card blurbs, day descriptions, meta descriptions. It is not the voice
for commit messages, PR bodies or code comments, and it is separate from the
"writing in my voice" rules in the global config, which are for things I send
to people.

**Every page is for both of us, and about travelling together.** The site
is Os and Jabari's, not one person's plan shown to the other. The point of
these trips is time together, so that is the centre of every page: what we
do together comes first, and the rest is framed around it. This overrides
anything below that seems to pull the other way.

**"We" and "us", never "you".** No page is addressed to one reader. Not "a
room you can take calls in", but "a room Os can take calls in without waking
Jabari". `scripts/check-dist.mjs` fails the build on second person in page
copy.

**When the trip splits, name the person.** Some legs are one of us alone or
with family (Os north to Chiang Mai, Os with family in Vietnam). Say so in
the third person, by name: "Os heads north", "We meet in Hanoi on the 13th".
Never write it from either person's side ("with him", "alone from here", "at
Jabari's, with him and his mom").

**Names, not pronouns.** Neither of us has stated pronouns for the site, so
use names ("Jabari’s mom", "Os’s parents"), never he, she, his or her.

**Neither of us is "home".** Os is fully nomadic. Nothing is "closer to
home", "back home" or "at home" unless it is literally about one named
person's house ("Jabari’s place").

**Offer, do not instruct.** The shared register below is the default for
every page, including the Thailand one. The examples in this section are real
copy from `src/pages/thai/index.astro`.

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

> Hard deadline: the palace stops selling tickets at 15:30, so this only works if we leave on time.

> Covered shoulders and knees, enforced at the gate.

> Early is better: it is flat, shadeless and hot by eleven

**Give permission to skip things.** These are options, not a schedule.

> Two sections is plenty; the rest can be abandoned.

> Everything below is an option rather than a plan. Whatever appeals, and none of it if nothing does.

**Fragments are fine.** They carry the verdict.

> Not Airbnb.

> Different city from the night version.

**Evaluate flat, never enthusiastic.** Where something is good, say why in a
way that sounds like a person who has been there.

> Strange, ambitious, and the opposite of a crowd.

> Liveliest on weekends, half-asleep midweek, which may be the point.

**Say when you are not sure.** Hedge on the fact, not on the recommendation.

> sources put it around 10–18 October

### Shared trip pages

Every page is shared, so this is the register everywhere. The Vegas page is
the cleanest reference.

**Offer, do not instruct.** "The dusk slot is the good one" rather than "book
the dusk slot". "Morning slots are the calm ones" rather than "take the first
slot". Describe the thing and let people decide.

**Say out loud that nothing is compulsory.** People split up, some work, some
sleep in, some are not doing the 1am club. A shared page should make doing
things separately feel expected rather than like defecting.

**Written from inside the group.** "The rodeo misses us." "Two of these
suit all four of us." The page is written from inside the group.

**Never imply a decision has been made.** "None of it is booked" and "ideas
rather than a plan" are load-bearing. Anything that reads like a schedule
creates an obligation the page did not mean to create.

**Constraints stay factual, and that is not pressure.** Weight limits, age
limits, timed entry and closing times are useful precisely because they are
neutral. Keep those; it is the verbs around them that need softening.

### Private details stay off the site

The site is public and every trip has dates on it. Lodging addresses, booking
or listing links, host names and anything that says how close the stay is to
a named place ("on our block", "next door to Palace") never go on a page.
"Up the hill from the bay in Kailua-Kona" is the right level. Check-in and
checkout times are fine.

### Do not

**Do not describe the website.** The page is a plan someone is going to use,
not a product with features. "One page per trip", "kept up to date as things
change", "everything you need in one place" are all wrong. Write about the
travel instead.

**No brochure language.** No "must-see", "breathtaking", "hidden gem",
"stunning", "nestled", "vibrant", "bucket list". `scripts/check-dist.mjs` fails the
build on a list of these. Extend the list rather than working around it.

**No em dashes.** Use a comma, a full stop, or `·`, which is the separator the
site already uses everywhere. En dashes are fine inside numeric ranges
(`15–20 Oct`, `17:00–19:00`) and nowhere else. Also enforced by the check.

**Sentence case.** Not Title Case, in headings or anywhere else.

**No exclamation marks, no rhetorical questions, no throat-clearing.** Start
with the thing.
