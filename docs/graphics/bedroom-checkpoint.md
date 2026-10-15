# Bedroom update checkpoint

## Curtain batch 01 — pending picture approval

The new request is all bedroom curtain options, including animations, limited to TWO sets per batch. Six cloth/blind styles exist, plus No Curtains. First proposal: Basic Curtains (included) and Blackout Curtains ($20); later batches Floral/Sheer and Patterned/Blinds. No Curtains retains the existing open window.

The new original atlas and animated shared renderer are under `graphics/curtains/batch-01/`. `tools/preview-curtains.cjs` injects them into the complete `public/index.html` game for review, without editing/publishing the production HTML or game source. Checks cover two distinct drawings, normal/Windy sway, fixed rods, still reduced motion, five untouched options and the actual Blackout store card. The approval board, store picture, animation loop and report are retained in `review/curtains-batch-01/`. Show pictures directly in chat; wait for explicit artwork approval before production integration and push. Read this batch's README for remaining integration checks.

## Mobile corner details — approved for publication

The user rejected the continuous foliage frame: “Instead of forcing an illustration that doesnt fit design one that fits like the reference. It doesnt have to frame it just add details around the corners and seperate hard edges”. The rejected frame was replaced before publication. The new revision uses six individually registered painted pieces from `graphics/main-menu/assets/mobile-details.png`: two header sprigs, two footer corners and two low flower clusters at the garden/menu seam. All pieces preserve their proportions, with no plant fading masks or full-height border. A shallow irregular clip softens the garden's hard horizontal edges.

The user approved the revised picture and authorized publication with “Great work :) please pushb”. The focused menu test passed all six layouts and menu interactions; `npm run check` verified the baseline and 85 scripts. Desktop/landscape pixels and all seven gameplay artwork payloads match the preceding approved version. Current captures/report: `review/main-menu-mobile-details/`. Earlier `review/main-menu-mobile/` images are REJECTED and must not be used as current previews. Desktop/landscape and gameplay artwork are unchanged. Continue using `public/index.html` for any game preview. The separate loading screen is still deferred.

## Preview entry point — user preference

For any “web preview” or “Open in ChatGPT” preview, use `public/index.html`, the complete built game containing the updated graphics. Never use `src/game.html` as the playable preview: it is the gameplay source and omits the appended illustrated renderers. The user explicitly requested this after receiving the original-looking source preview. Picture approvals should be shown directly in chat; workspace file links have not been accessible to this user.


## Approved tabletop depth and usable pegboard-top ledge

The user clarified that the lava lamp belongs ABOVE the green desk's pegboard and asked to retain the old ability to stack decorations. The upper surface now aligns with the illustrated pegboard's top trim at y=52 (x=231–286), while the other workbench tiers retain the original y=56 windowsill. The main supply row stays centered across tabletop depth at y=74.5. The proposed block against placing decor on the built-in supply row has been removed; original main-tabletop/custom-furniture placement and stacking are available.

Old upper decorations retain their horizontal positions above the pegboard and align to the top trim. Main-tabletop items align with the illustrated surface. Save/reload, repeated migration and changing desk tiers preserve the upper decorations. The focused tests passed 48 desk/supply cases, three decorations placed on the upper ledge through the actual UI, original main-desk/custom-table placement, legacy-save alignment and tier switching. Picture previews and the report are under `review/desk-tabletop-placement/`; use `pegboard-top-preview.png` for the current close-up.

Final validation: all 22 browser tests passed with no skips; `npm run check` verified the immutable baseline checksum and parsed all 84 scripts. Current source/build hashes match the build report, and character, room-shell and all four bed payloads remain byte-for-byte unchanged.

The user approved this final placement with “Go ahead and push the updates”. Pictures were shown directly in chat. The pull before committing reported main already up to date at `c5b0e24`. Commit and push this approved increment; future artwork still requires its own approval. Web previews must use `public/index.html`.

## Centered seedling desk supplies completed

