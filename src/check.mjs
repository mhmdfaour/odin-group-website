import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, ROOT, DEFAULT_CATALOG } from './lib/catalog.mjs';

const MAX_IMAGE = 300 * 1024;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}

/** Validates the catalogue and the built site. Returns a list of problems (empty = pass). */
export function check({ catalogDir = DEFAULT_CATALOG, distDir = path.join(ROOT, 'dist') } = {}) {
  const { site, errors } = loadCatalog(catalogDir);
  const problems = [...errors];
  if (!site || !fs.existsSync(distDir)) {
    if (!fs.existsSync(distDir)) problems.push(`${distDir} does not exist; run npm run build first`);
    return problems;
  }
  const files = walk(distDir);
  const rel = (f) => path.relative(distDir, f).split(path.sep).join('/');
  const htmlFiles = files.filter((f) => f.endsWith('.html'));
  const idsOf = new Map();
  const ids = (file) => {
    if (!idsOf.has(file)) idsOf.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    return idsOf.get(file);
  };

  for (const f of files) {
    if (/\.(png|jpe?g|webp)$/i.test(f) && fs.statSync(f).size > MAX_IMAGE && rel(f) !== 'og.png') problems.push(`${rel(f)}: image over 300 KB`);
    if (f.endsWith('.json')) { try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { problems.push(`${rel(f)}: invalid JSON`); } }
    if (/\.apk$|\.aab$/i.test(f)) problems.push(`${rel(f)}: APK/AAB must not be in dist`);
  }
  for (const need of ['CNAME', '.nojekyll', 'sitemap.xml', 'robots.txt', 'updates.json', '404.html', 'favicon.svg', 'og.png']) {
    if (!fs.existsSync(path.join(distDir, need))) problems.push(`dist/${need} missing`);
  }

  for (const file of htmlFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const me = rel(file);
    if (!/<title>[^<]+<\/title>/.test(src)) problems.push(`${me}: missing <title>`);
    if (!/<meta name="description" content="[^"]+"/.test(src)) problems.push(`${me}: missing description`);
    if (!/<html lang="/.test(src)) problems.push(`${me}: missing lang`);
    if ((src.match(/<h1[ >]/g) || []).length !== 1) problems.push(`${me}: needs exactly one <h1>`);
    for (const m of src.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) problems.push(`${me}: <img> without alt`);
    const dupes = [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    if (new Set(dupes).size !== dupes.length) problems.push(`${me}: duplicate ids`);

    for (const m of src.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
      let url = m[1].replace(/&amp;/g, '&');
      if (/^(mailto:|tel:|data:)/.test(url)) continue;
      if (url.startsWith(site.url)) url = url.slice(site.url.length) || '/';
      else if (/^https?:\/\//.test(url)) {
        // The only external links allowed are APK downloads from this repo's releases.
        if (!url.startsWith('https://github.com/mhmdfaour/odin-group-website/releases/download/')) problems.push(`${me}: unexpected external link ${url}`);
        continue;
      }
      const [pathPart, hash] = url.split('#');
      let target = file;
      if (pathPart) {
        const base = pathPart.startsWith('/') ? path.join(distDir, pathPart) : path.resolve(path.dirname(file), pathPart);
        target = pathPart.endsWith('/') || !path.extname(base) ? path.join(base, 'index.html') : base;
        if (!fs.existsSync(target)) { problems.push(`${me}: broken link ${m[1]}`); continue; }
      }
      if (hash && target.endsWith('.html') && !ids(target).has(hash)) problems.push(`${me}: missing anchor ${m[1]}`);
    }
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = check();
  if (problems.length) {
    console.error(`check failed (${problems.length}):\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log('check passed: catalogue valid, links ok');
}
