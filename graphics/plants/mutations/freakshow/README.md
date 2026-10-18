# Freakshow painted organs

Gameplay artwork approved by the user. The painted components are connected to
`public/index.html` for production.

The native `freakshow` identity and existing genotype, simulation, stats and saved
recipes are preserved. Two deterministic visual forms, **slender** and **fuller**,
are selected from the existing visual seed and expressed leaf shape. A cutting
retains its mother's form. No new mutation roll or mutation-specific save field
is introduced.

`assets/development.png` contains two sets of a dissected juvenile blade, a young
fan and a sugar leaf. `assets/mature-fans.png` contains the two painted mature
fans adapted from the approved concept. The engine's `fiveLeaf` and `sevenLeaf`
slots share the mature fan at different growth positions/sizes; those historical
slot names are not a fixed leaflet-count assertion for a dissected mutant.
Cotyledons, seeds, flowers and drying artwork retain the native strain kit.

The leaf atlas has its own continuous tissue, veins and alpha silhouette. It
does not use the former procedural Freakshow mask or a normal leaf texture cut
into a fern shape. Sugar leaves have stable IDs attached to their flower's parent
and move with the same plant model. They inherit the existing color, finishing,
health and support effects. The existing Ducksfoot shape precedence is retained
for a combined expressed Ducksfoot/Freakshow plant; other mutations remain on
their current renderer.

The source photographs were supplied in `Bagseed_Mutation_References.zip`,
principally R17 (mutantfarmer) and R02 (Shapeshifter collection via Doctor's
Choice). Original game art was generated from those morphology references and
the approved concept; external photographs are not shipped as game assets.

Rebuild the measured crops, petiole anchors, alpha hulls and lossless hashed WebP
assets with:

```sh
python tools/compile-mutation-components.py
npm run build:bedroom
npm run check
```

The compiler measures source pixels and verifies RGBA-exact encoding; it does not
repaint, recolor, mask or alter the original PNGs. Both atlases participate in
`BagseedPlants.ready`, so the loading gate also waits for them.

Run native review and assertions with `node tools/preview-freakshow.cjs` or
`node --test tests/freakshow-renderer.test.cjs`. Add `--animate` to the preview
command to export a six-second growth/wind MP4 and GIF. Native captures and the
verification report are in `review/mutation-detail/freakshow-in-game/`.
