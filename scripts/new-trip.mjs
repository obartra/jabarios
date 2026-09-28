/**
 * Scaffolds a trip: the page, its photo directory, and an entry in the data
 * file. Everything else (card, status pill, day count, countdown, nav, footer,
 * social tags) follows from that entry, so this is the whole job.
 *
 *   node scripts/new-trip.mjs vegas "Las Vegas" 2026-12-18 2026-12-27
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const [slug, name, start, end] = process.argv.slice(2);

const usage =
  'usage: node scripts/new-trip.mjs <slug> "<Name>" <start YYYY-MM-DD> <end YYYY-MM-DD>';
if (!slug || !name || !start || !end) {
  console.error(usage);
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`✗ slug "${slug}" must be lowercase kebab-case.\n${usage}`);
  process.exit(1);
}
for (const [label, value] of [
  ['start', start],
  ['end', end],
]) {
  if (Number.isNaN(Date.parse(`${value}T12:00:00Z`))) {
    console.error(`✗ ${label} "${value}" is not an ISO calendar day.\n${usage}`);
    process.exit(1);
  }
}

const pageDir = join(ROOT, 'src', 'pages', slug);
const tripDir = join(ROOT, 'src', 'content', 'trips', slug);

if (existsSync(pageDir) || existsSync(tripDir)) {
  console.error(`✗ a trip called "${slug}" already exists. Pick another slug or edit that one.`);
  process.exit(1);
}

mkdirSync(join(tripDir, 'img'), { recursive: true });
const trip = {
  name,
  start,
  end,
  countries: 1,
  lede: 'TODO: the hero line on the trip page.',
  blurb: 'TODO: two sentences for the homepage card.',
  description: 'TODO: meta description, at most 160 characters.',
  places: ['TODO'],
  notes: [],
  cover: 'cover.jpg',
  photos: {
    'cover.jpg': {
      alt: 'TODO: describe the cover photo.',
      credit: {
        subject: 'TODO',
        author: 'TODO',
        licence: 'TODO',
        url: 'https://commons.wikimedia.org/wiki/File:TODO',
      },
    },
  },
};
writeFileSync(join(tripDir, 'trip.json'), JSON.stringify(trip, null, 2) + '\n');

mkdirSync(pageDir, { recursive: true });
const template = readFileSync(join(ROOT, 'src', 'pages', '_template', 'index.astro'), 'utf8')
  .replaceAll('__SLUG__', slug)
  .replaceAll('__NAME__', name);
writeFileSync(join(pageDir, 'index.astro'), template);

console.log(`✓ scaffolded "${name}"

  src/content/trips/${slug}/trip.json   metadata and the photo registry, fill in the TODOs
  src/content/trips/${slug}/img/        photos go here, starting with cover.jpg
  src/pages/${slug}/index.astro         the page

Next: add img/cover.jpg with its credit, replace the TODOs, then run
  npm run verify`);
