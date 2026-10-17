# Gas Station Sushi connected component prototype

**Production update:** this approved kit is now connected to the live game through `BagseedPlants` / native `PlantArt`. See `review/live-plants/README.md`. The notes below preserve the original component-review milestone.

Status: artwork and growth samples approved on 2026-10-17. This batch contains the final named catalog strain plus two explicitly requested experimental phenotype options. Full native painted-renderer replacement remains pending.

Native lineage: Diesel Bog × Wasabi Peas; fixed photoperiod Type I catalog strain. Artwork supplies narrow blue-green fans, long frosty mint-blue flowers and amber pistils, with ochre finishing leaves applied in the shared renderer. Healthy fan source sprites stay green. Gas Station Sushi uses its native narrow / blue / Blue-green traits, branching .9 and height factor 1.3. The renderer uses actual height and does not multiply that factor again. This is the last named catalog strain to receive a component kit.

Sixteen isolated organs cover seed, radicle, cotyledons, single/three/five/seven-leaflet fans, sugar leaf, stem, Y junction, early/mid/late female flowers, closed/open male flowers and bamboo support. Crop bounds, attachment anchors, alpha hulls and SHA256 hashes are measured in the manifest. Source PNG pixels are preserved; WebP encoding is verified for exact RGBA equivalence. Nonoverlapping source crops are checked, and repeat compilation may not rewrite an existing part ID.

`gasstation@1` registers 15 integration-draft roles. The shared connected model handles expanding secondary branches, stable IDs, exact painted height, fixed-root wind, reduced motion, graded branch/popcorn buds and persisted canopy cleanup with larger retained tops. Senescence, stress, supports and care remain separate from genetic selection. The existing cool-night system deepens this receptive phenotype's color after an actual 10°F lights-off differential; 8°F earns no qualifying exposure. No native genetics, growth timing, climate or Sprout behavior is changed.

Samples in `review/gasstation-components/` include seed through harvest-ready, late-flower senescence, 50/90-inch physical scale, natural/cool-night colors, and 120 frames / 10 seconds of growth and wind. The controlled height studies do not override native growth or autoflower timing. Full care/training, diagnostic-state, drying-organ and camera/depth integration remain pending.

Reproduce: `python3 tools/compile-plant-components.py gasstation`, `node tools/preview-plant-components.cjs gasstation`, `python3 tools/verify-plant-wind.py gasstation`. New tests: `tests/plant-batch-five.test.cjs`; use the existing shared component/identity/growth/color suites and `npm run check`. User approved this batch and requested its push on 2026-10-17.
