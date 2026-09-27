import { z } from 'zod';

/**
 * Turns a Google Doc's HTML export into a small, stable structure the site can
 * render in its own styles. Used by scripts/sync-doc.mjs, which commits the
 * result, so the build itself never touches the network.
 *
 * Stability matters more than fidelity: the sync only commits when the output
 * changes, so anything Google varies per export (class names, inline styles,
 * the tracking parameters on redirect links) must not reach the output.
 */

const RunSchema = z.object({
  text: z.string().min(1),
  href: z.url().optional(),
});

const BlockSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('heading'),
    level: z.number().int().min(1).max(6),
    runs: z.array(RunSchema).min(1),
  }),
  z.object({ kind: z.literal('paragraph'), runs: z.array(RunSchema).min(1) }),
  z.object({
    kind: z.literal('item'),
    ordered: z.boolean(),
    depth: z.number().int().min(0).max(8),
    runs: z.array(RunSchema).min(1),
  }),
]);

export const DocSnapshotSchema = z.object({
  title: z.string().min(1),
  /**
   * An export with no content at all is far more likely to be a sign-in page
   * or a sharing change than a real empty doc, so it is refused rather than
   * synced over the last good copy.
   */
  blocks: z.array(BlockSchema).min(1),
});

export type Run = z.infer<typeof RunSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type DocSnapshot = z.infer<typeof DocSnapshotSchema>;

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n =
        code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
    }
    return NAMED[code.toLowerCase()] ?? whole;
  });
}

/**
 * Google wraps every link in a google.com/url redirect whose `ust` and `usg`
 * parameters change on each export. Unwrap it, or every sync is a change.
 * Anything that is not http(s) or mailto is dropped rather than rendered.
 */
export function cleanHref(raw: string): string | undefined {
  let href = decodeEntities(raw).trim();
  try {
    const url = new URL(href);
    if (url.hostname === 'www.google.com' && url.pathname === '/url' && url.searchParams.get('q')) {
      href = url.searchParams.get('q')!;
    }
    const final = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(final.protocol) ? final.href : undefined;
  } catch {
    return undefined;
  }
}

function plain(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''));
}

/** Text and links in document order, whitespace collapsed, adjacent plain text merged. */
export function runsOf(html: string): Run[] {
  const runs: Run[] = [];
  const push = (text: string, href?: string) => {
    if (!text) return;
    const last = runs.at(-1);
    if (last && !last.href && !href) last.text += text;
    else runs.push(href ? { text, href } : { text });
  };

  let at = 0;
  for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    push(plain(html.slice(at, m.index)));
    push(plain(m[2]!), cleanHref(m[1]!));
    at = m.index! + m[0].length;
  }
  push(plain(html.slice(at)));

  // Collapse whitespace across run boundaries, then trim the ends.
  const out = runs.map((r) => ({ ...r, text: r.text.replace(/\s+/g, ' ') }));
  if (out[0]) out[0].text = out[0].text.trimStart();
  if (out.at(-1)) out.at(-1)!.text = out.at(-1)!.text.trimEnd();
  return out.filter((r) => r.text.length > 0);
}

/** Joins neighbouring plain runs, so the output does not depend on how Google split the spans. */
function merge(runs: Run[]): Run[] {
  const out: Run[] = [];
  for (const run of runs) {
    const last = out.at(-1);
    if (last && !last.href && !run.href) last.text += run.text;
    else out.push({ ...run });
  }
  return out;
}

export function parseGoogleDoc(html: string): DocSnapshot {
  const body = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1];
  if (!body) throw new Error('no <body> in the export; is the doc still shared by link?');

  let title = '';
  const blocks: Block[] = [];

  const top = /<(p|h[1-6]|ul|ol|table)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  for (const [, rawTag, attrs, inner] of body.matchAll(top)) {
    const tag = rawTag!.toLowerCase();
    const cls = attrs!.match(/\bclass="([^"]*)"/)?.[1] ?? '';

    if (tag === 'p' && /\btitle\b/.test(cls)) {
      title ||= runsOf(inner!)
        .map((r) => r.text)
        .join('');
      continue;
    }

    if (tag[0] === 'h') {
      const runs = runsOf(inner!);
      if (runs.length) blocks.push({ kind: 'heading', level: Number(tag[1]), runs });
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      // Google flattens nesting into sibling lists and puts the level on the
      // class, e.g. lst-kix_abc123-1 for one level in.
      const depth = Number(cls.match(/lst-kix_\w+-(\d+)/)?.[1] ?? 0);
      for (const [, li] of inner!.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
        const runs = runsOf(li!);
        if (runs.length) blocks.push({ kind: 'item', ordered: tag === 'ol', depth, runs });
      }
      continue;
    }

    if (tag === 'table') {
      // No table styling on the page: each row becomes one line.
      for (const [, row] of inner!.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
        const cells = [...row!.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
          .map(([, td]) => runsOf(td!))
          .filter((runs) => runs.length);
        const runs = merge(cells.flatMap((cell, i) => (i ? [{ text: ' · ' }, ...cell] : cell)));
        if (runs.length) blocks.push({ kind: 'paragraph', runs });
      }
      continue;
    }

    const runs = runsOf(inner!);
    if (runs.length) blocks.push({ kind: 'paragraph', runs });
  }

  return DocSnapshotSchema.parse({ title: title || 'Untitled', blocks });
}

export type Rendered =
  | { kind: 'heading'; level: number; runs: Run[] }
  | { kind: 'paragraph'; runs: Run[] }
  | { kind: 'list'; ordered: boolean; items: { depth: number; runs: Run[] }[] };

/** Consecutive list items become one list, so the page can render real <ul>s. */
export function groupBlocks(blocks: Block[]): Rendered[] {
  const out: Rendered[] = [];
  for (const block of blocks) {
    if (block.kind !== 'item') {
      out.push(block);
      continue;
    }
    const last = out.at(-1);
    const item = { depth: block.depth, runs: block.runs };
    if (last?.kind === 'list' && last.ordered === block.ordered) last.items.push(item);
    else out.push({ kind: 'list', ordered: block.ordered, items: [item] });
  }
  return out;
}
