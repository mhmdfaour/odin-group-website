// Renders src/assets/og.png (1200x630) from the brand SVG. Run once when the brand changes: node tools/make-og.mjs
import sharp from 'sharp';
import { ogSvg } from '../src/lib/brand.mjs';
await sharp(Buffer.from(ogSvg())).png({ compressionLevel: 9 }).toFile('src/assets/og.png');
