/**
 * Post-build integrity and house-style check, run against dist/ so it inspects
 * exactly what gets served rather than what the source implies. Runs as part of
 * `npm run build`, which is also Netlify's build command, so a failure here
 * fails the deploy.
 *
 *   node scripts/check-dist.mjs
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { trips } from '../src/data/trips.ts';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

if (!existsSync(DIST)) {
  console.error('✗ dist/ does not exist. Run `astro build` first.');
  process.exit(1);
}

function walk(dir, ext) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full, ext);
    return extname(name) === ext ? [full] : [];
  });
}

const pages = walk(DIST, '.html');
if (pages.length === 0) problems.push('dist/ contains no HTML at all');

// ---------------------------------------------------------------- links ----

const EXTERNAL = /^(https?:|mailto:|tel:|data:|#|\/\/)/i;

function resolveLink(link, pageFile) {
  const path = link.split('#')[0].split('?')[0];
  if (!path) return null;
  const base = path.startsWith('/') ? DIST : dirname(pageFile);
  const target = resolve(base, path.replace(/^\//, ''));
  if (existsSync(target) && statSync(target).isDirectory()) return join(target, 'index.html');
  return target;
}

// ------------------------------------------------------------ house style --
// Voice is a judgement call, but these two are objective. See CLAUDE.md.
const BROCHURE = [
  'must-see',
  'must see',
  'breathtaking',
  'hidden gem',
  'unforgettable',
  'bucket list',
  'stunning',
  'nestled',
  'vibrant',
  'idyllic',
  'picturesque',
  'a feast for the senses',
  'like no other',
  'world-class',
  'paradise',
];

function visibleText(html) {
  // Comments first: one containing a '>' would otherwise leak its tail into
  // the text and trip these rules on an ordinary code note.
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ');
}

const seenPaths = new Map();

for (const file of pages) {
  const rel = relative(DIST, file);
  const html = readFileSync(file, 'utf8');

  for (const [, attr, value] of html.matchAll(/\b(href|src)="([^"]*)"/g)) {
    if (!value || EXTERNAL.test(value)) continue;
    const target = resolveLink(value, file);
    if (target && !existsSync(target)) {
      fail(rel, `dead ${attr} "${value}" (looked for ${relative(DIST, target)})`);
    }
  }

  if (!/<title>[^<]+<\/title>/.test(html)) fail(rel, 'missing a non-empty <title>');
  if (!/<meta name="description" content="[^"]+"/.test(html)) fail(rel, 'missing meta description');
  if (!/<html lang="/.test(html)) fail(rel, 'missing lang on <html>');

  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(tag)) fail(rel, `<img> without alt: ${tag.slice(0, 80)}`);
    else if (/\balt=""/.test(tag)) fail(rel, `<img> with empty alt: ${tag.slice(0, 80)}`);
  }

  // Canonical must point at this file's own URL, or duplicates get indexed.
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) {
    fail(rel, 'missing canonical');
  } else {
    const expected = rel === 'index.html' ? '/' : `/${rel.replace(/index\.html$/, '')}`;
    const got = new URL(canonical).pathname;
    if (got !== expected)
      fail(rel, `canonical is "${got}" but the page is served at "${expected}"`);
    if (seenPaths.has(got))
      fail(rel, `canonical "${got}" is also claimed by ${seenPaths.get(got)}`);
    seenPaths.set(got, rel);
  }

  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if (ogImage) {
    const path = new URL(ogImage).pathname;
    if (!existsSync(join(DIST, path))) fail(rel, `og:image "${path}" is not in the build`);
  }

  const text = visibleText(html);
  if (text.includes('—')) {
    const at = text.indexOf('—');
    const near = text
      .slice(Math.max(0, at - 40), at + 40)
      .replace(/\s+/g, ' ')
      .trim();
    fail(rel, `em dash in copy, use a comma, a full stop or "·": "…${near}…"`);
  }
  const lower = text.toLowerCase();
  for (const word of BROCHURE) {
    if (lower.includes(word)) fail(rel, `brochure phrasing "${word}" in copy`);
  }
}

// ---------------------------------------------------------------- trips ----

const home = readFileSync(join(DIST, 'index.html'), 'utf8');
const carded = new Set([...home.matchAll(/data-slug="([^"]+)"/g)].map((m) => m[1]));

for (const trip of trips) {
  const page = join(DIST, trip.slug, 'index.html');
  if (!existsSync(page)) {
    fail(
      `trip "${trip.slug}"`,
      `no page was built at /${trip.slug}/ (add src/pages/${trip.slug}/index.astro)`,
    );
  }
  if (!carded.has(trip.slug)) {
    fail(`trip "${trip.slug}"`, 'is in the data but has no card on the homepage');
  }

  // Every bundled photo needs attribution; that is the licence, not a nicety.
  const imgDir = join(DIST, trip.slug, 'img');
  if (existsSync(imgDir)) {
    const photos = readdirSync(imgDir).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
    if (photos.length > 0 && trip.credits.length === 0) {
      fail(`trip "${trip.slug}"`, `bundles ${photos.length} photos but declares no credits`);
    }
    if (photos.length > trip.credits.length) {
      fail(
        `trip "${trip.slug}"`,
        `${photos.length} photos but only ${trip.credits.length} credits, so something is unattributed`,
      );
    }
    const creditsHtml = existsSync(page) ? readFileSync(page, 'utf8') : '';
    for (const credit of trip.credits) {
      if (!creditsHtml.includes(credit.url)) {
        fail(`trip "${trip.slug}"`, `credit for "${credit.subject}" never renders on the page`);
      }
    }
  }
}

for (const slug of carded) {
  if (!trips.some((t) => t.slug === slug)) {
    fail('index.html', `card for "${slug}" has no matching entry in src/data/trips.ts`);
  }
}

// ---------------------------------------------------------------- report ---

if (problems.length) {
  console.error(`✗ ${problems.length} problem${problems.length > 1 ? 's' : ''}:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `✓ ${pages.length} pages, ${trips.length} trip(s), ${[...carded].length} card(s): links, meta, alt text, canonicals, credits and house style all check out.`,
);
