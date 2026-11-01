import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { deployProblems } from '../src/lib/guard.mjs';
import path from 'node:path';
import { build } from '../src/build.mjs';
import { check } from '../src/check.mjs';
import { loadCatalog } from '../src/lib/catalog.mjs';
import { makeCatalog, tmp, FAKE_RELEASE } from './fixture.mjs';

const read = (dist, f) => fs.readFileSync(path.join(dist, f), 'utf8');

test('real catalogue builds and passes check with no problems', () => {
  const dist = tmp();
  build({ outDir: dist });
  assert.deepEqual(check({ distDir: dist }), []);
  for (const f of ['index.html', 'install/index.html', 'about/index.html', '404.html', 'sitemap.xml', 'robots.txt', 'updates.json', 'CNAME', '.nojekyll', 'apps/fawterly/releases.json']) {
    assert.ok(fs.existsSync(path.join(dist, f)), `${f} exists`);
  }
  assert.equal(read(dist, 'CNAME').trim(), 'www.odingroup.co.za');
});

test('schema check fails on a broken app.json', () => {
  const cat = makeCatalog({ withRelease: false });
  const file = path.join(cat, 'apps/toolforge/app.json');
  const app = JSON.parse(fs.readFileSync(file, 'utf8'));
  app.type = 'spaceship';
  delete app.packageId;
  fs.writeFileSync(file, JSON.stringify(app));
  const { errors } = loadCatalog(cat);
  assert.ok(errors.some((e) => e.includes('toolforge') && e.includes('packageId')), errors.join('\n'));
  assert.throws(() => build({ catalogDir: cat, outDir: tmp() }), /Catalogue is invalid/);
});

test('schema check fails on a bad release (sha, url, duplicate version)', () => {
  const cat = makeCatalog({ withRelease: false });
  const bad = { ...FAKE_RELEASE, sha256: 'xyz', url: 'https://evil.example/a.apk' };
  fs.writeFileSync(path.join(cat, 'apps/fawterly/releases.json'), JSON.stringify([bad, FAKE_RELEASE]));
  const { errors } = loadCatalog(cat);
  assert.ok(errors.length > 0);
  const dup = makeCatalog({ withRelease: false });
  fs.writeFileSync(path.join(dup, 'apps/fawterly/releases.json'), JSON.stringify([FAKE_RELEASE, { ...FAKE_RELEASE, versionCode: 1 }]));
  assert.ok(loadCatalog(dup).errors.some((e) => e.includes('duplicate')));
});

test('app with no releases shows Coming soon and no download button', () => {
  const dist = tmp();
  build({ catalogDir: makeCatalog({ withRelease: false }), outDir: dist });
  const page = read(dist, 'apps/fawterly/index.html');
  assert.match(page, /Coming soon — no APK published yet/);
  assert.doesNotMatch(page, /Download latest APK/);
  assert.match(read(dist, 'index.html'), /No versions published yet/);
});

