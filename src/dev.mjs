// Local dev server: builds, serves dist/ on port 4610 and rebuilds when catalog/ or src/ change.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib/catalog.mjs';

const PORT = 4610;
const DIST = path.join(ROOT, 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };

function rebuild() {
  // A fresh process each time, so edits to templates are picked up (ES modules are cached).
  const r = spawnSync(process.execPath, [path.join(ROOT, 'src/build.mjs')], { encoding: 'utf8' });
  console.log(r.status === 0 ? 'rebuilt' : r.stderr);
}
rebuild();

let timer;
for (const dir of ['catalog', 'src']) {
  fs.watch(path.join(ROOT, dir), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 150); });
}

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    res.end(fs.existsSync(path.join(DIST, '404.html')) ? fs.readFileSync(path.join(DIST, '404.html')) : 'Not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`http://localhost:${PORT}/`));
