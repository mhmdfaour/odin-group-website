# Odin Group website

Static catalogue of Odin Group's apps and games. Live: https://www.odingroup.co.za. Plan: `docs/PLAN.md`.

```
npm install
npm run build    # catalog/ -> dist/
npm run dev      # build + serve on http://localhost:4610, rebuilds on change
npm run check    # catalogue schema validation + link/anchor check over dist/
npm test         # unit tests
npm run deploy   # build, check, push dist/ to gh-pages (from main, after a merge)
```

Add an app: create `catalog/apps/<slug>/` with `app.json`, `releases.json` (`[]` to start), `icon.png` (512x512) and
optional `screenshots/*.png`. Schemas are in `catalog/schema/`. APKs are GitHub Release assets, never committed.

`tools/prep-assets.mjs` made the launch icons/screenshots (read-only from the source projects); `tools/make-og.mjs`
renders the social image; `tools/serve-fixture.mjs` serves a fake-release build for stills.
