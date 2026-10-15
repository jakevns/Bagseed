# Face details on the current custom-character anatomy

This is the historical detail-alignment checkpoint. Current mouth designs and beard-edge work are in [customization v9](../customization-v9/README.md).

The user reported that mouths, ears and jewelry were still positioned for the old models. V8 measures those features on the retained bald artwork and composes them before applying the selected head shape. The playable output is `public/index.html`; user visual acceptance is pending.

Mouths replace the original lip ink at the actual mouth, with narrower profile versions. Each eye has its own local frame for iris color, lids, blinks and glasses. Iris recoloring happens before narrowing the eye opening, preventing color from reaching the lower lid or cheek. Eyebrow removal and slits reconstruct nearby skin instead of restoring the original brow.

Ear options resize the original painted ears around their attachment to the skull. Front and rear cutouts follow the cheek and skull contours; pointed and elfin tips use small shaded extensions. Profile ears are removed from the underlying skin before the selected ear is added. Hidden ears suppress ear jewelry. Studs and hanging earrings follow the selected ear's lobe, including resized and rear views; profile views show the near ear. Nose, lip, bridge and brow piercings, marks and glasses use their corresponding facial anchors. Headphone cups follow the ears in each direction. Hair is composed afterward so its strands naturally cover jewelry.

All 15 face shapes share the final anatomical transform with these details. Existing option IDs and saved appearance fields remain compatible. V7 hair fitting, transparent fringes, hats, footwear and body joins are retained. The authored NPC drawings, all 52 smell-pose sets, 80 bed combinations and three seedling desks are preserved.

## Review images

- [Creator preview](creator-details.png), [normal-ear mirror](mirror-normal-ears.png), [large-ear mirror](mirror-large-ears.png), [hidden-ear mirror](mirror-hidden-ears.png): actual game UI in disposable browser storage.
- [Mouths](mouths-after.png): every mouth in four directions.
- [Ears](ears-after.png): every ear option with studs and earrings.
- [Piercings](piercings-after.png) and [marks](marks-after.png): all controls in four directions.
- [Eyes, brows, glasses and headphones](eyes-and-glasses-after.png), including narrow/sleepy blue eyes and an eyebrow slit.
- [Hair and jewelry](hair-and-jewelry-after.png): natural strand occlusion and hidden ears.
- [Head shapes 1](shapes-1-after.png), [2](shapes-2-after.png), [3](shapes-3-after.png): all 15 shapes with a combined detail selection.

The corresponding `*-before.png` boards retain the previous merged build for comparison. That build and the original renderer/manifest are backed up in ignored `artifacts/custom-details-v8/`. Recreate the images with `node tools/review-face-details.cjs` while that backup is available. Set `BAGSEED_BROWSER_PATH` to the local Chromium/Chrome executable.

## Sources and checks

- `graphics/production/customization-v5/detail-landmarks.json`: native 192×320 landmarks and ear separation contours.
- `graphics/production/sources/face-details.js`: detail rendering and local skin reconstruction, injected into the renderer by `sources/build.cjs`.
- `tests/face-details.test.cjs`: 900 mouth combinations, 1,200 individual-stud combinations, hidden/rear visibility, iris/brow locality, all 15 eye options with colored irises, 180 headphone combinations, and real creator/save/reload controls.
- `tests/custom-heads.test.cjs`: retained hair, hat, facial hair, blink, body-join and footwear checks.

`validation.json` records the checked build, exact test results and preservation evidence. Tests use temporary browser profiles and leave the user's live progress alone. No artwork was regenerated, and no GitHub push or deployment was performed.

The final standalone build passed all 40 browser tests, with zero failures or skips. The baseline checksum and all 84 script blocks passed syntax validation. Preservation checks passed 1,872 cast comparisons and 260 direct smell-pose asset comparisons. All 83 non-character script blocks match the prior merged game, and all 21 retained customization source images still match their manifest hashes. The listed detail boards and creator/mirror captures were visually inspected.
