# Twin Leader, Crested Cola and Triple Whorl gameplay review

Status: **user-approved gameplay implementation for production**. All thirteen implemented mutation families are now approved for production. Pocket Dwarf and Triploid retain their existing runtime artwork.

## Samples

All samples use the actual native game compositor and connected growth model. Inspection images redraw that compositor at higher resolution; they do not paste concept illustrations over plants. Some anatomy diagrams hide leaves through the existing removed-leaf input to expose attachment points. Review stages and sizes are selected inputs, not an accelerated full simulated season.

- [Three flowering plants at the same physical scale](three-mutations.png)
- [Two forms, early structure and late flower](runtime-structure-details.png)
- [Exposed fork, ribbon and three-leaf node](structural-skeletons.png)
- Growth cycles: [Twin Leader](twinleader-growth.png), [Crested Cola](crested-growth.png), [Triple Whorl](whorl-growth.png)
- [Inherited colors and late-flower finishing](phenotype-colors.png)
- [Bamboo, SCROG, cleanup and stress](training-and-stress.png)
- [Combined mutations](combined-mutations.png)
- [Bedroom gameplay](bedroom-gameplay.png) · [mobile gameplay](mobile-gameplay.png) · [native guide and structure icons](native-guide.png)
- [Growth and wind MP4](growth-and-wind.mp4) · [GIF](growth-and-wind.gif)

## Anatomy

**Twin Leader:** a single rooted trunk progressively forks after the third node, with two comparable leaders, attached node leaves, smaller branch buds and separate terminal flowers. Open-V and upright-V forms differ in the fork's position and spread. Topping retains the original fork and adds two connected terminal tips to each leader. This is a visual representation of training; native simulation multipliers and inheritance are unchanged.

**Crested Cola:** scalloped-fan and curled-comb forms have a grooved, flattened upper axis and genuinely wide fused female flowers in early, middle and late bloom. Only terminal flowers use these organs. Lateral/popcorn buds retain the inherited strain artwork, graded sizes and cleanup behavior. The crest's floral tissue follows the host flower palette and eligible cool-night pigment; Pink Pistil can overlay its stigmas. Male flowers retain native anatomy. The attachment edge was refined to continue as living green tissue without a cut-surface ring.

**Triple Whorl:** three independent fans originate at one stem node, and developed interior nodes have three primary branch origins. A rear fan/branch is foreshortened rather than duplicating three front-facing leaves. Both radial-open and offset-rear forms retain inherited leaflet anatomy. The third juvenile true leaf is separate from the cotyledons. Three leaves per node are not evidence of triploidy.

The visual basis is the user's approved structure studies and supplied photo pack. R29 guides the exposed fork; R23 supplies early-development context without proving bifurcation. R16/R27 show flattened stem tissue; R30 is flowering context without establishing a particular cause. R06 shows three leaves around a shared node. Cause and inheritance are not inferred from photographs. Pigment pairings are game art interpretations. Original photos are not copied into the repository.

## Integration and verification

The structural layer composes independently with inherited leaf shape, Moonmarble sectors, Ember vascular tissue, Inkleaf pigmentation, chlorophyll layers and female stigma hairs. Existing saved art seeds select stable forms; clones, snapshots and older saves retain visual identity. Genome values, catalog entries, mutation probabilities and yield/speed/mold statistics are unchanged.

The compiler records original PNG hashes and RGBA-exact lossless WebP atlases under `public/assets/plants/mutations/`. The existing external image pipeline remains in place for `public/assets/embedded/`. Three new atlases join startup readiness: 14 base kits plus 15 mutation atlases, 29 plant images in total. Character release `character-audit-cel-v1` and the latest 1.35 person scale are retained.

Build/static checks and 22 model tests passed. Six browser regressions passed for the three earlier mutation batches, native plant loading/saves, genetics/guide art and character scale. The final batch capture additionally checks stages 0–12, both sexes, all 38 catalog recipes per family, two distinct stable forms, four training modes, 90-inch growth, attached sugar leaves, stress, canopy cleanup, wind, reduced motion, fixed roots, clones/snapshots, save/reload, legacy saves, combined mutations and pot layering. No JavaScript errors were recorded.

Structural assertions verify one common Twin Leader root, two natural terminal flowers, four after topping, an actually rendered wide crest tile, three separately identified fans per node and three branch origins per developed interior node. The image check inspects the flower tile actually stamped by the renderer, guarding against a correct model accidentally drawing the old flower.

The runtime's reusable `BagseedPlants.detail` redraws the same posed skeleton and organs at inspection resolution. Both the guide's small structural icons and the review close-ups use it.

```sh
python3 tools/compile-mutation-components.py
npm run build:bedroom
npm run check
node tools/preview-mutation-batch-05.cjs --animate
node --test tests/structural-mutations.test.cjs
node --test tests/mutation-batch-05-renderer.test.cjs
```

The native capture invokes the same assertions as the browser test wrapper. See [verification.json](verification.json) and [review-manifest.json](review-manifest.json) for results, hashes and source provenance.
