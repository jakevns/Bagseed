# Ember Stem, Pink Pistil and Inkleaf gameplay review

The user approved these gameplay implementations for production. The previous seven mutation kits retain their approved rendering. The remaining five mutation families retain their existing runtime artwork.

## Samples

These images come from the actual game renderer using native growth, organ placement, training and wind. Review inputs select stages and sizes; the six-second animation does not represent a full simulated season.

- [Three flowering plants](three-mutations.png)
- [Organ details and both forms](runtime-leaf-details.png)
- [Tissue close-ups](tissue-closeups.png)
- [Ember stem structure and node collars](ember-structure.png)
- Growth cycles: [Ember Stem](ember-growth.png), [Pink Pistil](pinkpistil-growth.png), [Inkleaf](inkleaf-growth.png)
- [Phenotype and finishing colors](phenotype-colors.png)
- [Training and stress](training-and-stress.png)
- [Combined mutations](combined-mutations.png)
- Gameplay: [bedroom](bedroom-gameplay.png), [mobile](mobile-gameplay.png), [native guide](native-guide.png)
- Growth and wind: [MP4](growth-and-wind.mp4), [GIF](growth-and-wind.gif)

## Anatomy and integration

Ember uses the approved photo-led red-purple pigmentation placement: stems, petioles and selected veins, with green leaf blades. Its painted internodes and node collars follow the existing branch skeleton and wind poses. Redness alone is not treated as a diagnosis of genetics or health.

Pink Pistil adds female stigma hairs across early, middle and late flower. It retains the inherited flower kit, green bracts and trichomes; it does not recolor vegetative or male plants. Both blush-rose and magenta-coral forms use the same native bud structure. The source references are R19 and R20 from the supplied research pack.

Inkleaf develops from greener juvenile tissue into darker adult and sugar leaves with visible veins, folds and margins. Plum-green and blue-black are approved game art interpretations, not independently verified genetic variants. The pigment treatment also works with other inherited leaf shapes.

All three preserve native plant identity, genome and saved visual recipe. They support deterministic forms, clones, older saves, canopy cleanup, stress, training, supports and wind. Independent stem and flower layers allow combinations with other mutations. The four new atlases participate in startup asset gating; the build now has ten mutation kits and twelve mutation atlases. Genetics, simulation statistics and catalog definitions were not changed.

This release uses the updated external image pipeline: original PNG/WebP sources stay under `graphics/`, hashed mutation atlases stay under `public/assets/plants/mutations/`, and the final bedroom build externalizes other formerly embedded images to `public/assets/embedded/`. Run the normal bedroom build rather than editing generated HTML or embedding images by hand. `npm run check` validates all published image references. The latest main character scale of 1.35 is retained.

## Verification

The final capture passed stages 0–12, both sexes, all 38 catalog recipes per family, 90-inch growth, four training forms, canopy cleanup, stress, wind, reduced motion, fixed roots, clone/snapshot stability, save/reload and legacy saves. Pot soil renders before plants and the front rim after them. Five combined-mutation cases passed. No browser JavaScript errors were recorded.

Targeted pixel checks confirm green Ember blades with red vascular accents, dark Inkleaf shading with brighter juvenile tissue, and Pink stigma color without changing vegetative or male artwork. All 32,076 sampled original green flower pixels remained within two RGB levels after the Pink overlay. This is a renderer regression check, not a biological measurement. See [verification.json](verification.json).

Build and static checks passed, alongside 17 model tests. After merging main's external image pipeline, 14 browser checks passed across native plant startup/saves, both earlier three-mutation batches, mutation genetics, character scale, loading recovery, mobile loading layout, character creation/movement/saves, cast artwork, day/night scenes and mobile gameplay. One additional standalone smoke check was blocked at file navigation by the cloud browser (`net::ERR_BLOCKED_BY_ADMINISTRATOR` for `file://`); it did not reach gameplay assertions. The standalone output was generated and its image reinlining and character JavaScript parse were verified separately. The earlier approved Freakshow capture also passed during batch development. The final batch capture was repeated after protecting Pink bract pixels and after merging main.

```sh
npm run build:bedroom
npm run check
node tools/preview-mutation-batch-04.cjs --animate
node --test tests/mutation-batch-04-renderer.test.cjs
```

The final animated capture invokes the same assertions as the test wrapper. Review hashes and source provenance are recorded in [review-manifest.json](review-manifest.json). Original source photos are study references and are not included in the repository.
