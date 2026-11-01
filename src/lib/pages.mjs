import { marked } from 'marked';
import { html, raw, esc } from './html.mjs';
import { wordmarkSvg, markSvg } from './brand.mjs';
import { formatSize, formatDate, STATUS_LABEL, CHANNEL_LABEL } from './format.mjs';
import { latestUpdates } from './catalog.mjs';

// Catalogue text is ours, but never let raw HTML through.
// Links and images may only be https, mailto, relative or #anchor URLs.
export const safeUrl = (href) => (/^(https:|mailto:|#|\/|\.{0,2}\/|[^:]*$)/i.test(String(href).trim()) ? href : null);
marked.use({
  renderer: {
    html: ({ text }) => esc(text),
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const url = safeUrl(href);
      return url ? `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ''}>${text}</a>` : text;
    },
    image({ href, title, text }) {
      const url = safeUrl(href);
      return url ? `<img src="${esc(url)}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ''}>` : esc(text);
    },
  },
});
const md = (s) => raw(marked.parse(s, { async: false }));

/**
 * Wraps a page. `rel` is the path prefix back to the site root ('' or '../' ...), so the site works both at the
 * custom domain and at the github.io project path. `abs` pages (404) use absolute URLs.
 */
function layout({ site, rel, title, description, path, nav, image, body, abs = false }) {
  const root = abs ? `${site.url}/` : rel;
  const fullTitle = path === '' ? `${site.name} — apps and games` : `${title} — ${site.name}`;
  const canonical = `${site.url}/${path}`;
  const ogImage = image ? `${site.url}/${image}` : `${site.url}/og.png`;
  const link = (href, label, key) => html`<a href="${root}${href}"${nav === key ? raw(' aria-current="page"') : ''}>${label}</a>`;
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${description}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#0b1b33">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}style.css">
<meta property="og:site_name" content="${site.name}">
<meta property="og:type" content="website">
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary">
<script src="${root}site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="bar">
  <a class="brand" href="${root}" aria-label="${site.name} home">${raw(markSvg())}${raw(wordmarkSvg())}</a>
  <nav aria-label="Main">${link('', 'Apps', 'home')}${link('install/', 'Install', 'install')}${link('about/', 'About', 'about')}</nav>
</div></header>
<main id="main">
${body}
</main>
<footer class="site-footer"><div class="inner">
  <span>© ${site.name}</span>
  <span><a href="${root}install/">How to install</a> · <a href="mailto:${site.email}">${site.email}</a></span>
</div></footer>
</body>
</html>
`;
}

const badge = (text, cls = '') => html`<span class="badge ${cls}">${text}</span>`;

function updateItem(u, rel) {
  return html`<li>
    <a href="${rel}apps/${u.appSlug}/#v${u.versionName}"><strong>${u.appName}</strong> ${u.versionName}</a>
    ${badge(CHANNEL_LABEL[u.channel])}
    <span class="muted">${u.phase}</span>
    <span class="when">${formatDate(u.date)}</span>
  </li>`;
}

export function homePage({ site, apps }) {
  const rel = '';
  const updates = latestUpdates(apps, 5);
  const body = html`
<section class="hero bleed">
  <div class="hero-bg" aria-hidden="true"><span class="orb o1" data-depth="0.25"></span><span class="orb o2" data-depth="0.4"></span><span class="orb o3" data-depth="0.15"></span><span class="stars"></span></div>
  <div class="hero-inner">
    <p class="eyebrow">Apps and games, built in South Africa</p>
    <h1>${site.name}</h1>
    <p class="lead">${site.tagline} ${site.about}</p>
    <a class="btn cta" href="#apps-h">Explore apps and games</a>
  </div>
  <a class="scroll-cue" href="#apps-h" aria-label="Scroll to apps"><span></span></a>
</section>
<section aria-labelledby="apps-h" data-reveal>
  <h2 id="apps-h">Apps and games</h2>
  <div class="filters" data-filters hidden role="group" aria-label="Filter">
    <button type="button" data-filter="all" aria-pressed="true">All</button>
    <button type="button" data-filter="app" aria-pressed="false">Apps</button>
    <button type="button" data-filter="game" aria-pressed="false">Games</button>
  </div>
  <ul class="grid">
    ${apps.map((a, i) => {
      const latest = a.releases[0];
      return html`<li data-type="${a.type}" data-reveal style="--i:${i}"><article class="card">
        <img src="${rel}apps/${a.slug}/icon.png" alt="" width="88" height="88" loading="lazy">
        <div>
          <h3><a href="${rel}apps/${a.slug}/">${a.name}</a></h3>
          <p>${a.tagline}</p>
          <div class="meta">
            ${badge(a.type === 'game' ? 'Game' : 'App')}
            ${badge(STATUS_LABEL[a.status])}
            ${latest ? badge(`v${latest.versionName}`, 'accent') : badge('Coming soon')}
          </div>
        </div>
      </article></li>`;
    })}
  </ul>
</section>
<section aria-labelledby="up-h" data-reveal>
  <h2 id="up-h">Latest updates</h2>
  ${updates.length
    ? html`<ul class="updates">${updates.map((u) => updateItem(u, rel))}</ul>`
    : html`<p class="empty">No versions published yet. Each new version will be listed here with its changelog.</p>`}
</section>`;
  return layout({
    site, rel, nav: 'home', path: '', title: site.name,
    description: `${site.tagline} ${site.about}`.slice(0, 200),
    body,
  });
}

function releaseCard(app, r) {
  return html`<article class="release" id="v${r.versionName}">
  <header>
    <h3><a href="#v${r.versionName}">Version ${r.versionName}</a></h3>
    ${badge(CHANNEL_LABEL[r.channel], r.channel === 'stable' ? 'accent' : '')}
    <span class="phase">${r.phase}</span>
    <span class="muted">· ${formatDate(r.date)}</span>
  </header>
  ${r.channel === 'dev' ? html`<p class="warn">Development build, signed with a debug key. For testing only.</p>` : ''}
  <div class="prose">${md(r.changelog)}</div>
  <p class="note">Build ${r.versionCode} · ${formatSize(r.sizeBytes)}${r.minSdk ? ` · Android API ${r.minSdk}+` : ''}</p>
  <div class="sha">
    <span class="muted">SHA-256</span>
    <code class="hash">${r.sha256}</code>
    <button type="button" class="btn ghost small" data-copy="${r.sha256}" hidden>Copy</button>
  </div>
  <a class="btn" href="${r.url}" download>Download ${r.file}</a>
</article>`;
}

export function appPage({ site, app }) {
  const rel = '../../';
  const latest = app.releases[0];
  const body = html`
<section class="app-hero bleed">
<img class="backdrop" src="icon.png" alt="" aria-hidden="true" data-depth="0.2">
<p class="crumbs"><a href="${rel}">← All apps and games</a></p>
<div class="app-head">
  <img src="icon.png" alt="${app.name} icon" width="112" height="112">
  <div>
    <h1>${app.name}</h1>
    <p class="tagline">${app.tagline}</p>
    ${badge(app.type === 'game' ? 'Game' : 'App')} ${badge(STATUS_LABEL[app.status])}
    ${app.website ? html`<p class="sub"><a href="${app.website}" rel="noopener">Visit the ${app.name} website →</a></p>` : ''}
  </div>
</div>
<div class="dl">
  ${latest
    ? html`<a class="btn big" href="${latest.url}" download>Download latest APK · ${latest.versionName}</a>
      <p class="sub">${formatSize(latest.sizeBytes)} · ${formatDate(latest.date)} · <a href="${rel}install/">How to install</a></p>`
    : html`<p class="soon">Coming soon — no APK published yet</p>`}
</div>
</section>
<h2 data-reveal>About</h2>
<div class="prose" data-reveal>${md(app.description)}</div>
${app.screenshots.length ? '' : html`<div class="showcase" data-reveal aria-hidden="true"><img src="icon.png" alt="" width="160" height="160"></div>`}
${app.screenshots.length ? html`
<h2 data-reveal>Screenshots</h2>
<div class="gallery" data-reveal tabindex="0" role="group" aria-label="${app.name} screenshots">
  ${app.screenshots.map((s, i) => html`<figure><img src="screenshots/${s}" alt="${app.name} screenshot ${i + 1} of ${app.screenshots.length}" loading="lazy"></figure>`)}
</div>
<p class="note">Screenshots are from development builds and use sample data.</p>` : ''}
<h2 data-reveal>Details</h2>
<dl class="facts" data-reveal>
  <dt>Platform</dt><dd>Android${app.minAndroid ? ` ${app.minAndroid} or newer` : ''}</dd>
  <dt>Category</dt><dd>${app.category}</dd>
  <dt>Status</dt><dd>${STATUS_LABEL[app.status]}</dd>
  ${app.website ? html`<dt>Website</dt><dd><a href="${app.website}" rel="noopener">${app.website.replace(/^https:\/\//, '')}</a></dd>` : ''}
</dl>
<h2 id="versions" data-reveal>Version history</h2>
${app.releases.length
  ? app.releases.map((r) => releaseCard(app, r))
  : html`<p class="empty">No versions published yet. Each version will appear here with its changelog, size and SHA-256.</p>`}`;
  return layout({
    site, rel, nav: 'home', path: `apps/${app.slug}/`, title: app.name,
    description: `${app.name}: ${app.tagline}. ${app.type === 'game' ? 'Android game' : 'Android app'} by ${site.name}.`,
    image: `apps/${app.slug}/icon.png`, body,
  });
}

export function installPage({ site }) {
  const rel = '../';
  const body = html`
<h1>Install an APK on Android</h1>
<p>Apps on this site are downloaded as APK files and installed directly, not through Google Play. This takes about a minute.</p>
<ol class="steps">
  <li><strong>Download</strong> the APK from the app's page, using your phone's browser. Note the version you chose.</li>
  <li><strong>Allow installs from your browser.</strong> When Android asks, open <em>Settings</em> and turn on <em>Allow from this source</em> for the browser or file manager you used. You can turn it off again afterwards.</li>
  <li><strong>Open the file</strong> from your notifications or the Downloads folder and tap <em>Install</em>.</li>
  <li><strong>Updating:</strong> install the newer APK over the old one. Your data stays, as long as it is the same app and was signed the same way. If Android refuses the update, uninstall the old version first; this removes its data.</li>
</ol>
<h2>Check the file (optional)</h2>
<p>Each version lists a SHA-256 checksum. If it does not match, do not install the file.</p>
<ul>
  <li>On Windows, in PowerShell: <code>Get-FileHash .\\App.apk -Algorithm SHA256</code></li>
  <li>On macOS or Linux: <code>shasum -a 256 App.apk</code></li>
  <li>On Android: a file-manager or hash-checker app that shows SHA-256.</li>
</ul>
<h2>Good to know</h2>
<ul>
  <li>Builds marked <em>Dev build</em> are debug-signed test versions and may be rough.</li>
  <li>Android may warn that the app is from an unknown source. That is expected for apps outside Google Play.</li>
  <li>Problems? Write to <a href="mailto:${site.email}">${site.email}</a> with the app, version and phone model.</li>
</ul>`;
  return layout({
    site, rel, nav: 'install', path: 'install/', title: 'Install an APK',
    description: 'How to install an Odin Group APK on Android, and how to check its SHA-256.', body,
  });
}

export function aboutPage({ site, apps }) {
  const rel = '../';
  const body = html`
<h1>About ${site.name}</h1>
<p>${site.about}</p>
<p>Right now the catalogue lists ${apps.length} ${apps.length === 1 ? 'title' : 'titles'}, all for Android.</p>
<h2>Contact</h2>
<p>Email <a href="mailto:${site.email}">${site.email}</a>.</p>`;
  return layout({
    site, rel, nav: 'about', path: 'about/', title: 'About',
    description: `About ${site.name} and how to contact us.`, body,
  });
}

export function notFoundPage({ site }) {
  const body = html`
<h1>Page not found</h1>
<p>That page does not exist, or has moved.</p>
<p><a class="btn" href="${site.url}/">Go to the home page</a></p>`;
  return layout({
    site, rel: '', abs: true, nav: '', path: '404.html', title: 'Page not found',
    description: 'Page not found.', body,
  });
}