test('fake release: download button, version history, anchor, size, sha, home update', () => {
  const dist = tmp();
  const cat = makeCatalog();
  build({ catalogDir: cat, outDir: dist });
  const page = read(dist, 'apps/fawterly/index.html');
  assert.match(page, /Download latest APK · 0\.2\.0/);
  assert.ok(page.includes(`href="${FAKE_RELEASE.url}"`));
  assert.match(page, /id="v0\.2\.0"/);
  assert.match(page, /30\.0 MB/);
  assert.ok(page.includes(FAKE_RELEASE.sha256));
  assert.match(page, /Phase 2 — Sales screens/);
  assert.match(page, /Added quotes list/);
  assert.match(page, /Development build/);
  assert.doesNotMatch(page, /<script>alert/, 'raw HTML in changelog is escaped');
  const home = read(dist, 'index.html');
  assert.match(home, /Latest updates/);
  assert.match(home, /apps\/fawterly\/#v0\.2\.0/);
  assert.match(home, /v0\.2\.0/);
  const feed = JSON.parse(read(dist, 'updates.json'));
  assert.equal(feed[0].appSlug, 'fawterly');
  assert.equal(feed[0].versionName, '0.2.0');
  assert.deepEqual(JSON.parse(read(dist, 'apps/fawterly/releases.json')), [FAKE_RELEASE]);
  assert.deepEqual(check({ catalogDir: cat, distDir: dist }), []);
});

test('check detects a broken link, missing anchor, missing alt and stray APK', () => {
  const cat = makeCatalog();
  const dist = tmp();
  build({ catalogDir: cat, outDir: dist });
  assert.deepEqual(check({ catalogDir: cat, distDir: dist }), []);
  const home = path.join(dist, 'index.html');
  fs.appendFileSync(home, '<a href="nope/">x</a><a href="apps/fawterly/#v9.9.9">y</a><img src="favicon.svg">');
  fs.writeFileSync(path.join(dist, 'x.apk'), 'x');
  const problems = check({ catalogDir: cat, distDir: dist }).join('\n');
  assert.match(problems, /broken link nope\//);
  assert.match(problems, /missing anchor apps\/fawterly\/#v9\.9\.9/);
  assert.match(problems, /img> without alt/);
  assert.match(problems, /APK\/AAB must not be in dist/);
});

test('pages use relative URLs so the github.io project path works', () => {
  const dist = tmp();
  build({ outDir: dist });
  assert.match(read(dist, 'apps/fawterly/index.html'), /href="\.\.\/\.\.\/style\.css"/);
  assert.match(read(dist, 'index.html'), /href="style\.css"/);
});

test('every launch app has icon, valid package id and unique slug', () => {
  const { apps, errors } = loadCatalog();
  assert.deepEqual(errors, []);
  assert.deepEqual(apps.map((a) => a.slug), ['fawterly', 'toolforge', 'petriotic', 'wormhole-rider']);
  assert.equal(new Set(apps.map((a) => a.packageId)).size, apps.length);
});

test('markdown drops javascript: links and images, keeps https/mailto/relative', () => {
  const cat = makeCatalog();
  const file = path.join(cat, 'apps/fawterly/releases.json');
  const rel = JSON.parse(fs.readFileSync(file, 'utf8'));
  rel[0].changelog = '[bad](javascript:alert(1)) ![img](javascript:alert(2)) [ok](https://example.com/x) [mail](mailto:a@b.co) [rel](../../install/)';
  fs.writeFileSync(file, JSON.stringify(rel));
  const dist = tmp();
  build({ catalogDir: cat, outDir: dist });
  const page = read(dist, 'apps/fawterly/index.html');
  assert.doesNotMatch(page, /javascript:/i);
  assert.match(page, /href="https:\/\/example\.com\/x"/);
  assert.match(page, /href="mailto:a@b\.co"/);
  assert.match(page, /href="\.\.\/\.\.\/install\/"/);
  assert.deepEqual(check({ catalogDir: cat, distDir: dist }), [], 'https link in a changelog passes check');
});

test('check still rejects external links outside catalogue text', () => {
  const cat = makeCatalog();
  const dist = tmp();
  build({ catalogDir: cat, outDir: dist });
  fs.appendFileSync(path.join(dist, 'about/index.html'), '<a href="https://example.com/">x</a>');
  assert.match(check({ catalogDir: cat, distDir: dist }).join('\n'), /unexpected external link/);
});

test('release file names must not contain spaces', () => {
  const cat = makeCatalog({ withRelease: false });
  fs.writeFileSync(path.join(cat, 'apps/fawterly/releases.json'), JSON.stringify([{ ...FAKE_RELEASE, file: 'Wormhole Rider-0.1.0.apk', url: FAKE_RELEASE.url.replace('Fawterly-0.2.0.apk', 'Wormhole Rider-0.1.0.apk') }]));
  assert.ok(loadCatalog(cat).errors.length > 0);
});

test('deploy guard: needs clean tree, main, and HEAD == origin/main; --allow-branch overrides', () => {
  const sh = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8' });
  const origin = fs.mkdtempSync(path.join(os.tmpdir(), 'odin-origin-'));
  sh(origin, 'init', '-q', '--bare', '-b', 'main');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'odin-work-'));
  sh(work, 'init', '-q', '-b', 'main');
  sh(work, 'config', 'user.email', 't@t.t'); sh(work, 'config', 'user.name', 't');
  fs.writeFileSync(path.join(work, 'a.txt'), 'a');
  sh(work, 'add', '-A'); sh(work, 'commit', '-q', '-m', 'one');
  sh(work, 'remote', 'add', 'origin', origin);
  sh(work, 'push', '-q', 'origin', 'main');
  assert.deepEqual(deployProblems(work), []);
  fs.writeFileSync(path.join(work, 'b.txt'), 'b');
  assert.match(deployProblems(work).join(), /not clean/);
  assert.match(deployProblems(work, { allowBranch: true }).join(), /not clean/);
  sh(work, 'add', '-A'); sh(work, 'commit', '-q', '-m', 'two');
  assert.match(deployProblems(work).join(), /HEAD is not equal to origin\/main/);
  sh(work, 'push', '-q', 'origin', 'main');
  sh(work, 'checkout', '-q', '-b', 'feature');
  assert.match(deployProblems(work).join(), /not main/);
  assert.deepEqual(deployProblems(work, { allowBranch: true }), []);
});
