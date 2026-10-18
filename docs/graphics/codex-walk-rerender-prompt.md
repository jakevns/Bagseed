# Codex task: re-render the broken custom-character walk art so it matches idle

## Read this first: the rules

1. **Idle is the source of truth.** The idle art in `graphics/production/customization/top/<garment>/` (front, back, left, right) is approved. Do not change it. Every walking frame must show **the same garment** as idle: same cut, color, trims, pockets, closures, prints and line weight. The only difference should be the pose.
2. **Re-generate. Do not repair.** For every frame listed below as BROKEN, generate a completely new image from scratch with the image generator. **Do NOT**:
   - paint over, patch, recolor, tint, palette-swap or composite onto the existing walk PNGs
   - paste torso, rect or donor pixels from one frame into another. `graphics/production/walk/sources/repair-rear-overalls.py` is an example of this, and that approach is banned. Remove that repair and re-generate `up/1` properly.
   - run an outline, stroke, dilate or "ink" pass on top of generated art
   - use the old walk frame as an img2img or inpaint base
   Earlier passes did all of these, and that is why the art looks muddy, doubled and outlined. Use the **idle garment image plus the walk mannequin pose** as references. Do not use the old walk frame as a reference.
3. **Delete the bad frames before you replace them.** Delete them from `graphics/production/walk/registered/top-<garment>/`, `graphics/production/walk/wardrobe-v5/registered/top-<garment>/`, and their atlas or manifest entries. Then write the new ones. Do not keep a fallback to the old art.
4. **Show visual proof.** Passing tests do not count as approval. You are done when the review sheets described at the bottom show idle and walk side by side, and a person cannot tell which outfit is which except by the pose.

## Audit: what is wrong now

Evidence: `review/custom-walk-audit/01…05-*.png`. Each row shows one garment as F idle | F walk1 | B idle | B walk1 | R idle | R walk3 | L idle | L walk3. These were cropped from `review/custom-alignment/after/<garment>-average-neutral.png`.

### A. Problems on every garment (front `down/0-3` and back `up/0-3` walk frames)

| # | Problem | What it should be |
|---|---|---|
| A1 | **Thick black border** around the whole walking silhouette, about 3–4 px at 3× and roughly twice the idle line weight. It reads as a sticker outline. | Use the same thin, broken, colored line art as idle: a dark navy or sepia line, not pure black, and not a uniform stroke. |
| A2 | Front walk sneakers have a dark or navy upper with a blobby toe. Idle sneakers have a **cream toe cap and sole with dark laces**. | Draw the idle sneaker in the walking pose. |
| A3 | Back walk legs are a smeared stack. The trailing leg is a dark blob with no hem, and the jeans lose their seams and back pockets. | Draw two readable legs with jean hems, back pockets and the cream sole showing, like back idle. |
| A4 | **Dark horizontal band at the hip/waist** on back walk (cardigan, crop, flannel, hoodie, jacket, sweater, tank, tee, work). It looks like a pasted strip, not a waistband. | Show the garment hem over the jeans waistband, with no extra band. |
| A5 | Back walk shows a **white or cream collar strip** at the neck (cardigan, jacket, suit, work, tee). Back idle does not show this. | Match the back idle neckline exactly. |
| A6 | Front walk hands and forearms are muddy and blurred, with a brown smear (most visible on crop and tank). | Use clean skin with the same cel shading as idle hands. |
| A7 | Front/back walk is a little wider and more hunched than idle, and the shoulders are inflated. | Match idle shoulder width and torso length. Only the arms and legs should move. |

Side walk frames (`left/0-7`, `right/0-7`) are mostly fine. Keep them unless they are listed below.

### B. Per-garment problems: walking does not match idle

