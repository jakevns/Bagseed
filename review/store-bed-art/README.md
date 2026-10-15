# Store artwork verification

The user requested that updated bedroom furniture also appear in the store. LeafCart's product and package canvases already called the approved bed renderer. Their old thumbnail dimensions squashed the images vertically; supported previews now use the native 252×240 proportions and detail.

- [Store card before correction](canopy-card-before.png).
- [Corrected store card](canopy-card.png).
- [Opened-package preview](package-preview.png).
- [Validation report](validation.json).

`node --test tests/store-bed-art.test.cjs` reproduces the checks and captures. It navigates the store's actual Home & Decor → Room Styles UI, compares 104 product cards against the room artwork across 59 distinct purchasable combinations, checks that temporary preview rendering preserves selections, tests search and sorting, completes a $220 cart checkout and opens the package. It also checks desktop and phone image proportions. The remaining free Starter/Blue Check pairing is not a store product. No new artwork or prices were introduced.
