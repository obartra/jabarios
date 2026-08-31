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
const imgDir = join(ROOT, 'public', slug, 'img');
const dataFile = join(ROOT, 'src', 'data', 'trips.ts');

if (existsSync(pageDir)) {
  console.error(`✗ src/pages/${slug}/ already exists. Pick another slug or edit that page.`);
  process.exit(1);
}

const data = readFileSync(dataFile, 'utf8');
if (data.includes(`slug: '${slug}'`)) {
  console.error(`✗ a trip with slug "${slug}" is already in src/data/trips.ts.`);
  process.exit(1);
}

const MARKER = '  // <new-trip> scripts/new-trip.mjs inserts above this line.';
if (!data.includes(MARKER)) {
  console.error(`✗ could not find the insertion marker in src/data/trips.ts.`);
  process.exit(1);
}

const entry = `  {
    slug: '${slug}',
    name: ${JSON.stringify(name)},
    start: '${start}',
    end: '${end}',
    countries: 1,
    lede: 'TODO: the hero line on the trip page.',
    blurb: 'TODO: two sentences for the homepage card.',
    description: 'TODO: meta description, at most 160 characters.',
    places: ['TODO'],
    notes: [],
    cover: '/${slug}/img/TODO.jpg',
    coverAlt: 'TODO: describe the cover photo.',
    featured: false,
    credits: [],
  },
`;

writeFileSync(dataFile, data.replace(MARKER, entry + MARKER));

mkdirSync(pageDir, { recursive: true });
mkdirSync(imgDir, { recursive: true });

const template = readFileSync(join(ROOT, 'src', 'pages', '_template', 'index.astro'), 'utf8')
  .replaceAll('__SLUG__', slug)
  .replaceAll('__NAME__', name);
writeFileSync(join(pageDir, 'index.astro'), template);

console.log(`✓ scaffolded "${name}"

  src/pages/${slug}/index.astro   the page
  public/${slug}/img/             put photos here
  src/data/trips.ts               entry added, fill in the TODOs

Next: replace the TODOs, add a cover photo with its credit, then run
  npm run verify`);
