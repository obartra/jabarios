import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  cleanHref,
  decodeEntities,
  DocSnapshotSchema,
  groupBlocks,
  parseGoogleDoc,
  runsOf,
} from './gdoc.ts';
import { dateNight } from '../data/date-night.ts';

// A real export of the date night doc, saved as-is.
const fixture = readFileSync(join(import.meta.dirname, 'fixtures', 'date-night.html'), 'utf8');

const wrap = (body: string) => `<html><head></head><body class="doc">${body}</body></html>`;

describe('parseGoogleDoc on a real export', () => {
  const doc = parseGoogleDoc(fixture);

  it('takes the title from the title paragraph, not the first heading', () => {
    expect(doc.title).toBe('Date Night Ideas');
    expect(doc.blocks[0]).toEqual({
      kind: 'heading',
      level: 1,
      runs: [{ text: '🔔 Philly Activities' }],
    });
  });

  it('keeps headings and list items in document order', () => {
    expect(doc.blocks.map((b) => b.kind)).toEqual([
      'heading',
      'item',
      'item',
      'item',
      'heading',
      'item',
      'item',
      'heading',
      'item',
      'item',
      'item',
    ]);
  });

  it('decodes entities, including emoji and ampersands', () => {
    const texts = doc.blocks.flatMap((b) => b.runs.map((r) => r.text));
    expect(texts).toContain('Fishtown Bars & Highlights');
    expect(texts).toContain('Hayao Miyazaki (all! 😂)');
  });

  it('unwraps the Google redirect so the link is stable between exports', () => {
    const links = doc.blocks.flatMap((b) => b.runs).filter((r) => r.href);
    expect(links).toEqual([
      { text: 'Toynbee Tiles Documentary', href: 'https://www.youtube.com/watch?v=LYTK6QicICo' },
    ]);
  });

  it('parses into the same shape the committed snapshot has', () => {
    // The snapshot changes on every doc edit, so it is compared by shape, not
    // content: whatever the sync wrote must be something this parser produces.
    expect(DocSnapshotSchema.parse(dateNight)).toEqual(dateNight);
    expect(Object.keys(doc).sort()).toEqual(Object.keys(dateNight).sort());
  });
});

describe('parseGoogleDoc edge cases', () => {
  it('refuses an export with no content rather than wiping the page', () => {
    expect(() => parseGoogleDoc(wrap('<p class="title"><span>Only a title</span></p>'))).toThrow();
    expect(() => parseGoogleDoc('<html><body></body>')).toThrow();
    expect(() => parseGoogleDoc('Sign in to continue')).toThrow(/body/);
  });

  it('skips empty spacer paragraphs', () => {
    const doc = parseGoogleDoc(wrap('<p class="c1"><span></span></p><p><span>Real</span></p>'));
    expect(doc.blocks).toEqual([{ kind: 'paragraph', runs: [{ text: 'Real' }] }]);
  });

  it('reads nesting depth from the list class and knows ordered lists', () => {
    const doc = parseGoogleDoc(
      wrap(
        '<ol class="c1 lst-kix_abc-0 start"><li>One</li></ol>' +
          '<ul class="c1 lst-kix_def-1"><li>Nested</li></ul>',
      ),
    );
    expect(doc.blocks).toEqual([
      { kind: 'item', ordered: true, depth: 0, runs: [{ text: 'One' }] },
      { kind: 'item', ordered: false, depth: 1, runs: [{ text: 'Nested' }] },
    ]);
  });

  it('flattens a table into one line per row', () => {
    const doc = parseGoogleDoc(
      wrap('<table><tr><td><p>Fri</p></td><td><p>Ramen</p></td></tr></table>'),
    );
    expect(doc.blocks).toEqual([{ kind: 'paragraph', runs: [{ text: 'Fri · Ramen' }] }]);
  });
});

describe('runsOf', () => {
  it('keeps the spaces around a link and collapses the rest', () => {
    expect(runsOf('  see   <a href="https://a.test/">this</a>  one ')).toEqual([
      { text: 'see ' },
      { text: 'this', href: 'https://a.test/' },
      { text: ' one' },
    ]);
  });

  it('keeps the text of a link it will not render', () => {
    expect(runsOf('<a href="javascript:alert(1)">click</a>')).toEqual([{ text: 'click' }]);
  });
});

describe('cleanHref', () => {
  it('drops the per-export tracking parameters', () => {
    const a = cleanHref(
      'https://www.google.com/url?q=https://x.test/p?a%3D1&amp;sa=D&amp;ust=1&amp;usg=A',
    );
    const b = cleanHref(
      'https://www.google.com/url?q=https://x.test/p?a%3D1&amp;sa=D&amp;ust=2&amp;usg=B',
    );
    expect(a).toBe('https://x.test/p?a=1');
    expect(a).toBe(b);
  });

  it('allows only web and mail links', () => {
    expect(cleanHref('mailto:a@b.test')).toBe('mailto:a@b.test');
    expect(cleanHref('javascript:alert(1)')).toBeUndefined();
    expect(cleanHref('not a url')).toBeUndefined();
  });
});

describe('decodeEntities', () => {
  it('handles named, decimal and hex entities, and leaves unknown ones alone', () => {
    expect(decodeEntities('&amp; &#128514; &#x1F602; &bogus;')).toBe('& 😂 😂 &bogus;');
  });
});

describe('groupBlocks', () => {
  it('merges consecutive items into one list and splits on a change of type', () => {
    const grouped = groupBlocks([
      { kind: 'item', ordered: false, depth: 0, runs: [{ text: 'a' }] },
      { kind: 'item', ordered: false, depth: 1, runs: [{ text: 'b' }] },
      { kind: 'item', ordered: true, depth: 0, runs: [{ text: 'c' }] },
      { kind: 'paragraph', runs: [{ text: 'd' }] },
    ]);
    expect(grouped.map((g) => g.kind)).toEqual(['list', 'list', 'paragraph']);
    expect(grouped[0]).toMatchObject({ items: [{ depth: 0 }, { depth: 1 }] });
  });
});
