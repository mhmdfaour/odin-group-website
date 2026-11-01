// Odin Group wordmark and mark, drawn as strokes so they look the same everywhere (no font needed).
const LETTERS = {
  O: 'M1 0H7V10H1Z',
  D: 'M1 0H5L7 2V8L5 10H1Z',
  I: 'M4 0V10',
  N: 'M1 10V0L7 10V0',
  G: 'M7 2L5.5 0H2.5L1 2V8L2.5 10H5.5L7 8V5H4',
  R: 'M1 10V0H5.5L7 1.5V4L5.5 5.5H1M4.5 5.5L7 10',
  U: 'M1 0V8L3 10H5L7 8V0',
  P: 'M1 10V0H5.5L7 1.5V4.5L5.5 6H1',
};
const PITCH = 11;
const WORD_GAP = 8;

function layout() {
  const paths = [];
  let x = 0;
  for (const word of ['ODIN', 'GROUP']) {
    for (const ch of word) {
      paths.push(`<path transform="translate(${x} 0)" d="${LETTERS[ch]}"/>`);
      x += PITCH;
    }
    x += WORD_GAP;
  }
  return { paths: paths.join(''), width: x - PITCH + 8 - WORD_GAP };
}

/** Wordmark "ODIN GROUP", inherits colour from `currentColor`. */
export function wordmarkSvg(className = 'wordmark') {
  const { paths, width } = layout();
  return `<svg class="${className}" viewBox="-1 -1 ${width + 2} 12" role="img" aria-label="Odin Group" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="bevel" stroke-linecap="square">${paths}</svg>`;
}

// Mark: the Ansuz rune (Odin's rune) inside a rounded square.
const MARK_INNER = '<path d="M16 6V26M16 9L24 15M16 15L24 21" fill="none" stroke="#f5b942" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';

export function markSvg(className = 'mark') {
  return `<svg class="${className}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#13294b"/>${MARK_INNER}</svg>`;
}

export function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0b1b33"/>${MARK_INNER}</svg>`;
}

/** 1200x630 social image source (rendered to PNG by tools/make-og.mjs). */
export function ogSvg() {
  const { paths, width } = layout();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0b1b33"/><g transform="translate(120 150) scale(7)"><rect width="32" height="32" rx="7" fill="#13294b"/>${MARK_INNER}</g><g transform="translate(120 400) scale(8.2)" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="square" stroke-linejoin="bevel">${paths}</g><rect x="120" y="520" width="${Math.round(width * 8.2)}" height="6" fill="#f5b942"/></svg>`;
}
