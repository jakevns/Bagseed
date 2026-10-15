# Character customization repair

This revision addresses the user's reports of brown rear hair under silver hair, cropped hairstyles, misplaced facial hair and hats, damaged trousers and neck joins, blurred previews, and a dark line appearing during animation. It supersedes the rejected customization-v3 review. The playable local file is `public/index.html`.

Hair registration now isolates each complete head before cropping; all 240 views retain their crowns and ends. Rear skin patches are masked locally, including the saturated neck shadows, so the chosen hair color cannot paint the neck. The nape's ink no longer retains the source brown. Face-shape changes preserve canvas margins. Long hair sits behind the actual shoulder silhouette, without the rectangular foreground cuts.

Facial hair is isolated from the original head studies and attached to each replacement face's eye/lip landmarks. Hats fit the skull and mask covered hair along their brims, preserving the face's size and position. Hat extraction follows each source row's transparent gutters so bills and brims remain complete.

All four clothing directions now retain source detail through composition. The shared waist and ankle layout keeps trousers joined to the torso and selected shoes. The creator and wardrobe mirror use 540×288 render targets and request detailed character rendering directly. The mirror spaces the three views apart. The blink is drawn at the illustrated eyes before scaling; the heuristic that stretched a guessed face strip and drew a dark line has been removed.

These are screenshots and contact sheets from the running local renderer, not generated concept images:

- `preview-silver-short.png`, `preview-silver-cap.png`, `preview-silver-long.png`, `preview-silver-beard.png`: actual creator canvas, selected with real controls.
- `silver-hairstyles.png`: every hairstyle in four directions, including full heads and game sprites.
- `hats.png`, `facial-hair.png`: accessory and facial-hair comparisons.
- `animation-frames.png`: ordinary and detailed sprites across motion frames, with blinking.
- `outfits.png`: every top in four directions on average and broad bodies.
- `mirror.png`, `street.png`: wardrobe and gameplay screenshots.

Recreate the review images with `node tools/review-custom-heads.cjs`. Rebuild the retained source crops with the registration scripts under `graphics/production/customization-v3/`, then `graphics/production/sources/prepare-customization.py` and `graphics/production/sources/build.cjs`. Source artwork and appearance option IDs are preserved.

Validation: 20 browser tests passed, followed by the three affected creator/save and mobile checks after the final mirror change. Targeted coverage includes 2,520 facial-hair views, 840 rear views, 720 hair/face-shape margins, 1,440 hat/face comparisons, 540 animated blink views, 300 connected outfit/body/direction combinations, rear neck material colors, and retained preview detail. Existing gameplay checks cover creation, wardrobe, save/reload, movement, scenes, seating, flashlights, and smell encounters. Separately, 1,872 roster comparisons and 260 direct pose-asset checks preserve all 71 NPC appearances and 52 completed smell-reaction sets.

The screenshots have been inspected for these reported defects. User visual acceptance remains pending. Generic walking still uses whole-figure motion rather than newly authored walk cycles. No live user saves were accessed, and no push or deployment was performed.
