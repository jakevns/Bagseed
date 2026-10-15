# Pose review batch 02

User-approved batch: Tobias Nguyen, Beverly Sloane, Kenji Mori, Mateo Market and Elena Market. Complete nose-covering drawings replace generic action sprites and pasted-arm reaction portraits for these five canonical outfits. Standing art, custom appearances and the first approved batch remain unchanged.

`pose-candidates.png` retains the approved review board. `registered.png` shows the final registered world sprites and portrait crops. `candidate.html` is a separate updated standalone game; the untouched original illustrated release and first-batch candidate remain under `../poses-batch-01/`. `checkpoint.json` records before/after checksums.

Source artwork and repeatable technical registration are in `graphics/production/actions/batch-02/`. Beverly's front view was corrected to remove an extra arm from the initial sprite export. Only the corrected crop is used. Left profiles mirror right profiles, including hand and phone side, as in the first batch. This release covers nose-covering reactions, not new walking/seated/interaction drawings.

Validate with `npm run check`, `npm test` and `node tools/verify-action-batch.cjs`. The comparison tool checks all seven approved characters against the preserved original and compares this batch against the first batch.
