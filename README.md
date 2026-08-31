# jabarios.com

Trip pages. Hand-written static HTML, no framework, no build step. Netlify
publishes the repo root as-is on every push to `main`.

```
index.html          homepage, the list of trips
404.html
favicon.svg
thai/index.html     Thailand, 15 Oct – 1 Nov 2026
thai/img/*.jpg      photos for that trip, bundled with the page
netlify.toml        publish settings, headers, redirects
scripts/check.mjs   pre-deploy integrity check (runs as the build command)
```

## Adding a trip

1. Make the folder: `mkdir -p <slug>/img`, and put the page at
   `<slug>/index.html`. It gets served at `/<slug>/`.
2. Copy a card in `index.html` and edit it. That block is the only thing the
   homepage needs:

```html
<a class="trip rev" href="/<slug>/"
   data-name="Place" data-start="2027-03-04" data-end="2027-03-18" data-countries="1">
```

Everything else is derived at runtime from those dates: the status pill
(Upcoming / Happening now / Past), the Upcoming/Past filter, the trip and day
counts in the header, and the countdown to the next departure. Nothing to
update by hand when a trip becomes the past.

Add `class="trip feature rev"` to let a card span two columns on desktop.

## Checks

```bash
node scripts/check.mjs
```

Verifies every local `href`/`src` resolves to a real file, that each page has a
title, description and `lang`, that every `<img>` has `alt`, and that each trip
card has parseable dates and a live link. Netlify runs it as the build command,
so a dead link fails the deploy rather than shipping. It also runs in CI on
every push and PR.

## Local preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Use a server rather than opening the file
directly, so the root-relative links (`/thai/`, `/favicon.svg`) resolve.

## Photos

From Wikimedia Commons under Creative Commons licences, bundled per trip.
Per-photo attribution is in the footer of each trip page. Keep it there when
adding photos.
