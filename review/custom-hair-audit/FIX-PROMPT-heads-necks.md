# Prompt: fix head/neck/body alignment on custom characters (and the audit that missed it)

Copy everything below the line into Codex.

---

The custom-character heads are not attached to the bodies correctly. In the game the heads sit down in the chest, and the head, neck, collar, hair and body do not line up between idle and walking frames. Your last audit (`review/custom-hair-audit/` and `review/custom-hair-audit/necks/`) did not catch any of this. Fix the rendering first, then rebuild the audit so it actually proves the fix.

Files involved:
- `graphics/production/walk/sources/renderer.js`: `walkNeck()` (line ~4) and `authoredWalk()` (line ~78)
- `graphics/production/sources/renderer.js`: `HEAD_NECK/HEAD_JOIN/BODY_JOIN` (line 9), `paintedNeck()` (~484), `neckBacking()` (~522), `neckSurface()` (~532), standing composition (~660-700), face-fit anchor (~799)
- `tools/review-custom-neck.cjs`, `tools/review-custom-hair.cjs`
- Rebuild `public/index.html` with the normal build afterwards. Do not hand-edit the built file.

## Part A: rendering mistakes to fix

### 1. Heads sink into the chest on front/back walking frames
- **What's wrong:** In `down` and `up` walk frames the collar and shoulders rise up beside the jaw, and the chin sits at or below the neckline. Compare `down idle` with `down walk 0/1` for tee, hoodie and suit: the walking torso is wider, and its collar is higher relative to the head.
- **Cause:** `walkNeck()` hard-codes `registration.root[1]=registration.top+5` for every down/up frame, a magic 5px offset instead of the real collar root. Then `authoredWalk()` uses `bodyFit=(143-restRoot-bob)/(143-attachment.root[1])` to squash the taller walking torso vertically to the standing collar height. That makes the walking body short and wide, while the head stays full size at `hy=ny-HEAD_NECK/3`.
- **Fix:**
  - Delete the `top+5` override and use the measured collar root from `paintedNeck()` for every direction.
  - Do not squash the walking torso vertically to fake a collar height. Scale it uniformly, using the same factor for x and y, so its feet-to-shoulder span matches the standing body.
  - Then place the head so the chin and jaw-to-neck join (`HEAD_JOIN`, adjusted by the face-shape fit used at line ~799) sits a fixed, visible neck length above the collar root. Use the same distance as the standing figure.
  - The standing (idle) and walking figures must use one shared head-placement function. Two copies of this maths is how they drifted apart.

### 2. Idle and walk use different-looking bodies
- **What's wrong:** Walking frames have broader shoulders and a bulkier torso than idle in every direction, so the character visibly "puffs up" when they start moving.
- **Fix:** Once #1's uniform scaling is in place, measure shoulder width (outer sleeve edge to outer sleeve edge, at the shoulder row) on idle and on each walk frame. Scale the walking body's width so the two match within ±1 game pixel per body type. Keep the existing `width` multipliers per body type (`slim .84 … stocky 1.2`) applied to both.

### 3. The head doesn't follow the body in side walk frames
- **What's wrong:** In `right`/`left` walks the torso leans and shifts with the stride but the head stays put. The neck becomes a thin stick at the back of the skull, and the head floats ahead of or behind the shoulders (see `right walk 3`, `left walk 7`).
- **Cause:** `bagseedHeadOrigin` x is `15.01` in every frame and every direction (see the `necks/*.json` files), so the head never moves horizontally with the rig's `neck` keypoint.
- **Fix:** Set head x from the frame's actual neck keypoint (`walk.rig.frames[f].keypoints.neck`), after the body transform. In profile, the neck must sit under the back-centre of the skull, roughly behind the ear, not at the very back edge. The neck's front edge should run into the throat, not the chin.

### 4. Head size and position ignore body type and height
- **What's wrong:** Head origin and head size are identical for slim, average, curvy, stocky, broad and tall bodies. "Tall" isn't taller where it matters, and broad or stocky bodies get the same head sitting lower into wider shoulders.
- **Fix:** Head position must come from each body's own collar root (after #1, this falls out naturally). Confirm that "tall" raises the collar and head instead of only stretching the legs.

