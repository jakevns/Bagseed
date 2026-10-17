# Night Shift connected component prototype

Status: artwork and growth samples approved on 2026-10-17. New kit after the approved Halfmoon / Zoomies / Cruise Control batch. Full painted-renderer replacement remains pending.

The native catalog lists `nightshift` (Moonberry × Dark Matter) as a photoperiod Type II line. The new organ sheet supplies broad deep forest-green leaves and dense inky-plum flowers with silver frost and copper pistils; the shared renderer applies deep purple senescence rather than painting dying colors into healthy fan components. See `sources/profile.json` for the exact review phenotype and captions.

Night Shift uses its fixed native catalog traits: broad leaves, forest foliage, Dark purple flowers, branching 1.1 and height factor .9. Native Type II chemistry, lifecycle, growth timing and height remain unchanged.

Sixteen separate source organs cover seed, radicle, cotyledons, single/three/five/seven-leaflet fans, sugar leaf, stem, Y junction, early/mid/late female flowers, closed/open male flowers and bamboo support. Source pixels are preserved, the WebP is verified for exact RGBA equivalence, and the manifest records checksums, nonoverlapping measured crops, actual attachment points and alpha hulls. Bog Lantern was rerendered with wider gutters after the original spacing failed the crop check; the validator was not weakened.

`nightshift@1` registers 15 integration-draft organ roles using the shared connected model and renderer under `porchlight/sources/`. This includes expanding secondary shoots, stable branch/organ IDs, the native 11-node limit, measured physical canopy height, fixed-root wind, reduced motion, graded branch/popcorn bud sites, and persisted canopy cleanup with larger retained tops. Temporary care state never selects inherited phenotype parts. All eight earlier kits and saved identities remain unchanged.

This representative genotype is receptive to the existing cool-night system. The comparison holds the plant constant: 78°F day / 70°F night earns no qualifying exposure, while 78°F day / 68°F night earns 24 hours after two study nights and deepens the near-black purple expression. The shared Sprout color bonus stays genotype-gated. This introduces no climate or native gameplay change.

Samples are in `review/nightshift-components/`: seed through harvest-ready, mature flower, same-scale 50/90-inch studies, natural/cool-night color, and 120 frames / 10 seconds of growth and wind. The physical-scale figures are controlled review inputs; they do not override native size limits or autoflower growth timing. Full topping/LST/SCROG, diagnostic-state, drying-organ and native camera/depth integration remain pending.

Reproduce: `python3 tools/compile-plant-components.py nightshift`, `node tools/preview-plant-components.cjs nightshift`, `python3 tools/verify-plant-wind.py nightshift`. Tests: `tests/plant-batch-four.test.cjs` with the shared growth/identity/color suites. `npm run check` verifies the existing production entry and character payload. User approved this batch on 2026-10-17.
