import { z } from 'zod';
import { categoriesFor } from './activities.ts';
import { tripFolders } from './content.ts';
import { photoOf, tripBySlug } from './trips.ts';

/**
 * The body of each trip page, from the trip folder's page.json: a headline, a
 * footer line, and an ordered list of sections, each one of a small set of
 * types rendered by src/pages/[slug]/index.astro. Copy may mark emphasis with
 * *asterisks*, which renders as the site's coloured <em>.
 */

const Id = z.string().regex(/^[a-z0-9-]+$/, 'ids are lowercase kebab-case');
const Text = z.string().min(1);

const Linked = { id: Id, nav: Text.optional(), title: Text, note: Text.optional() };

const ShapeSection = z.object({
  type: z.literal('shape'),
  title: Text.optional(),
  paragraphs: z.array(Text).min(1),
  notes: z.array(z.object({ lead: Text, rest: Text })).min(1),
});

const TimelineSection = z.object({
  type: z.literal('timeline'),
  ...Linked,
  items: z.array(z.object({ when: Text, what: Text, detail: Text })).min(1),
});

const Place = z.object({ name: Text, where: Text, detail: Text, url: z.url().optional() });

const PlacesSection = z.object({
  type: z.literal('places'),
  ...Linked,
  /** One list, or several under their own sub-headings. */
  lists: z.array(z.object({ title: Text.optional(), items: z.array(Place).min(1) })).min(1),
  caveat: Text.optional(),
});

const ActivitiesSection = z.object({
  type: z.literal('activities'),
  /** Which categories to show here, in order. All of them if left out. */
  categories: z.array(Id).optional(),
  /** Tint alternate sections. Off when sections are interleaved with others. */
  alternate: z.boolean().default(true),
});

const DetailSection = z.object({
  type: z.literal('detail'),
  rows: z.array(z.object({ label: Text, text: Text })).min(1),
  daysTitle: Text.default('The fortnight, roughly'),
  days: z.array(Text).default([]),
});

const FeatureSection = z.object({
  type: z.literal('feature'),
  id: Id,
  nav: Text.optional(),
  eyebrow: Text,
  headline: Text,
  steps: z.array(z.object({ step: Text, detail: Text })).min(1),
  photo: z.object({ file: Text, alt: Text.optional() }),
  chips: z.object({ title: Text, items: z.array(Text).min(1) }).optional(),
  compareTitle: Text.optional(),
  compare: z
    .array(
      z.object({
        name: Text,
        pick: z.boolean().default(false),
        price: Text,
        url: z.url(),
        rows: z.array(z.tuple([Text, Text])).min(1),
      }),
    )
    .default([]),
  note: Text.optional(),
});

const BookingSection = z.object({
  type: z.literal('booking'),
  title: Text.optional(),
  intro: Text,
  items: z.array(z.object({ label: Text, detail: Text })).min(1),
  caveat: Text,
});

const SectionSchema = z.discriminatedUnion('type', [
  ShapeSection,
  TimelineSection,
  PlacesSection,
  ActivitiesSection,
  DetailSection,
  FeatureSection,
  BookingSection,
]);

const PageSchema = z.object({
  headline: Text,
  /** Tighter measure for a long headline, e.g. "17ch". */
  headlineWidth: z
    .string()
    .regex(/^\d+ch$/)
    .optional(),
  /** The footer line under the trip name. "{nights}" is filled in from the dates. */
  footer: Text,
  sections: z.array(SectionSchema).min(1),
});

export type Section = z.infer<typeof SectionSchema>;
export type Page = z.infer<typeof PageSchema>;

function check(slug: string, page: Page) {
  const trip = tripBySlug(slug);
  const known = categoriesFor(slug).map((c) => c.id);
  const ids = new Set<string>(known);
  for (const section of page.sections) {
    if ('id' in section) {
      if (ids.has(section.id))
        throw new Error(`page "${slug}": duplicate section id "${section.id}"`);
      ids.add(section.id);
    }
    if (section.type === 'activities') {
      for (const id of section.categories ?? []) {
        if (!known.includes(id)) throw new Error(`page "${slug}": no activity category "${id}"`);
      }
    }
    if (section.type === 'feature') photoOf(trip, section.photo.file);
  }
  if (page.footer.includes('{nights}') && !trip.dates) {
    throw new Error(`page "${slug}": the footer uses {nights} but the trip has no dates`);
  }
}

function load(): Record<string, Page> {
  const out: Record<string, Page> = {};
  for (const { slug, page } of tripFolders()) {
    if (page === null) continue;
    const result = PageSchema.safeParse(page);
    if (!result.success) {
      throw new Error(
        `invalid page.json for "${slug}":\n` +
          result.error.issues
            .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('\n'),
      );
    }
    check(slug, result.data);
    out[slug] = result.data;
  }
  return out;
}

export const PAGES: Readonly<Record<string, Page>> = load();

export function pageFor(slug: string): Page | undefined {
  return PAGES[slug];
}

/**
 * Copy with *emphasis* as HTML: everything escaped, then asterisk pairs turned
 * into <em>. The only markup copy can carry, which keeps page.json plain text.
 */
export function emphasis(text: string): string {
  const escaped = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
