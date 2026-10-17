# Velvet Underbrush connected component prototype

Status: component artwork, growth, flowering and red senescence approved by the user. The painted kit remains a prototype pending full renderer integration. The separately approved night cooling and Sprout color features are integrated into the native game.

## Strain identity and source art

Native catalog source: `src/game.html`, line id `velvet`, Heirloom Porchlight × Old Oak, broad forest-green leaves, Red accents, branching 1.0 (Porchlight 1.1), height factor .85. The review uses these expressed appearance traits; height factor remains the simulation's responsibility and is not reapplied to an already measured plant height.

The new transparent `assets/components.png` organ sheet was generated using the approved Porchlight component sheet for layout/style and the archived Velvet concept for strain identity. Source pixels remain unchanged. The new kit has broader dark green fans and compact wine-accented flowers, not recolored full-plant frames.

Sixteen organs cover seed, radicle, paired cotyledons, single/three/five/seven-leaflet fans, sugar leaf, stem segment, node junction, early/mid/late female flowers, closed/open male flowers and bamboo/tie. Source and lossless WebP checksums, measured alpha hulls, crops and attachment coordinates live in `sources/manifest.json`. WebP conversion is checked for exact RGBA equivalence. The source is retained in full, including transparent gutters; crops/anchors are metadata.

`tools/compile-velvet-components.py` reproduces the manifest, lossless WebP and draft library registration using Pillow, NumPy and SciPy. It measures connected alpha regions, allowing leaves to extend beyond a theoretical grid cell without clipping. Runtime assets use content hashes.

## Shared connected model

The model and renderer are shared directly from `graphics/plants/porchlight/sources/`; Velvet does not fork wind, growth, senescence or care logic. The renderer accepts a manifest API name and expressed branching from the pinned art identity. Porchlight's default API and behavior are retained. `velvet@1` registers 15 inherited organ roles as integration drafts, leaving the existing Porchlight profile and saved selections intact; bamboo remains a shared accessory role in the prototype model. The new optional inherited `branching` descriptor reads expressed native traits; it does not create new genetic rolls or rewrite saved appearances.

Branches and leaves retain parent attachments and stable IDs as the plant grows from 3 to 90 inches. Eleven main nodes remain the native limit. Physical height is measured against actual source-alpha bounds. Root stays fixed under wind; branches and leaves follow the same attachment rig, and reduced motion freezes posing. Female flowers attach at apex and primary branch tips. Male closed/open organs are available and tested, though the main review board follows a female plant.

Senescence uses the existing expressed Red accents phenotype: green vegetative fans fade toward wine/rust red during late flower and harvest-ready stages. It is independent of nutrition, stress and disease, and preserves leaf alpha/vein shading. Stems and trichome-covered flowers retain their source art. No new harvest dates, growing instructions or actual game-week duration are introduced by the review's controlled stage/finish inputs.

## Samples and verification

- `node tools/preview-plant-components.cjs velvet` captures the stage board, same-scale 50/90-inch pair, late-flower portrait and 10-second growth/wind video/GIF. `--stills` skips animation.
- The preview opens the real `index.html`, waits for startup, then injects the kit only into that disposable browser. It does not replace the live game renderer.
- `node --test tests/velvet-components.test.cjs tests/porchlight-growth-model.test.cjs tests/plant-phenotype-library.test.cjs`
- `npm run check`

Review files are in `review/velvet-components/`. Stage-board panels independently magnify small organs and juvenile plants for legibility; their pots are schematic and the panel sizes are not a physical scale comparison. Only the 50/90-inch board uses a shared physical scale. Video growth values are explicit study inputs, not elapsed game days. Intermediate animation PNGs are ignored; the encoded videos and approval stills are retained.

The shared renderer still needs full topping/LST/SCROG coverage, historical care-event adapters, drying/harvest art integration and native scene/depth integration before either strain can replace `PlantArt`. This checkpoint adds a second review kit; it does not claim those unfinished states are complete.
