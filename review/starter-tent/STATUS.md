# Starter tent — approved for publication

Requested: start the tent updates with the starter tent, match the established art style, include the store image and show samples before finalizing. Only this item family is included.

- Budget starter shell: included, faded charcoal fabric, simple zipper and repaired corners.
- Standard starter shell: existing $35 LeafCart upgrade, reinforced seams and cleaner silver lining.
- Open and zipped samples for both; shared matching catalog art and the actual Standard store card.
- The user approved the corrected layering and authorized pushing the release on 2026-10-16.

The browser preview uses public/index.html. At the user's request, the plant/pot and its click target move 10 logical pixels back into the tent. A rounded aperture clips contents; foreground roof, sides and tray occlude the light and pots. Equipment/shell targets, bedroom footprints, shell catalog/prices and separate live rendering are preserved. report.json records the isolated prototype; integration/report.json records the compiled production release.

Preview board: approval-starter-tent.png. Store previews: store-standard.png and store-standard-phone.png. Full room pictures: bedroom-budget.png and bedroom-standard.png.

Approved layering closeup: corrected-layering.png. Integrated room/store pictures and zipper frames are in integration/. The production test passed all 24 light/pot/shell combinations, 12 interaction cases, day/night masks, nine closing frames, opening/reduced motion, worn zipper and drying indicators, purchase/delivery, matching store/package/inventory art, fitting and save reload. The loading cover explicitly waits for the tent module. Runtime images are lossless copies of the approved originals.

Release checks passed: npm run check (99 script blocks, original baseline and character release intact), starter-tent.test.cjs, grow-pot-garden.test.cjs, loading-first-paint.test.cjs and loading-screen.test.cjs. The full loading readiness/recovery/save report is copied to integration/loading-regression.json. integration/modules.json verifies that all 19 other artwork/runtime modules and src/game.html match the previous published commit; the only existing module change adds the tent to the startup requirements.
