# Approved custom outfits in the game

This publication connects the approved cardigan, jacket and flannel source reviews to the playable character renderer. It includes their two idle views and eight front/rear walking drawings (30 paintings total), the corrected passing/contact guides, and the final flannel shared-palette correction including the replacement down/3 shirt.

The earlier hair and head-attachment fixes remain included from commit `c9c7173`. Current `origin/main` was merged before integration, retaining the newer plant artwork and the equivalent face-shape migration fix.

## Implementation

`tools/pack-approved-custom-outfits.py` packs the reviewed paintings without repainting them. Separate semantic masks identify upper garments/hands, trousers and footwear, along with their recolorable materials. The manifest verifies every source and atlas hash. `npm run build:graphics` regenerates this pack before lossless encoding and publication as separate files in `public/assets/embedded`.

The renderer uses the new front/rear idle and walking paintings for all three tops with the reviewed jeans and sneakers combination, including frame zero when walking. Heads, ears, hair and hats use the established head renderer above the clothing. Painted necks determine the attachment; the completed figure remains at native density before gameplay scaling.

Combinations with other bottom cuts or footwear retain their complete existing renderer and customization controls. They do not splice older legs into the new paintings; compatible replacement artwork for those combinations has not been reviewed. The eight-frame side animations and the remaining outfits retain their established art, ready for the next outfit-by-outfit pass. No rejected artwork replaces other outfits.

## Evidence and reproduction

- Live figures: `review/approved-outfits-live/`.
- Final source reviews: `review/cardigan-proportions-v11/`, `review/jacket-proportions-v9/`, `review/flannel-proportions-v13/`.
- Packed sources: `graphics/production/walk/approved-outfits/manifest.json`.
- The flannel palette tests verify alpha, dimensions, protected outlines, source hashes, material membership and bounded color drift.

Commands:

```text
npm run build:graphics
npm test -- --test-concurrency=4
node tools/check.mjs
```

On Windows, set `BAGSEED_BROWSER_PATH` to Chrome when Playwright's bundled browser is unavailable. Use HTTP (`npm run dev`) for the external-image build. Direct-file play uses `npm run build:standalone`; opening the external-image `public/index.html` directly still encounters the browser's canvas-origin restriction.

Large rejected generation batches and redundant diagnostic matrices remain local. The accepted source paintings, their provenance, current comparisons and reproducible tools are included in this publication.

Final validation: the graphics build passed, all **240 npm tests passed** with zero failures or skips, the strict roster audit flagged zero rows, all **1,847** published images matched their hashes and were included in the Git index, and both Python checks passed (3 palette-preservation tests plus 3 clustering tests). Detailed results and the complete npm log are in `review/approved-outfits-live/publication-validation.json` and `full-tests.txt`.
