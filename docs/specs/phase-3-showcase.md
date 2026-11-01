# Phase 3 — Brand and showcase

The owner's ask (2026-11-01): an Odin Group logo, a cover banner, a parallax slider with features that pop in, and
a full overview of every app and game, supplied by the projects themselves. The site should feel complete, not
empty. Read first: `CLAUDE.md`, `docs/PLAN.md`, the current `src/` (PR #3 already added a hero, glass header,
scroll reveal and light parallax; build on it, don't restart).

Out of scope: `tools/publish.mjs` and `releases.json` (phase 2 owns them, on another branch).

## Step A — Logo concepts, then stop for the owner's pick

1. Make **3 distinct logo concepts** for "ODIN GROUP": a symbol plus a wordmark. Directions: (1) a geometric raven
   (Huginn/Muninn), (2) a rune-based monogram built from the O and G, (3) an all-seeing eye / Valknut-inspired
   abstract mark. Each concept should be one or two flat colours on a deep navy (#0B1530 or close), and must read at
   32 px.
2. Use the `nano-banana` image tools for exploration if they are configured. The final logo must be a
   **hand-built SVG** (clean paths, no embedded raster), so trace or redraw the chosen idea as SVG. If nano-banana
   isn't configured, draw the SVG concepts directly.
3. Save the concepts to `docs/brand/concepts/` (SVG + a 1024 px PNG each, plus one comparison sheet PNG). Push the
   branch and **stop**. Report the sheet's path so the main session can show the owner and send back the pick.

## Step B — Brand kit (after the pick)

`src/assets/brand/`: `logo.svg` (horizontal), `logo-stacked.svg`, `mark.svg`, `mark-mono.svg`, light and dark
variants, plus a favicon set (`favicon.svg`, 32 px and 180 px PNG, `site.webmanifest` icons 192 and 512). Write the
colour tokens into the CSS. Keep a short `docs/brand/README.md` (colours, clear space, minimum size, do/don't).

## Step C — Cover banner

- A home-page hero banner (1920×1080 art, responsive `srcset` at 768, 1280 and 1920, WebP + fallback ≤350 KB at
  1920). It's Norse-tech themed and abstract: aurora or constellation sky, a subtle raven or rune motif, and no
  text baked into the image (the HTML holds the text). Build it from **3–4 layers** for parallax (sky, far
  shapes, near shapes, foreground glow).
- An Open Graph image 1200×630 with the logo, used site-wide.
- One **cover image per app** (1600×900): for each app built from its own logo/icon and brand colours, plus its
  real screenshots in phone frames where they exist. **Never** invent app screens. Petriotic must use only its
  toolkit colours and its logo unaltered (see `D:\Projects\Petriotic\CLAUDE.md` and `docs/brand/`).

## Step D — Parallax showcase slider (home page)

- Directly under the hero: a full-width slider, one slide per app/game (ordered by `order`), auto-advancing every
  6 s, pausing on hover/focus/touch, with swipe on touch, arrow keys, dots and prev/next buttons. Each slide shows
  the app's cover layers moving at different speeds on scroll and pointer move, plus name, tagline, status badge
  and "View app" / "Download" (or "Coming soon") buttons.
- **Popping features**: each slide's 3–4 key features (from `features`, below) pop in one by one as cards (scale
  0.8→1 + fade, 120 ms stagger) when the slide becomes active.
- Respect `prefers-reduced-motion`: no auto-advance, no parallax, features shown statically. No layout shift, and
  the hero image is preloaded. Vanilla JS only, ≤12 KB unminified for the slider; no libraries.
- The rest of the home page should feel full: a "What we build" strip (Apps / Games counts plus a one-line pitch
  each), the app grid with cover thumbnails, "Latest updates" (show "First releases coming soon" when empty), and
  an "About Odin Group" band with the logo and contact.

## Step E — App overviews, supplied by the projects

Each app page gets a richer overview built from new catalogue fields (extend `catalog/schema/app.schema.json`; all
fields are optional so `check` still passes for apps without them):

```json
"accent": "#1C55A4",
"cover": "cover.webp",
"stage": "Phase 1b — Identity and pets",
"features": [{ "icon": "shield", "title": "Health book", "text": "Vaccines and vet visits with reminders." }],
"highlights": ["Works offline", "Arabic and English"],
"roadmap": [{ "label": "Next", "text": "Lost-pet alerts" }]
```

plus `catalog/apps/<slug>/overview.md` (longer markdown: what it is, who it's for, what works today).

**Source of truth is each project.** Each project keeps `docs/odin-listing.md` in its own repo, in this format:

```markdown
---
name: Petriotic
tagline: …
type: app | game
stage: Phase 1b — Identity and pets
accent: "#1C55A4"
highlights: [Works offline, …]
features:
  - { icon: shield, title: Health book, text: … }
roadmap:
  - { label: Next, text: … }
---
Overview markdown (what it is, who it's for, what works today — factual).
```

- Add `tools/import-listing.mjs <slug> <path-to-odin-listing.md>`: it validates the file and writes the fields into
  `app.json` plus `overview.md`. Add tests.
- Write `docs/LISTING.md`: a one-screen guide for projects on how to write `odin-listing.md` (what each field means,
  tone rules: factual, no claims the app can't back, no fake ratings or download counts).
- For **this phase only**, where a project has no `docs/odin-listing.md` yet, draft one **in this repo** under
  `catalog/apps/<slug>/odin-listing.draft.md` from the project's own docs (read-only: plans, READMEs, brand
  folders, ARB strings). Import it, and list the drafts in the PR so the main session can ask each project to
  confirm or replace it. Projects: fawterly, toolforge, petriotic, wormhole-rider.
- Icons: a small inline SVG icon set (≈20 icons: shield, bolt, globe, lock, cloud-off, scan, doc, receipt, chart,
  paw, map, bell, rocket, star, gamepad, trophy, wand, users, language, sparkle). Unknown icon → sparkle.

## Step E2 — Store availability (owner, 2026-11-01)

Apps are "coming soon" today. Once an app is published, it can be downloaded from Google Play and the Apple App
Store.

- Add optional `stores: { "googlePlay": "https://play.google.com/store/apps/details?id=…", "appStore":
  "https://apps.apple.com/…" }` to the schema. Allow only those two URL prefixes.
- When a store URL is set, show the **official** "Get it on Google Play" / "Download on the App Store" badges
  (official artwork, following each brand's badge guidelines; no recolouring), linking to the store. Use them as
  the primary call to action on the slider, the app card and the app page.
- When no store URL is set, show a clear **"Coming soon to Google Play and the App Store"** label (plain text and
  icons, not the official badges, which are only for live listings) as the primary state on the slider, cards and
  app page. Games and apps both use this.
- The APK version history stays (download and follow each version), as a secondary "Preview builds (APK)" section
  below the overview. It's hidden when the app has no releases.

## Step F — App page layout

Cover banner at the top with parallax and the accent colour, then: icon, name, tagline, stage badge and store badges or "Coming soon"
(with APK previews below); the feature cards (pop in on scroll); highlights as chips; the overview; screenshots in phone frames; the
roadmap as a mini timeline; the version history. Keep the download button above the fold at 375 px.

## Acceptance checks

1. `npm run build && npm run check && npm test` pass; tests cover the schema, the importer and the slider markup
   (one slide per app; reduced-motion fallback class present).
2. Lighthouse (local, mobile) on home and one app page: Performance ≥85, Accessibility ≥95, no CLS > 0.05. Report
   the scores.
3. Stills in `docs/stills/phase-3/`: home (hero, slider on two different slides, rest of page), each app page, at
   375 px and 1440 px in light and dark. Also a short screen recording or 3 frames showing the features popping in.
4. No package ids, local paths or other dev details anywhere on the site.
5. PR to `main` with stills, scores, the drafted listings and the tests run. Don't deploy; the main session deploys
   after the merge.
