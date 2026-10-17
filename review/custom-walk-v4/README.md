# Eight-pose side-stride candidate

This replaces the rejected side-motion preview for the hoodie/jeans/sneakers sample, not the full Phase 2 wardrobe. The previous four-pose side preview is not considered accepted.

The approved Remy, Priya and Doug source sheets were inspected directly. They contain four drawn walk frames per direction. The custom replacement now has eight separately drawn phases per side, including both contacts, both loading positions, both passing positions and both push-off positions. Existing cast artwork and playback are not modified.

Source generation used the built-in image generation tool, with the existing standing wardrobe artwork as the design authority and the existing Priya sheet as the drawing-style reference. Prompts are retained in `graphics/production/walk/sources/stride-v4-generation*.json`. The first candidate turned left in the second half and was rejected. The second stays in the same right-facing view. The final pose receives a separate arm-swing correction.

Only uniform scale and translation register the source artwork. Each final body receives one resampling from original source pixels. No garment pixels are drawn in Python, no limbs are stretched, and no low-resolution thumbnail is enlarged. The existing head renderer supplies each view's head above the new body. The symmetric sample outfit is mirrored for the left view, as permitted by the original brief; this does not authorize mirroring asymmetric garments without checking them.

The comparison uses 288 × 432 canvases for standing and custom walking. The original cast canvases are aligned to the same bottom baseline. PNG playback avoids GIF palette reduction. The local preview does not write game saves or replace `public/index.html`.

The sample is rendered through the modular wardrobe compositor, including separate hoodie, jeans, sneaker and underlayer atlases. Capture checks require all eight frame keys in both side directions, eight distinct composite images, and zero flashlight attachment error. These are implementation checks, not an independent judgment of movement quality.

Remaining: apply the corrected motion to the other wardrobe garments, update the gameplay/creator/mirror clocks for the completed rollout, check all outfit/build combinations, and review the remaining garments at native resolution. Automatic landmark checks alone cannot approve a walking cycle. This preview does not replace the current game build.
