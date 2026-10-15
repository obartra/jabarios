import type { APIRoute } from 'astro';
import { tripsFeed } from '../data/feed.ts';
import { trips } from '../data/trips.ts';

/** The public trips feed, built to dist/trips.json. See src/data/feed.ts. */
export const GET: APIRoute = ({ site }) =>
  new Response(JSON.stringify(tripsFeed(trips, site ?? 'https://jabarios.com'), null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