### 5. Hoodie neck hole shows a black band and a white sliver
- **What's wrong:** In `hoodie down walk 0–3` there is a black gap with a white strip under the chin. `hoodie up walk 1` has a black ink blob beside the neck.
- **Cause:** `neckBacking()`/`neckSurface()` only cover the neck opening down to `attachment.opening`, and that is wrong once the torso is squashed (#1). The hoodie's painted neck hole and placeholder are left showing.
- **Fix:** After #1, fill the whole collar opening with the neck's skin and shadow, from the jaw join down to the inner collar edge. Clip it to the garment's opening mask, not a rectangle. Nothing near-black or near-white that isn't part of the garment art may remain inside the opening.

### 6. Back view shows the wrong garment, or the front of it
- **What's wrong:** `overalls up walk 1` shows the front bib, buttons and pocket on the back view. `suit up walk 1` switches from the dark jacket to a light-green sweater-like top with a white collar.
- **Fix:** Check that every `up/*` frame of every top uses that top's rear artwork, and that the colour mapping for full suits (`entry.fullSuit`, `base=105`) is the same for idle and walk. If a rear frame is missing, fail loudly. Don't silently fall back to the front art.

### 7. Garments change colour or pieces between idle and walk
- **What's wrong:**
  - Suit idle has jeans, but suit walking has green suit trousers.
  - Lab coat idle is white, but lab coat walking is green.
  - The down walk frames have white smears on the jeans around the knee and crotch.
- **Fix:**
  - Idle and walk must agree on whether the top is a full suit, and on which bottom is shown. Use the same `fullSuit` and `bottomS` rule in both.
  - The lab coat must keep its own white colour, not `shirtC`. Look at how `walkPart()` classifies `cream` pixels (currently `continue`, which keeps the raw source) versus the standing renderer.
  - The white smears on the jeans are unmapped "cream" source pixels. Map them to the pants tone and shading.

### 8. Bright strips beside the face with long hair
- **What's wrong:** With `long` hair (and other long or framing styles) in the `down` view, there are bright cream strips between the cheeks and the hair on both sides, on every top.
- **Fix:** That is the neck or ear backing, or a light sliver of the hair layer, showing through. Find which layer it is, and make sure no non-skin, non-hair light pixels appear between the face outline and the hair.

### 9. Mohawk side outlines float outside the skull
- **What's wrong:** `mohawk` in `down` and `up` views draws grey loops and blobs outside the head silhouette (the shaved sides).
- **Fix:** The shaved-side shading must be clipped to the bald head's silhouette (`baldBase`) for each direction.

### 10. Hair linework is too dense, and white hair reads grey
- **What's wrong:** On the hair sheets (`page-01.png` …), short, medium and similar styles are covered in heavy dark hatching. White hair reads as dirty grey. Side views have grey blocks over the temple and ear.
- **Fix:** Lighten or thin the inner strand lines so the base colour dominates, and keep the dark ink for the outer silhouette. Clip temple and sideburn pieces so they don't sit as solid blocks over the ear.

### 11. A stray scribble on the tee collar
- **What's wrong:** On `tee down walk 1`, at the right side of the neckline, there's a small dark scribble.
- **Fix:** It's part of the collar or placeholder that isn't covered. Recheck it after #1 and #5.

## Part B: why the audit missed it, and how to rebuild it

The current audit could not catch these problems:

- **It crops off the body.** `review-custom-neck.cjs` draws only a fixed crop of each sprite, `drawImage(im,70,130,150,165,…)`, so you never see the whole figure or where the head sits on the torso.
- **It tests only one character.** It uses a bald head, one skin tone, one body type ("average") and one shirt colour.
- **It renders hair without a body.** `review-custom-hair.cjs` draws heads on their own via `BagseedArt.head()`, so hair-to-collar and hair-to-shoulder problems are invisible.
- **Its numbers can't fail.** The JSON only records `origin`/`eyes`, which are the same in every frame, and that sameness is itself the bug in #3. Nothing compares idle against walk, and there are no thresholds.
- **The hash check means nothing.** The hair hash for "Bald" is identical in all four directions, so it never checks anything.

Rebuild the audit to do this:

1. **Full-body sheets** for every top × every body type (`slim, average, curvy, stocky, broad, tall`) × `pres` (`masc, neutral, fem`) × every direction × idle and every walk frame. Show each sprite uncropped at 3× and at actual in-game size (1×) side by side.
2. **Hair-on-body sheets** for every hairstyle on a real body, not head-only: hoodie, tee and suit, in all four directions, including one walk frame per direction.
3. **Measured checks that fail the build**, written as `node --test` tests:
   - **Visible neck:** the jaw/chin bottom is at least N px above the collar's inner top edge in every frame. Pick N from the approved standing figure and allow ±1px.
   - **Idle vs walk:** the head-to-collar distance, the shoulder width and the head size each match idle within ±1 game pixel, for every top, body and frame.
   - **Side views:** the neck keypoint's x is between the ear and the back of the skull, and the head origin x changes when the rig's neck x changes.
   - **No stray pixels:** zero near-black or near-white stray pixels inside the collar opening.
   - **Back views:** every `up` frame's garment art comes from the rear source.
   - **Matching garments:** idle and walk use the same bottom and the same garment colour per top.
4. **Before/after comparisons**: for the frames named in Part A, generate a side-by-side before/after image so the fix can be checked by eye.

## Done means
- All the Part B tests pass.
- The existing tests still pass: `npm test`, in particular `tests/neck-join.test.cjs`, `tests/custom-idle-walk-neck.test.cjs`, `tests/custom-walk.test.cjs` and `tests/custom-heads.test.cjs`.
- `public/index.html` has been rebuilt from source.
- You send me the new full-body sheets plus the before/after comparisons. Don't send cropped head-only sheets.

Don't hide a problem by moving or cropping the review. If something can't be fixed without new artwork, list it separately, with the frame names.
