# Bagseed

The approved main menu uses a sunny community-garden illustration with familiar neighbors, two cannabis plants, and responsive desktop/phone controls. See [menu artwork and build notes](graphics/main-menu/README.md).

The supplied **v1.1.5.1 Night Walker Flashlights** game, updated with the user-approved illustrated character direction. Open [public/index.html](public/index.html) for the complete standalone game, or serve `public/` with any static host. Use this `index.html` for **Web Preview / Open in ChatGPT**; `src/game.html` is source-only and does not include the appended illustrated graphics.

The update includes the five approved identities, 67 additional authored appearance variants, matching portraits, all 60 hairstyles and the existing customization choices. The [final review](review/final/index.html) contains comparisons, motion previews, a complete appearance roster, screenshots and validation notes. [Study 02](review/characters-v2/index.html) records the approved samples and reference evidence. Study 01 was rejected and is excluded from this release.

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

`src/game.html` is the editable gameplay source. `baselines/` retains the immutable uploaded HTML, SHA-256 `4889b1d5c14ee0b95085ed6ef208615e19598f2bf5a656604284f22085502164`. The bedroom shell update adds a rendering hook for dynamic window light; gameplay rules remain unchanged. The builder appends the graphics renderers and embedded images to produce `public/index.html`; edit the sources, not the generated output. It refuses to overwrite an output changed since the last recorded build.

The approved bedroom background uses sage plaster, paneled trim, and honey oak. All **80 bed combinations** are illustrated: [Starter/Wooden](graphics/beds/batch-01/README.md), [Metal/Cozy](graphics/beds/batch-02/README.md), [Platform/Fancy Canopy](graphics/beds/batch-03/README.md), and [Rattan/Tufted](graphics/beds/batch-04/README.md), each with ten bedding choices. Room, store and package previews share the approved artwork. See [bedroom sources](graphics/bedroom/README.md). Rebuild with `npm run build:bedroom`, then run `npm run check` and `npm test`. This preserves the existing verified character payload; the full graphics build includes all four bed modules too.

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

The link stays the same for future updates. Check the workflow's green deployment result before refreshing; `https://jakevns.github.io/Bagseed/version.json` identifies the deployed commit. Review boards and original HTML backups remain in Git and are not included in the published site. Local browser saves are tied to the site's origin, so progress from another host does not automatically appear on the Pages address. GitHub Pages does not serve branch previews; the site follows merged `main`.

`netlify.toml` publishes `public/` without a build step. The task authorizes a GitHub push; no manual Netlify deployment is performed. A connected Netlify project may automatically build on a push. Live deployment status and physical-device performance are not verified by local checks. Browser saves are scoped to the site's origin.
