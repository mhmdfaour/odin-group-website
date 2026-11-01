import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_CATALOG } from '../src/lib/catalog.mjs';

export const FAKE_RELEASE = {
  versionName: '0.2.0',
  versionCode: 2,
  date: '2026-11-01',
  phase: 'Phase 2 — Sales screens',
  channel: 'dev',
  changelog: '- Added quotes list\n- Fixed login crash\n- <script>alert(1)</script>',
  file: 'Fawterly-0.2.0.apk',
  tag: 'fawterly-v0.2.0+2',
  url: 'https://github.com/mhmdfaour/odin-group-website/releases/download/fawterly-v0.2.0+2/Fawterly-0.2.0.apk',
  sizeBytes: 31457280,
  sha256: 'a'.repeat(63) + 'b',
  minSdk: 26,
  targetSdk: 35,
};

/** Copies the real catalogue to a temp dir and (optionally) adds a fake release to fawterly. */
export function makeCatalog({ withRelease = true, dir } = {}) {
  const root = dir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'odin-catalog-'));
  fs.rmSync(root, { recursive: true, force: true });
  fs.cpSync(DEFAULT_CATALOG, root, { recursive: true });
  if (withRelease) fs.writeFileSync(path.join(root, 'apps/fawterly/releases.json'), JSON.stringify([FAKE_RELEASE], null, 2));
  return root;
}

export const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'odin-dist-'));