| Garment | Idle (correct) | Walk now (wrong) | Frames to re-generate |
|---|---|---|---|
| **garden** | **Tan/mustard canvas apron** with a front pocket over a **navy tee**. The back shows tan straps and a tan bow tie at the waist. | Front/back walk: **navy bib apron over a white tee**, a completely different outfit. Side walk is tan, but the pocket and apron shape differ from side idle. | **All**: down 0-3, up 0-3, left 0-7, right 0-7 |
| **jacket** | Navy zip jacket, **open over a cream tee**, ribbed hem and cuffs, chest seams. The back has a yoke seam and ribbed hem. | Front walk: closed-looking jacket with a white zipper edge and a different collar. Back walk: a **plain sweater blob** with no yoke, no rib hem and a white collar. | down 0-3, up 0-3 |
| **cardigan** | Open navy cardigan with buttons and a **cream tee** showing. The back is smooth knit with a ribbed hem. | Back walk has a white collar strip and a dark hip band, and the knit texture is missing. The front walk cardigan is boxier, with a bold border. | down 0-3, up 0-3 |
| **flannel** | **Navy plaid** flannel. The plaid is visible on the back too. | Back walk is **solid navy with no plaid**. Front walk plaid is faint and muddy. | down 0-3, up 0-3 |
| **hoodie** | Hoodie with **white drawstrings** and a kangaroo pocket. The back hood lies flat. | Front walk is **missing the drawstrings**. The back walk hood is a bulky lump with a bold outline. | down 0-3, up 0-3 |
| **labcoat** | **Warm cream/off-white** coat with lapels and pockets over a light shirt. The back is warm cream with a center vent. Ripped jeans. | The walk coat is **cool grey-white/blue-white**, a different color. The back walk vent is a dark slit, and the jeans rips are gone. | **All**: down 0-3, up 0-3, left 0-7, right 0-7 (the color is wrong in side frames too) |
| **officer** | Navy shirt with a gold badge, pocket flaps and a belt. The back idle has a wide dark waist band. | Back walk has a different belt with a visible buckle, and the shirt is boxier. The front walk badge is a different shape. | down 0-3, up 0-3 |
| **overalls** | Navy overalls over a **cream tee**, with brass buttons on the straps. The back has an X-strap. | The back walk X-strap is doubled or ghosted (from the `rearTorsoRepair` paste). Front walk has a blobby hand. | down 0-3, up 0-3 (and remove `repair-rear-overalls.py`) |
| **pjs** | Navy pajama top with **thin, subtle white piping** and a chest pocket. The back has no collar piping. | The walk piping is **thick and bright**, and the back walk adds collar and hem piping that idle does not have. | down 0-3, up 0-3 |
| **suit** | Black suit jacket, white shirt and black tie. The back is plain. | Back walk shows **white shirt collar and cuffs**. Front walk lapels are different. | down 0-3, up 0-3 |
| **crop** | Navy crop tee showing the midriff, with no wristbands. | Front walk arms are muddy, and back walk has a dark hip band. (Idle also has thin dark wrist marks, which are an artifact. Leave idle alone, but do not copy them.) | down 0-3, up 0-3 |
| **tank** | Navy tank with a scoop neck. | Bold outline, muddy forearms, and a dark band on the back walk. | down 0-3, up 0-3 |
| **tee** | Navy tee. | Bold outline, a white collar on the back walk, and a dark hip band. | down 0-3, up 0-3 |
| **sweater** | Navy crew sweater with ribbed cuffs and hem. | Bold outline and a hunched back. | down 0-3, up 0-3 |
| **work** | Navy work shirt with two flap pockets and rolled sleeves. The back has a yoke. | Back walk has no yoke and a white collar. Front walk pockets are blurred. | down 0-3, up 0-3 |

Total: 15 garments × 8 front/back frames (120), plus 16 side-stride frames each for garden and labcoat (32) = **152 frames to re-generate**. Check the real frame keys in `walk/manifest.json` and `walk/wardrobe-v5/manifest.json` before you start.

## How to generate

For each frame:
1. Reference A is the idle garment for that direction, from `graphics/production/customization/top/<garment>/`.
2. Reference B is the walk pose for that frame. For front/back, use `graphics/production/walk/registered/mannequin/{down,up}-<0-3>.png`. For side, use the 8-frame stride at `graphics/production/walk/stride-v4/{left,right}-<0-7>.png`. Use it for the arm and leg positions only.
3. Prompt the generator to paint **the garment from Reference A, worn in the pose from Reference B**. Use the same chibi cel style, line weight and palette as idle. Use a transparent background, with no outline stroke and no drop shadow. The output should be a garment layer only, with no head or face.
4. Generate at the same native density as the existing walk sources (`density: 3`, 288×432 for the 96×144 canvas).
5. Record each prompt and seed in `graphics/production/walk/sources/top-<garment>-rerender-v6-generation.json`. Store the raw generated PNGs, unedited, in `graphics/production/walk/sources/rerender-v6/`.
6. Register them with the existing registration step: a feet-anchored fit to the mannequin landmarks. **Registration may only translate, scale or rotate. It may not repaint pixels.**

Generate all 4 front frames of a garment in one pass (and all 4 back frames in one pass) so the garment stays identical across the cycle. Check that frames 0–3 show the same garment before you register them.

## Acceptance checks

Run all of these. Each one must pass before you call the task done.

1. **Palette check.** For each garment and direction, compare the dominant garment colors (k-means, k=4, skin and jeans excluded) between idle and every walk frame. Every walk frame must be within ΔE 6 of idle. This catches garden, labcoat and pjs.
2. **Outline weight.** Measure the mean thickness of the outer dark line on idle and on walk. Walk must be ≤ 1.25× idle. This catches the bold borders.
3. **No black stroke.** Fewer than 2% of silhouette-edge pixels may be at or below RGB(20,20,20).
4. **No pasted repairs.** No manifest frame may have `rearTorsoRepair`, a donor `rect` from another frame, or a part sourced from a different frame. Add a test for this.
5. **Back neckline.** There must be no cream or white pixels within 6 px below the back neck join unless back idle has them there.
6. **Visual sheet.** Regenerate `review/custom-alignment/after/*` and the same 8-column idle-vs-walk crops as in `review/custom-walk-audit/`, saved to `review/custom-walk-rerender-v6/`. Include all 15 garments, plus the average/broad/curvy body types for garden and labcoat. Put before-and-after sheets next to each other.
7. Run `npm test` and confirm it passes. This is required, but it does **not** replace check 6.

Do not report success until you have looked at the check 6 sheets yourself and confirmed, garment by garment, that walk matches idle. List any frame you are unsure about instead of claiming it is fixed.
