# Freakshow: native gameplay review

Status: **gameplay artwork approved by the user for production**. This is the first mutation implementation. The remaining fourteen retain their current runtime rendering.

## Review files

- [Actual gameplay](bedroom-gameplay.png) and [mobile gameplay](mobile-gameplay.png).
- [Growth stages](lifecycle.png): seedling through late flower, at one shared physical scale.
- [Normal control and both painted forms](normal-and-two-forms.png).
- [Actual runtime leaf tiles, magnified](runtime-leaf-closeups.png). These are captured after native tile color processing, not substituted concept art.
- [Eight expressed color families](phenotype-colors.png), using the existing phenotype palette, finishing and eligible cool-night expression.
- [Training, supports and stress](training-and-stress.png).
- [Six-second growth and wind MP4](growth-and-wind.mp4) / [GIF](growth-and-wind.gif). Height/stage review inputs expand the real component model; soil and roots stay fixed. This demonstrates the renderer, not a full simulated growing season.
- [Native Sprout photo](sprout-photo.png) and [plant inspector](native-inspector.png).

The captures come from the rebuilt **public/index.html**, not game.html. Review fixtures exist only in an isolated browser, with real native plant creation and mutation genotype. No debug plants or fixture state are added to the production game.

## Implemented

The old generic Freakshow shape mask is replaced by dedicated painted juvenile, young fan, mature fan and sugar-leaf organs. Two seeded forms are stable across growth, snapshots, clones and reloads. Native morphology slot names fiveLeaf/sevenLeaf can share a mature dissected organ; they are not a fixed leaflet-count guarantee for the mutant.

Existing expressed leaf palettes, late-flower senescence, cool-night pigment, droop, yellowing, burn/pests, bamboo ties, topping/LST/SCROG and canopy cleanup are applied by the native model/renderer. Extra sugar leaves attach to actual flower parents. Both atlases must decode before startup is released.

Source art, measured geometry and reference notes: [Freakshow kit](../../../../graphics/plants/mutations/freakshow/README.md). External source photographs are not shipped as assets.

## Verification

- npm run check: baseline integrity, verified current character payload, 127 parsed scripts.
- 17 focused unit/model tests passed: existing physical growth, fixed roots, supports, canopy care and night-color rules.
- Four existing browser regressions passed: live plants, mutation genetics/guide, canopy care/save/harvest and current person scale.
- Dedicated Freakshow browser capture/assertions passed: 38 catalog records, stages 0–12, male flowers, both painted forms, real atlas source use, all organ parents, five distinct training/support cases, symptoms, snapshots, clone identity, unchanged saved genotype, reload and legacy save.
- Film: 72 MP4 frames at 12 fps, 6 seconds, 1200×900. GIF: 48 frames, 840×630. Frame comparison found moving canopy pixels with a fixed pot landmark.

The local headless warm-frame timing is recorded in verification.json; it is not a mobile hardware benchmark. Native existing save and simulation mechanics are preserved; this work does not change mutation inheritance or introduce new genetic/performance claims.

Regenerate with `node tools/preview-freakshow.cjs --animate`, or run the same functional assertions without video export using `node --test tests/freakshow-renderer.test.cjs`.
