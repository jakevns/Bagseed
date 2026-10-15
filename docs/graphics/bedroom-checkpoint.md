# Bedroom update checkpoint

## Store artwork verification

The user requested verification that the bedroom artwork also appears in the store (called LeafCart in the game). Actual store cards and opened-package previews already used the approved bed renderer, but their legacy 96×48 thumbnails compressed the new beds vertically. The shared style renderer now sets supported bed/bedding preview canvases to their native 252×240 render size, preserving proportions with the existing responsive CSS. Room sprites, prices, ownership and checkout behavior are unchanged.

`tests/store-bed-art.test.cjs` opens the actual store, navigates Home & Decor → Room Styles, compares 104 rendered product cards with the room artwork (59 distinct purchasable combinations; the free Starter/Blue Check pairing is not sold), checks desktop/phone proportions, searches/sorts, completes a $220 Canopy checkout, and verifies the opened-package preview. Captures/report are in `artifacts/store-art/` and retained examples in `review/store-bed-art/`.

Final validation: all 19 browser tests passed with no skips. The baseline checksum and 82 script blocks passed `npm run check`. All completed in-room bed drawings still match their render hashes; the character and room-shell script payloads are unchanged. This correction changes preview dimensions only and introduces no new artwork.

For each future furniture update, update its shared room/store/preview artwork and verify the actual store UI, plus the item's relevant inventory/package views. Direct renderer calls alone do not establish storefront readiness. Continue the existing explicit artwork approval and 20-combination batch/push workflow.

## Bed batch 03 completed

The user approved the Platform Bed and Fancy Canopy Bed with all ten bedding choices: "Great job! please push the update", followed by "Continue working". This adds exactly 20 combinations, bringing the completed total to 60. Original transparent atlases, approval boards, source hashes and crop rectangles are retained under `graphics/beds/batch-03/`. The existing renderer is instantiated separately for the third batch without changing earlier artwork or gameplay.

Focused checks passed for all three batches. Batches 01 and 02 match their pre-integration rendered hashes (40 combinations). Batch 03 checks all 20 drawings/previews, unchanged interaction geometry, transparent canopy openings, purchases at $110/$220, style switching, saved selections after reload, sleep controls and phone layout. Rattan/Tufted's final 20 combinations still match the archived original. Actual rendered captures and reports are retained under `review/beds-batch-03/`; regenerate with `node --test tests/beds-batch-03.test.cjs`.

Final integration: all 18 browser tests passed with no skips. `npm run check` verified the immutable baseline checksum and parsed all 82 script blocks. Rebuilding succeeded, and the character, bedroom-shell and both earlier bed-batch script payloads were verified byte-for-byte unchanged against the preceding commit. A final focused Batch 03 run also passed after adding its module-registration assertion.

Remaining: Rattan Headboard (`cane`, $75) and Tufted Headboard (`tufted`, $95), each with ten bedding choices. Neither is approved for implementation yet. Prepare that final 20-combination batch for visual approval, then implement/test/push it separately. Previous milestone sections below preserve their historical state.

## Bed batch 02 completed

The user approved the Metal Frame and Cozy Upholstered Bed with all ten bedding choices: "Great work go ahead and push it through". This increment adds exactly 20 combinations, bringing the completed total to 40. Original transparent atlases, approval boards, source hashes and registration rectangles are retained under `graphics/beds/batch-02/`. The same source renderer is instantiated separately for each batch, preserving Batch 01 artwork and allowing readiness to await all four atlases.

Both batch tests passed. Batch 01's 20 rendered images match hashes captured before this integration. Batch 02 checks its 20 drawings and icons, buys both frames at their existing $55/$90 prices plus paid bedding, applies styles, reloads the save, checks sleep controls and emulated phone layout. The remaining 40 combinations match the archived original renderer. Reproduce with `node --test tests/beds-batch-01.test.cjs tests/beds-batch-02.test.cjs`; tests share `tests/helpers/bed-batch.cjs`.

Final integration validation: all 17 browser tests passed with no skips; `npm run check` verified the immutable baseline checksum and parsed all 81 script blocks. The embedded character and bedroom-shell payloads are unchanged from the preceding commit. Repeating the bedroom build succeeded. Original art and actual rendered review captures are retained in Git under this batch's source and review folders.

The four remaining frames are Platform, Fancy Canopy, Rattan Headboard and Tufted Headboard. None is approved for implementation yet. Prepare the next batch of at most two frames × ten beddings for explicit visual approval, then implement, test and push that increment separately. Previous milestone sections below record their state at completion.

## Bed batch 01 completed

The user approved the Starter Bed and Wooden Frame with all ten bedding choices: "First batch looks great!!" The user explicitly requested batches of at most 20 combinations and pushing each completed approved increment. Batch 01 implements exactly those 20 combinations, including their shop/style previews. Original transparent source atlases, approval boards and crop/registration data are retained under `graphics/beds/batch-01/`.

The remaining six frames (Metal, Cozy Upholstered, Platform, Fancy Canopy, Rattan, Tufted) and their 60 combinations still use their previous artwork. They are not approved for implementation by the first-batch approval. Present the next batch of at most two frames × ten beddings for explicit approval before implementation, then test and push that increment separately.

The batch test renders and checks all 20 combinations and 20 previews, compares all remaining 60 against the archived renderer, exercises purchases and installation at existing prices, switches between the two approved frames, reloads a purchased frame/bedding save, and checks the existing sleep dialog and phone layout. Reproduce with `node --test tests/beds-batch-01.test.cjs`; captures go to `artifacts/beds-batch-01/`.

Integration validation completed: all 16 browser tests passed with no skips; the approved-baseline checksum and all 80 script blocks passed `npm run check`. The existing embedded character payload was verified unchanged against the preceding commit. Source art, rendered review captures and the batch validation report are retained in Git.

## Room-shell milestone

The user approved the sage/cream/oak bedroom Concept 01 and requested its baseline integration before redrawing furniture. The room-shell implementation and its original artwork are in `graphics/bedroom/`; the generated standalone game is `public/index.html`. The immutable uploaded game remains under `baselines/`.

Completed scope: baseline sage wall and wood floor, paneled trim, trim around the existing window and door, and separate weather/time/curtain-aware floor light. Existing furniture renderers, variations, save identifiers, interaction geometry and gameplay rules are preserved. Other wall and floor finishes retain their previous artwork.

Validation: source-integrity check passed; the existing 14 browser tests passed; the new bedroom test passed, comparing save choices and interaction geometry with the archived game and testing finishes, blackout/rain/night light and phone viewport rendering. Repeating the bedroom build preserved its output. Screenshots can be reproduced by `node --test tests/bedroom.test.cjs` under `artifacts/bedroom/`.

The user requested that future work be completed and pushed in small approved increments to preserve progress between conversations. For each bedroom furniture item, inspect all existing variations, show artwork for explicit approval, then implement and test the approved change and push that completed increment before proceeding to the next item. The subsequent approval and completion of bed batch 01 are recorded above. Do not interpret approval of one batch as approval of later batches.

Rebuild only the bedroom using `npm run build:bedroom`; this retains the existing verified character payload. Run `npm run check` and `npm test`. The full graphics builder includes the bedroom compiler too. Read `graphics/bedroom/README.md` for registration and asset provenance.
