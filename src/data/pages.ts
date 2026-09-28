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

const ShapeSection = z.strictObject({
  type: z.literal('shape'),
  title: Text.optional(),
  paragraphs: z.array(Text).min(1),
  notes: z.array(z.strictObject({ lead: Text, rest: Text })).min(1),
});

const TimelineSection = z.strictObject({
  type: z.literal('timeline'),
  ...Linked,
  items: z.array(z.strictObject({ when: Text, what: Text, detail: Text })).min(1),
});

const Place = z.strictObject({ name: Text, where: Text, detail: Text, url: z.url().optional() });

const PlacesSection = z.strictObject({
  type: z.literal('places'),
  ...Linked,
  /** One list, or several under their own sub-headings. */
  lists: z.array(z.strictObject({ title: Text.optional(), items: z.array(Place).min(1) })).min(1),
  caveat: Text.optional(),
});

const ActivitiesSection = z.strictObject({
  type: z.literal('activities'),
  /** Which categories to show here, in order. All of them if left out. */
  categories: z.array(Id).optional(),
  /** Tint alternate sections. Off when sections are interleaved with others. */
  alternate: z.boolean().default(true),
});

const DetailSection = z.strictObject({
  type: z.literal('detail'),
  rows: z.array(z.strictObject({ label: Text, text: Text })).min(1),
  daysTitle: Text.default('The fortnight, roughly'),
  days: z.array(Text).default([]),
});

const FeatureSection = z.strictObject({
  type: z.literal('feature'),
  id: Id,
  nav: Text.optional(),
  eyebrow: Text,
  headline: Text,
  steps: z.array(z.strictObject({ step: Text, detail: Text })).min(1),
  photo: z.strictObject({ file: Text, alt: Text.optional() }),
  chips: z.strictObject({ title: Text, items: z.array(Text).min(1) }).optional(),
  compareTitle: Text.optional(),
  compare: z
    .array(
      z.strictObject({
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

const BookingSection = z.strictObject({
  type: z.literal('booking'),
  title: Text.optional(),
  intro: Text,
  items: z.array(z.strictObject({ label: Text, detail: Text })).min(1),
  caveat: Text,
});

/** Blocks that sit inside a leg: one titled stretch of a trip, light or dark. */
const Chip = z.strictObject({ text: Text, kind: z.enum(['key', 'dry']).optional() });

const BlockSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('clock'),
    segments: z
      .array(
        z.strictObject({
          time: Text,
          label: Text,
          tone: z.enum(['calls', 'sleep', 'out', 'night']),
        }),
      )
      .min(1),
    legend: z.array(Text).default([]),
  }),
  z.strictObject({ kind: z.literal('figure'), file: Text, alt: Text.optional(), caption: Text }),
  z.strictObject({
    kind: z.literal('prose'),
    eyebrow: Text.optional(),
    paragraphs: z.array(Text).min(1),
  }),
  /** Small print. **Bold** marks a lead-in. */
  z.strictObject({ kind: z.literal('fine'), paragraphs: z.array(Text).min(1) }),
  z.strictObject({
    kind: z.literal('windows'),
    items: z
      .array(
        z.strictObject({
          day: Text,
          weekday: Text,
          head: Text,
          text: Text,
          free: z.boolean().default(false),
        }),
      )
      .min(1),
  }),
  z.strictObject({
    kind: z.literal('options'),
    title: Text,
    sub: Text.optional(),
    items: z
      .array(
        z.strictObject({ title: Text, meta: Text, text: Text, chips: z.array(Chip).default([]) }),
      )
      .min(1),
  }),
  z.strictObject({
    kind: z.literal('rows'),
    title: Text.optional(),
    sub: Text.optional(),
    items: z.array(z.strictObject({ k: Text, v: Text })).min(1),
  }),
  z.strictObject({
    kind: z.literal('cards'),
    eyebrow: Text.optional(),
    columns: z.union([z.literal(2), z.literal(3)]).default(2),
    items: z
      .array(
        z.strictObject({
          title: Text,
          sub: Text.optional(),
          text: Text,
          link: z.strictObject({ href: z.url(), label: Text }).optional(),
        }),
      )
      .min(1),
  }),
  z.strictObject({ kind: z.literal('callout'), title: Text, text: Text }),
  z.strictObject({
    kind: z.literal('dives'),
    eyebrow: Text.optional(),
    items: z.array(z.strictObject({ day: Text, site: Text, depth: Text, note: Text })).min(1),
  }),
  z.strictObject({
    kind: z.literal('checklist'),
    items: z.array(z.strictObject({ lead: Text, text: Text, by: Text })).min(1),
  }),
  z.strictObject({
    kind: z.literal('notes'),
    eyebrow: Text.optional(),
    items: z.array(z.strictObject({ title: Text, text: Text })).min(1),
  }),
]);

export type Block = z.infer<typeof BlockSchema>;

const LegSection = z.strictObject({
  type: z.literal('leg'),
  id: Id.optional(),
  nav: Text.optional(),
  /** Shown beside the nav label, e.g. "15–20". */
  navDates: Text.optional(),
  theme: z.enum(['light', 'sea']).default('light'),
  /** A hairline above the section, for two dark legs in a row. */
  rule: z.boolean().default(false),
  number: Text.optional(),
  title: Text.optional(),
  meta: Text.optional(),
  intro: Text.optional(),
  blocks: z.array(BlockSchema).min(1),
});

const CrossingSection = z.strictObject({
  type: z.literal('crossing'),
  text: Text,
  /** Coming back up from the dark legs to a light one. */
  up: z.boolean().default(false),
});

/**
 * A height-and-depth line through the trip. Positions are authored in the
 * chart's 1200 × 320 space; the phone version and its bars are derived from
 * the same stops, so the two can never disagree.
 */
const ProfileSection = z.strictObject({
  type: z.literal('profile'),
  label: Text,
  stops: z
    .array(
      z.strictObject({
        name: Text,
        metres: z.number(),
        date: Text.optional(),
        x: z.number(),
        y: z.number(),
        /** stack: name over value. inline: one line to the right. name: the name only. */
        mode: z.enum(['stack', 'inline', 'name']).default('stack'),
        anchor: z.enum(['start', 'middle', 'end']).default('middle'),
        /** Replaces the chart's value line, e.g. "31 Oct → Manila". */
        chartValue: Text.optional(),
      }),
    )
    .min(2),
  caption: z.array(Text).default([]),
});

const SectionSchema = z.discriminatedUnion('type', [
  ShapeSection,
  TimelineSection,
  PlacesSection,
  ActivitiesSection,
  DetailSection,
  FeatureSection,
  BookingSection,
  LegSection,
  CrossingSection,
  ProfileSection,
]);

export const PageSchema = z.strictObject({
  headline: Text,
  /** Tighter measure for a long headline, e.g. "17ch". */
  headlineWidth: z
    .string()
    .regex(/^\d+ch$/)
    .optional(),
  /** Chips under the lede. The hot one is filled. */
  tags: z
    .array(z.strictObject({ text: Text, hot: z.boolean().default(false) }).strict())
    .default([]),
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
    // Legs have an optional id; the rest that have one always do.
    if ('id' in section && section.id) {
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
    if (section.type === 'leg') {
      for (const block of section.blocks) if (block.kind === 'figure') photoOf(trip, block.file);
    }
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
 * into <em>, and **double** ones into <b>. The only markup copy can carry,
 * which keeps page.json plain text.
 */
export function emphasis(text: string): string {
  const escaped = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