User request: “clean up the things on top of the desk and ensure theyre centered on each desk”. The local update replaces the old blocky tabletop props with seven illustrated cutouts and centers the visible group dynamically on all three existing seedling desks. The common baseline places supplies on the tabletop, with even gaps and side clearance. Availability continues to follow inventory and active/brewing feed. Existing frames, store/package art and storage/supply-box interactions remain intact.

Artwork source and crop/hash registration are under `graphics/desks/`; actual in-game previews and the focused report are under `review/seedling-desk-supplies/`. The focused check passed all 48 layouts plus normal store, package, install, mixing and save behavior. The user approved the preview with “Great work” and asked to pull before pushing because another worker may have updated the repository. Fetching all remote refs and `git pull --ff-only origin main` confirmed main was already up to date at `06078be`; no newer remote commits were available to integrate.

Cleanup validation: all 21 browser tests passed with no skips. The baseline checksum and all 84 game scripts passed `npm run check`. Existing character, room-shell and all four bed payloads remain byte-for-byte unchanged. Approved for commit and a normal, non-forced push to main. Future items still require their own artwork approval.


## Seedling desks completed

The user approved all three workstation designs and their matching store artwork: “Great job!! Send it :)”. This increment updates the included Folding Card Table, Used Writing Desk ($49), and Gardener's Bench ($149). These are the existing `workbench` equipment tiers, separate from the two-variant decorative Potting Bench. Prices, mixing bonuses, save identifiers, nutrient/supply behavior and interaction geometry remain unchanged.

Original approval art, transparent production atlas, hash-verified crop/anchor manifest and shared room/store/package renderer are retained under `graphics/desks/`. Both graphics build paths include the desk compiler. Actual room captures for all three tiers, both paid store/package cards and a phone card are retained under `review/seedling-desks/`.

The focused browser check passed: three distinct room frames and previews, full sprite bounds, store artwork matching the room renderer, original bench/storage/supply-box hits, inventory-sensitive supplies, actual $198 store checkout, both package previews and installations, mixing-panel access, save/reload and phone proportions. The character, room-shell and all four bed-batch script payloads were verified byte-for-byte unchanged against the preceding commit. Future furniture still requires its own artwork approval before implementation and push.

Final integration validation: all 21 browser tests passed with no skips. `npm run check` verified the immutable baseline checksum and parsed all 84 script blocks. Repeating the bedroom build produced identical output.


## Bed collection complete — batch 04

The user approved Rattan Headboard (`cane`, $75) and Tufted Headboard (`tufted`, $95): "Approved. Youve done great work today heres a tip!" The final increment adds 20 combinations and completes all eight existing frames × ten bedding choices, 80 total. Original transparent atlases, approval boards and hashed crop manifests are retained under `graphics/beds/batch-04/`; rendered review and store/package examples are under `review/beds-batch-04/`.

Focused Batch 04 and actual-store checks passed. Earlier batches are protected by 60 rendered hashes captured before later integrations. With no legacy bed frames remaining, the shared test verifies complete registration of the eight-frame/ten-bedding catalog rather than comparing an empty legacy set. Every batch still exercises its 20 drawings/previews, interactions, purchases, installation, style switching, save/reload, sleep controls and phone layout.

The store check now covers 142 actual card samples across all 79 purchasable combinations. It checks out Canopy/Rattan/Tufted together at their unchanged prices ($390 total) and opens each package to verify the updated image and ownership. The free Starter/Blue Check pairing is not sold. Store and package canvases retain the corrected 252×240 proportions.

Final integration validation: all 20 browser tests passed with no skips. `npm run check` verified the immutable baseline checksum and parsed all 83 script blocks; rebuilding succeeded. The character, room-shell and all three previous bed-batch payloads are byte-for-byte unchanged from the preceding commit. The full collection's sources, tests and review evidence are retained in Git.

Next furniture item has not been selected or approved. Continue one furniture item at a time: audit all its existing variations, show artwork for explicit approval, then implement room/store/package/inventory artwork as applicable, test and push that approved increment. Keep batches at or below 20 combinations when needed. Previous milestone sections below are historical records of their completion state.

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
