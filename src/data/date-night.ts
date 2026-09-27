import { DocSnapshotSchema } from '../lib/gdoc.ts';
import snapshot from './date-night.json' with { type: 'json' };

/**
 * The shared date night doc. Editing happens in Google Docs; the page at
 * /date-night/ renders the committed snapshot in date-night.json, which
 * scripts/sync-doc.mjs refreshes on a schedule (.github/workflows/sync-doc.yml).
 */
export { DOC_EDIT_URL } from './date-night-source.ts';

export const dateNight = DocSnapshotSchema.parse(snapshot);
