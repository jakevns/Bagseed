# Porchlight components and continuous-growth prototype

**Production update:** this approved kit is now connected to the live game through `BagseedPlants` / native `PlantArt`. See `review/live-plants/README.md`. The notes below preserve the original component-review milestone.

Status: component artwork and 50/90-inch growth prototype approved by the user; saved as a checkpoint. This renderer is injected only into the disposable preview browser; the production game, growth rates, existing saves and native renderer are unchanged.

## Artwork

`assets/components.png` is the unchanged generated component sheet. `components.webp` is a lossless RGBA-equivalent runtime encoding; the manifest records both checksums, crop rectangles and real attachment points. Sixteen parts cover seed/radicle, cotyledons, one/three/five/seven-leaflet leaves, sugar leaf, stem, junction, three female flower maturities, closed/open male flowers and bamboo/tie. The component artwork is approved for this prototype. Shared phenotype library entries retain **draft** integration status until the training and care renderer is complete; their asset and attachment metadata is present.

The outlines in the manifest are measured from the existing alpha channel; they allow the assembled model's canopy to meet its physical height label. They do not change source artwork pixels. Juvenile fans retain their leaflet count as later nodes develop. A seedling uses cotyledons and its first pair of single true leaves.

## Connected growth

`model.cjs` builds a parent/child structure from physical height, fractional node count, branching, phenotype identity and current conditions. Node count remains capped at the native 11. Older nodes, branches and leaves keep stable IDs. Increasing height lengthens internodes and shoots and introduces new lateral leaf sites instead of stretching a full plant picture. Organ sizes have separate limits so giant growth does not turn every leaf into an enormous leaf.

Every leaf and flower has a real parent node or branch and attachment coordinate. Posing derives attachment positions from the same curves used for stems. Roots stay fixed. Trunk sway propagates into branches, with independent leaf flutter. Supported branches move less; reduced motion freezes posing. Removal IDs are respected without changing the input plant.

The first public review material focuses on **natural healthy vegetative Porchlight at 50 and 90 inches**. Both are shown at 7.35 pixels per physical inch. The animation supplies explicit study heights from 3 to 90 inches with a shared phenotype identity; these frames are not elapsed game days and do not introduce a faster growth rate. The 50-inch checkpoint fits a suitable taller tent, not the 30-inch starter tent. The giant example represents the outdoor extension. Continuous leaf/branch expansion continues past the ordinary size without adding more than 11 main nodes.

## Review boundary

This is the first component/growth milestone, not the finished all-state game replacement. It includes preparatory hooks for pruning, removed-leaf records, supports, droop and flower parts. Complete topping, SCROG net integration, historical care-event persistence, all diagnostic states, drying and every in-game camera/depth context still need the subsequent coverage outlined in the Porchlight plan. Do not publish this prototype as a full replacement for `PlantArt`.

The existing game's `Giant.proxy` compresses tall outdoor specimens to fit the yard view. These comparison sheets intentionally show uncompressed physical dimensions. A future game adapter must distinguish physical height from that view projection and retain the approved pot/player layering. It must not reinterpret the 90-inch sample as a new growth cap or change outdoor unlocks.

## Reproduction and verification

- `node --test tests/porchlight-growth-model.test.cjs tests/plant-phenotype-library.test.cjs`
- `node tools/preview-porchlight-growth.cjs` (`--stills` skips the animation frames)
- The preview reads the normal `index.html`, then injects the model only in that disposable browser page.
- `review/porchlight-growth/verification.json` records physical-height pixel measurements, attached organ counts and browser errors.
- Frame PNGs are local intermediates excluded from Git. The comparison, component sheet, GIF and MP4 are retained for approval.

The prototype is pure/read-only: rendering does not advance growth, write phenotypes, spend inventory or modify saves. Native game build verification remains `npm run check`.

## Approved flowering and senescence checkpoint

The user approved the early/mid/late female flower references and the larger late-flower Porchlight portrait with golden fan-leaf senescence. Review images are in `review/porchlight-flower/`; reproduce with `node tools/preview-porchlight-flower.cjs`. Finish color is driven by the expressed color phenotype, with a separate late-stage progress input. Gold, ochre, lavender, purple, deep purple, rose, red and the ink mutation's near-black purple are supported. Color does not reroll genetics or depend on low nutrients; flowers and stems retain their source art. Native simulation, saves and the live renderer remain unchanged pending the full integration milestone.
