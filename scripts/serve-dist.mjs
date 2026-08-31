/**
 * Minimal static server over dist/, used by the end-to-end tests. It exists so
 * the tests hit the same shapes Netlify serves: directory URLs resolve to
 * index.html, a missing trailing slash redirects, and an unknown path returns
 * 404.html with an actual 404 status rather than 200.
 *
 *   node scripts/serve-dist.mjs [port]
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const DIST = resolve(import.meta.dirname, '..', 'dist');
const port = Number(process.argv[2] ?? process.env.PORT ?? 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

const send = (res, status, file) => {
  res.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  // normalize() collapses any ".." before it can escape dist/.
  const pathname = normalize(decodeURIComponent(url.pathname));
  const target = join(DIST, pathname);

  if (!target.startsWith(DIST)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  if (existsSync(target) && statSync(target).isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { location: `${pathname}/` }).end();
      return;
    }
    const index = join(target, 'index.html');
    if (existsSync(index)) {
      send(res, 200, index);
      return;
    }
  }

  if (existsSync(target) && statSync(target).isFile()) {
    send(res, 200, target);
    return;
  }

  const notFound = join(DIST, '404.html');
  if (existsSync(notFound)) {
    send(res, 404, notFound);
    return;
  }
  res.writeHead(404).end('not found');
}).listen(port, () => {
  console.log(`serving dist/ on http://localhost:${port}`);
});
