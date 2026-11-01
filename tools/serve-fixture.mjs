// Builds the real catalogue plus a fake fawterly release into .cache/fixture-dist and serves it on port 4610.
// Used for the "app page with releases" stills. Nothing from here is published.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { build } from '../src/build.mjs';
import { ROOT } from '../src/lib/catalog.mjs';
import { makeCatalog } from '../test/fixture.mjs';

const cache = path.join(ROOT, '.cache');
const dist = path.join(cache, 'fixture-dist');
build({ catalogDir: makeCatalog({ dir: path.join(cache, 'fixture-catalog') }), outDir: dist });
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
http.createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(dist) || !fs.existsSync(file)) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(4610, '127.0.0.1', () => console.log('fixture on http://localhost:4610/'));
