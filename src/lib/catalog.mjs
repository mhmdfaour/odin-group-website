import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DEFAULT_CATALOG = path.join(ROOT, 'catalog');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function validators(catalogDir) {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const schemaDir = path.join(DEFAULT_CATALOG, 'schema');
  return {
    app: ajv.compile(readJson(path.join(schemaDir, 'app.schema.json'))),
    releases: ajv.compile(readJson(path.join(schemaDir, 'releases.schema.json'))),
    site: ajv.compile(readJson(path.join(schemaDir, 'site.schema.json'))),
  };
}

const fmt = (file, errors) => errors.map((e) => `${file}${e.instancePath || ''}: ${e.message}`);

/** Loads and validates a catalogue. Returns { site, apps, errors }; apps are sorted by `order`. */
export function loadCatalog(catalogDir = DEFAULT_CATALOG) {
  const v = validators(catalogDir);
  const errors = [];
  const parse = (file) => {
    try { return readJson(file); } catch (e) { errors.push(`${file}: ${e.message}`); return undefined; }
  };

  const siteFile = path.join(catalogDir, 'site.json');
  const site = parse(siteFile);
  if (site && !v.site(site)) errors.push(...fmt(siteFile, v.site.errors));

  const apps = [];
  const appsDir = path.join(catalogDir, 'apps');
  const slugs = fs.existsSync(appsDir) ? fs.readdirSync(appsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  const seenPkg = new Map();
  for (const dir of slugs) {
    const base = path.join(appsDir, dir);
    const appFile = path.join(base, 'app.json');
    const relFile = path.join(base, 'releases.json');
    const app = parse(appFile);
    const releases = fs.existsSync(relFile) ? parse(relFile) : [];
    if (!app) continue;
    if (!v.app(app)) { errors.push(...fmt(appFile, v.app.errors)); continue; }
    if (app.slug !== dir) errors.push(`${appFile}: slug "${app.slug}" must match folder name "${dir}"`);
    if (seenPkg.has(app.packageId)) errors.push(`${appFile}: packageId "${app.packageId}" already used by ${seenPkg.get(app.packageId)}`);
    seenPkg.set(app.packageId, dir);
    if (!fs.existsSync(path.join(base, 'icon.png'))) errors.push(`${base}: missing icon.png`);
    if (!releases) continue;
    if (!v.releases(releases)) { errors.push(...fmt(relFile, v.releases.errors)); continue; }
    const seen = new Set();
    releases.forEach((r, i) => {
      if (seen.has(r.versionName)) errors.push(`${relFile}[${i}]: duplicate versionName ${r.versionName}`);
      seen.add(r.versionName);
      if (i > 0 && releases[i - 1].versionCode <= r.versionCode) errors.push(`${relFile}[${i}]: not newest first (versionCode)`);
      if (!r.url.endsWith(`/${r.tag}/${r.file}`)) errors.push(`${relFile}[${i}]: url must end with /<tag>/<file>`);
    });
    const shotDir = path.join(base, 'screenshots');
    const screenshots = fs.existsSync(shotDir) ? fs.readdirSync(shotDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort() : [];
    apps.push({ ...app, releases, screenshots, dir: base });
  }
  apps.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return { site, apps, errors };
}

/** Newest releases across all apps, newest first. */
export function latestUpdates(apps, limit = 50) {
  return apps
    .flatMap((a) => a.releases.map((r) => ({ ...r, appSlug: a.slug, appName: a.name })))
    .sort((a, b) => b.date.localeCompare(a.date) || b.versionCode - a.versionCode)
    .slice(0, limit);
}
