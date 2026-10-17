# Halfmoon CBD connected component prototype

**Production update:** this approved kit is now connected to the live game through `BagseedPlants` / native `PlantArt`. See `review/live-plants/README.md`. The notes below preserve the original component-review milestone.

Status: artwork and growth samples approved on 2026-10-17. Sixth kit, part of the three-strain review after Moonberry. Full painted-renderer integration remains pending; this registers parts and produces actual connected-rig samples without replacing the native renderer.

The existing catalog defines `halfmoon` (Tidewater CBD × Lemon Hush) as photoperiod Type III, height factor 1.15, branching 0.95, and Citrus aroma. `sources/profile.json` pins its expressed visual traits and review captions. Native height, growth timing, chemistry and genetics are unchanged; actual plant height is the renderer input and its genetic factor is not applied twice. The 50/90-inch figures are controlled physical-scale studies rather than predictions of a normal indoor autoflower's size.

New transparent artwork supplies fine, narrow lime-green fans and slender citrus-green flower spears. Sixteen isolated organs cover seed, radicle, cotyledons, single/three/five/seven-leaflet fans, sugar leaf, stem, Y junction, early/mid/late female flowers, closed/open male flowers and bamboo support. Source PNG pixels are preserved. Crop bounds, real attachment anchors, alpha hulls and SHA256 hashes are recorded in the manifest. WebP encoding is verified for exact RGBA equivalence.

`halfmoon@1` registers 15 organ roles as integration drafts. The shared Porchlight model and renderer provide seedling-to-flower assembly, expanding attached shoots, stable identities, exact physical canopy height, wind with fixed roots, reduced motion and golden senescence. Each flowering primary branch carries four graded lateral bud sites plus its tip, with the largest flower at the apex. Shared canopy cleanup removes low growth and popcorn sites and enlarges retained tops. Saved care state remains separate from inherited genetics. Existing five strain profiles and all their part records are unchanged.

No cool-night pigment or color-based Sprout bonus is added to this green-only genotype.

Samples in `review/halfmoon-components/` include seed through harvest-ready, mature flower, 50/90-inch growth, and a 10-second growth/wind animation. The batch comparison is `review/plant-batch-03/next-three-late-flower.png`. The next production milestone still needs complete topping/LST/SCROG, diagnostic-state and native camera/depth adapters; samples do not imply that unfinished integration is installed.

Reproduce:

- `python3 tools/compile-plant-components.py halfmoon`
- `node tools/preview-plant-components.cjs halfmoon` (`--stills` skips animation)
- `node tools/preview-popcorn-canopy.cjs --next-three`
- `node --test tests/plant-batch-three.test.cjs tests/plant-canopy.test.cjs tests/porchlight-growth-model.test.cjs tests/*components.test.cjs tests/plant-phenotype-library.test.cjs tests/night-color.test.cjs`
- `npm run check`

Preview captures load current `index.html` in a disposable browser and inject only the review rig. Existing output and character payload are unchanged. User approved this batch on 2026-10-17.
