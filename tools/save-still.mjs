// Converts a browser-pane screenshot (JPEG) to a PNG still and trims the blank rows below the footer.
// Usage: node tools/save-still.mjs <source.jpg> <docs/stills/phase-1/name.png>
import sharp from 'sharp';

const [src, dest] = process.argv.slice(2);
const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
const row = (y) => data.subarray(y * info.width * info.channels, (y + 1) * info.width * info.channels);
const last = Buffer.from(row(info.height - 1));
let h = info.height;
while (h > 1 && Buffer.compare(row(h - 1), last) === 0) h--;
// keep the footer: trim only when the blank block is page background (not navy), plus a small margin
await sharp(src).extract({ left: 0, top: 0, width: info.width, height: Math.min(info.height, h + 8) }).png({ compressionLevel: 9, palette: true, quality: 85 }).toFile(dest);
console.log(dest, info.width, Math.min(info.height, h + 8));
