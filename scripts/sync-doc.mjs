/**
 * Pulls the shared date night Google Doc and writes the snapshot the page
 * renders. Writes only when the content changed, so the scheduled workflow
 * commits only real edits.
 *
 *   node scripts/sync-doc.mjs            fetch the live doc
 *   node scripts/sync-doc.mjs <file>     parse a saved export instead
 *
 * Exits 1 without touching the snapshot if the export does not parse, which
 * is what a sign-in page or a sharing change looks like.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseGoogleDoc } from '../src/lib/gdoc.ts';
import { DOC_EXPORT_URL } from '../src/data/date-night-source.ts';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'src', 'data', 'date-night.json');

async function load(source) {
  if (source) return readFileSync(source, 'utf8');
  const res = await fetch(DOC_EXPORT_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`export returned HTTP ${res.status}`);
  return res.text();
}

try {
  const snapshot = parseGoogleDoc(await load(process.argv[2]));
  const next = JSON.stringify(snapshot, null, 2) + '\n';
  let prev = '';
  try {
    prev = readFileSync(OUT, 'utf8');
  } catch {
    // First run.
  }
  if (next === prev) {
    console.log('✓ date night doc unchanged');
  } else {
    writeFileSync(OUT, next);
    console.log(`✓ date night doc updated: ${snapshot.blocks.length} blocks`);
  }
} catch (err) {
  console.error(`✗ could not sync the date night doc: ${err.message}`);
  process.exit(1);
}
