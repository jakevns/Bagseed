# Final bed batch — implementation review

The user approved Rattan Headboard and Tufted Headboard with all ten bedding choices. This increment adds exactly 20 combinations and completes the full 80-combination collection.

- [All 20 new drawings](all-20.png): enlarged captures from the production renderer.
- [In-room capture](room-art.png): Tufted Headboard with Botanical bedding.
- [Rattan store card](cane-card.png) and [Tufted store card](tufted-card.png).
- [Rattan opened package](cane-package-preview.png) and [Tufted opened package](tufted-package-preview.png).
- [Batch checks](validation.json) and [complete storefront checks](store-validation.json).
- [Original source artwork, approval boards and registration notes](../../graphics/beds/batch-04/README.md).

Reproduce with `node --test tests/beds-batch-04.test.cjs tests/store-bed-art.test.cjs`, or run `npm test` for the full suite. The four batch tests cover all 80 drawings and previews; the storefront test compares 142 actual cards across 79 purchasable combinations and verifies checkout/package artwork for the two new frames and Canopy. Earlier 60 drawings remain protected by pre-integration hashes. Captures are enlarged for inspection and do not establish physical-device performance.
