import { z } from 'zod';
import { tripFolders } from './content.ts';
import { photoOf, trips, type Credit } from './trips.ts';

/**
 * Things to do on a trip, one entry per option, from each trip folder's
 * activities.json. The trip pages render these as a scannable grid rather than
 * an itinerary: the point is to see what is on offer, what it costs and how
 * long it eats, and then choose.
 *
 * An activity names its photo by file name; the alt text and credit come from
 * the trip's photo registry in trip.json, so a photo is described once and can
 * never arrive without its attribution.
 */

export type { Credit };

const CategorySchema = z.object({
  /** Anchor id for the section and the sticky nav. Unique within its trip. */
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  /** What the sticky nav shows, where the full label is too long. */
  short: z.string().min(1),
  note: z.string().min(1),
});

export type Category = z.infer<typeof CategorySchema>;

const ActivitySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  /** One of the ids in this trip's own categories; load() checks it. */
  category: z.string().regex(/^[a-z0-9-]+$/),
  /** Free text so it can say "per car" or "for two", but always concrete. */
  price: z.string().min(1),
  duration: z.string().min(1),
  blurb: z.string().min(1),
  /** Short constraints and gotchas. Three or four, scannable. */
  facts: z.array(z.string().min(1)).min(1).max(5),
  /** A file name in the trip's img/, described in trip.json's photos. */
  photo: z.string().min(1),
  /**
   * Shape of the photo. Every activity in a category must agree, or the cards
   * in a row end up different heights; activities.test.ts checks that.
   */
  aspect: z.enum(['landscape', 'portrait']).default('landscape'),
  link: z.url().optional(),
});

const FileSchema = z.object({
  /**
   * In the order the sections appear on the page. Per trip rather than global
   * because the grouping is part of the writing.
   */
  categories: z.array(CategorySchema).min(1),
  items: z.array(ActivitySchema).min(1),
});

export type Activity = z.infer<typeof ActivitySchema> & {
  /** The trip this belongs to, for resolving the photo. */
  trip: string;
  photoAlt: string;
  credit: Credit;
};

function load() {
  const categories: Record<string, Category[]> = {};
  const items: Record<string, Activity[]> = {};
  for (const { slug, activities } of tripFolders()) {
    if (activities === null) continue;
    const result = FileSchema.safeParse(activities);
    if (!result.success) {
      throw new Error(
        `invalid activities.json for "${slug}":\n` +
          result.error.issues
            .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('\n'),
      );
    }
    const trip = trips.find((t) => t.slug === slug)!;
    const known = result.data.categories;
    const seen = new Set<string>();
    categories[slug] = known;
    items[slug] = result.data.items.map((item) => {
      if (seen.has(item.id)) throw new Error(`duplicate activity id "${item.id}" in "${slug}"`);
      seen.add(item.id);
      if (!known.some((c) => c.id === item.category)) {
        throw new Error(
          `activity "${item.id}" is in category "${item.category}", which is not one of ` +
            `${slug}'s categories (${known.map((c) => c.id).join(', ')}).`,
        );
      }
      const photo = photoOf(trip, item.photo);
      return { ...item, trip: slug, photoAlt: photo.alt, credit: photo.credit };
    });
  }
  return { categories, items };
}

const loaded = load();

/** Categories per trip, in page order. */
export const CATEGORIES: Readonly<Record<string, readonly Category[]>> = loaded.categories;

export function categoriesFor(slug: string): readonly Category[] {
  return CATEGORIES[slug] ?? [];
}

export function activitiesFor(slug: string): Activity[] {
  return loaded.items[slug] ?? [];
}

/** The trip's categories that actually have something in them, in order. */
export function groupedFor(slug: string) {
  const list = activitiesFor(slug);
  return categoriesFor(slug)
    .map((category) => ({
      ...category,
      items: list.filter((a) => a.category === category.id),
    }))
    .filter((group) => group.items.length > 0);
}
