# Bedroom update checkpoint

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
