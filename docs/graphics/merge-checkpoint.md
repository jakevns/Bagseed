# Character and furniture merge

Local character checkpoint `c02baf1` was merged with `origin/main` through `06078be` (all 80 bed/bedding combinations and all three seedling-desk tiers). The character renderer remains `customization-7`. No furniture or character source artwork was replaced during conflict resolution.

Conflicts were in `graphics/production/sources/build.cjs` and `graphics/production/build.json`. The resolution retains the current transparent-head asset loader, character review metadata, all four bed compilers and the desk compiler. `public/index.html` was rebuilt from the combined sources; neither worker's generated file was chosen wholesale.

The embedded character script matches the backed-up local version, and the room-shell, four bed scripts and desk script match the remote version, after normalizing Windows line endings. The character source/assets match `c02baf1`; the furniture source/assets and compilers match `06078be`. All 80 bed views and all three desk views also render identically to the incoming game in the same browser. Verification details are in `merge-validation.json`.

The earlier bed fixtures use exact PNG checksums. Windows accelerated canvas differed from those reference checksums even for the untouched incoming game. The shared bed test now uses software canvas, matching all 60 stored reference checksums without replacing or relaxing them. Actual purchases, installation, saves, room/store/package previews and sleep controls remain covered for every batch.

Before-merge files, binary patches, index snapshot and test logs are retained in ignored `artifacts/merge-backup-2026-10-15T17-42-40-255Z/`. `codex/character-before-furniture-merge` points to the committed character checkpoint. Browser checks use disposable storage and do not access live player saves. This merge is local; no push or deployment was requested.

For future concurrent updates, edit the appropriate sources instead of hand-merging embedded image data in `public/index.html`. `node graphics/production/sources/build.cjs` rebuilds characters and all furniture from their existing registered assets. `npm run build:bedroom` rebuilds furniture while retaining the verified embedded character script. Both refresh the shared build report. Run `npm run check` and the relevant browser tests after merging. `tools/verify-merged-furniture.cjs` can compare incoming and merged furniture in the same browser when investigating a later merge.
