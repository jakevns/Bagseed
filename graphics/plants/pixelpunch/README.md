# Pixel Punch connected component prototype

Status: awaiting artwork approval. This is the third organ kit after Porchlight and Velvet Underbrush. The live painted-renderer integration remains pending; no native game or save code changes are made by this kit.

## Strain identity

The existing native catalog defines `pixelpunch` (8-Bit Berry × Grape Soda) as a photoperiod Type I hybrid with blue-green foliage (`leafKey: blue`), Purple flowers, branching 1.1 and height factor 1. The review profile copies those expressed traits into the pinned appearance identity. Physical review heights are inputs from the simulated plant; height factors are not applied again by the renderer.

New hand-painted organs use blue-green hybrid fans, tapered serrated leaflets, compact lavender/grape calyces, pale frost and copper pistils. The source atlas was generated using the approved Velvet organ layout/style and the archived Pixel Punch strain study. A second image-generation pass corrected atlas spacing so every crop has isolated rectangular bounds. `assets/components.png` is the unchanged generated source; the runtime WebP is verified for exact RGBA equivalence.

Sixteen isolated parts include seed, radicle, cotyledons, single/three/five/seven-leaflet fans, sugar leaf, stem, node junction, early/mid/late female flowers, closed/open male flowers and bamboo/tie. Crops, attachment points, alpha hulls and checksums are in `sources/manifest.json`. The healthy fan source pixels stay blue-green; late senescence and cool-night pigment use the shared renderer rather than separate full-plant pictures.

## Shared methodology

- `pixelpunch@1` adds 15 draft organ roles to the versioned library. Existing Porchlight/Velvet part and profile records are retained unchanged. Hybrid leaves are explicitly compatible with the hybrid profile; unrelated broad-leaf substitutions are rejected.
- The same model and renderer under `graphics/plants/porchlight/sources/` assemble attached growth, branches, leaves and flower sites. No renderer fork is introduced.
- Growth adds attached secondary shoots and leaves, preserves existing organ IDs and the native 11-main-node limit, and uses actual source-alpha bounds for the 50/90-inch comparison. Root position stays fixed in wind; branches flex and leaves flutter; reduced motion freezes posing.
- Late flower fades to the phenotype's natural purple. The existing shared night-color rule intensifies this receptive genotype after actual qualifying dark exposure. The 8°F/10°F study compares identical phenotype, geometry, stage, health and nutrition after two nights. Only the 10°F example accumulates 24 exposure hours. The corresponding captured-color Sprout bonus is verified at 0 versus 8 percentage points before the existing viral cap.

This is a review checkpoint, with the same scope as earlier kits. Complete topping/LST/SCROG, care-history and diagnostic coverage, drying/harvest organ integration and native camera/depth adapters still need the shared production milestone. Availability of male/bamboo parts does not imply all training/care states are installed in the game.

## Reproduce

1. `python3 tools/compile-plant-components.py pixelpunch` measures metadata and encodes the source losslessly (Pillow, NumPy and SciPy). Existing part IDs cannot be overwritten with different metadata; approved status is preserved on repeat runs.
2. `node tools/preview-plant-components.cjs pixelpunch` captures review images plus a 120-frame/10-second growth and wind video/GIF. `--stills` skips animation. The tool loads `index.html`, waits for startup and injects the shared prototype only into the disposable browser page.
3. `node --test tests/pixelpunch-components.test.cjs tests/velvet-components.test.cjs tests/porchlight-growth-model.test.cjs tests/plant-phenotype-library.test.cjs tests/night-color.test.cjs`
4. `npm run check`

Review files live in `review/pixelpunch-components/`. Stage panels independently magnify juvenile organs/plants for legibility and use schematic pot size; only the 50/90-inch board uses a shared physical scale. Animation height inputs are a growth study, not elapsed game days. Intermediate animation PNGs are ignored; encoded review media are retained. No push occurs before user approval.

The generalized review tool was also run for Velvet into a temporary output directory (`--output=/tmp/bagseed-velvet-regression`). Its three approved still images matched byte-for-byte; hashes are recorded in `review/pixelpunch-components/previous-kit-regression.json`. `wind-validation.json` compares two frames after height reaches 90 inches: the canopy moves while the soil landmark stays fixed; the root attachment is independently checked by the model tests.
