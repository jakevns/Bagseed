# GitHub game package

The playable game is in `public/`. Open `public/index.html` as before, or serve that folder. Keep `character-data.js` and `assets/` beside the HTML when copying the game to another computer.

Character image data lives in a companion classic JavaScript file so each Git file remains below GitHub's 100 MiB limit. The HTML loads that script synchronously before the character renderer. This works when opening the local `file://` game and does not require a network connection, fetch request or server for the character data.

The image data URLs are unchanged: this packaging change does not resize, recompress, recolor or redraw the artwork. Source PNGs, generation prompts and review previews remain in the repository. The build report records the companion script's checksum, and `node tools/check.mjs` verifies it with the HTML and renderer.

Build with `node graphics/production/sources/build.cjs` after preparing encoded source assets. Commit both `public/index.html` and `public/character-data.js` with the updated build report. The development server also serves both files from `public/`.

`npm run build:bedroom` also preserves the existing character-data script tag ahead of the verified character renderer. It retains the companion file and its build-report checksum when rebuilding room/equipment graphics.

For managed browsers that block local file navigation, run the same live stride checks through the development server with `BAGSEED_TEST_HTTP=1 node --test tests/custom-stride-live.test.cjs`. Without that flag the test keeps its original local-file launch coverage.
