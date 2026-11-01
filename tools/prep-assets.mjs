// One-off: read-only copy of icons/stills from the launch projects into catalog/, resized and optimised.
// Usage: node tools/prep-assets.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const WR = 'C:/Users/EIFfa3our/Wormhole Rider';
const jobs = {
  fawterly: { shots: ['D:/Projects/Fawterly/docs/stills/phase1/phone-en-home.png', 'D:/Projects/Fawterly/docs/stills/phase1/phone-en-create-menu.png', 'D:/Projects/Fawterly/docs/stills/phase1/phone-en-settings.png'] },
  toolforge: { shots: ['D:/Projects/ToolForge/docs/stills/p0/library-light.png', 'D:/Projects/ToolForge/docs/stills/p0/library-dark.png', 'D:/Projects/ToolForge/docs/stills/p1/import-results.png'] },
  petriotic: { icon: 'D:/Projects/Petriotic/docs/brand/petriotic-logo-primary.jpg', crop: { left: 200, top: 105, width: 590, height: 590 }, shots: [] },
  'wormhole-rider': { shots: [] },
};
const monogram = (letter, bg, fg) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="112" fill="${bg}"/><text x="256" y="344" font-family="Segoe UI, Arial, sans-serif" font-size="280" font-weight="700" text-anchor="middle" fill="${fg}">${letter}</text></svg>`);
const mono = { fawterly: ['F', '#0f2a4a', '#f5b942'], toolforge: ['T', '#0f2a4a', '#f5b942'], 'wormhole-rider': ['W', '#0f2a4a', '#f5b942'] };

for (const [slug, j] of Object.entries(jobs)) {
  const dir = path.join('catalog/apps', slug);
  fs.mkdirSync(path.join(dir, 'screenshots'), { recursive: true });
  let img;
  if (j.icon) {
    img = sharp(j.icon).extract(j.crop).resize(512, 512);
  } else {
    img = sharp(monogram(...mono[slug]));
  }
  await img.png({ compressionLevel: 9, palette: true }).toFile(path.join(dir, 'icon.png'));
  let i = 1;
  for (const s of j.shots) {
    const out = path.join(dir, 'screenshots', `${String(i++).padStart(2, '0')}.png`);
    await sharp(s).resize({ width: 540, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
    console.log(out, fs.statSync(out).size);
  }
}
