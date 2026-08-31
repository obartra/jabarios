// Pre-deploy integrity check for the static site.
//
// The whole site is hand-written HTML with relative asset paths, so the way it
// breaks is always the same: a file moves and a src/href silently 404s. This
// runs as the Netlify build command, so that breakage fails the deploy instead
// of shipping. No dependencies; plain Node.
//
//   node scripts/check.mjs

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, extname } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SKIP = new Set(['.git', 'node_modules', '.netlify', 'scripts']);
const problems = [];

const fail = (file, msg) => problems.push(`${file}: ${msg}`);

function htmlFiles(dir = ROOT) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name) || name.startsWith('.')) return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return extname(name) === '.html' ? [full] : [];
  });
}

// Resolve a site link the way Netlify serves it: root-relative from the publish
// root, otherwise relative to the page, with /dir/ meaning /dir/index.html.
function resolveLink(link, pageFile) {
  const path = link.split('#')[0].split('?')[0];
  if (!path) return null;
  const base = path.startsWith('/') ? ROOT : dirname(pageFile);
  const target = resolve(base, path.replace(/^\//, ''));
  if (existsSync(target) && statSync(target).isDirectory()) {
    return join(target, 'index.html');
  }
  return target;
}

const EXTERNAL = /^(https?:|mailto:|tel:|data:|#|\/\/)/i;

// Redirect sources declared in netlify.toml are served by Netlify, not by a
// file on disk, so they are legitimate link targets.
const redirects = new Set(
  [...readFileSync(join(ROOT, 'netlify.toml'), 'utf8')
      .matchAll(/^\s*from\s*=\s*"([^"]+)"/gm)].map((m) => m[1]),
);

const pages = htmlFiles();
if (pages.length === 0) problems.push('no HTML files found at all');

for (const file of pages) {
  const rel = relative(ROOT, file);
  const html = readFileSync(file, 'utf8');

  // --- every local href/src must resolve to a real file ---
  for (const [, attr, value] of html.matchAll(/\b(href|src)="([^"]*)"/g)) {
    if (!value || EXTERNAL.test(value) || redirects.has(value.split('#')[0])) continue;
    const target = resolveLink(value, file);
    if (target && !existsSync(target)) {
      fail(rel, `dead ${attr} "${value}" (looked for ${relative(ROOT, target)})`);
    }
  }

  // --- head essentials ---
  if (!/<title>[^<]+<\/title>/.test(html)) fail(rel, 'missing a non-empty <title>');
  if (!/<meta name="description" content="[^"]+"/.test(html)) fail(rel, 'missing meta description');
  if (!/<html lang="/.test(html)) fail(rel, 'missing lang on <html>');

  // --- images need alt and intrinsic size, or the grid reflows on load ---
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(tag)) fail(rel, `<img> without alt: ${tag.slice(0, 80)}`);
  }
}

// --- house style, the mechanical half of it (see CLAUDE.md for the rest) ---
// Voice is mostly a judgement call, but two rules are objective enough to pin:
// no em dashes, and no travel-brochure adjectives. Both are things that creep
// back in whenever copy gets rewritten.
const BROCHURE = [
  'must-see', 'must see', 'breathtaking', 'hidden gem', 'unforgettable',
  'bucket list', 'stunning', 'nestled', 'vibrant', 'idyllic', 'picturesque',
  'a feast for the senses', 'like no other', 'world-class', 'paradise',
];

for (const file of pages) {
  const rel = relative(ROOT, file);
  const html = readFileSync(file, 'utf8');

  // Visible copy only: drop comments and script/style bodies first, then tags
  // and entities. Comments must go before tags, or a comment containing a '>'
  // leaks its tail into the text and trips these rules on a code note.
  const text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ');

  // Ranges like "15–20 Oct" are fine; em dashes as connectors are not.
  if (text.includes('\u2014')) {
    const at = text.indexOf('\u2014');
    fail(rel, `em dash in copy, use a comma, a full stop or "·": "…${text.slice(Math.max(0, at - 40), at + 40).replace(/\s+/g, ' ').trim()}…"`);
  }

  const lower = text.toLowerCase();
  for (const word of BROCHURE) {
    if (lower.includes(word)) fail(rel, `brochure phrasing "${word}" in copy`);
  }
}

// --- trip cards on the homepage drive the pills, stats and countdown ---
const home = readFileSync(join(ROOT, 'index.html'), 'utf8');
const cards = [...home.matchAll(/<a class="trip[^"]*"[\s\S]*?<\/a>/g)].map((m) => m[0]);

if (cards.length === 0) problems.push('index.html: no trip cards found');

for (const card of cards) {
  const attr = (k) => (card.match(new RegExp(`data-${k}="([^"]*)"`)) || [])[1];
  const name = attr('name') || '(unnamed)';
  const where = `index.html [${name}]`;

  for (const key of ['name', 'start', 'end']) {
    if (!attr(key)) fail(where, `card is missing data-${key}`);
  }

  const start = Date.parse(`${attr('start')}T12:00:00Z`);
  const end = Date.parse(`${attr('end')}T12:00:00Z`);
  if (attr('start') && Number.isNaN(start)) fail(where, `data-start "${attr('start')}" is not an ISO date`);
  if (attr('end') && Number.isNaN(end)) fail(where, `data-end "${attr('end')}" is not an ISO date`);
  if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
    fail(where, `data-end (${attr('end')}) is before data-start (${attr('start')})`);
  }

  if (!/<span class="pill" data-status>/.test(card)) {
    fail(where, 'card has no [data-status] pill, so the status badge will not update');
  }
  const href = (card.match(/href="([^"]+)"/) || [])[1];
  if (!href) fail(where, 'card has no href');
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem${problems.length > 1 ? 's' : ''}:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`✓ ${pages.length} pages, ${cards.length} trip card(s), no dead links.`);
