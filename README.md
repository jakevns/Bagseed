# Bagseed

Latest character change: [v14 neck and reaction attachment review](review/neck-v14/README.md). It records the rejected initial result, the revised rendered poses, and targeted checks. The user accepted this checkpoint for now and requested publishing it.

The approved main menu uses a sunny community-garden illustration with familiar neighbors, two cannabis plants, and responsive desktop/phone controls. See [menu artwork and build notes](graphics/main-menu/README.md).

The supplied **v1.1.5.1 Night Walker Flashlights** game, updated with the user-approved illustrated character direction. Serve `public/` with any static host (`npm run dev` locally). To play straight from disk instead, run `npm run build:standalone` and open `dist/standalone/index.html`. Use this `index.html` for **Web Preview / Open in ChatGPT**; `src/game.html` is source-only and does not include the appended illustrated graphics.

The update includes the five approved identities, 67 additional authored appearance variants, matching portraits, all 60 hairstyles and the existing customization choices. The [final review](review/final/index.html) contains comparisons, motion previews, a complete appearance roster, screenshots and validation notes. [Study 02](review/characters-v2/index.html) records the approved samples and reference evidence. Study 01 was rejected and is excluded from this release.

The latest local custom-character repair draws complete hair over clothing in figures and portraits. Loose hairstyles and afros conceal covered ears and earrings; short cuts and updos retain visible ears. Individual scalp fits, complete hair lengths and the accepted first five cuts are retained. See the [v13 hair layer review](review/hair-layer-v13/README.md) for before/after figures, all head shapes and actual creator/wardrobe captures. The earlier [v12 fits](review/hair-all-v12/README.md) and [five-cut review](review/hair-batch-01/README.md) are retained as history. The distinct mouths and clean beard edges from [v9](review/customization-v9/README.md) and the [v8 detail alignment](review/customization-v8/README.md) are retained.

Players who would rather not grow cannabis can grow garden plants in the starter tent and grow-tent pots instead. Clicking an empty pot lists cannabis seeds alongside garden seeds from Fern & Forge. Herbs, greens, peppers, flowers and houseplants grow there under the grow light in any season. Plants that need a whole garden bed or a trellis stay outdoors. Each pot holds either cannabis or a garden plant, never both. These plants are watered, fed, harvested and sold the same way as other garden plants.

The [combined release checkpoint](docs/graphics/merge-checkpoint.md) records the merge with the latest menu, curtains and desk work. Publishing checks require the generated game, embedded character payload and character source checksums to agree, preventing a stale character release from passing deployment validation.

## Develop and verify

Use the existing checkout; cloud tasks are already isolated. Node.js 22+ and Chromium are required for development checks. Playwright is locked in `package-lock.json`; the prepared cloud machine uses `/usr/bin/chromium`. Set `BAGSEED_BROWSER_PATH` for another installation.

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run dev
```

The development server serves `public/` on port 5173. `HOST` and `PORT` override its binding. Tests start their own server and disposable browser storage; screenshots go to ignored `artifacts/`. They do not use the live site's progress. `npm run check` protects the pristine archive and parses the built game scripts. The browser tests cover creation, movement, customization, save compatibility, scenes, seating, shops, music controls, smell encounters, flashlights and emulated phone layouts.

## Rebuild the graphics release

`src/game.html` is the editable gameplay source. `baselines/` retains the immutable uploaded HTML, SHA-256 `4889b1d5c14ee0b95085ed6ef208615e19598f2bf5a656604284f22085502164`. The bedroom shell update adds a rendering hook for dynamic window light; gameplay rules remain unchanged. The builder appends the graphics renderers to produce `public/index.html`; edit the sources, not the generated output. Images are not embedded in the published page: as the last build step, `tools/external-assets.cjs` moves each one to `public/assets/embedded/<content hash>` and links it, so the page stays small, browsers cache images between updates, and unchanged art never adds a new file to git. `npm run check` verifies every linked image. It refuses to overwrite an output changed since the last recorded build.

The approved bedroom background uses sage plaster, paneled trim, and honey oak. All **80 bed combinations** are illustrated: [Starter/Wooden](graphics/beds/batch-01/README.md), [Metal/Cozy](graphics/beds/batch-02/README.md), [Platform/Fancy Canopy](graphics/beds/batch-03/README.md), and [Rattan/Tufted](graphics/beds/batch-04/README.md), each with ten bedding choices. Room, store and package previews share the approved artwork. See [bedroom sources](graphics/bedroom/README.md). Rebuild with `npm run build:bedroom`, then run `npm run check` and `npm test`. This preserves the existing verified character payload; the full graphics build includes all four bed modules too.

All three [seedling-desk tiers](graphics/desks/README.md) are also illustrated in the room, store and package previews. Both build paths include them. The [local merge checkpoint](docs/graphics/merge-checkpoint.md) records the integration of this furniture work with the latest character fixes and explains how to rebuild the shared game file safely.

```sh
python3 -m venv /workspace/.venvs/bagseed-art
/workspace/.venvs/bagseed-art/bin/pip install -r graphics/production/sources/requirements.txt
export PATH="/workspace/.venvs/bagseed-art/bin:$PATH"
npm run build:graphics
npm run check
npm test
node tools/review-production.cjs
python3 tools/package-review.py
```

Python crops, registers and losslessly encodes retained artwork; it does not generate new character designs. See [production sources](graphics/production/README.md), [the source audit](docs/graphics/audit.md), and [the checkpoint](docs/graphics/checkpoint.md).

The user's reference DOCX is preserved in the repository. Its 1,080 embedded images cover 30 games. The approved direction studied character art from Fields of Mistria, Eastward, Sea of Stars, Legend of Mana, CrossCode, Roots of Pacha and Owlboy; specific IDs and source links are retained with Study 02. No additional reference uploads are needed for this update.

## Hosting

GitHub Pages publishes the standalone game at **https://jakevns.github.io/Bagseed/** after the first successful deployment. `.github/workflows/pages.yml` verifies the HTML and publishes only `public/` whenever approved changes are merged or pushed to `main`. It can also be rerun from Actions → Publish Bagseed to GitHub Pages → Run workflow on `main`. The repository's Settings → Pages → Build and deployment → Source must be **GitHub Actions** (enabled by the repository owner during setup).

The link stays the same for future updates. Check the workflow's green deployment result before refreshing; `https://jakevns.github.io/Bagseed/version.json` identifies the deployed commit, character revision and game checksum. Review boards and original HTML backups remain in Git and are not included in the published site. Local browser saves are tied to the site's origin, so progress from another host does not automatically appear on the Pages address. GitHub Pages does not serve branch previews; the site follows merged `main`.

`netlify.toml` publishes `public/` without a build step. The task authorizes a GitHub push; no manual Netlify deployment is performed. A connected Netlify project may automatically build on a push. Live deployment status and physical-device performance are not verified by local checks. Browser saves are scoped to the site's origin.
