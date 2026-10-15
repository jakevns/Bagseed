# Pose batch 03

User approved the review sheet for Rosa, Leo, Mara, Eli and Nico. These complete nose-covering drawings replace the generic body/arm composition and pasted-arm reaction portraits for the matching canonical outfits only. Standing artwork, custom appearances and the earlier seven approved characters remain on their previous rendering paths.

`pose-candidates.png` retains the approved review. `registered.png` shows technical crops in four directions, whole-drawing portrait crops and the 32×36 world scale. Source sheets, explicit crop bounds and registration reports are under `graphics/production/actions/batch-03/`. Reproduce the crops from the repository root with `python3 graphics/production/actions/register-batch.py batch-03`.

The updated standalone HTML with both groups is saved at `../poses-batch-04/candidate.html`. Earlier comparison HTML remains under batches 01 and 02; the untouched original illustrated HTML is `../poses-batch-01/original-illustrated.html`. `checkpoint.json` records checksums. No live save data is used in validation.

Registration preserves the existing 96×108 canvas, feet at y=107, child height 82px, short height 93px, tall height 104px and standard height 100px, subject to width constraints. Left profiles mirror right profiles, including raised hand and carried prop side. Custom outfits retain the previous generic action renderer. This release covers nose-covering reactions, not new walk, seated or interaction animations.

Run `npm run check`, `node tools/verify-action-batch.cjs` and `npm test` after building with `node graphics/production/sources/build.cjs`. Comparisons cover the full 67-appearance cast, the earlier seven approved action sets and the ten new ones. Direct asset checks exercise all four action sprite entry points and reaction portrait rendering for all 17 approved appearances.
