// Regenerates the three Step A logo concepts (SVG + 1024 px PNG) and the comparison sheet.
// Run from the repo root: node docs/brand/concepts/build-concepts.mjs
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const NAVY = '#0B1530', GOLD = '#F5B942', ICE = '#DCE7FF';

const LETTERS = {
  O: 'M1 0H7V10H1Z', D: 'M1 0H5L7 2V8L5 10H1Z', I: 'M4 0V10', N: 'M1 10V0L7 10V0',
  G: 'M7 2L5.5 0H2.5L1 2V8L2.5 10H5.5L7 8V5H4',
  R: 'M1 10V0H5.5L7 1.5V4L5.5 5.5H1M4.5 5.5L7 10', U: 'M1 0V8L3 10H5L7 8V0', P: 'M1 10V0H5.5L7 1.5V4.5L5.5 6H1',
};
function word(text, x0, y0, scale, color, sw) {
  let x = 0; const p = [];
  for (const ch of text) {
    if (ch === ' ') { x += 8; continue; }
    p.push(`<path transform="translate(${x} 0)" d="${LETTERS[ch]}"/>`); x += 11;
  }
  const w = (x - 11 + 8) * scale;
  return { w, svg: `<g transform="translate(${x0} ${y0}) scale(${scale})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="bevel" stroke-linecap="square">${p.join('')}</g>` };
}

// Marks are drawn in a 64x64 box.
const marks = {
  raven: { name: 'Concept 1 — Raven', note: 'Geometric raven (Huginn / Muninn)', body: `
    <path fill="${GOLD}" d="M6 40 L20 18 L34 10 L50 12 L60 20 L47 24 L50 28 L41 34 L33 52 L24 58 L22 44 Z"/>
    <path fill="${NAVY}" d="M34 10 L50 12 L47 24 Z" opacity=".0"/>
    <path fill="${NAVY}" d="M40 17 L46 17.5 L44 21 Z"/>
    <path fill="${NAVY}" d="M20 18 L34 10 L30 30 L22 44 Z" opacity=".28"/>` },
  rune: { name: 'Concept 2 — Rune monogram', note: 'O and G bound into one angular rune', body: `
    <path fill="none" stroke="${GOLD}" stroke-width="5" stroke-linejoin="miter" d="M22 6 H42 L58 22 V42 L42 58 H22 L6 42 V22 Z"/>
    <path fill="none" stroke="${ICE}" stroke-width="5" stroke-linejoin="miter" stroke-linecap="butt" d="M42 24 H29 L23 30 V35 L29 41 H42 V32 H34"/>` },
  eye: { name: 'Concept 3 — All-seeing eye', note: 'Valknut triangles around Odin\u2019s eye', body: `
    <g fill="none" stroke="${GOLD}" stroke-width="3.6" stroke-linejoin="miter">
      <path d="M32 4 L44 25 H20 Z"/><path d="M14 36 L26 57 H2 Z" transform="translate(6 -2)"/><path d="M50 36 L62 57 H38 Z" transform="translate(-6 -2)"/>
    </g>
    <path fill="none" stroke="${ICE}" stroke-width="3" stroke-linejoin="round" d="M20 38 Q32 26 44 38 Q32 50 20 38 Z"/>
    <circle cx="32" cy="38" r="4.2" fill="${ICE}"/>` },
};

function logoSvg(m, size = 1024) {
  // Horizontal lockup, 360 x 100 canvas
  const w1 = word('ODIN', 96, 20, 3.1, ICE, 1.7), w2 = word('GROUP', 96, 58, 3.1, GOLD, 1.7);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(Math.max(w1.w, w2.w) + 112)} 100"><rect width="100%" height="100%" rx="10" fill="${NAVY}"/><g transform="translate(14 18) scale(1.1)">${m.body}</g>${w1.svg}${w2.svg}</svg>`;
}
function markSvg(m) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${NAVY}"/><g transform="translate(8 8) scale(.75)">${m.body}</g></svg>`;
}

const out = [];
for (const [k, m] of Object.entries(marks)) {
  const i = Object.keys(marks).indexOf(k) + 1;
  const svg = logoSvg(m);
  writeFileSync(join(dir, `concept-${i}-${k}.svg`), svg);
  writeFileSync(join(dir, `concept-${i}-${k}-mark.svg`), markSvg(m));
  await sharp(Buffer.from(markSvg(m)), { density: 300 }).resize(1024, 1024).png().toFile(join(dir, `concept-${i}-${k}.png`));
  out.push({ k, i, m });
}

// Comparison sheet 1800 x 1100: per concept a large mark, the lockup, and 64/32 px tests.
const col = 600; let cells = '';
for (const { k, i, m } of out) {
  const x = (i - 1) * col;
  const lock = logoSvg(m).replace('<svg ', '<svg x="40" y="520" width="520" height="130" ');
  cells += `
  <g transform="translate(${x} 0)">
    <text x="40" y="70" fill="${ICE}" font-family="Segoe UI, Arial" font-size="30" font-weight="700">${m.name}</text>
    <text x="40" y="104" fill="#8FA3CC" font-family="Segoe UI, Arial" font-size="20">${m.note}</text>
    <g transform="translate(110 130) scale(5.6)"><rect width="64" height="64" rx="14" fill="#0E1C3D"/><g transform="translate(0 0)">${m.body}</g></g>
    ${lock}
    <text x="40" y="700" fill="#8FA3CC" font-family="Segoe UI, Arial" font-size="18">Small-size test: 64 / 48 / 32 / 24 px</text>
    ${[64, 48, 32, 24].map((s, j) => { const off = [0, 84, 148, 196][j]; return `<svg x="${40 + off}" y="${730}" width="${s}" height="${s}" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${NAVY}"/><g transform="translate(8 8) scale(.75)">${m.body}</g></svg>`; }).join('')}
    <rect x="40" y="860" width="520" height="90" rx="10" fill="#F4F6FB"/>
    <svg x="56" y="872" width="66" height="66" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${NAVY}"/><g transform="translate(8 8) scale(.75)">${m.body}</g></svg>
    <text x="140" y="922" fill="${NAVY}" font-family="Segoe UI, Arial" font-size="22" font-weight="700">On light backgrounds</text>
  </g>`;
}
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1100" viewBox="0 0 1800 1100"><rect width="1800" height="1100" fill="${NAVY}"/>${cells}</svg>`;
writeFileSync(join(dir, 'comparison-sheet.svg'), sheet);
await sharp(Buffer.from(sheet), { density: 144 }).png().toFile(join(dir, 'comparison-sheet.png'));
console.log('done');
