# Pocket Dwarf and Triploid gameplay review

Status: **user-approved for production**. These are the final two families in the fifteen-mutation roster. The previous thirteen implementations remain approved for production.

## Samples

All images use the real `index.html` plant renderer, native attachment model and pot layers. The regular comparison is an otherwise matched plant without the mutation. Detail views redraw the same compositor at inspection resolution. Exposed node studies hide leaves through the existing removed-leaf input; they do not paste concept art onto plants. Selected stages/heights in the six-second animation are review inputs, not a full simulated season.

- [Final pair with a regular control, at one physical scale](two-mutations.png)
- [Compact nodes and both genetic tag finishes](anatomy-and-identity.png)
- Full growth: [Pocket Dwarf](pocketdwarf-growth.png) · [Triploid](triploid-growth.png)
- [Inherited colors and late-flower senescence](phenotype-colors.png)
- [Bamboo, SCROG, stress and canopy cleanup](training-and-stress.png)
- [Combined mutations](combined-mutations.png)
- [Bedroom gameplay](bedroom-gameplay.png) · [mobile gameplay](mobile-gameplay.png) · [native guide artwork](native-guide.png)
- [Growth and wind MP4](growth-and-wind.mp4) · [GIF](growth-and-wind.gif)

## Anatomical choices

**Pocket Dwarf:** cushion and upright-compact forms shorten node spacing and branch reach while retaining substantial mature fan detail. The model uses the actual saved height, so the simulation's existing dwarf height effect is not applied twice. Both forms keep the host's leaf shape and flower parts. Opposite painted node collars remain on the stem after leaf removal. Branch buds stay attached and graded; cleanup removes lower leaves and popcorn buds. A 22-inch dwarf is shown beside a 50-inch control using identical pots and scale. This is a stature contrast, not a universal final height for the mutation.

R24 and R22 in the supplied pack guide compact stature and ordinary leaf anatomy. They are cultivar/plant analogues, not proof of a specific dwarf mutation or of the cause of a short plant.

**Triploid:** ordinary inherited cannabis anatomy is retained. The former live compositor's fixed dark tint and enlarged leaves/buds are removed. The real comparison photos do not support a universal diagnostic shape, and three leaves at one node remain the separate Triple Whorl trait.

A small copper or verdigris plaque marked **3x** identifies the game's known genetic state. It appears after the existing discovery event; hidden traits have no badge and render identically to matched controls. Revealing the trait invalidates its cached sprite. The badge is an intentional game identity convention. R09 supplies a scientific diploid/triploid comparison and R10 supplies DNA-content/chromosome evidence; visual appearance alone does not establish ploidy. The field-guide description now follows that distinction and explicitly describes seed/pollen restrictions as Bagseed's existing rules. Yield, speed, inheritance, reproduction and other balance values were not changed.

Both families inherit host leaf/flower recipes, expressed colors, eligible cool-night pigment and late-flower senescence. The color sheet uses real Porchlight, Pixel Punch, Moonberry and Velvet recipes. No source photos are copied into the repository.

## Integration and verification

The two new original PNG atlases are retained under `graphics/plants/mutations/`; the compiler records source hashes and RGBA-exact lossless WebP under `public/assets/plants/mutations/`. The existing `public/assets/embedded/` publication pipeline stays intact. All fifteen native mutation keys now have local component manifests, using seventeen mutation atlases. Fourteen base kits plus those atlases give 31 plant images gated by startup readiness. Character release `character-audit-cel-v1`, person scale 1.35 and the latest main-branch fix preserving chosen face shapes while walking and reloading are retained.

The build and static integrity checks passed. Seven browser regressions passed for native startup/saves, all four previous three-mutation batches, mutation genetics/guide art and character scale. Twenty-six model tests passed, including exact Triploid/control geometry across stages, sexes, heights and training; compressed Dwarf geometry with preserved physical height; stable removed-leaf IDs; and combined structural attachments.

The final native capture passed stages 0–12, both sexes, all 38 catalog recipes per family, two stable forms/finishes, four training modes, larger 90-inch models, supports, stress, visible-leaf and popcorn cleanup, wind, reduced motion, fixed roots, clones, snapshots, save/reload, older saves and soil/rim layering. Triploid bodies match controls pixel-for-pixel when labels are suppressed; unrevealed full sprites also match controls. Known traits show the identity tag and use a different cache key after discovery. Genome values and pinned host recipes remain unchanged. No browser JavaScript errors were recorded.

After integrating current main, the build and integrity checks passed again, as did all five final-batch model/browser tests and the chosen-face walking/save/reload regression. The browser wrapper invokes the same assertions as the native capture. Results, source provenance and hashes are recorded in [verification.json](verification.json) and [review-manifest.json](review-manifest.json).

```sh
python3 tools/compile-mutation-components.py
npm run build:bedroom
npm run check
node tools/preview-mutation-batch-06.cjs --animate
node --test tests/stature-mutations.test.cjs
node --test tests/mutation-batch-06-renderer.test.cjs
```
