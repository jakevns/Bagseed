# Bald base and transparent hair review

Historical v5 review. The user found remaining forehead cuts, undersized boots and hat-fit problems. These are addressed in `../customization-v6/README.md`; screenshots and validation below describe the superseded renderer.

This replaces the user-rejected v4 customization renderer. The playable local build is `public/index.html` at the repository root. User visual acceptance remains pending.

The base head is genuinely bald in front, both profiles and back. All 60 hairstyles have been regenerated as independent transparent grayscale hair layers; Bald is a 61st selectable choice. Changing hair color tints every hair pixel without changing the silhouette or revealing retained brown. There is no colored-background removal from a painted face and no old hairstyle underneath the selected hair.

Eight hat styles have new transparent artwork and fitted registrations. Their worn outer shapes cover the appropriate crown hair without shrinking the face. Full source silhouettes are isolated before cropping. The updated layer order retains face and ear anatomy in front of rear hair while letting long back hair cover the nape. Facial hair follows the common face landmarks. Blink changes are confined to registered eyes.

Custom sprites have transparent headroom, preserving full crowns and natural body proportions. The creator and wardrobe canvas now render at 540×336 with a matching CSS aspect ratio. Existing waist, ankle and footwear joins are retained. Approved NPC drawings and completed smell poses are preserved.

All images listed below come from the running game renderer. They are not generated mockups:

- `preview-bald-base.png`, `preview-silver-short.png`, `preview-silver-cap.png`, `preview-silver-long.png`, `preview-silver-bun.png`, `preview-silver-beard.png`: actual creator canvas, selected through the creator controls.
- `preview-bald-cap.png`: actual creator opened directly from the standalone file URL, with Bald selected under the cap. `mirror.png` and `street.png` show the tested wardrobe and gameplay rendering.
- `bald-hair-hat-layers.png`: anatomy, transparent hair, composed head and cap on a checkerboard, in all four directions.
- `hair-colors-1.png` through `hair-colors-7.png`: every hairstyle and Bald in white, jade and pink, all four directions. Original head proportions are preserved in these contact sheets.
- `hats.png`: all eight hats over Bald, short hair and Afro, in four directions.
- `facial-hair.png`, `animation-frames.png`, `outfits.png`: facial placement, motion/blinks and clothing joins.
- `audit.json`: opaque pixels touching the outer head canvas margin; an empty list means no boundary violations.

Generated source artwork, the exact prompts and the registration script are retained in `graphics/production/customization-v5/`. The built-in `image_gen` tool was used; no CLI image-generation fallback was used.

Recreate screenshots with `node tools/review-layered-characters.cjs`. Run `npm test` with Playwright and Chrome configured and `npm run check` for browser regressions and the immutable-baseline check. The validation record is in `validation.json`.

Final validation: all 24 tests in the browser suite passed, followed by the added standalone-file creation/save test. Targeted checks cover 2,562 facial-hair views, 854 rear views, 732 head margins, 1,464 hat/face comparisons, 549 blinks, 300 joined outfit/body/direction combinations, and 244 independent hair layers across four material colors. The final preservation comparison passed 1,872 roster comparisons and 260 direct reaction-asset checks. The archived baseline checksum matches and all 80 built game script blocks parse. All seven hairstyle/color boards and the listed hat, anatomy, animation and outfit boards were visually reviewed.

Generic walking still uses continuous figure motion rather than newly authored walk cycles. Browser tests use disposable storage and do not read or change the user's live save. No push or deployment was performed.
