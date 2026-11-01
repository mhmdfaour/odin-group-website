# Odin Group website

Static catalogue site for Odin Group's apps and games, with a downloadable APK and changelog per version.
Plan: `docs/PLAN.md`; phase specs: `docs/specs/`. Live: https://www.odingroup.co.za (GitHub Pages, `gh-pages`).

## Rules

- Build only what the current phase spec says.
- APKs are GitHub Release assets on `mhmdfaour/odin-group-website`; never commit an `.apk`/`.aab` to git.
- Never edit, build in or run anything inside another project's folder; read only what the spec names.
- Never run GitHub Actions or add workflows. Run `npm run build && npm run check` (and tests) locally before every PR.
- Deploy only with `npm run deploy`, and only from `main` after a merge (or as the spec's acceptance step says).
- Dev server port: **4610**. Nothing else in this project listens on a port.
- Copy is factual: no claims an app can't back, no fake reviews, download counts or ratings.
