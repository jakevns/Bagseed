> Superseded draft: the user rejected profile motion, heavier lines and the low-resolution review. See `review/custom-walk-v3/` for the standing-style redo. Earlier performance/size statements below describe the withdrawn draft, not the corrected release.

# Full wardrobe walking: Phase 2

The remaining wardrobe has been authored and integrated locally on `codex/custom-walk-phase-2`. Phase 2 has not been pushed or deployed. Open [the interactive review](index.html) to compare all tops, bottoms and footwear, play/pause the movement, and step each pose using the game renderer at full canvas resolution.

## Artwork

Phase 2 adds 11 tops (tank, sweater, cardigan, work shirt, crop top, jacket, garden apron, pajamas, lab coat, suit and officer), three bottoms (joggers, cargo and shorts), and two shoes (boots and rainboots). Together with Phase 1 this covers 15 tops × five bottoms × four shoes. All 24 garment items have 16 directional poses, or 384 item-frames. Full suits own their trouser layers, including newly matching pajama trousers; they ignore the selected separate bottom while retaining its saved option ID.

The original Phase 1 rig, master, registered sample frames and atlases remain unchanged. Every additional source uses the same 96×144 canvas, density-three pixels and ground baseline 143. Registration uses uniform scale, translation and no more than two degrees of rotation. No limbs, hair or clothing are mesh-warped or painted by Python.

The neck-down approved player body and neutral mannequin are the exact pose references. Twenty untouched generated originals are retained with their complete prompts in `graphics/production/walk/assets/` and `sources/*-generation.json`. The first pass rejected one tank pose, one crop-top pose, four lab-coat poses and one cargo pose. Four targeted correction atlases replaced those failed cells. All 256 added garment frames now pass the current registration checks. The [registration report](garment-validation.json) retains the rejected candidates and selected source cells.

Coats and aprons retain their long painted hems as extra top layers above trousers. Boots and rainboots retain their shafts where they overlap the trouser area. Shorts retain exposed skin pixels, with the shared underlayer recolored to skin underneath. Pajamas and business suits use their matching generated trousers. Existing heads, hair, hats, ears, facial details, standing bodies, portraits, smell reactions and cast source art are preserved. [The provenance report](source-provenance.json) checks 186 locked Phase 1 files, protected renderer blocks, generated originals and protected art paths.

## Visual review

- [Varied looks, indoors](walk-varied-indoor.gif), [grass](walk-varied-grass.gif), [night backdrop](walk-varied-night.gif)
- [Tops 1–8](walk-tops-a-indoor.gif) and [tops 9–15](walk-tops-b-indoor.gif)
- [Bottoms and all footwear](walk-bottoms-indoor.gif)
- [All coat/apron poses](coat-apron-all-poses-native.png)

There are 1,248 real-renderer figure captures across the four review sets, three game backdrops and four poses. Varied looks include slim/broad/stocky/curvy builds, different skin tones, long hair, a ponytail, braids, a bun with hat, patterns and accessories, beside the approved Remy and Priya walkers. The backdrop images are game assets; the night board is a night backdrop comparison, not a simulation of every flashlight effect. All 24 animated GIFs have game-size and 3× versions. No save is read by this review page.

Motion/readability references remain the approved player Study 02 poses plus the Phase 1 reference IDs: G03-P14/P15/P16/P17, G03-P01, G03-S04, G04-S03, G07-S05, G15-S12, G17-S03, G26-S01, G01-S08 and G02-PN09–PN19. No external-game pixels are used. Reference archive Part 12 is truncated.

## Validation and limits

The add-only `tests/custom-walk.test.cjs` checks all 300 outfit combinations, including redundant bottom choices beneath full suits: 4,800 frames, nonempty authored output, painted ground position, visible hand neighborhoods connected to the shoulder, and actual flashlight attachment. It additionally checks six builds × three presentations × 16 poses, all 16 sandal toe skin tones, creator/mirror Walk and Idle, reduced motion, and disposable save/reload compatibility. The [combination report](combination-validation.json) records results per outfit. Browser storage is disposable; the user's save is never used.

Registration checks detected distal hands, an inferred neck and the painted foot baseline. `limbCoreIoU` measures occupancy around a 2.2-pixel bone core, not full garment silhouette overlap. Hidden joints and anatomical fingers are not independently detected. Runtime hand checks test opaque connectivity around the expected visible hand and shoulder; they do not prove good anatomy or correct finger shape. Automatic checks cannot replace inspecting every pose, particularly long hems and layered footwear. Your visual review and a real phone playtest remain necessary.

Static source/payload checks pass with 100 game script blocks. The complete browser regression result is recorded in `validation-summary.json` when the run finishes. Commands use the Node executables behind `npm run check` and `npm test` because npm itself is unavailable here.

## Size and lossless preservation

The standalone game is 103,255,681 bytes. This is 2,200,115 bytes above the earlier merged baseline of 101,055,566 and below the 10 MB growth threshold. An initial full-wardrobe build was 110,375,893 bytes. To keep the file below GitHub's hard size limit, existing custom layers and reaction images now also use lossless WebP in the generated payload. Their PNG originals and all decoded RGBA pixels are unchanged. `encode.py` verifies every decoded WebP against its PNG before the builder uses it. Walking atlases themselves total 6,617,806 WebP bytes. Runtime atlas/figure caches remain bounded.

## Reproduce

Do not rerun the original Phase 1 registration script to rebuild Phase 2: it would replace the combined manifest. The additional registration script preserves approved Phase 1 data.

1. `python graphics/production/walk/sources/register_phase2.py`
2. `python graphics/production/sources/encode.py --walk-only`
3. `python graphics/production/sources/encode.py --actions-only`
4. `python graphics/production/sources/encode.py --layers-only`
5. `node graphics/production/sources/build.cjs`
6. `node graphics/production/walk/sources/capture_phase2.cjs`
7. `python graphics/production/walk/sources/make_phase2_review.py`
8. `python graphics/production/walk/sources/audit_phase2.py`
9. `node tools/check.mjs`
10. `node --test --test-concurrency=1 tests/*.test.cjs`

On a clean checkout, first encode the existing production sources with the full `encode.py` command. The partial commands merge into the ignored encoded manifest. Use the bundled Python/Node paths on this Windows machine, plus Playwright's `NODE_PATH` and Chrome's `BAGSEED_BROWSER_PATH` for browser commands.

## Review resolution correction

The initial review incorrectly reduced characters to tiny raster thumbnails before enlarging them. Those previews were withdrawn. The replacement capture calls the actual `drawPerson` function on the same density-three canvas used by the game, preserving its smoothing and full-resolution illustrated artwork. It does not resize a low-resolution thumbnail. Fit-panel mode scales the full-resolution image smoothly; native mode shows the original captured pixels. Character source art, game rendering density and the approved illustration style were not reduced or regenerated for this correction.
