# Companion pot refresh

Status: user approved; integrated into production index.html. The approved third herb batch is published separately in `eedbf4f`.

The game has one shared companion pot appearance, not purchasable side-pot tiers. This proposal refreshes that shared design across all eight existing slots: starter 1, 2×2 2, 4×4 2 and 5×5 3. The terracotta body has a rolled clay rim, small olive/brass leaf tag and shallow saucer. No shop item, price, variant selector, capacity, planting rule, companion bonus or care mechanic is added.

The generated PNG is retained unchanged in assets/pot.png and encoded into an exact lossless WebP. The measured crop and soil ellipse are in sources/manifest.json. World height stays 6 units and width stays within the original 9-unit footprint. Each plant keeps its original x coordinate, y−4 soil attachment, native growth stage, 0.8 render scale and existing wind animation. Rendering order is back/soil, native plant, near rim/body. The front mask removes the back half and soil ellipse from a cached rendering surface, using the original source pixels.

The matching empty-pot thumbnail is provided for future UI use; there is no existing independent companion-pot product to replace in the store. Seed packets and starter nursery pots keep their current identities.

- [Empty and planted examples](approval.png)
- [Before and after](before-after.png)
- [Six-second existing herb wind animation](wind.mp4)
- [Native tent placements](tent-placements.png)
- [Matching pot thumbnail](pot-icon.png)

Review uses the actual public/index.html game in a disposable browser, injects the draft renderer, and routes its image from this folder. The historical review media records the proposal. The approved source is now published through graphics/companion-pots with a hashed image URL, and startup awaits its image. The command below still injects the review adapter; its before picture uses the original native draw function from src/game.html. Reproduce with:

```sh
BAGSEED_BROWSER_PATH=/usr/bin/chromium node tools/preview-companion-pots.cjs
```

The review warms native room rendering before checking 4×4/5×5 coordinates because TentArt.geo is populated by drawing those rooms. It compares original and proposed positions and care targets across all eight slots, verifies an overlong test stem is hidden behind the front while foliage remains visible above the soil, compares the main grow-pot rendering pixel-for-pixel, draws every eligible companion species at all four stages, checks drawing leaves saved plant data unchanged, and reloads saved fixtures with the draft adapter reinstalled.

Validation passed: eight native positions and eight unchanged care targets, front-rim occlusion, unchanged main-pot pixels, all 76 eligible species × four stages (304 renders), read-only drawing, saved fixture reload and no browser errors. The wind clip is 72 frames at 12fps (six seconds).

Sharpness: the original 1254×1254 source and 862×677 pot crop are retained. Both layers draw from full-resolution images; the cached near rim remains 862×677. See production/ for screenshots and actual production-renderer checks at mobile/desktop wide, normal and close zoom. No image generation or source repainting occurred during integration.

Release validation passed: build and static integrity checks, production companion-pot checks and five garden/live-plant/resolution browser regressions (six tests total). All eight care targets, saved fixtures and original source pixels are retained.
