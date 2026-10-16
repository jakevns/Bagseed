# Custom walking: Phase 1 review

Status: samples ready for visual review. Phase 2 is not implemented. GitHub publication was requested for the Phase 1 branch; Phase 2 and deployment remain outside this release.

Open [the interactive review](index.html) to play/pause or step all four poses, switch backgrounds, and compare game size with 3× and 6× nearest-neighbor enlargements. Columns are the default hoodie, slim long-haired skirt look, broad ponytail/overalls look, patterned tee/hat look, Remy and Priya. Rows are front, right, back and left. These are captures of the actual renderer at a 32-pixel world width, with proportional sprite heights.

- [Grass animation](walk-grass-1x.gif), [3×](walk-grass-3x.gif)
- [Indoor animation](walk-indoor-1x.gif), [3×](walk-indoor-3x.gif)
- [Night backdrop animation](walk-night-1x.gif), [3×](walk-night-3x.gif)
- [Approved pose landmarks](master-rig-overlay.png) and [registered mannequin](mannequin-rig-overlay.png)
- [Creator](creator-a.png) and [wardrobe mirror](mirror-a.png)

## Scope and construction

The sample set contains hoodie, tee, flannel, overalls, jeans, skirt, sneakers and sandals, each with 16 poses. Overalls own their trouser layers. Unsupported clothing combinations retain the previous rendering path until Phase 2. The confirmed full inventory is in [inventory.json](inventory.json): 15 tops, five bottoms and four shoes, including NPC-only modular tops. Matching pajama trousers remain Phase 2 work.

The 16 approved player poses were cropped and registered reproducibly. The 96×144 canvas uses density-three source art and a ground baseline of 143. The rig records neck, shoulders, elbows, hands, waist, hips, knees, ankles, toes, heels, near arm/leg and ground. Visible hands are detected; hidden landmarks are manually inferred and recorded. Profile knee and ankle landmarks received a separate manual pass. The mannequin and garments are registered with uniform scale, translation and at most two degrees of rotation. There is no mesh deformation, row warping or independent limb stretching.

Generated pixels are masked into farArm, torso, nearArm, farLeg, nearLeg, farFoot and nearFoot atlases. Existing generated mannequin leg pixels form the shared underlayer; exposed skirt legs and sandal toes are skin recolored. Under trousers, those same pixels use the trouser palette. Python only crops, registers, masks, recolors and encodes source pixels; it does not draw garments or anatomy.

Composition happens at density three before one whole-body build transform and downsample. Existing body width factors remain in use; six separate build drawings were not silently introduced. Existing bald heads, hair and hats translate together to each frame's neck, above clothing. Patterns use per-frame torso/leg coordinates, accessories follow neck/waist/hip anchors, and flashlight metadata follows the transformed near hand. Creator and mirror have Walk/Idle controls. Standing, portraits, nose reactions, existing cast drawings and approved walker source art remain intact.

## Generation and rejected work

All 32 generated originals are retained unchanged in `graphics/production/walk/assets/`, with exact prompts and SHA-256 records in `graphics/production/walk/sources/*-generation.json`. [Source provenance](source-provenance.json) lists selected cells and verifies protected renderer blocks and art. The [walk manifest](../../graphics/production/walk/manifest.json) records each selected frame's source, cell and transform.

The first mannequin and pose correction were superseded by the full neutral underlayer, followed by a two-cell rear correction. Initial garment sheets drifted at hands, collars or feet. Overalls received two full-sheet revisions; jeans, skirt, shoes, hoodie and tee also received full-sheet corrections. Focused correction grids then replaced individual failing poses. Final skirt and sandal corrections edited clothing on the approved headless player pose reference, keeping the pose locked. Rejected candidates remain in the registration records rather than being silently accepted.

Generated sneaker attempts were less accurate than the approved player shoes. The final sneaker layers reuse those approved source pixels for all 16 poses; they are not claimed as newly generated shoes. Superseded bare-leg experiments and the historical mannequin hand audit are explicitly marked as rejected/historical and do not feed the runtime. `skin-base-audit.png` belongs to that rejected experiment.

