import type { ImageMetadata } from 'astro';

/**
 * Every trip photo as an Astro image module, so components can hand it to
 * <Picture> and get resized, re-encoded copies instead of the full original.
 * Only usable inside Astro components; the data modules refer to photos by
 * file name and stay plain Node.
 */
const files = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/trips/*/img/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

export function photo(slug: string, file: string): ImageMetadata {
  const found = files[`/src/content/trips/${slug}/img/${file}`];
  if (!found) throw new Error(`no photo src/content/trips/${slug}/img/${file}`);
  return found.default;
}

/**
 * Widths the <Picture> components ask for. The largest covers a full-width
 * hero on a desktop screen at 2x; phones pick the small ones.
 */
export const WIDTHS = [480, 800, 1200, 1600];
