# Phase 2 — APK publishing pipeline

Read first: `docs/PLAN.md`, `CLAUDE.md`, `docs/specs/phase-1-site.md` §2 (catalogue schema), the phase-1 code.

## 1. `tools/publish.mjs` — the one command other projects run

```
node "D:/Projects/ODIN GROUP/tools/publish.mjs" --app <slug> --apk <path.apk> \
     --phase "Phase 3 — Sales screens" --changelog <notes.md> [--channel stable|beta] [--dry-run]
```

Steps, stop with a clear error at the first failure:

1. **Lock**: take `%LOCALAPPDATA%/odin-publish/publish.lock` (several projects may publish at once); wait up to
   10 min, then fail. Remove stale locks older than 30 min.
2. **Workspace**: never touch the owner's checkout. Use a dedicated clone at `%LOCALAPPDATA%/odin-publish/repo`
   (create on first run, then `git fetch` + hard reset to `origin/main`).
3. **Validate the APK** with `aapt2 dump badging` (latest `build-tools` under
   `%LOCALAPPDATA%/Android/Sdk`): package id must equal `app.json.packageId`; read `versionName`, `versionCode`,
   `minSdk`, `targetSdk`. `application-debuggable` → channel forced to `dev`. Refuse if this `versionCode` (or
   `versionName`) is already in `releases.json`, with the message "bump the version before publishing". Refuse
   unknown slugs (list the valid ones). Changelog file must be non-empty.
4. **Release**: `gh release create <tag> <apk renamed to <AppName>-<versionName>.apk> --repo
   mhmdfaour/odin-group-website --title "<AppName> <versionName> (<phase>)" --notes-file <changelog>`;
   `--prerelease` unless channel is `stable`. Compute SHA-256 and size locally.
5. **Catalogue**: prepend the entry to `catalog/apps/<slug>/releases.json`, set `app.json.status` to `beta` if it
   was `in-development`. Commit `Publish <AppName> <versionName> (<phase>)` and push to `main` (on a push race:
   fetch, rebase, retry up to 3 times).
6. **Deploy**: `npm ci` (if needed), `npm run deploy` from the clone.
7. **Verify**: HEAD the asset URL (200) and fetch `/apps/<slug>/releases.json` from the live site (retry up to
   3 min for Pages to update). Print the app page URL with the version anchor.

If step 4 succeeded but a later step failed, print exactly how to resume (`--resume <tag>` skips the upload, reuses
the existing release).

`--dry-run` runs steps 1–3 and prints what it would do. `--add-app` is out of scope: new apps are added by a PR to
this repo (catalogue entry + icon).

## 2. Tests (`node --test`)

Use a fixture APK built by a tiny script, or stub `aapt2`/`gh`/`git` behind an injectable runner: duplicate version
refused, wrong package refused, debug → `dev`, lock contention, release entry shape matches the schema, resume
path.

## 3. Backfill

Publish what exists today, after confirming each file is the newest build of its project (ask the main session if
unsure; do not build other projects yourself):

- Wormhole Rider: `C:\Users\EIFfa3our\Wormhole Rider\Builds\Android\WormholeRider-setup.apk`
- ToolForge: newest `app-release.apk` under `D:\Projects\ToolForge` (worktree builds included; pick by mtime and
  by highest versionCode)
- Fawterly, Petriotic: only debug builds exist → publish as `dev` channel only if the main session confirms.

Changelog for backfilled versions: summarise from the project's merged PRs / plan (factual, short).

## 4. Guide for other projects

`docs/PUBLISHING.md`: when to publish (after each phase whose PR is merged and that produces an Android build),
how to bump the version, how to build the APK (Flutter: `flutter build apk --release`; Unity: the project's build
script), the exact command, how to write the changelog, what to do on each error. Keep it to one screen.

## 5. Acceptance checks

1. Tests pass. `--dry-run` on each backfill APK prints the right package/version.
2. Backfill published; each app page shows the version with a working download (download it, compare SHA-256).
3. Running the same publish twice is refused with the bump message.
4. PR with what ran, the live URLs, and the release list.
