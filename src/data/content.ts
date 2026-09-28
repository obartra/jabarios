import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads the trip folders under src/content/trips. One folder per trip, named
 * by its slug:
 *
 *   src/content/trips/<slug>/trip.json         metadata and the photo registry
 *   src/content/trips/<slug>/activities.json   optional: categories and cards
 *   src/content/trips/<slug>/page.json         optional: the page's sections
 *   src/content/trips/<slug>/img/              the photos, optimised at build
 *
 * Plain fs rather than import.meta.glob, so the same data loads in the Astro
 * build, in vitest, in the Playwright specs and in scripts/check-dist.mjs.
 * Paths resolve from the working directory, which is the project root for all
 * of those.
 */
export const CONTENT_ROOT = join(process.cwd(), 'src', 'content', 'trips');

export interface TripFolder {
  slug: string;
  dir: string;
  trip: unknown;
  activities: unknown | null;
  page: unknown | null;
  /** File names in img/, sorted. */
  images: string[];
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`could not read ${path}: ${(err as Error).message}`, { cause: err });
  }
}

export function tripFolders(): TripFolder[] {
  return readdirSync(CONTENT_ROOT)
    .filter((name) => statSync(join(CONTENT_ROOT, name)).isDirectory())
    .sort()
    .map((slug) => {
      const dir = join(CONTENT_ROOT, slug);
      const optional = (file: string) =>
        existsSync(join(dir, file)) ? readJson(join(dir, file)) : null;
      const imgDir = join(dir, 'img');
      return {
        slug,
        dir,
        trip: readJson(join(dir, 'trip.json')),
        activities: optional('activities.json'),
        page: optional('page.json'),
        images: existsSync(imgDir)
          ? readdirSync(imgDir)
              .filter((f) => !f.startsWith('.'))
              .sort()
          : [],
      };
    });
}
