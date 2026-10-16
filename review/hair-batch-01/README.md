# Five hairstyles with foreground ears

Local renderer `customization-11` updates **Short, Buzzed, Textured crop, Caesar and Low fade**. The user asked to keep the existing artwork and draw the selected ears above hair. Visual acceptance is pending.

The layer order is bald anatomy, facial details/beard, hair, selected ears and ear jewelry, headphones, then hat. A single head-shape transform keeps the face, hair and ears registered on all 15 shapes. Ear artwork retains its original texture and antialiased outline. Glasses arms remain visible across the ears. Ear jewelry is drawn once after hair; hidden ears suppress it.

Profile hair fills the old fixed ear aperture with grain from its own painting, blending to adjacent shading so small/flat/hidden ears do not reveal a circular cutout. Rear silhouettes extend to the lower skull and follow its contour at the nape. Buzz follows the bald skull without the former rear bulge. These changes apply only to the five cuts above. The other 55 styles plus Bald are checked against pre-batch pixel fingerprints over 3,360 shape/direction combinations. Original source PNGs and registration manifest are unchanged by this batch.

- [Five cuts after](five-cuts-after.png) and [before](five-cuts-before.png), front/right/back/left.
- [Complete figures](figures-after.png), [walk and blink frames](walk-frames-after.png), and [hats](hats-after.png).
- Actual [creator](creator-crop.png), [mirror](mirror-crop.png) and [bedroom](bedroom-crop.png) captures use disposable browser storage.
- All ear choices with glasses and hoops: [Short](short-ear-options-after.png), [Buzz](buzz-ear-options-after.png), [Crop](crop-ear-options-after.png), [Caesar](caesar-ear-options-after.png), [Fade](fade-ear-options-after.png).
- Shape sheets use `<cut>-shapes-1-after.png`, `-2-after.png` and `-3-after.png`, covering all 15 shapes in four directions for each cut.

`tests/hair-batch-01.test.cjs` checks 2,700 ear-surface cases, 75 rear-skull cases, 1,500 ear-jewelry cases, untouched-style fingerprints, and creator/mirror/save/reload. Ear checks locate actual ear artwork by comparing selected and hidden bald anatomy, including the cartilage outline. Rear checks sample independent skull cross-sections down to the nape. Existing tests retain forehead strands outside the foreground ear region and verify hats, blinks, body connections, footwear and earlier face-detail work.

Build with `node graphics/production/sources/build.cjs`. Recreate current review images with `node tools/review-hair-batch-01.cjs --after`. Optional before images require the ignored backup `artifacts/hair-batch-01/before.html`; automated tests use the retained compact pre-batch fingerprints and do not require that backup. Run `node --test --test-concurrency=1 tests/*.test.cjs` with Playwright/Chrome configured. Final results are recorded in `validation.json`.

Validation: all **57 tests passed**, with no skips. All 88 embedded scripts parse and the playable file matches its source/build checksums. The 87 non-character script blocks match the pre-batch game exactly. Full-cast verification passed 1,872 comparisons and 260 registered-pose checks; no browser errors were reported. The local build has not been committed or pushed in this batch.