References consulted: G03-P14/P15/P16/P17, G03-P01, G03-S04, G04-S03, G07-S05, G15-S12, G17-S03, G26-S01, G01-S08, and G02-PN09 through G02-PN19. These informed timing, small-size readability and cloth treatment. No pixels from those games are used in the runtime. Reference archive Part 12 is truncated.

## Checks and their limits

- Static checks passed: approved baseline checksum, 99 parsed game script blocks, source/embedded payload consistency.
- All 86 existing browser tests passed, including movement, disposable save/reload, customization, necks, mobile layouts and furniture integration.
- [Runtime capture](runtime-validation.json): 96 comparison frames, 96 body-build frames, creator animation, mirror animation and stopped Idle, zero browser errors, and 16 distinct sandal toe skin variants. Reported flashlight anchor errors are zero.
- [Mannequin registration](mannequin-validation.json): 16/16 selected frames pass the recorded point checks and full-body silhouette IoU threshold of 0.85. Master extraction and accepted mannequin replay were also verified pixel-identical.
- [Garment registration](garment-validation.json): 128/128 selected frames pass current measured-hand/inferred-neck checks, physical ground alignment and limb-core occupancy checks. No selected source has a large detached component.

These checks are narrower than independent anatomical validation. Garment `limbCoreIoU` measures occupancy around a 2.2-pixel bone core; it is not full garment silhouette IoU. Neck markers are inferred, and hidden joints are not independently detected. Mannequin ground-marker error includes a centerline component; physical baseline alignment is checked separately. Automated checks cannot prove good folds, natural movement, correct occlusion or absence of every duplicate limb. Inspect all four frames in the review before approving.

Tests ran with the exact Node commands behind `npm run check` and `npm test`, because this machine has Node but no npm executable available. They used disposable browser storage, not the user's save. Mobile browser tests passed; a real phone playtest and visual approval are still required.

The generated standalone build is 103,997,382 bytes, up 2,941,816 bytes from the merged GitHub baseline of 101,055,566 (approximately 2.81 MiB). This is below the 10 MB review threshold. Atlases use lossless WebP verified against their PNG pixels.

## Reproduction

Run from the repository root, using the bundled Python and Node executables where they are not on PATH:

1. `python graphics/production/walk/sources/extract-master.py --verify`
2. `python graphics/production/walk/sources/prepare.py`
3. `python graphics/production/walk/sources/register_mannequin.py --verify`
4. `python graphics/production/walk/sources/register_samples.py`
5. `python graphics/production/walk/sources/pack-body-base.py`
6. `python graphics/production/sources/encode.py --walk-only`
7. `node graphics/production/sources/build.cjs`
8. `node graphics/production/walk/sources/capture.cjs`
9. `python graphics/production/walk/sources/make-review.py`
10. `python graphics/production/walk/sources/provenance.py`
11. `node tools/check.mjs` and `node --test --test-concurrency=1 tests/*.test.cjs`

Browser commands require Playwright's module path in `NODE_PATH` and Chrome's executable in `BAGSEED_BROWSER_PATH`. Existing tests regenerate some unrelated review screenshots; those outputs are excluded from this feature's changes. Encoding the existing production assets is a prerequisite on a completely fresh checkout.

Please approve the sample movement and layering, or identify poses to revise, before the full wardrobe phase.

## GitHub integration

The publication branch is `codex/custom-walk-phase-1`. It includes GitHub main through `6edd9d4`, preserving the other worker's approved 2�2 tent, starter proportions and watering layout changes. Generated HTML and the build report were rebuilt from the combined sources rather than choosing one worker's generated output. The new tent compiler now normalizes Windows line endings consistently with the other compilers. Phase 2 has not begun.

Post-merge checks passed with 100 game script blocks and 11/11 targeted browser tests: gameplay smoke, starter tents, tent/player depth and approved 2�2 tents. The earlier complete Phase 1 run passed 86/86 existing tests.
