# Moonberry connected component prototype

Status: awaiting artwork approval. Fifth organ kit after Porchlight, Velvet Underbrush, Pixel Punch and Cotton Candy CRT. The painted rigs remain review prototypes pending full care/training and native renderer integration.

## Native identity and source artwork

The existing catalog defines `moonberry` (Halfmoon × Night Berry) as a photoperiod Type II hybrid, with blue foliage, Lavender color, branching 1.05, height factor .95 and Berry aroma. `sources/profile.json` pins the expressed visual traits and review captions. The renderer takes actual plant height as input and does not apply the native height factor twice. Existing chemistry, genetics and growing mechanics are unchanged.

The new transparent component sheet was generated using the approved Pixel Punch layout/style as reference. Moonberry has muted sage-blue hybrid fans, pale lilac calyces, silvery frost and light peach/amber pistils, distinct from Pixel Punch's saturated grape colors and Cotton Candy's pink/lime palette. Healthy fan source pixels stay green; the shared renderer applies lavender senescence and temperature-driven expression.

Sixteen isolated organs cover seed, radicle, paired cotyledons, single/three/five/seven-leaflet fans, sugar leaf, stem, Y node, early/mid/late female flower, closed/open male flower and bamboo/tie. Source PNG pixels are retained unchanged. WebP encoding is verified for exact RGBA equivalence. Checksums, non-overlapping crop bounds, attachment points and measured alpha hulls are in `sources/manifest.json`.

## Connected growth, flowering and color

`moonberry@1` registers 15 integration-draft organ roles with hybrid compatibility. Older part/profile records and saved appearances remain pinned. The shared model/renderer under `graphics/plants/porchlight/sources/` supplies growing branches, stable parent/child organ IDs, the native 11-node limit, actual canopy-height bounds, root-fixed wind and reduced motion. There is no strain-specific renderer fork.

The review includes seed through harvest-ready, same-scale 50/90-inch specimens, a late-flower portrait, cool-night comparison and a 10-second wind/growth clip. Native Lavender is a receptive genotype: natural lavender senescence deepens after the existing qualifying cool-night exposure. The 8°F/10°F comparison holds phenotype, stage, geometry, health and nutrition constant; only the 10°F example receives 24 exposure hours after two study nights. Its captured-color Sprout bonus is verified at 0 versus 8 percentage points before the existing viral cap. Green-only strains keep their existing behavior.

The complete production milestone still needs full topping/LST/SCROG behavior, care-event history, diagnostic states, drying/harvest organ integration and native camera/depth adapters. Available male/support art and tested wind do not imply those unfinished states are installed in the game.

## Reproduce and validate

- `python3 tools/compile-plant-components.py moonberry` measures metadata, encodes losslessly and registers the new profile (Pillow, NumPy and SciPy). Repeated runs preserve approved status and refuse to replace an existing part ID with different data.
- `node tools/preview-plant-components.cjs moonberry` captures stills and 120 frames/10 seconds of wind/growth in MP4 and GIF. `--stills` skips animation; `--output=/tmp/...` supports separate review captures.
- `node --test tests/moonberry-components.test.cjs tests/cottoncandy-components.test.cjs tests/pixelpunch-components.test.cjs tests/velvet-components.test.cjs tests/porchlight-growth-model.test.cjs tests/plant-phenotype-library.test.cjs tests/night-color.test.cjs`
- `npm run check`

The preview uses the current `index.html`, waits for startup and injects the kit only in its disposable browser. Native game source/output, character payload, climate and Sprout code are unchanged. Stage panels independently magnify small organs/plants; only the 50/90-inch board shares a physical scale. Animation heights are controlled study inputs, not elapsed game days. Review files live in `review/moonberry-components/`; intermediate frame PNGs are ignored and encoded media are retained. Nothing is pushed before approval.
