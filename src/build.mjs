import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog, latestUpdates, ROOT, DEFAULT_CATALOG } from './lib/catalog.mjs';
import { homePage, appPage, installPage, aboutPage, notFoundPage } from './lib/pages.mjs';
import { faviconSvg } from './lib/brand.mjs';

const DOMAIN = 'www.odingroup.co.za';

function write(out, rel, data) {
  const file = path.join(out, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, String(data));
}
const json = (v) => JSON.stringify(v, null, 2) + '\n';

/** Builds the site from `catalogDir` into `outDir`. Throws if the catalogue is invalid. */
export function build({ catalogDir = DEFAULT_CATALOG, outDir = path.join(ROOT, 'dist') } = {}) {
  const { site, apps, errors } = loadCatalog(catalogDir);
  if (errors.length) throw new Error(`Catalogue is invalid:\n  ${errors.join('\n  ')}`);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  write(outDir, 'index.html', homePage({ site, apps }));
  write(outDir, 'install/index.html', installPage({ site }));
  write(outDir, 'about/index.html', aboutPage({ site, apps }));
  write(outDir, '404.html', notFoundPage({ site }));
  for (const app of apps) {
    write(outDir, `apps/${app.slug}/index.html`, appPage({ site, app }));
    write(outDir, `apps/${app.slug}/releases.json`, json(app.releases));
    fs.copyFileSync(path.join(app.dir, 'icon.png'), path.join(outDir, `apps/${app.slug}/icon.png`));
    for (const s of app.screenshots) {
      fs.mkdirSync(path.join(outDir, `apps/${app.slug}/screenshots`), { recursive: true });
      fs.copyFileSync(path.join(app.dir, 'screenshots', s), path.join(outDir, `apps/${app.slug}/screenshots`, s));
    }
  }

  write(outDir, 'updates.json', json(latestUpdates(apps, 50).map((u) => ({ ...u, page: `${site.url}/apps/${u.appSlug}/#v${u.versionName}` }))));

  const pages = ['', 'install/', 'about/', ...apps.map((a) => `apps/${a.slug}/`)];
  write(outDir, 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${site.url}/${p}</loc></url>`).join('\n')}\n</urlset>\n`);
  write(outDir, 'robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
  write(outDir, 'favicon.svg', faviconSvg());
  write(outDir, 'CNAME', `${DOMAIN}\n`);
  write(outDir, '.nojekyll', '');
  const assets = path.join(ROOT, 'src/assets');
  for (const f of fs.readdirSync(assets)) fs.copyFileSync(path.join(assets, f), path.join(outDir, f));

  return { site, apps, pages };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { apps } = build();
    console.log(`Built ${apps.length} apps into dist/`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
