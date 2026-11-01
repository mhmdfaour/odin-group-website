# Phase 1 — site generator, design, launch catalogue, deploy

Read first: `docs/PLAN.md`, `CLAUDE.md`.

## 1. Build tooling

- Node (already installed). `package.json` scripts: `build` (catalog → `dist/`), `dev` (build + local static server
  with rebuild on change, port **4610**), `check` (schema validation + link check over `dist/`), `deploy` (build,
  `check`, then push `dist/` to the `gh-pages` branch with the `gh-pages` npm package; include `CNAME` =
  `www.odingroup.co.za` and `.nojekyll`).
- No framework. Plain ES modules, a tiny template helper (tagged template literals are fine), one CSS file, no
  client JS except the home-page filter and a copy-SHA button. Minimal dependencies (`gh-pages`, a JSON-schema
  validator, a markdown renderer for changelogs). Lock file committed.
- `dist/` and `node_modules/` gitignored.

## 2. Catalogue schema (validated by `npm run check`; write the JSON Schemas to `catalog/schema/`)

`catalog/apps/<slug>/app.json`:

```json
{
  "slug": "fawterly",
  "name": "Fawterly",
  "type": "app",                       // "app" | "game"
  "packageId": "za.co.odingroup.fawterly",
  "tagline": "Business made easy",
  "description": "Markdown, 1–3 short paragraphs",
  "category": "Business",
  "minAndroid": "8.0",                 // optional
  "status": "in-development",          // "in-development" | "beta" | "released"
  "sourceProject": "D:/Projects/Fawterly",
  "order": 1                           // sort order on the home page
}
```

`catalog/apps/<slug>/releases.json` — array, newest first; empty `[]` until phase 2 publishes:

```json
[{
  "versionName": "1.2.0", "versionCode": 12,
  "date": "2026-11-01", "phase": "Phase 3 — Sales screens",
  "channel": "beta",                   // "stable" | "beta" | "dev" (dev = debug-signed build)
  "changelog": "Markdown bullet list",
  "file": "Fawterly-1.2.0.apk", "tag": "fawterly-v1.2.0+12",
  "url": "https://github.com/mhmdfaour/odin-group-website/releases/download/fawterly-v1.2.0+12/Fawterly-1.2.0.apk",
  "sizeBytes": 31457280, "sha256": "…", "minSdk": 26, "targetSdk": 35
}]
```

`catalog/site.json`: company name "Odin Group", tagline, short about text, contact email `info@odingroup.co.za`.

## 3. Launch catalogue

For each app read its project (read-only; never edit another project) for name, description, package id, icon and
screenshots:

| slug | Project | Type | Package id |
| --- | --- | --- | --- |
| fawterly | `D:\Projects\Fawterly` (Flutter, `app/`) | app | `za.co.odingroup.fawterly` |
| toolforge | `D:\Projects\ToolForge` (Flutter) | app | `za.co.odingroup.toolforge` |
| petriotic | `D:\Projects\Petriotic` (see its `docs/brand/`, follow its brand rules) | app | read from project |
| wormhole-rider | `C:\Users\EIFfa3our\Wormhole Rider` (Unity) | game | read from `ProjectSettings` |

- Icon: the project's launcher icon or brand logo, resized to 512×512 PNG. Screenshots: use any the project already
  has (store listing, docs, test stills); if none exist, leave the gallery out for that app (no placeholders that
  look like real screens). Optimise images (≤300 KB each).
- `status` from each project's plan/README; descriptions in plain, factual voice (no claims the app can't back).

## 4. Design

- Odin Group brand: there is no logo yet. Make a clean SVG wordmark "ODIN GROUP" plus a simple mark (geometric,
  Norse-inspired raven or rune shape, one colour). Dark navy + one accent colour, light and dark mode via
  `prefers-color-scheme`. System font stack or one Google Font.
- Mobile-first (people download APKs on their phones): download button reachable without scrolling on a 375 px
  screen, no horizontal scroll, tap targets ≥44 px.
- App page per `docs/PLAN.md` "Pages". When an app has no releases yet, show "Coming soon — no APK published yet"
  instead of the download button.
- Accessibility: semantic HTML, alt text, visible focus, contrast AA.
- SEO basics: per-page `<title>`/description, Open Graph image (app icon), `sitemap.xml`, `robots.txt`, favicon.
- Feeds `/apps/<slug>/releases.json` and `/updates.json` (copies of the catalogue data).

## 5. Acceptance checks

1. `npm run build && npm run check` pass with no warnings; schema check fails on a broken `app.json` (unit test).
2. Add a fake release to a temp copy of the catalogue in a test: app page shows the download button, version
   history entry, anchor, size, SHA-256; home "Latest updates" shows it.
3. Stills (in `docs/stills/phase-1/`, from the built-in browser at 375 px and 1280 px, light and dark): home, one
   app page with no releases, the test-fixture app page with releases, install page.
4. `npm run deploy` publishes to `gh-pages`; https://mhmdfaour.github.io/odin-group-website/ (or the custom domain,
   once DNS is set) serves the site. Enable Pages on the `gh-pages` branch with `gh api` and set the custom domain.
   Report the URL.
5. PR to `main` with stills, tests run, and anything the owner must do (DNS).
